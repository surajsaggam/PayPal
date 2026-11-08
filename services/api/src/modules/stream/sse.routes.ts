/**
 * PayOps AI (PayPal Sentinel) — Real-Time SSE Event Stream (SSE-01) & Health/Doctor Endpoint
 * Maps to: GET /api/v1/stream/events, GET /api/v1/health, GET /health
 */

import type { FastifyInstance } from "fastify";
import type { SseStreamEvent } from "@payops/shared";
import { envConfig } from "../../config/env.js";
import { normalizeWorkspaceId, repository } from "../../db/repository.js";
import { sseBus } from "../../lib/sse-bus.js";
import { paypalToolkitHost } from "../agent-orchestrator/paypal-toolkit-host.js";
import { junoIdempotencyStore } from "../junodb-idempotency/idempotency-guard.js";

export async function registerStreamAndHealthRoutes(app: FastifyInstance): Promise<void> {
  const buildHealthPayload = () => {
    const doctor = paypalToolkitHost.runPayPalDoctorDiagnostics();
    const auditStatus = repository.verifyAuditLedgerIntegrity();

    return {
      status: "ok",
      service: "payops-api",
      version: "1.0.0",
      environment: envConfig.paypalEnvironment,
      mcpToolsRegistered: paypalToolkitHost.listCoreTools().length,
      extendedAliasesRegistered: paypalToolkitHost.listExtendedAliases().length,
      totalMcpToolsAvailable: paypalToolkitHost.listAllTools().length,
      storageMode: repository.storageMode,
      junodbMode: junoIdempotencyStore.mode,
      replayFallbackMode: envConfig.isLivePayPalConfigured ? "live-sandbox" : "deterministic-replay",
      auditChainValid: auditStatus.valid,
      auditChainHead: auditStatus.headHash,
      paypalDoctorChecksPassed: doctor.checksPassed,
      paypalDoctorTotalChecks: doctor.totalChecks,
      paypalDoctorChecks: doctor.checks,
      timestampIso: new Date().toISOString(),
    };
  };

  /**
   * Health & /paypal:doctor Diagnostic Endpoints: GET /api/v1/health & GET /health
   */
  app.get("/api/v1/health", async () => buildHealthPayload());
  app.get("/health", async () => buildHealthPayload());

  /**
   * SSE-01: GET /api/v1/stream/events
   * Streams SseStreamEvent frames (execution_delta, dispute_alert, policy_hold, replay_mode_engaged).
   */
  app.get("/api/v1/stream/events", async (req, reply) => {
    const query = (req.query ?? {}) as Record<string, string | undefined>;
    const workspaceId = normalizeWorkspaceId(query.workspaceId ?? query.workspace_id);

    const recent = sseBus.getRecentEvents(5);
    const initialEvent: SseStreamEvent =
      recent.length > 0
        ? recent[recent.length - 1]
        : {
            eventType: "execution_delta",
            timestampIso: new Date().toISOString(),
            payload: {
              workspaceId,
              status: "STREAM_CONNECTED",
              activeInvoicesCount: repository.listInvoices({ workspaceId }).length,
              activeDisputesCount: repository.listDisputes(workspaceId).length,
            },
          };

    reply
      .code(200)
      .header("Content-Type", "text/event-stream; charset=utf-8")
      .header("Cache-Control", "no-cache, no-transform")
      .header("Connection", "keep-alive")
      .header("X-Accel-Buffering", "no");

    const frames: string[] = [
      `retry: 3000\n`,
      `event: ${initialEvent.eventType}\ndata: ${JSON.stringify(initialEvent)}\n\n`,
    ];

    for (const evt of recent) {
      if (evt !== initialEvent) {
        frames.push(`event: ${evt.eventType}\ndata: ${JSON.stringify(evt)}\n\n`);
      }
    }

    return reply.send(frames.join(""));
  });
}
