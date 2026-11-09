/**
 * PayOps AI (PayPal Sentinel) — Full REST Endpoints, Dual-Contract Hydration, SSE & 43 MCP Tools Suite
 * Covers: API-01..API-14, SSE-01, /api/v1/health, and all 35 core + 8 extended alias tools.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../app.js";
import { repository } from "../db/repository.js";
import { junoIdempotencyStore } from "../modules/junodb-idempotency/idempotency-guard.js";
import { paypalToolkitHost } from "../modules/agent-orchestrator/paypal-toolkit-host.js";

describe("Fastify 5 Server — All 14 REST Endpoints (API-01..API-14), SSE-01, Health & 43 MCP Tools", () => {
  beforeEach(() => {
    repository.seedInMemoryLedger();
    junoIdempotencyStore.clearAll();
  });

  it("GET /, GET /api/v1/live-status, GET /api/v1/health & GET /health return 200 OK with 35 core tools, 8 aliases, and 9/9 /paypal:doctor checks", async () => {
    const app = await buildApp({ logger: false });
    await app.ready();

    const rootHtmlRes = await app.inject({
      method: "GET",
      url: "/",
      headers: { accept: "text/html" },
    });
    expect(rootHtmlRes.statusCode).toBe(200);
    expect(rootHtmlRes.headers["content-type"]).toContain("text/html");
    expect(rootHtmlRes.body).toContain("PayOps AI (PayPal Sentinel) — Dev 1 Backend Live Console");

    const liveStatusRes = await app.inject({ method: "GET", url: "/api/v1/live-status" });
    expect(liveStatusRes.statusCode).toBe(200);
    expect(liveStatusRes.json().mcpTools.total).toBe(43);

    const cfoAliasRes = await app.inject({ method: "GET", url: "/api/v1/insights/cfo-summary" });
    expect(cfoAliasRes.statusCode).toBe(200);
    expect(cfoAliasRes.json().dsoDaysCurrent).toBe(16);

    const c3AliasRes = await app.inject({
      method: "GET",
      url: "/api/v1/catalog/channel3/search?q=mailer",
    });
    expect(c3AliasRes.statusCode).toBe(200);
    expect(c3AliasRes.json().items.length).toBeGreaterThanOrEqual(1);

    const ledgerAliasRes = await app.inject({ method: "GET", url: "/api/v1/audit/ledger" });
    expect(ledgerAliasRes.statusCode).toBe(200);
    expect(ledgerAliasRes.json().chainIntegrity.valid).toBe(true);

    const res = await app.inject({ method: "GET", url: "/api/v1/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(body.mcpToolsRegistered).toBe(35);
    expect(body.extendedAliasesRegistered).toBe(8);
    expect(body.totalMcpToolsAvailable).toBe(43);
    expect(body.paypalDoctorChecksPassed).toBe(9);
    expect(body.auditChainValid).toBe(true);

    const aliasRes = await app.inject({ method: "GET", url: "/health" });
    expect(aliasRes.statusCode).toBe(200);
    await app.close();
  });

  it("GET /api/v1/stream/events (SSE-01) streams valid text/event-stream SseStreamEvent frames", async () => {
    const app = await buildApp({ logger: false });
    await app.ready();

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/stream/events?workspaceId=ws_99102a",
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/event-stream");
    expect(res.body).toContain("event: execution_delta");
    expect(res.body).toContain("data: {");
    await app.close();
  });

  it("API-01 (POST /api/v1/agent/execute) executes approved L3 prompts and returns dual camelCase & snake_case contracts", async () => {
    const app = await buildApp({ logger: false });
    await app.ready();

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/agent/execute",
      payload: {
        workspaceId: "ws_99102a",
        prompt: "Create an invoice for $180.00 USD to buyer@pacificboutique-la.example.com",
        dryRun: false,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    // camelCase (api-contracts.ts)
    expect(body.sessionId).toBeDefined();
    expect(body.execution.toolName).toBe("create_invoice");
    expect(body.execution.policyVerdict).toBe("APPROVED_L3_AUTO");
    expect(body.sdkSnippetTs).toContain("@paypal/paypal-server-sdk");
    expect(body.sdkSnippetPython).toContain("PaypalServersdkClient");
    expect(body.auditEntry.entryHash).toHaveLength(64);
    // snake_case (openapi.yaml)
    expect(body.execution_id).toBe(body.execution.executionId);
    expect(body.mcp_tool_name).toBe("create_invoice");
    expect(body.policy_verdict).toBe("ALLOW");
    await app.close();
  });

  it("API-03 (GET & PUT /api/v1/policies and PUT /api/v1/policies/:policyId) lists and updates Cosmos.AI DSL policies", async () => {
    const app = await buildApp({ logger: false });
    await app.ready();

    const getRes = await app.inject({
      method: "GET",
      url: "/api/v1/policies?workspaceId=ws_99102a",
    });
    expect(getRes.statusCode).toBe(200);
    const getBody = getRes.json();
    expect(getBody.workspaceId).toBe("ws_99102a");
    expect(getBody.policies.length).toBeGreaterThanOrEqual(2);
    expect(getBody.data.length).toBe(getBody.policies.length);

    const putRes = await app.inject({
      method: "PUT",
      url: "/api/v1/policies/pol_refund_risk_gate_01",
      payload: {
        policyId: "pol_refund_risk_gate_01",
        autonomyLevel: "L3",
        maxSingleAutoRefundUsd: 300.0,
        maxDailyRefundVelocityUsd: 600.0,
        maxGnnRiskScoreForAutoRefund: 0.4,
      },
    });
    expect(putRes.statusCode).toBe(200);
    const putBody = putRes.json();
    expect(putBody.maxSingleAutoRefundUsd).toBe(300.0);
    expect(putBody.max_single_tx_minor).toBe(30000);
    expect(putBody.ast_compiled).toBe(true);

    const putAliasRes = await app.inject({
      method: "PUT",
      url: "/api/v1/policies",
      payload: {
        policyId: "pol_refund_risk_gate_01",
        autonomyLevel: "L3",
        maxSingleAutoRefundUsd: 250.0,
        maxDailyRefundVelocityUsd: 500.0,
        maxGnnRiskScoreForAutoRefund: 0.35,
      },
    });
    expect(putAliasRes.statusCode).toBe(200);
    await app.close();
  });

  it("API-04, API-05 & API-06 create autonomous invoices, list invoices, enforce 72h reminder cooldown (R-11), and update Bryntum schedules", async () => {
    const app = await buildApp({ logger: false });
    await app.ready();

    // API-04: Create autonomous invoice
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/invoices/autonomous",
      payload: {
        workspaceId: "ws_99102a",
        recipientEmail: "ap@vancetech.example.com",
        amountValue: "1450.00",
        currencyCode: "USD",
        dueDate: "2026-11-29",
        earlyPaymentDiscountPct: "2.50",
        enableRecurringSeries: true,
      },
    });
    expect(createRes.statusCode).toBe(201);
    const created = createRes.json();
    expect(created.invoiceId).toMatch(/^INV2-/);
    expect(created.status).toBe("SENT");
    expect(created.qrCodeUri).toContain("/v2/invoicing/invoices/");
    expect(created.conditionalRule.percentage).toBe("2.50");

    // API-05: List invoices
    const listRes = await app.inject({
      method: "GET",
      url: "/api/v1/invoices?workspaceId=ws_99102a",
    });
    expect(listRes.statusCode).toBe(200);
    const listBody = listRes.json();
    expect(listBody.invoices.length).toBeGreaterThanOrEqual(3);
    expect(listBody.data.length).toBe(listBody.invoices.length);

    // API-06: Send first reminder (succeeds)
    const remind1 = await app.inject({
      method: "POST",
      url: `/api/v1/invoices/${created.invoiceId}/remind`,
      payload: {
        invoiceId: created.invoiceId,
        note: "First dunning notice",
      },
    });
    expect(remind1.statusCode).toBe(200);
    expect(remind1.json().lastReminderSentAt).toBeDefined();

    // API-06: Second immediate reminder within 72h cooldown is rejected with 409 (R-11)
    const remind2 = await app.inject({
      method: "POST",
      url: `/api/v1/invoices/${created.invoiceId}/remind`,
      payload: {
        invoiceId: created.invoiceId,
        note: "Duplicate reminder within 72h",
      },
    });
    expect(remind2.statusCode).toBe(409);
    expect(remind2.json().reason_code).toBe("RC_11_REMINDER_COOLDOWN_72H_ACTIVE");

    // API-06: Bryntum schedule update
    const scheduleRes = await app.inject({
      method: "POST",
      url: `/api/v1/invoices/${created.invoiceId}/remind`,
      payload: {
        invoiceId: created.invoiceId,
        action: "UPDATE_BRYNTUM_SCHEDULE",
        newTriggerDate: "2026-12-05",
      },
    });
    expect(scheduleRes.statusCode).toBe(200);
    expect(scheduleRes.json().dueDate).toBe("2026-12-05");
    await app.close();
  });

  it("API-07, API-08 & API-09 create, capture with tracking, and refund PayPal Orders v2", async () => {
    const app = await buildApp({ logger: false });
    await app.ready();

    // API-07: Create Order
    const createOrderRes = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      payload: {
        workspaceId: "ws_99102a",
        skuId: "C3-88210",
        amountValue: "190.00",
        currencyCode: "USD",
        intent: "CAPTURE",
      },
    });
    expect(createOrderRes.statusCode).toBe(201);
    const createdOrder = createOrderRes.json();
    expect(createdOrder.order.status).toBe("CREATED");
    expect(createdOrder.junodbLeaseStatus).toBe("ACQUIRED");

    const orderId = createdOrder.order.orderId;

    // API-08: Capture Order & attach carrier shipment tracking
    const captureRes = await app.inject({
      method: "POST",
      url: `/api/v1/orders/${orderId}/capture`,
      payload: {
        carrierCode: "DHL_EXPRESS",
        trackingNumber: "JJD014600001122",
      },
    });
    expect(captureRes.statusCode).toBe(200);
    const captured = captureRes.json();
    expect(captured.order.status).toBe("COMPLETED");
    expect(captured.order.trackingNumber).toBe("JJD014600001122");

    // API-09: Low-risk refund under $250 cap executes automatically at L3 (200 OK)
    const refundRes = await app.inject({
      method: "POST",
      url: `/api/v1/orders/${orderId}/refund`,
      payload: {
        amountValue: "190.00",
        currencyCode: "USD",
        reasonNote: "Partial courtesy adjustment",
      },
    });
    expect(refundRes.statusCode).toBe(200);
    expect(refundRes.json().execution.policyVerdict).toBe("APPROVED_L3_AUTO");

    // API-09: High-value ($420 > $250 cap) & high GNN risk refund on 8XL99102481 is held (202 Accepted)
    const heldRefundRes = await app.inject({
      method: "POST",
      url: "/api/v1/orders/8XL99102481/refund",
      payload: {
        amountValue: "420.00",
        currencyCode: "USD",
        reasonNote: "Full refund request on disputed order",
      },
    });
    expect(heldRefundRes.statusCode).toBe(202);
    expect(heldRefundRes.json().execution.policyVerdict).toBe("HELD_FOR_L2_PASSKEY");
    await app.close();
  });

  it("API-10 & API-11 list enriched disputes and autonomously resolve friendly-fraud vs low-value SNAD claims", async () => {
    const app = await buildApp({ logger: false });
    await app.ready();

    // API-10: List disputes
    const listRes = await app.inject({
      method: "GET",
      url: "/api/v1/disputes?workspaceId=ws_99102a",
    });
    expect(listRes.statusCode).toBe(200);
    const listBody = listRes.json();
    expect(listBody.disputes.length).toBeGreaterThanOrEqual(2);
    expect(listBody.disputes[0].disputeId).toBe("PP-D-90412");
    expect(listBody.disputes[0].gnnRiskScore).toBe(0.89);

    // API-11: Contest friendly-fraud INR dispute PP-D-90412 with Compelling Evidence 3.0
    const contestRes = await app.inject({
      method: "POST",
      url: "/api/v1/disputes/PP-D-90412/resolve",
      payload: {
        disputeId: "PP-D-90412",
        action: "CONTEST_WITH_COMPELLING_EVIDENCE",
        carrierTrackingNumber: "JJD014600009812",
      },
    });
    expect(contestRes.statusCode).toBe(200);
    const contested = contestRes.json();
    expect(contested.executed_strategy).toBe("CONTEST_WITH_COMPELLING_EVIDENCE");
    expect(contested.evidence_bundle.carrier_tracking).toContain("JJD014600009812");
    expect(contested.evidence_bundle.elastic_policy_citation).toContain("Compelling Evidence 3.0");

    // API-11: Attempting to auto-accept high-risk DELIVERED dispute PP-D-90412 is blocked with 409
    const blockedAccept = await app.inject({
      method: "POST",
      url: "/api/v1/disputes/PP-D-90412/resolve",
      payload: {
        disputeId: "PP-D-90412",
        action: "AUTO_ACCEPT_LOW_VALUE_CLAIM",
      },
    });
    expect(blockedAccept.statusCode).toBe(409);

    // API-11: Low-value ($35) SNAD dispute PP-D-90419 is auto-accepted under L3 policy
    const acceptLowRes = await app.inject({
      method: "POST",
      url: "/api/v1/disputes/PP-D-90419/resolve",
      payload: {
        disputeId: "PP-D-90419",
        action: "AUTO_ACCEPT_LOW_VALUE_CLAIM",
      },
    });
    expect(acceptLowRes.statusCode).toBe(200);
    expect(acceptLowRes.json().executed_strategy).toBe("AUTO_ACCEPT_LOW_VALUE_CLAIM");
    await app.close();
  });

  it("API-12 & API-14 create subscription plans and return merchant working-capital insights", async () => {
    const app = await buildApp({ logger: false });
    await app.ready();

    // API-12: Create subscription plan
    const subRes = await app.inject({
      method: "POST",
      url: "/api/v1/subscriptions/plans",
      payload: {
        workspaceId: "ws_99102a",
        productName: "Kaveri Priority B2B Supply Line",
        planName: "Annual Priority Supply Retainer",
        amountValue: "4800.00",
        currencyCode: "USD",
        billingIntervalUnit: "YEAR",
      },
    });
    expect(subRes.statusCode).toBe(201);
    const subBody = subRes.json();
    expect(subBody.plan.planName).toBe("Annual Priority Supply Retainer");
    expect(subBody.plan.status).toBe("ACTIVE");

    // API-14: Merchant insights
    const insightsRes = await app.inject({
      method: "GET",
      url: "/api/v1/analytics/insights?workspaceId=ws_99102a",
    });
    expect(insightsRes.statusCode).toBe(200);
    const insights = insightsRes.json();
    expect(insights.dsoDaysCurrent).toBe(16);
    expect(insights.dsoReductionPct).toBe(42.8);
    expect(insights.disputeWinRatePct).toBe(84.0);
    expect(insights.annualizedSavingsUsd).toBe("26960.00");
    expect(insights.north_star_anmpr_usd).toBe(4470.0);
    await app.close();
  });

  it("executes all 43 registered @paypal/agent-toolkit MCP tools (35 core + 8 extended aliases) in-process", async () => {
    const allTools = paypalToolkitHost.listAllTools();
    expect(allTools.length).toBe(43);
    expect(paypalToolkitHost.listCoreTools().length).toBe(35);
    expect(paypalToolkitHost.listExtendedAliases().length).toBe(8);

    for (const descriptor of allTools) {
      const result = await paypalToolkitHost.executeTool({
        toolName: descriptor.name,
        args: {
          workspace_id: "ws_99102a",
          invoice_id: "INV2-X89A-4412-9012-7731",
          order_id: "8XL99102481",
          dispute_id: "PP-D-90419",
          plan_id: "P-5ML4271244454362WXNWU5NQ",
          product_id: "PROD-88102KAVERI",
          series_id: "SER-2026-001",
          amountValue: "100.00",
          currencyCode: "USD",
        },
        workspaceId: "ws_99102a",
      });
      expect(result.httpStatus).toBeGreaterThanOrEqual(200);
      expect(result.httpStatus).toBeLessThan(300);
      expect(result.paypalRequestId.length).toBeGreaterThan(8);
    }
  });

  it("supports full-stack apps/web <-> services/api seed fixture ID parity and dynamic UI HITL execution approvals", async () => {
    const app = await buildApp({ logger: false });
    await app.ready();

    // Frontend Bryntum invoice ID INV2-F19A-7704-6612-4002 remind returns invoice + status
    const remindRes = await app.inject({
      method: "POST",
      url: "/api/v1/invoices/INV2-F19A-7704-6612-4002/remind",
      payload: {
        newTriggerDate: "2026-11-12",
      },
    });
    expect(remindRes.statusCode).toBe(200);
    const remindBody = remindRes.json();
    expect(remindBody.invoiceId).toBe("INV2-F19A-7704-6612-4002");
    expect(remindBody.status).toBe("REMINDER_SCHEDULED_72H_GUARD_OK");
    expect(remindBody.invoice.invoiceId).toBe("INV2-F19A-7704-6612-4002");

    // Frontend Dispute War-Room IDs PP-D-4490 and PP-D-3988 resolve with top-level status & paypalRequestId
    const dispContestRes = await app.inject({
      method: "POST",
      url: "/api/v1/disputes/PP-D-4490/resolve",
      payload: {
        disputeId: "PP-D-4490",
        action: "CONTEST_WITH_COMPELLING_EVIDENCE",
        carrierTrackingNumber: "789102938102",
      },
    });
    expect(dispContestRes.statusCode).toBe(200);
    expect(dispContestRes.json().disputeId).toBe("PP-D-4490");
    expect(dispContestRes.json().status).toBe("EVIDENCE_SUBMITTED_TO_PAYPAL_SANDBOX");
    expect(dispContestRes.json().paypalRequestId).toBeTruthy();

    // Frontend Fastlane Order ID 5O190127TN364715T refund returns top-level orderId
    const refundRes = await app.inject({
      method: "POST",
      url: "/api/v1/orders/5O190127TN364715T/refund",
      payload: {
        amountValue: "120.00",
        currencyCode: "USD",
      },
    });
    expect(refundRes.statusCode).toBe(200);
    expect(refundRes.json().orderId).toBe("5O190127TN364715T");

    // Dynamic UI-created held execution ex_sim_hold_9900 can be approved via API-02
    const approveRes = await app.inject({
      method: "POST",
      url: "/api/v1/agent/approve/ex_sim_hold_9900",
      headers: {
        "x-payops-role": "OWNER",
      },
      payload: {
        executionId: "ex_sim_hold_9900",
        operatorUserId: "usr_owner_01",
        decision: "APPROVE",
        webauthnSignatureBase64: "webauthn_assertion_sig_ed25519_demo_99102a_valid_passkey",
        operatorReason: "Approved simulated hold from Command Center",
      },
    });
    expect(approveRes.statusCode).toBe(200);
    expect(approveRes.json().status).toBe("RELEASED_AND_EXECUTED");
    expect(approveRes.json().executionId).toBe("ex_sim_hold_9900");

    await app.close();
  });
});

