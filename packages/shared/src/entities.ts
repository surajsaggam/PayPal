/**
 * PayOps AI (PayPal Sentinel) — Canonical Data Entity Schemas (E-01 to E-10)
 * Frozen at Phase 0 (H02) — Synchronized with docs/03-engineering/DATA_MODEL.md & api/openapi.yaml
 */

export type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "PYUSD";
export type AutonomyLevel = "L0" | "L1" | "L2" | "L3" | "L4";
export type OperatorRole = "OWNER" | "FINANCE_ADMIN" | "OPS_ANALYST" | "AUDITOR" | "AGENT_SERVICE";

/** E-01: MerchantWorkspace */
export interface MerchantWorkspace {
  workspaceId: string;
  merchantName: string;
  paypalMerchantId: string;
  baseCurrency: CurrencyCode;
  riskTier: "LOW" | "STANDARD" | "ELEVATED";
  autonomyLevel: AutonomyLevel;
  createdAt: string;
}

/** E-02: OperatorUser */
export interface OperatorUser {
  userId: string;
  workspaceId: string;
  email: string;
  displayName: string;
  role: OperatorRole;
  webauthnCredentialId?: string;
  publicKeyEd25519?: string;
}

/** E-03: AgentSession */
export interface AgentSession {
  sessionId: string;
  workspaceId: string;
  operatorUserId: string;
  intentDomain: "INVOICES" | "ORDERS" | "DISPUTES" | "SHIPMENT_TRACKING" | "CATALOG" | "SUBSCRIPTIONS" | "REPORTING";
  toolHopCount: number;
  maxToolHops: number;
  cumulativeTokenCostUsd: number;
  maxSessionCostUsd: number;
  traceId: string;
  status: "ACTIVE" | "COMPLETED" | "HALTED_CIRCUIT_BREAKER" | "HELD_FOR_HITL";
}

/** E-04: AgentToolExecution */
export interface AgentToolExecution {
  executionId: string;
  sessionId: string;
  workspaceId: string;
  toolName: string;
  paypalRequestId: string;
  junodbLeaseStatus: "ACQUIRED" | "REPLAYED_FROM_JUNODB" | "RELEASED";
  policyVerdict: "APPROVED_L3_AUTO" | "HELD_FOR_L2_PASSKEY" | "BLOCKED_SECURITY_INJECTION";
  reasonCode: string;
  gnnRiskScore: number;
  amountValue?: string;
  currencyCode?: CurrencyCode;
  executedAt: string;
}

/** E-05: PolicyRule */
export interface PolicyRule {
  policyId: string;
  workspaceId: string;
  ruleName: string;
  autonomyLevel: AutonomyLevel;
  maxSingleAutoRefundUsd: number;
  maxDailyRefundVelocityUsd: number;
  maxSingleAutoInvoiceSendUsd: number;
  maxAutoDisputeClaimAcceptUsd: number;
  maxGnnRiskScoreForAutoRefund: number;
  minHoursBetweenInvoiceReminders: number;
  isActive: boolean;
}

/** E-06: PayPalOrderRecord */
export interface PayPalOrderRecord {
  orderId: string;
  workspaceId: string;
  paypalRequestId: string;
  intent: "CAPTURE" | "AUTHORIZE";
  status: "CREATED" | "APPROVED" | "COMPLETED" | "REFUNDED";
  amountValue: string;
  currencyCode: CurrencyCode;
  buyerEmailHmac: string;
  carrierCode?: "DHL_EXPRESS" | "FEDEX" | "BLUEDART" | "UPS";
  trackingNumber?: string;
  trackingStatus?: "DELIVERED" | "IN_TRANSIT" | "PENDING";
}

/** E-07: PayPalInvoiceRecord */
export interface PayPalInvoiceRecord {
  invoiceId: string;
  workspaceId: string;
  invoiceNumber: string;
  recipientEmail: string;
  amountValue: string;
  currencyCode: CurrencyCode;
  status: "DRAFT" | "SENT" | "SCHEDULED" | "PAID" | "CANCELLED" | "OVERDUE";
  dueDate: string;
  qrCodeUri: string;
  conditionalRule?: {
    ruleType: "EARLY_PAYMENT_DISCOUNT" | "LATE_PAYMENT_FEE";
    percentage: string;
    triggerDate: string;
  };
  lastReminderSentAt?: string;
  idempotencyKey: string;
}

/** E-08: PayPalDisputeCase */
export interface PayPalDisputeCase {
  disputeId: string;
  workspaceId: string;
  orderId: string;
  reasonCode: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED" | "SIGNIFICANTLY_NOT_AS_DESCRIBED" | "UNAUTHORIZED";
  disputedAmountValue: string;
  currencyCode: CurrencyCode;
  carrierCode: "DHL_EXPRESS" | "FEDEX" | "BLUEDART";
  trackingNumber: string;
  trackingStatus: "DELIVERED" | "IN_TRANSIT";
  gnnRiskScore: number;
  treeShapReasons: string[];
  recommendedAction: "CONTEST_WITH_COMPELLING_EVIDENCE" | "AUTO_ACCEPT_LOW_VALUE_CLAIM" | "ROUTE_TO_HITL_PASSKEY";
  responseDueIso: string;
}

/** E-09: SubscriptionPlanRecord */
export interface SubscriptionPlanRecord {
  planId: string;
  workspaceId: string;
  productId: string;
  planName: string;
  billingIntervalUnit: "MONTH" | "YEAR";
  amountValue: string;
  currencyCode: CurrencyCode;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

/** E-10: ImmutableAuditLog */
export interface ImmutableAuditLog {
  logId: string;
  workspaceId: string;
  timestampIso: string;
  actorId: string;
  toolName: string;
  paypalRequestId: string;
  policyVerdict: string;
  prevHash: string;
  entryHash: string;
}
