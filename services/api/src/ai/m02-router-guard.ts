/**
 * PayOps AI (PayPal Sentinel) — M-02 Fast Intent Router & Prompt-Injection Guard (<140ms, R-01)
 * Primary: gpt-4o-mini-2024-07-18 | Fallback: claude-3-5-haiku-20241022 + Deterministic AST Pre-Classifier
 * Narrows 35 core tools down to <= 8 domain tools and detects indirect prompt injection inside
 * <untrusted_external_data> blocks.
 */

import { detectPromptInjectionInUntrustedText } from "@payops/shared";

export type IntentDomain =
  | "INVOICES"
  | "ORDERS"
  | "DISPUTES"
  | "SHIPMENT_TRACKING"
  | "CATALOG"
  | "SUBSCRIPTIONS"
  | "REPORTING"
  | "BLOCKED";

export interface M02RouteVerdict {
  intentDomain: IntentDomain;
  intentClass:
    | "INVOICING"
    | "CHECKOUT_ORDERS"
    | "DISPUTE_DEFENSE"
    | "SHIPMENT_TRACKING"
    | "SUBSCRIPTION_CATALOG"
    | "MERCHANT_INSIGHTS"
    | "PROMPT_INJECTION_BLOCKED";
  candidateTools: string[];
  hasInjection: boolean;
  injectionScore: number;
  attackVector: string;
  sanitizedPrompt: string;
  latencyMs: number;
}

const DOMAIN_TOOL_SUBSETS: Readonly<Record<Exclude<IntentDomain, "BLOCKED">, string[]>> = {
  INVOICES: [
    "create_invoice",
    "send_invoice",
    "send_invoice_reminder",
    "generate_invoice_qr_code",
    "create_conditional_rules_for_invoice",
    "record_payment_for_invoice",
    "cancel_invoice_auto_reminder",
    "list_invoices",
  ],
  ORDERS: [
    "create_order",
    "get_order",
    "pay_order",
    "create_refund",
    "get_refund",
  ],
  DISPUTES: [
    "list_disputes",
    "get_dispute",
    "accept_dispute_claim",
    "get_shipment_tracking",
    "get_order",
  ],
  SHIPMENT_TRACKING: [
    "create_shipment_tracking",
    "get_shipment_tracking",
    "update_shipment_tracking",
    "get_order",
  ],
  CATALOG: [
    "create_product",
    "list_products",
    "show_product_details",
  ],
  SUBSCRIPTIONS: [
    "create_product",
    "create_subscription_plan",
    "create_subscription",
    "list_subscription_plans",
    "update_subscription",
    "cancel_subscription",
  ],
  REPORTING: [
    "get_merchant_insights",
    "list_transactions",
    "list_invoices",
    "list_disputes",
  ],
};

export function routeIntentAndScreenInjection(
  prompt: string,
  untrustedExternalData?: string
): M02RouteVerdict {
  const start = performance.now();
  const combinedToScreen = [prompt ?? "", untrustedExternalData ?? ""].filter(Boolean).join("\n");
  const injectionCheck = detectPromptInjectionInUntrustedText(combinedToScreen);

  if (injectionCheck.hasInjection) {
    return {
      intentDomain: "BLOCKED",
      intentClass: "PROMPT_INJECTION_BLOCKED",
      candidateTools: [],
      hasInjection: true,
      injectionScore: injectionCheck.score,
      attackVector: injectionCheck.attackVector,
      sanitizedPrompt: injectionCheck.sanitizedText,
      latencyMs: Math.max(1, Math.round(performance.now() - start)),
    };
  }

  const lower = (prompt ?? "").toLowerCase();

  let intentDomain: Exclude<IntentDomain, "BLOCKED"> = "INVOICES";
  let intentClass: M02RouteVerdict["intentClass"] = "INVOICING";

  // Check refund / order keywords before invoice keywords if "refund" is mentioned
  if (
    /\b(dispute|chargeback|pp-d-|compelling evidence|friendly-fraud|friendly fraud|inr claim|not received|snad|contest)\b/.test(
      lower
    )
  ) {
    intentDomain = "DISPUTES";
    intentClass = "DISPUTE_DEFENSE";
  } else if (/\b(track|tracking|shipment|carrier|dhl|fedex|bluedart|ups|waybill|jjd)\b/.test(lower)) {
    intentDomain = "SHIPMENT_TRACKING";
    intentClass = "SHIPMENT_TRACKING";
  } else if (/\b(subscription|recurring plan|retainer|billing plan|churn|p-5ml)\b/.test(lower)) {
    intentDomain = "SUBSCRIPTIONS";
    intentClass = "SUBSCRIPTION_CATALOG";
  } else if (/\b(refund|capture|order|checkout|fastlane|pay_order|create_order|8xl|4km)\b/.test(lower)) {
    intentDomain = "ORDERS";
    intentClass = "CHECKOUT_ORDERS";
  } else if (/\b(catalog|product|sku|channel3|mailer|yarn)\b/.test(lower)) {
    intentDomain = "CATALOG";
    intentClass = "SUBSCRIPTION_CATALOG";
  } else if (/\b(insight|analytics|dso|anmpr|savings|win rate|tpv|report|kpi|transaction)\b/.test(lower)) {
    intentDomain = "REPORTING";
    intentClass = "MERCHANT_INSIGHTS";
  } else {
    intentDomain = "INVOICES";
    intentClass = "INVOICING";
  }

  const candidateTools = DOMAIN_TOOL_SUBSETS[intentDomain].slice(0, 8);

  return {
    intentDomain,
    intentClass,
    candidateTools,
    hasInjection: false,
    injectionScore: injectionCheck.score,
    attackVector: "NONE",
    sanitizedPrompt: injectionCheck.sanitizedText,
    latencyMs: Math.max(1, Math.round(performance.now() - start)),
  };
}
