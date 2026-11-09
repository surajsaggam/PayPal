/**
 * PayOps AI (PayPal Sentinel) — End-to-End Verification Specification
 * Covers:
 * - F-02: Cosmos.AI Deterministic Spend & Risk Policy Firewall (R-01)
 * - F-03: Autonomous Smart Invoicing v2 with QR & Conditional Rules (API-04)
 * - F-04 & F-10: Autonomous Dispute Defense with Carrier Tracking & GNN Risk Score (API-11)
 * - F-05 & F-06: Idempotent Order Capture & Refund Enforcement via PayPal-Request-Id (R-02)
 * - F-07, F-08, F-09, F-11, F-12: Dev 2 Cockpit Mock/Replay Fixtures & 10k-Row AG Grid Generator
 */

import { describe, it, expect } from "vitest";
import {
  SEED_DISPUTES,
  SEED_INVOICES,
  computeAuditChainHash,
  computeDeterministicIdempotencyKey,
} from "../../scripts/seed-sandbox";
import {
  evaluateCosmosPolicyFirewall,
  type CosmosPolicyConfig,
} from "../../packages/shared/src/policy-dsl";
import { validatePayPalMonetaryPayload } from "../../packages/shared/src/apimatic-validators";
import {
  ALL_35_MCP_TOOLS,
  MOCK_CHANNEL3_CATALOG,
  MOCK_DISPUTES,
  MOCK_EXECUTIONS,
  MOCK_GUIDED_DEMO_SCENARIOS,
  MOCK_INVOICES,
  MOCK_WORKSPACES,
  generateHighDensityLedgerRows,
} from "../../packages/shared/src/mock-fixtures";

type PolicyRuleConfig = CosmosPolicyConfig;

describe("PayOps AI (PayPal Sentinel) — E2E Checkout, Invoicing & Dispute Defense Suite", () => {
  const defaultPolicy: PolicyRuleConfig = {
    maxSingleAutoRefundUsd: 250.0,
    maxDailyRefundVelocityUsd: 500.0,
    maxGnnRiskScoreForAutoRefund: 0.35,
  };

  it("enforces JunoDB-patterned PayPal-Request-Id idempotency across retries (F-06, R-02)", () => {
    const keyAttempt1 = computeDeterministicIdempotencyKey("ws_99102a", "order", "8XL99102481", "capture");
    const keyAttempt2 = computeDeterministicIdempotencyKey("ws_99102a", "order", "8XL99102481", "capture");
    const differentOrderKey = computeDeterministicIdempotencyKey("ws_99102a", "order", "9AB11029384", "capture");

    expect(keyAttempt1).toBe(keyAttempt2);
    expect(keyAttempt1).not.toBe(differentOrderKey);
    expect(keyAttempt1.startsWith("idem_ws_99102a_")).toBe(true);
  });

  it("validates smart PayPal Invoice v2 fixtures with 2-decimal ISO-4217 strings and QR codes (F-03, F-09, R-03)", () => {
    for (const invoice of SEED_INVOICES) {
      expect(invoice.amountValue).toMatch(/^[0-9]+\.[0-9]{2}$/);
      expect(["USD", "INR", "EUR", "GBP"]).toContain(invoice.currencyCode);
      expect(invoice.qrCodeUri).toContain("/v2/invoicing/invoices/");
      expect(invoice.conditionalRule.ruleType).toBe("EARLY_PAYMENT_DISCOUNT");
    }
  });

  it("blocks indirect prompt injection embedded in buyer dispute notes (F-02, R-01)", () => {
    const result = evaluateCosmosPolicyFirewall("create_refund", 120.0, 0, 0.1, true, defaultPolicy);
    expect(result.verdict).toBe("BLOCKED_SECURITY_INJECTION");
    expect(result.reasonCode).toBe("RC_00_INDIRECT_PROMPT_INJECTION_DETECTED");
  });

  it("intercepts friendly-fraud INR disputes when carrier tracking is DELIVERED and GNN score is high (F-04, F-10)", () => {
    const friendlyFraudCase = SEED_DISPUTES[0];
    expect(friendlyFraudCase.trackingStatus).toBe("DELIVERED");
    expect(friendlyFraudCase.gnnRiskScore).toBeGreaterThanOrEqual(0.85);
    expect(friendlyFraudCase.recommendedAction).toBe("CONTEST_WITH_COMPELLING_EVIDENCE");

    const refundGate = evaluateCosmosPolicyFirewall(
      "create_refund",
      Number(friendlyFraudCase.disputedAmountValue),
      0,
      friendlyFraudCase.gnnRiskScore,
      false,
      defaultPolicy
    );
    expect(refundGate.verdict).toBe("HELD_FOR_L2_PASSKEY");
  });

  it("maintains tamper-evident SHA-256 hash chaining in ImmutableAuditLog (E-10)", () => {
    const genesis = "0".repeat(64);
    const h1 = computeAuditChainHash(genesis, "2026-11-05T08:00:00Z", "usr_owner", "send_invoice", '{"id":1}', "APPROVED");
    const h2 = computeAuditChainHash(h1, "2026-11-05T08:01:00Z", "usr_owner", "pay_order", '{"id":2}', "APPROVED");
    const tamperedH1 = computeAuditChainHash(
      genesis,
      "2026-11-05T08:00:00Z",
      "usr_owner",
      "send_invoice",
      '{"id":999}',
      "APPROVED"
    );
    const h2FromTampered = computeAuditChainHash(
      tamperedH1,
      "2026-11-05T08:01:00Z",
      "usr_owner",
      "pay_order",
      '{"id":2}',
      "APPROVED"
    );

    expect(h2).toHaveLength(64);
    expect(h2).not.toBe(h2FromTampered);
  });

  it("enforces APIMatic 2-decimal string validation and shared Dev1/Dev2 contract parity (F-09, R-03)", () => {
    const validPayload = validatePayPalMonetaryPayload("2450.00", "USD");
    expect(validPayload.valid).toBe(true);
    expect(validPayload.normalizedAmountValue).toBe("2450.00");

    const invalidFloatPayload = validatePayPalMonetaryPayload(2450, "USD");
    expect(invalidFloatPayload.valid).toBe(false);
    expect(invalidFloatPayload.errors[0]).toContain("R-03");

    expect(MOCK_WORKSPACES.length).toBeGreaterThanOrEqual(2);
    expect(MOCK_INVOICES[0].invoiceId).toBe(SEED_INVOICES[0].invoiceId);
    expect(MOCK_DISPUTES[0].disputeId).toBe(SEED_DISPUTES[0].disputeId);
    expect(MOCK_EXECUTIONS.length).toBeGreaterThanOrEqual(8);
    expect(MOCK_CHANNEL3_CATALOG.length).toBeGreaterThanOrEqual(3);
    expect(MOCK_GUIDED_DEMO_SCENARIOS).toHaveLength(4);

    const totalTools = ALL_35_MCP_TOOLS.reduce((sum, dom) => sum + dom.tools.length, 0);
    expect(totalTools).toBe(35);

    const benchmarkRows = generateHighDensityLedgerRows(10000);
    expect(benchmarkRows).toHaveLength(10000);
  });
});
