/**
 * PayOps AI (PayPal Sentinel) — Canonical REST & SSE API Contracts (API-01 to API-14 + SSE-01)
 * Frozen at Phase 0 (H02) — Synchronized with api/openapi.yaml & docs/03-engineering/API_SPEC.md
 */

import type {
  AgentToolExecution,
  AutonomyLevel,
  CurrencyCode,
  ImmutableAuditLog,
  PayPalDisputeCase,
  PayPalInvoiceRecord,
  PayPalOrderRecord,
  PolicyRule,
  SubscriptionPlanRecord,
} from "./entities.js";

/** API-01: POST /api/v1/agent/execute */
export interface AgentExecuteRequest {
  workspaceId: string;
  prompt: string;
  dryRun?: boolean;
  idempotencyKey?: string;
}

export interface AgentExecuteResponse {
  sessionId: string;
  execution: AgentToolExecution;
  sdkSnippetTs: string;
  sdkSnippetPython: string;
  auditEntry: ImmutableAuditLog;
}

/** API-02: POST /api/v1/agent/approve/{executionId} */
export interface AgentApproveRequest {
  executionId: string;
  operatorUserId: string;
  webauthnSignatureBase64: string;
  decision: "APPROVE" | "REJECT";
}

export interface AgentApproveResponse {
  executionId: string;
  status: "RELEASED_AND_EXECUTED" | "REJECTED_BY_OPERATOR";
  paypalTransactionId?: string;
  auditEntryHash: string;
}

/** API-03: GET & PUT /api/v1/policies */
export interface UpdatePolicyRequest {
  policyId: string;
  autonomyLevel: AutonomyLevel;
  maxSingleAutoRefundUsd: number;
  maxDailyRefundVelocityUsd: number;
  maxGnnRiskScoreForAutoRefund: number;
}

export interface PoliciesListResponse {
  workspaceId: string;
  policies: PolicyRule[];
}

/** API-04: POST /api/v1/invoices/autonomous & API-05: GET /api/v1/invoices */
export interface CreateAutonomousInvoiceRequest {
  workspaceId: string;
  recipientEmail: string;
  amountValue: string;
  currencyCode: CurrencyCode;
  dueDate: string;
  earlyPaymentDiscountPct?: string;
  enableRecurringSeries?: boolean;
}

export interface InvoicesListResponse {
  workspaceId: string;
  invoices: PayPalInvoiceRecord[];
}

/** API-06: POST /api/v1/invoices/{invoiceId}/remind */
export interface RemindInvoiceRequest {
  invoiceId: string;
  newTriggerDate?: string;
  note?: string;
}

/** API-07: POST /api/v1/orders, API-08: capture, API-09: refund */
export interface CreateOrderRequest {
  workspaceId: string;
  skuId: string;
  amountValue: string;
  currencyCode: CurrencyCode;
  intent: "CAPTURE" | "AUTHORIZE";
}

export interface OrderMutationResponse {
  order: PayPalOrderRecord;
  paypalRequestId: string;
  junodbLeaseStatus: "ACQUIRED" | "REPLAYED_FROM_JUNODB";
}

/** API-10: GET /api/v1/disputes & API-11: POST /api/v1/disputes/{disputeId}/resolve */
export interface DisputesListResponse {
  workspaceId: string;
  disputes: PayPalDisputeCase[];
}

export interface ResolveDisputeRequest {
  disputeId: string;
  action: "CONTEST_WITH_COMPELLING_EVIDENCE" | "AUTO_ACCEPT_LOW_VALUE_CLAIM";
  carrierTrackingNumber?: string;
}

/** API-12: POST /api/v1/subscriptions/plans */
export interface CreateSubscriptionPlanRequest {
  workspaceId: string;
  productName: string;
  planName: string;
  amountValue: string;
  currencyCode: CurrencyCode;
  billingIntervalUnit: "MONTH" | "YEAR";
}

export interface SubscriptionPlanResponse {
  plan: SubscriptionPlanRecord;
}

/** API-13: POST /api/v1/webhooks/paypal */
export interface PayPalWebhookEnvelope {
  id: string;
  event_type: "CUSTOMER.DISPUTE.CREATED" | "INVOICING.INVOICE.PAID" | "PAYMENT.CAPTURE.COMPLETED";
  create_time: string;
  resource: Record<string, unknown>;
}

/** API-14: GET /api/v1/analytics/insights */
export interface MerchantInsightsResponse {
  workspaceId: string;
  dsoDaysCurrent: number;
  dsoReductionPct: number;
  disputeWinRatePct: number;
  annualizedSavingsUsd: string;
  annualizedSavingsInr: string;
}

/** SSE-01: GET /api/v1/stream/events */
export interface SseStreamEvent {
  eventType: "execution_delta" | "dispute_alert" | "policy_hold" | "replay_mode_engaged";
  timestampIso: string;
  payload: AgentToolExecution | PayPalDisputeCase | Record<string, unknown>;
}
