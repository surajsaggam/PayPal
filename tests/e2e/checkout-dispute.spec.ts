/**
 * PayOps AI (PayPal Sentinel) — End-to-End Verification Specification
 * Covers:
 * - F-02: Cosmos.AI Deterministic Spend & Risk Policy Firewall (R-01)
 * - F-03: Autonomous Smart Invoicing v2 with QR & Conditional Rules (API-04)
 * - F-04 & F-10: Autonomous Dispute Defense with Carrier Tracking & GNN Risk Score (API-11)
 * - F-05 & F-06: Idempotent Order Capture & Refund Enforcement via PayPal-Request-Id (R-02)
 */

import { describe, it, expect } from "vitest";
import {
  SEED_DISPUTES,
  SEED_INVOICES,
  computeAuditChainHash,
  computeDeterministicIdempotencyKey,
} from "../../scripts/seed-sandbox";

interface PolicyRuleConfig {
  maxSingleAutoRefundUsd: number;
  maxDailyRefundVelocityUsd: number;
  maxGnnRiskScoreForAutoRefund: number;
}

function evaluateCosmosPolicyFirewall(
  toolName: string,
  amountUsd: number,
  cumulative24hRefundUsd: number,
  gnnRiskScore: number,
  untrustedTextContainsInjection: boolean,
  policy: PolicyRuleConfig
): { verdict: "APPROVED_L3_AUTO" | "HELD_FOR_L2_PASSKEY" | "BLOCKED_SECURITY_INJECTION"; reasonCode: string } {
  if (untrustedTextContainsInjection) {
    return {
      verdict: "BLOCKED_SECURITY_INJECTION",
      reasonCode: "RC_00_INDIRECT_PROMPT_INJECTION_DETECTED",
    };
  }
  if (toolName === "create_refund") {
    if (gnnRiskScore >= policy.maxGnnRiskScoreForAutoRefund) {
      return {
        verdict: "HELD_FOR_L2_PASSKEY",
        reasonCode: "RC_04_GNN_FRIENDLY_FRAUD_RISK_THRESHOLD_EXCEEDED",
      };
    }
    if (amountUsd > policy.maxSingleAutoRefundUsd) {
      return {
        verdict: "HELD_FOR_L2_PASSKEY",
        reasonCode: "RC_02_EXCEEDS_SINGLE_REFUND_CAP_250_USD",
      };
    }
    if (cumulative24hRefundUsd + amountUsd > policy.maxDailyRefundVelocityUsd) {
      return {
        verdict: "HELD_FOR_L2_PASSKEY",
        reasonCode: "RC_03_EXCEEDS_24H_VELOCITY_CAP_500_USD",
      };
    }
  }
  return { verdict: "APPROVED_L3_AUTO", reasonCode: "RC_OK_POLICY_PASSED" };
}

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
});
