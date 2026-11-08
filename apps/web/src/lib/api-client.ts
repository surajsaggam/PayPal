/**
 * PayOps AI (PayPal Sentinel) — Dual-Mode Frontend API Adapter (mock | live | replay)
 * Maps to: Section 3.1 of IMPLEMENTATION_PLAN.md, API-01..API-14, R-06 Demo Safety Net
 * Write Owner: Dev 2 (100%)
 */

import type {
  AgentApproveRequest,
  AgentApproveResponse,
  AgentExecuteRequest,
  AgentExecuteResponse,
  CreateAutonomousInvoiceRequest,
  CreateOrderRequest,
  CreateSubscriptionPlanRequest,
  DisputesListResponse,
  InvoicesListResponse,
  MerchantInsightsResponse,
  OrderMutationResponse,
  PayPalDisputeCase,
  PayPalInvoiceRecord,
  PayPalWebhookEnvelope,
  PoliciesListResponse,
  RemindInvoiceRequest,
  ResolveDisputeRequest,
  SubscriptionPlanResponse,
  UpdatePolicyRequest,
} from "@payops/shared";
import { validatePayPalMonetaryPayload } from "@payops/shared/apimatic-validators";
import { evaluateCosmosPolicyFirewall } from "@payops/shared/policy-dsl";
import {
  MOCK_APIMATIC_SNIPPETS,
  MOCK_AUDIT_LOGS,
  MOCK_DISPUTES,
  MOCK_INVOICES,
  MOCK_MERCHANT_INSIGHTS,
  MOCK_POLICY_RULES,
  MOCK_SUBSCRIPTION_PLANS,
} from "@payops/shared/mock-fixtures";
import { useCockpitStore } from "../stores/useCockpitStore";

const API_BASE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:4000";

const LIVE_TIMEOUT_MS = 2500;

async function fetchWithReplayFallback<T>(
  path: string,
  init: RequestInit | undefined,
  fallbackFactory: () => Promise<T> | T
): Promise<T> {
  const store = useCockpitStore.getState();
  if (store.apiMode === "mock" || store.apiMode === "replay") {
    await new Promise((r) => setTimeout(r, 90));
    return fallbackFactory();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (response.status === 429 || response.status >= 500) {
      // R-06 Automatic Circuit Breaker -> engage deterministic replay fallback
      useCockpitStore.getState().setApiMode("replay");
      return fallbackFactory();
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} on ${path}`);
    }

    return (await response.json()) as T;
  } catch {
    clearTimeout(timer);
    // R-06 Automatic Circuit Breaker on network disconnect or >2.5s timeout
    useCockpitStore.getState().setApiMode("replay");
    return fallbackFactory();
  }
}

/** API-01: POST /api/v1/agent/execute */
export async function executeAgentPrompt(req: AgentExecuteRequest): Promise<AgentExecuteResponse> {
  return fetchWithReplayFallback(
    "/api/v1/agent/execute",
    { method: "POST", body: JSON.stringify(req) },
    () => {
      const promptLower = req.prompt.toLowerCase();
      const hasInjection =
        promptLower.includes("ignore") ||
        promptLower.includes("system override") ||
        promptLower.includes("maintenance mode") ||
        promptLower.includes("bypass");

      const amountMatch = req.prompt.match(/\$?([0-9,]+(?:\.[0-9]{1,2})?)/);
      const parsedNumber = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : 1850.0;
      const amountStr = parsedNumber.toFixed(2);

      const isRefund = promptLower.includes("refund");
      const isDispute = promptLower.includes("dispute") || promptLower.includes("inr");
      const isOrder = promptLower.includes("order") || promptLower.includes("restock");

      const toolName = isRefund
        ? "create_refund"
        : isDispute
          ? "get_dispute"
          : isOrder
            ? "create_order"
            : "send_invoice";

      const apimaticCheck = validatePayPalMonetaryPayload(amountStr, "USD");
      const gnnRiskScore = hasInjection ? 0.94 : isRefund && parsedNumber > 250 ? 0.78 : 0.04;

      const firewall = evaluateCosmosPolicyFirewall(
        toolName,
        parsedNumber,
        0,
        gnnRiskScore,
        hasInjection,
        {
          maxSingleAutoRefundUsd: 250.0,
          maxDailyRefundVelocityUsd: 500.0,
          maxGnnRiskScoreForAutoRefund: 0.35,
        }
      );

      const executionId = `ex_${Math.floor(9100 + Math.random() * 899)}`;
      const paypalRequestId =
        req.idempotencyKey ?? `idem_${req.workspaceId}_${toolName}_${executionId}`;

      const snippet =
        MOCK_APIMATIC_SNIPPETS[toolName] ?? MOCK_APIMATIC_SNIPPETS.send_invoice;

      return {
        sessionId: "ses_20261108_9041",
        execution: {
          executionId,
          sessionId: "ses_20261108_9041",
          workspaceId: req.workspaceId,
          toolName,
          paypalRequestId,
          junodbLeaseStatus: "ACQUIRED",
          policyVerdict: apimaticCheck.valid ? firewall.verdict : "HELD_FOR_L2_PASSKEY",
          reasonCode: apimaticCheck.valid ? firewall.reasonCode : "RC_03_APIMATIC_SCHEMA_ERROR",
          gnnRiskScore,
          amountValue: apimaticCheck.normalizedAmountValue ?? amountStr,
          currencyCode: "USD",
          executedAt: new Date().toISOString(),
        },
        sdkSnippetTs: snippet.ts,
        sdkSnippetPython: snippet.python,
        auditEntry: MOCK_AUDIT_LOGS[1],
      };
    }
  );
}

/** API-02: POST /api/v1/agent/approve/{executionId} */
export async function approveHeldAgentExecution(
  req: AgentApproveRequest
): Promise<AgentApproveResponse> {
  return fetchWithReplayFallback(
    `/api/v1/agent/approve/${req.executionId}`,
    { method: "POST", body: JSON.stringify(req) },
    () => ({
      executionId: req.executionId,
      status: req.decision === "APPROVE" ? "RELEASED_AND_EXECUTED" : "REJECTED_BY_OPERATOR",
      paypalTransactionId: req.decision === "APPROVE" ? "PP-TX-88412093A" : undefined,
      auditEntryHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    })
  );
}

/** API-03: GET & PUT /api/v1/policies */
export async function fetchWorkspacePolicies(workspaceId: string): Promise<PoliciesListResponse> {
  return fetchWithReplayFallback(`/api/v1/policies?workspaceId=${workspaceId}`, undefined, () => ({
    workspaceId,
    policies: MOCK_POLICY_RULES,
  }));
}

export async function updateWorkspacePolicy(req: UpdatePolicyRequest): Promise<PoliciesListResponse> {
  return fetchWithReplayFallback(
    "/api/v1/policies",
    { method: "PUT", body: JSON.stringify(req) },
    () => ({
      workspaceId: "ws_99102a",
      policies: MOCK_POLICY_RULES.map((p) =>
        p.policyId === req.policyId
          ? {
              ...p,
              autonomyLevel: req.autonomyLevel,
              maxSingleAutoRefundUsd: req.maxSingleAutoRefundUsd,
              maxDailyRefundVelocityUsd: req.maxDailyRefundVelocityUsd,
              maxGnnRiskScoreForAutoRefund: req.maxGnnRiskScoreForAutoRefund,
            }
          : p
      ),
    })
  );
}

/** API-04: POST /api/v1/invoices/autonomous & API-05: GET /api/v1/invoices */
export async function fetchInvoices(workspaceId: string): Promise<InvoicesListResponse> {
  return fetchWithReplayFallback(`/api/v1/invoices?workspaceId=${workspaceId}`, undefined, () => ({
    workspaceId,
    invoices: MOCK_INVOICES,
  }));
}

export async function createAutonomousSmartInvoice(
  req: CreateAutonomousInvoiceRequest
): Promise<PayPalInvoiceRecord> {
  return fetchWithReplayFallback(
    "/api/v1/invoices/autonomous",
    { method: "POST", body: JSON.stringify(req) },
    () => {
      const suffix = Math.floor(1000 + Math.random() * 8999);
      const invoiceId = `INV2-A91F-${suffix}-8841-2026`;
      const invoiceNumber = `INV-2026-${suffix}`;
      return {
        invoiceId,
        workspaceId: req.workspaceId,
        invoiceNumber,
        recipientEmail: req.recipientEmail,
        amountValue: parseFloat(req.amountValue || "1850").toFixed(2),
        currencyCode: req.currencyCode,
        status: "SENT",
        dueDate: req.dueDate,
        qrCodeUri: `https://api-m.sandbox.paypal.com/v2/invoicing/invoices/${invoiceId}/generate-qr-code`,
        conditionalRule: {
          ruleType: "EARLY_PAYMENT_DISCOUNT",
          percentage: req.earlyPaymentDiscountPct ?? "2.00",
          triggerDate: "2026-11-15",
        },
        idempotencyKey: `idem_${req.workspaceId}_invoice_${invoiceNumber}`,
      };
    }
  );
}

/** API-06: POST /api/v1/invoices/{invoiceId}/remind */
export async function sendOrRescheduleInvoiceReminder(
  req: RemindInvoiceRequest
): Promise<{ status: string; invoiceId: string; newTriggerDate?: string }> {
  return fetchWithReplayFallback(
    `/api/v1/invoices/${req.invoiceId}/remind`,
    { method: "POST", body: JSON.stringify(req) },
    () => ({
      status: "REMINDER_SCHEDULED_72H_GUARD_OK",
      invoiceId: req.invoiceId,
      newTriggerDate: req.newTriggerDate,
    })
  );
}

/** API-07: POST /api/v1/orders & API-08: POST /api/v1/orders/{orderId}/capture */
export async function createAndCaptureOrder(
  req: CreateOrderRequest
): Promise<OrderMutationResponse> {
  return fetchWithReplayFallback(
    "/api/v1/orders",
    { method: "POST", body: JSON.stringify(req) },
    () => {
      const orderId = `5O190127TN${Math.floor(100000 + Math.random() * 899999)}`;
      const paypalRequestId = `idem_${req.workspaceId}_order_${req.skuId}_${req.amountValue}`;
      return {
        order: {
          orderId,
          workspaceId: req.workspaceId,
          paypalRequestId,
          intent: req.intent,
          status: "COMPLETED",
          amountValue: parseFloat(req.amountValue).toFixed(2),
          currencyCode: req.currencyCode,
          buyerEmailHmac: "hmac_sha256_fastlane_recognized_buyer_88a1",
          carrierCode: "FEDEX",
          trackingNumber: `794899${Math.floor(100000 + Math.random() * 899999)}`,
          trackingStatus: "DELIVERED",
        },
        paypalRequestId,
        junodbLeaseStatus: "ACQUIRED",
      };
    }
  );
}

/** API-08: POST /api/v1/orders/{orderId}/capture */
export async function captureOrder(
  orderId: string,
  workspaceId: string,
  amountValue = "390.00",
  currencyCode: "USD" | "INR" | "EUR" | "GBP" | "PYUSD" = "USD"
): Promise<OrderMutationResponse> {
  return fetchWithReplayFallback(
    `/api/v1/orders/${orderId}/capture`,
    {
      method: "POST",
      body: JSON.stringify({ orderId, workspaceId, amountValue, currencyCode }),
    },
    () => {
      const paypalRequestId = `idem_${workspaceId}_order_${orderId}_capture`;
      return {
        order: {
          orderId,
          workspaceId,
          paypalRequestId,
          intent: "CAPTURE",
          status: "COMPLETED",
          amountValue,
          currencyCode,
          buyerEmailHmac: "hmac_sha256_fastlane_captured_buyer",
          carrierCode: "FEDEX",
          trackingNumber: `794899${Math.floor(100000 + Math.random() * 899999)}`,
          trackingStatus: "DELIVERED",
        },
        paypalRequestId,
        junodbLeaseStatus: "ACQUIRED",
      };
    }
  );
}

/** API-09: POST /api/v1/orders/{orderId}/refund */
export async function refundOrder(
  orderId: string,
  workspaceId: string,
  amountValue: string,
  currencyCode: "USD" | "INR" | "EUR" | "GBP" | "PYUSD" = "USD"
): Promise<{
  orderId: string;
  paypalRequestId: string;
  policyVerdict: "APPROVED_L3_AUTO" | "HELD_FOR_L2_PASSKEY" | "BLOCKED_SECURITY_INJECTION";
  reasonCode: string;
}> {
  return fetchWithReplayFallback(
    `/api/v1/orders/${orderId}/refund`,
    {
      method: "POST",
      body: JSON.stringify({ orderId, workspaceId, amountValue, currencyCode }),
    },
    () => {
      const numericAmount = parseFloat(amountValue) || 0;
      const gnnScore = numericAmount > 250 ? 0.78 : 0.08;
      const verdict = evaluateCosmosPolicyFirewall(
        "create_refund",
        numericAmount,
        0,
        gnnScore,
        false,
        {
          maxSingleAutoRefundUsd: 250,
          maxDailyRefundVelocityUsd: 500,
          maxGnnRiskScoreForAutoRefund: 0.35,
        }
      );
      return {
        orderId,
        paypalRequestId: `idem_${workspaceId}_order_${orderId}_refund`,
        policyVerdict: verdict.verdict,
        reasonCode: verdict.reasonCode,
      };
    }
  );
}

/** API-13: POST /api/v1/webhooks/paypal */
export async function simulatePayPalWebhook(
  envelope: PayPalWebhookEnvelope
): Promise<{ verified: boolean; webhookId: string; eventType: string }> {
  return fetchWithReplayFallback(
    "/api/v1/webhooks/paypal",
    {
      method: "POST",
      headers: {
        "PAYPAL-TRANSMISSION-ID": envelope.id,
        "PAYPAL-TRANSMISSION-SIG": "rsa_sha256_verified_sandbox_signature",
      },
      body: JSON.stringify(envelope),
    },
    () => ({
      verified: true,
      webhookId: envelope.id,
      eventType: envelope.event_type,
    })
  );
}

/** API-10: GET /api/v1/disputes & API-11: POST /api/v1/disputes/{disputeId}/resolve */
export async function fetchDisputes(workspaceId: string): Promise<DisputesListResponse> {
  return fetchWithReplayFallback(`/api/v1/disputes?workspaceId=${workspaceId}`, undefined, () => ({
    workspaceId,
    disputes: MOCK_DISPUTES,
  }));
}

export async function resolveDispute(
  req: ResolveDisputeRequest
): Promise<{ disputeId: string; status: string; paypalRequestId: string }> {
  return fetchWithReplayFallback(
    `/api/v1/disputes/${req.disputeId}/resolve`,
    { method: "POST", body: JSON.stringify(req) },
    () => ({
      disputeId: req.disputeId,
      status:
        req.action === "CONTEST_WITH_COMPELLING_EVIDENCE"
          ? "EVIDENCE_SUBMITTED_TO_PAYPAL_SANDBOX"
          : "CLAIM_AUTO_ACCEPTED",
      paypalRequestId: `idem_ws_99102a_dispute_${req.disputeId}_resolve`,
    })
  );
}

/** API-12: POST /api/v1/subscriptions/plans */
export async function createSubscriptionPlan(
  req: CreateSubscriptionPlanRequest
): Promise<SubscriptionPlanResponse> {
  return fetchWithReplayFallback(
    "/api/v1/subscriptions/plans",
    { method: "POST", body: JSON.stringify(req) },
    () => ({
      plan:
        MOCK_SUBSCRIPTION_PLANS[0] ?? {
          planId: "P-5ML4271244454362WXNWU5NQ",
          workspaceId: req.workspaceId,
          productId: "PROD-KAVERI-RET-104",
          planName: req.planName,
          billingIntervalUnit: req.billingIntervalUnit,
          amountValue: req.amountValue,
          currencyCode: req.currencyCode,
          status: "ACTIVE",
        },
    })
  );
}

/** API-14: GET /api/v1/analytics/insights */
export async function fetchMerchantInsights(
  workspaceId: string
): Promise<MerchantInsightsResponse> {
  return fetchWithReplayFallback(
    `/api/v1/analytics/insights?workspaceId=${workspaceId}`,
    undefined,
    () => MOCK_MERCHANT_INSIGHTS[workspaceId] ?? MOCK_MERCHANT_INSIGHTS.ws_99102a
  );
}

export function getDisputeById(disputeId: string): PayPalDisputeCase | undefined {
  return useCockpitStore.getState().disputes.find((d) => d.disputeId === disputeId);
}
