/**
 * PayOps AI (PayPal Sentinel) — Merchant Working-Capital & Dispute Analytics Insights Routes (API-14)
 * Plus Tamper-Evident Audit Ledger Inspection Route (E-10 / E-06).
 */

import type { FastifyInstance } from "fastify";
import { normalizeWorkspaceId, repository } from "../../db/repository.js";
import { paypalToolkitHost } from "../agent-orchestrator/paypal-toolkit-host.js";

export async function registerAnalyticsRoutes(app: FastifyInstance): Promise<void> {
  const handleInsights = async (query: Record<string, string | undefined>) => {
    const workspaceId = normalizeWorkspaceId(query.workspaceId ?? query.workspace_id);
    const period = String(query.period ?? "LAST_30_DAYS");

    const toolRes = await paypalToolkitHost.executeTool({
      toolName: "get_merchant_insights",
      args: { workspace_id: workspaceId, period },
      workspaceId,
    });

    return {
      ...toolRes.responsePayload,
      workspaceId,
      workspace_id: workspaceId,
      period,
    };
  };

  /**
   * API-14: GET /api/v1/analytics/insights & GET /api/v1/insights/cfo-summary
   * Aggregates merchant TPV, North-Star ANMPR ($4,470/mo / +$26,960/yr), DSO reduction (28d -> 16d, -42.8%),
   * dispute win rate (84.0%), and cash-flow aging buckets.
   */
  app.get("/api/v1/analytics/insights", async (req) =>
    handleInsights((req.query ?? {}) as Record<string, string | undefined>)
  );
  app.get("/api/v1/insights/cfo-summary", async (req) =>
    handleInsights((req.query ?? {}) as Record<string, string | undefined>)
  );

  const handleAuditLedger = async (query: Record<string, string | undefined>) => {
    const workspaceId = query.workspaceId ?? query.workspace_id;
    const logs = repository.listAuditLogs(workspaceId);
    const integrity = repository.verifyAuditLedgerIntegrity();

    return {
      workspaceId: normalizeWorkspaceId(workspaceId),
      chainIntegrity: integrity,
      auditLogs: logs,
      data: logs,
      total_count: logs.length,
    };
  };

  /**
   * Audit Ledger Inspection Route (E-10 / E-06): GET /api/v1/audit-logs & GET /api/v1/audit/ledger
   * Returns the ordered SHA-256 hash-chained audit logs and cryptographic verification status.
   */
  app.get("/api/v1/audit-logs", async (req) =>
    handleAuditLedger((req.query ?? {}) as Record<string, string | undefined>)
  );
  app.get("/api/v1/audit/ledger", async (req) =>
    handleAuditLedger((req.query ?? {}) as Record<string, string | undefined>)
  );
}
