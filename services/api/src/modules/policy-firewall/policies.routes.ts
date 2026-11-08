/**
 * PayOps AI (PayPal Sentinel) — Cosmos.AI Policy Firewall Routes (API-03)
 * Supports GET /api/v1/policies, PUT /api/v1/policies/:policyId, and PUT /api/v1/policies.
 */

import type { FastifyInstance } from "fastify";
import type { AutonomyLevel } from "@payops/shared";
import { normalizeWorkspaceId, repository } from "../../db/repository.js";
import { PayOpsProblemError } from "../../lib/errors.js";
import { assertMutationPermitted } from "../../middleware/rbac-auth.js";

export async function registerPolicyRoutes(app: FastifyInstance): Promise<void> {
  /**
   * API-03 (GET): GET /api/v1/policies
   */
  app.get("/api/v1/policies", async (req) => {
    const query = (req.query ?? {}) as Record<string, string | undefined>;
    const workspaceId = normalizeWorkspaceId(query.workspaceId ?? query.workspace_id);
    const policies = repository.listPolicies(workspaceId);

    return {
      workspaceId,
      workspace_id: workspaceId,
      policies,
      data: policies,
      total_count: policies.length,
    };
  });

  const handleUpdatePolicy = async (
    policyIdParam: string | undefined,
    body: Record<string, unknown>
  ) => {
    const policyId =
      policyIdParam ??
      (body.policyId as string | undefined) ??
      (body.policy_id as string | undefined) ??
      "pol_refund_risk_gate_01";

    const autonomyLevel = (body.autonomyLevel ??
      body.autonomy_level) as AutonomyLevel | undefined;

    const maxSingleAutoRefundUsd =
      typeof body.maxSingleAutoRefundUsd === "number"
        ? body.maxSingleAutoRefundUsd
        : typeof body.max_single_tx_minor === "number"
          ? body.max_single_tx_minor / 100
          : undefined;

    const maxDailyRefundVelocityUsd =
      typeof body.maxDailyRefundVelocityUsd === "number"
        ? body.maxDailyRefundVelocityUsd
        : typeof body.daily_velocity_cap_minor === "number"
          ? body.daily_velocity_cap_minor / 100
          : undefined;

    const maxGnnRiskScoreForAutoRefund =
      typeof body.maxGnnRiskScoreForAutoRefund === "number"
        ? body.maxGnnRiskScoreForAutoRefund
        : typeof body.risk_threshold === "number"
          ? body.risk_threshold
          : undefined;

    if (
      (maxSingleAutoRefundUsd !== undefined && maxSingleAutoRefundUsd < 0) ||
      (maxDailyRefundVelocityUsd !== undefined && maxDailyRefundVelocityUsd < 0)
    ) {
      throw new PayOpsProblemError({
        status: 400,
        title: "Invalid Policy Spend Threshold",
        detail: "Policy spend thresholds must be non-negative numbers (API-03).",
        reasonCode: "INVALID_POLICY_CAP",
      });
    }

    const updated = repository.updatePolicy(policyId, {
      autonomyLevel,
      maxSingleAutoRefundUsd,
      maxDailyRefundVelocityUsd,
      maxGnnRiskScoreForAutoRefund,
      dslExpression: body.dsl_expression as string | undefined,
      ruleName: (body.ruleName ?? body.rule_name) as string | undefined,
      isEnabled:
        typeof body.is_enabled === "boolean"
          ? body.is_enabled
          : typeof body.isActive === "boolean"
            ? body.isActive
            : undefined,
    });

    const auditEntry = repository.appendAuditLog({
      workspaceId: updated.policy.workspaceId,
      actorId: "usr_maya_lin_owner",
      toolName: "update_policy_rule",
      paypalRequestId: `idem_policy_${policyId}_${Date.now()}`,
      policyVerdict: "APPROVED_L3_AUTO",
      payload: {
        policyId: updated.policy.policyId,
        autonomyLevel: updated.policy.autonomyLevel,
        maxSingleAutoRefundUsd: updated.policy.maxSingleAutoRefundUsd,
        maxDailyRefundVelocityUsd: updated.policy.maxDailyRefundVelocityUsd,
      },
    });

    return {
      ...updated.policy,
      policy: updated.policy,
      ast_compiled: updated.ast_compiled,
      compile_time_ms: updated.compile_time_ms,
      auditEntryHash: auditEntry.entryHash,
    };
  };

  /**
   * API-03 (PUT with param): PUT /api/v1/policies/:policyId
   */
  app.put<{ Params: { policyId: string } }>(
    "/api/v1/policies/:policyId",
    async (req) => {
      assertMutationPermitted(req, { requireAdminOrOwner: true });
      const body = (req.body ?? {}) as Record<string, unknown>;
      return handleUpdatePolicy(req.params.policyId, body);
    }
  );

  /**
   * API-03 (PUT body policyId): PUT /api/v1/policies
   */
  app.put("/api/v1/policies", async (req) => {
    assertMutationPermitted(req, { requireAdminOrOwner: true });
    const body = (req.body ?? {}) as Record<string, unknown>;
    return handleUpdatePolicy(undefined, body);
  });
}
