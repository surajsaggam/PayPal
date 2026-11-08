/**
 * PayOps AI (PayPal Sentinel) — PYUSD Solana SPL Token-2022 Bridge, Channel3, Zapier, Elastic & AI Evals Suite
 * Covers: F-11 (R-09 Memo Required), F-12 (Channel3, Zapier, Elastic), M-01..M-05, and eval:ci gate.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../app.js";
import { repository } from "../db/repository.js";
import { runAiEvaluationSuite } from "../ai/evals/run-ci-gate.js";
import { PYUSD_SOLANA_MINT_ADDRESS } from "../modules/pyusd-bridge/pyusd-solana.service.js";
import { runPolicyWebhookWorkerCycle } from "../workers/policy-webhook-worker.js";

describe("PYUSD Solana SPL Token-2022 Bridge (F-11), Channel3/Zapier/Elastic (F-12) & AI Eval Gate", () => {
  beforeEach(() => {
    repository.seedInMemoryLedger();
  });

  it("validates PYUSD Solana SPL Token-2022 (6 decimals) Memo Required (R-09) and reconciles PayPal Invoices", async () => {
    const app = await buildApp({ logger: false });
    await app.ready();

    // 1. Valid PYUSD settlement with matching PAYOPS:<invoiceId>:<paypalRequestId> memo
    const validRes = await app.inject({
      method: "POST",
      url: "/api/v1/pyusd/settle",
      payload: {
        workspaceId: "ws_99102a",
        invoiceId: "INV2-X89A-4412-9012-7731",
        amountValue: "2450.00",
        paypalRequestId: "idem_pyusd_8841",
        memo: "PAYOPS:INV2-X89A-4412-9012-7731:idem_pyusd_8841",
        confidentialTransfer: true,
      },
    });
    expect(validRes.statusCode).toBe(200);
    const settled = validRes.json();
    expect(settled.status).toBe("PAID");
    expect(settled.mintAddress).toBe(PYUSD_SOLANA_MINT_ADDRESS);
    expect(settled.decimals).toBe(6);
    expect(settled.amountBaseUnits).toBe("2450000000");
    expect(settled.wireFeeComparison.traditionalWireUsd).toBe("48.00");
    expect(settled.wireFeeComparison.solanaPyusdFeeUsd).toBe("0.001");
    expect(settled.invoice.status).toBe("PAID");

    // 2. Invalid / mismatched memo is rejected with 409 (R-09)
    const badMemoRes = await app.inject({
      method: "POST",
      url: "/api/v1/pyusd/settle",
      payload: {
        workspaceId: "ws_99102a",
        invoiceId: "INV2-X89A-4412-9012-7731",
        amountValue: "2450.00",
        memo: "INVALID_MEMO_WITHOUT_INVOICE_BINDING",
      },
    });
    expect(badMemoRes.statusCode).toBe(409);
    expect(badMemoRes.json().reason_code).toBe("R09_PYUSD_MEMO_REQUIRED_MISMATCH");

    await app.close();
  });

  it("queries Channel3 B2B catalog, dispatches Zapier webhooks, inspects E-10 audit logs, and runs background worker", async () => {
    const app = await buildApp({ logger: false });
    await app.ready();

    // Channel3 search
    const c3Res = await app.inject({
      method: "GET",
      url: "/api/v1/catalog/channel3?q=mailer",
    });
    expect(c3Res.statusCode).toBe(200);
    const c3Body = c3Res.json();
    expect(c3Body.items.length).toBeGreaterThanOrEqual(1);
    expect(c3Body.items[0].skuId).toBe("C3-88210");

    // Zapier trigger & delivery inspection
    const zapTrigger = await app.inject({
      method: "POST",
      url: "/api/v1/integrations/zapier/trigger",
      payload: {
        workspaceId: "ws_99102a",
        eventType: "HITL_APPROVAL_REQUIRED",
        payload: { executionId: "exec_test_01" },
      },
    });
    expect(zapTrigger.statusCode).toBe(200);
    expect(zapTrigger.json().deliveryId).toMatch(/^zap_/);

    const zapList = await app.inject({
      method: "GET",
      url: "/api/v1/integrations/zapier/deliveries?workspaceId=ws_99102a",
    });
    expect(zapList.statusCode).toBe(200);
    expect(zapList.json().total_count).toBeGreaterThanOrEqual(1);

    // Audit log inspection route
    const auditRes = await app.inject({
      method: "GET",
      url: "/api/v1/audit-logs?workspaceId=ws_99102a",
    });
    expect(auditRes.statusCode).toBe(200);
    expect(auditRes.json().chainIntegrity.valid).toBe(true);

    // Worker cycle
    const workerSummary = await runPolicyWebhookWorkerCycle("ws_99102a");
    expect(workerSummary.auditChainValid).toBe(true);
    expect(workerSummary.disputesEvaluated).toBeGreaterThanOrEqual(2);

    await app.close();
  });

  it("passes all 5 benchmark gates in the AI Evaluation & Red-Team CI Suite (eval:ci)", async () => {
    const summary = await runAiEvaluationSuite();
    expect(summary.passed).toBe(true);
    expect(summary.mcpToolSelectionRecallPct).toBe(100.0);
    expect(summary.apimaticSchemaValidityPct).toBe(100.0);
    expect(summary.idempotencyKeyPresencePct).toBe(100.0);
    expect(summary.promptInjectionBlockRatePct).toBe(100.0);
    expect(summary.unauthorizedSpendBypassRatePct).toBe(0.0);
    expect(summary.gnnFriendlyFraudPrecisionPct).toBe(100.0);
  });
});
