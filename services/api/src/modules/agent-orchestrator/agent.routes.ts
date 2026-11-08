/**
 * PayOps AI (PayPal Sentinel) — Agent Execution & HITL Approval Routes (API-01, API-02 + Tools Introspection)
 */

import type { FastifyInstance } from "fastify";
import { executeM01AgentOrchestration } from "../../ai/m01-orchestrator.js";
import { normalizeWorkspaceId, repository } from "../../db/repository.js";
import { PayOpsProblemError } from "../../lib/errors.js";
import { assertMutationPermitted, resolveRequestOperatorRole } from "../../middleware/rbac-auth.js";
import { junoIdempotencyStore } from "../junodb-idempotency/idempotency-guard.js";
import { zapierDispatcher } from "../webhooks/zapier-dispatcher.js";
import { verifyAndProcessHitlApproval } from "./hitl-approver.js";
import { paypalToolkitHost } from "./paypal-toolkit-host.js";

export async function registerAgentRoutes(app: FastifyInstance): Promise<void> {
  /**
   * API-01: POST /api/v1/agent/execute
   * Executes natural-language financial prompt through M-02 injection guard, M-01 35-tool planner,
   * F-09 APIMatic schema validator, F-02 Cosmos.AI Policy Firewall, and F-06 JunoDB idempotency lock.
   */
  app.post("/api/v1/agent/execute", async (req, reply) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const dryRun = Boolean(body.dryRun ?? body.dry_run ?? false);
    const { operatorId, role } = resolveRequestOperatorRole(req);

    if (role === "AUDITOR" || (role === "OPS_ANALYST" && !dryRun)) {
      throw new PayOpsProblemError({
        status: 403,
        title: "Forbidden RBAC Role for Agent Execution",
        detail: `Role '${role}' is not permitted to execute live state-mutating agent plans.`,
        reasonCode: "RBAC_AGENT_EXECUTE_FORBIDDEN",
      });
    }

    const prompt = String(body.prompt ?? "").trim();
    if (!prompt) {
      throw new PayOpsProblemError({
        status: 400,
        title: "Missing Agent Prompt",
        detail: "Request body must include a non-empty 'prompt' string (API-01).",
        reasonCode: "INVALID_AGENT_PROMPT",
      });
    }

    const workspaceId = normalizeWorkspaceId(
      (body.workspaceId as string | undefined) ??
        (body.workspace_id as string | undefined) ??
        (req.headers["x-workspace-id"] as string | undefined)
    );

    const headerRequestId = (req.headers["paypal-request-id"] as string | undefined)?.trim();
    const bodyIdempotencyKey =
      (body.idempotencyKey as string | undefined) ??
      (body.idempotency_key as string | undefined);
    const explicitKey = headerRequestId || bodyIdempotencyKey;

    const runOrchestration = async () => {
      const outcome = await executeM01AgentOrchestration({
        workspaceId,
        operatorUserId: operatorId,
        prompt,
        dryRun,
        idempotencyKey: explicitKey,
        traceId: req.traceId,
        explicitGnnRiskScore:
          typeof body.gnnRiskScore === "number"
            ? body.gnnRiskScore
            : typeof body.gnn_risk_score === "number"
              ? body.gnn_risk_score
              : undefined,
      });

      const auditLogs = repository.listAuditLogs(workspaceId);
      const latestAudit = auditLogs[auditLogs.length - 1];

      if (outcome.execution.policyVerdict === "HELD_FOR_L2_PASSKEY") {
        await zapierDispatcher.dispatchAlert({
          eventType: "HITL_APPROVAL_REQUIRED",
          workspaceId,
          paypalRequestId: outcome.execution.paypalRequestId,
          payload: {
            executionId: outcome.execution.executionId,
            toolName: outcome.execution.toolName,
            amountValue: outcome.execution.amountValue,
            reasonCode: outcome.execution.reasonCode,
          },
        });
      }

      const statusCode =
        outcome.execution.policyVerdict === "HELD_FOR_L2_PASSKEY" ? 202 : 200;

      const responsePayload = {
        // snake_case contract (api/openapi.yaml: E04_AgentToolExecution)
        ...outcome.execution,
        // camelCase contract (packages/shared/src/api-contracts.ts: AgentExecuteResponse)
        sessionId: outcome.session.sessionId,
        execution: outcome.execution,
        sdkSnippetTs: outcome.sdkSnippetTs,
        sdkSnippetPython: outcome.sdkSnippetPython,
        auditEntry: latestAudit,
      };

      return { statusCode, result: responsePayload };
    };

    if (explicitKey) {
      const junoOutcome = await junoIdempotencyStore.executeIdempotent(
        explicitKey,
        runOrchestration
      );
      reply.header("PayPal-Request-Id", junoOutcome.paypalRequestId);
      if (junoOutcome.replayed) {
        reply.header("X-Idempotent-Replayed", "true");
        junoOutcome.result.execution = {
          ...junoOutcome.result.execution,
          junodbLeaseStatus: "REPLAYED_FROM_JUNODB",
        };
      }
      return reply.code(junoOutcome.statusCode).send(junoOutcome.result);
    }

    const directOutcome = await runOrchestration();
    reply.header("PayPal-Request-Id", directOutcome.result.execution.paypalRequestId);
    return reply.code(directOutcome.statusCode).send(directOutcome.result);
  });

  /**
   * API-02: POST /api/v1/agent/approve/:executionId
   * Approves or rejects a policy-held (HELD_FOR_L2_PASSKEY / HOLD_APPROVAL) tool call with WebAuthn / Ed25519 signature.
   */
  app.post<{ Params: { executionId: string } }>(
    "/api/v1/agent/approve/:executionId",
    async (req, reply) => {
      const { executionId } = req.params;
      const body = (req.body ?? {}) as Record<string, unknown>;

      const decisionRaw = String(body.decision ?? "APPROVE").toUpperCase();
      if (decisionRaw !== "APPROVE" && decisionRaw !== "REJECT") {
        throw new PayOpsProblemError({
          status: 400,
          title: "Invalid Approval Decision",
          detail: "Field 'decision' must be either 'APPROVE' or 'REJECT' (API-02).",
          reasonCode: "INVALID_HITL_DECISION",
        });
      }

      const outcome = await verifyAndProcessHitlApproval({
        executionId,
        operatorUserId:
          (body.operatorUserId as string | undefined) ??
          (body.operator_id as string | undefined) ??
          (req.headers["x-operator-id"] as string | undefined),
        explicitRoleHeader: req.headers["x-payops-role"] as string | undefined,
        webauthnSignatureBase64:
          (body.webauthnSignatureBase64 as string | undefined) ??
          (body.webauthn_signature_base64 as string | undefined),
        headerSignature: req.headers["x-payops-signature"] as string | undefined,
        decision: decisionRaw as "APPROVE" | "REJECT",
        operatorReason:
          (body.operator_reason as string | undefined) ??
          (body.operatorReason as string | undefined),
        expectedVersion:
          typeof body.expected_version === "number"
            ? body.expected_version
            : typeof body.expectedVersion === "number"
              ? body.expectedVersion
              : undefined,
      });

      reply.header("PayPal-Request-Id", outcome.paypal_request_id);
      return reply.code(200).send(outcome);
    }
  );

  /**
   * Diagnostic / Introspection Route: GET /api/v1/tools
   * Lists all 35 core @paypal/agent-toolkit tools + 8 extended aliases (43 total).
   */
  app.get("/api/v1/tools", async () => {
    const coreTools = paypalToolkitHost.listCoreTools();
    const extendedAliases = paypalToolkitHost.listExtendedAliases();
    const allTools = paypalToolkitHost.listAllTools();
    return {
      coreToolCount: coreTools.length,
      extendedAliasCount: extendedAliases.length,
      totalToolCount: allTools.length,
      coreTools,
      extendedAliases,
      tools: allTools,
    };
  });
}
