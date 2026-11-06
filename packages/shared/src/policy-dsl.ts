/**
 * PayOps AI (PayPal Sentinel) — Deterministic Spend & Risk Policy Firewall (Cosmos.AI DSL, F-02)
 * Write Owner (H03-H48): Dev 1 (100%)
 */

export interface CosmosPolicyConfig {
  maxSingleAutoRefundUsd: number;
  maxDailyRefundVelocityUsd: number;
  maxGnnRiskScoreForAutoRefund: number;
  minHoursBetweenInvoiceReminders?: number;
}

export interface CosmosPolicyVerdict {
  verdict: "APPROVED_L3_AUTO" | "HELD_FOR_L2_PASSKEY" | "BLOCKED_SECURITY_INJECTION";
  reasonCode: string;
}

export function evaluateCosmosPolicyFirewall(
  toolName: string,
  amountUsd: number,
  cumulative24hRefundUsd: number,
  gnnRiskScore: number,
  untrustedTextContainsInjection: boolean,
  policy: CosmosPolicyConfig
): CosmosPolicyVerdict {
  if (untrustedTextContainsInjection) {
    return {
      verdict: "BLOCKED_SECURITY_INJECTION",
      reasonCode: "RC_00_INDIRECT_PROMPT_INJECTION_DETECTED",
    };
  }
  if (toolName === "create_refund" || toolName === "record_refund_for_invoice") {
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
  return {
    verdict: "APPROVED_L3_AUTO",
    reasonCode: "RC_OK_POLICY_PASSED",
  };
}
