/**
 * PayOps AI (PayPal Sentinel) — Deterministic Spend & Risk Policy Firewall (Cosmos.AI DSL, F-02)
 * Write Owner (H03-H48): Dev 1 (100%)
 */

import type { AutonomyLevel } from "./entities.js";

export interface CosmosPolicyConfig {
  maxSingleAutoRefundUsd: number;
  maxDailyRefundVelocityUsd: number;
  maxGnnRiskScoreForAutoRefund: number;
  minHoursBetweenInvoiceReminders?: number;
  autonomyLevel?: AutonomyLevel;
  maxSingleAutoInvoiceSendUsd?: number;
  maxAutoDisputeClaimAcceptUsd?: number;
  dslExpression?: string;
}

export interface CosmosPolicyVerdict {
  verdict: "APPROVED_L3_AUTO" | "HELD_FOR_L2_PASSKEY" | "BLOCKED_SECURITY_INJECTION";
  reasonCode: string;
  matchedRuleCode?: string;
  openApiVerdict?: "ALLOW" | "HOLD_APPROVAL" | "DENY";
}

export interface PromptInjectionInspectionResult {
  hasInjection: boolean;
  score: number;
  attackVector:
    | "NONE"
    | "ROLE_HIJACK"
    | "UNAUTHORIZED_REFUND_CMD"
    | "WEBHOOK_SPOOF"
    | "PII_EXFILTRATION"
    | "XML_TAG_BREAKOUT";
  sanitizedText: string;
  wrappedXml: string;
}

export interface CosmosDslAstNode {
  field: string;
  operator: ">" | ">=" | "<" | "<=" | "==" | "!=";
  value: number | string | boolean;
  action: "ALLOW" | "HOLD_APPROVAL" | "DENY";
}

export interface ReminderCooldownVerdict {
  allowed: boolean;
  hoursElapsed: number;
  reasonCode: string;
}

const MUTATING_TOOLS: ReadonlySet<string> = new Set([
  "create_invoice",
  "send_invoice",
  "send_invoice_reminder",
  "cancel_sent_invoice",
  "generate_invoice_qr_code",
  "delete_invoice",
  "update_invoicing",
  "cancel_invoice_auto_reminder",
  "record_payment_for_invoice",
  "record_refund_for_invoice",
  "create_conditional_rules_for_invoice",
  "create_recurring_series",
  "activate_recurring_series",
  "cancel_recurring_series",
  "delete_recurring_series",
  "create_order",
  "pay_order",
  "create_refund",
  "accept_dispute_claim",
  "create_shipment_tracking",
  "update_shipment_tracking",
  "create_product",
  "create_subscription_plan",
  "create_subscription",
  "update_subscription",
  "cancel_subscription",
]);

const DESTRUCTIVE_HITL_TOOLS: ReadonlySet<string> = new Set([
  "cancel_sent_invoice",
  "delete_invoice",
  "cancel_recurring_series",
  "delete_recurring_series",
  "cancel_subscription",
]);

const INJECTION_PATTERNS: ReadonlyArray<{
  regex: RegExp;
  vector: PromptInjectionInspectionResult["attackVector"];
  score: number;
}> = [
  {
    regex: /<\s*\/\s*untrusted_external_data\s*>/i,
    vector: "XML_TAG_BREAKOUT",
    score: 0.99,
  },
  {
    regex: /\b(ignore\s+(all\s+)?(previous|prior|above)\s+instructions|system\s+override|admin\s+override|developer\s+mode|jailbreak|disregard\s+guardrails)\b/i,
    vector: "ROLE_HIJACK",
    score: 0.98,
  },
  {
    regex: /\b(call\s+create_refund|execute\s+create_refund|issue\s+immediate\s+refund|call\s+accept_dispute_claim|bypass\s+policy|set\s+maxSingleAutoRefundUsd)\b/i,
    vector: "UNAUTHORIZED_REFUND_CMD",
    score: 0.97,
  },
  {
    regex: /\b(fake\s+webhook|spoof\s+paypal-transmission-sig|forge\s+signature)\b/i,
    vector: "WEBHOOK_SPOOF",
    score: 0.96,
  },
  {
    regex: /\b(dump\s+all\s+api\s+keys|print\s+client_secret|exfiltrate\s+database|reveal\s+system\s+prompt)\b/i,
    vector: "PII_EXFILTRATION",
    score: 0.95,
  },
];

/**
 * Inspects untrusted external data (buyer dispute notes, invoice memos, webhook strings)
 * for indirect prompt-injection patterns and wraps in <untrusted_external_data> tags (R-01).
 */
export function detectPromptInjectionInUntrustedText(text: string): PromptInjectionInspectionResult {
  const raw = text ?? "";
  const sanitizedText = raw
    .replace(/<\s*\/\s*untrusted_external_data\s*>/gi, "&lt;/untrusted_external_data&gt;")
    .replace(/<\s*untrusted_external_data\s*>/gi, "&lt;untrusted_external_data&gt;");

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.regex.test(raw)) {
      return {
        hasInjection: true,
        score: pattern.score,
        attackVector: pattern.vector,
        sanitizedText,
        wrappedXml: `<untrusted_external_data>${sanitizedText}</untrusted_external_data>`,
      };
    }
  }

  return {
    hasInjection: false,
    score: 0.01,
    attackVector: "NONE",
    sanitizedText,
    wrappedXml: `<untrusted_external_data>${sanitizedText}</untrusted_external_data>`,
  };
}

/**
 * Compiles a Cosmos.AI-style deterministic policy DSL expression into an AST in <1ms.
 * Example DSL:
 *   "WHEN tool == 'create_refund' AND amount_minor > 25000 THEN HOLD_APPROVAL"
 */
export function compileCosmosDslExpression(dslExpression: string): {
  astCompiled: boolean;
  compileTimeMs: number;
  tokens: string[];
  ast: CosmosDslAstNode[];
} {
  const start = performance.now();
  const normalized = (dslExpression ?? "").trim();
  if (!normalized) {
    return {
      astCompiled: false,
      compileTimeMs: 0,
      tokens: [],
      ast: [],
    };
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const ast: CosmosDslAstNode[] = [];
  const clauseRegex =
    /([a-zA-Z0-9_.]+)\s*(>=|<=|==|!=|>|<)\s*(['"]?[a-zA-Z0-9_.-]+['"]?)(?:[\s\S]*?\bTHEN\s+(ALLOW|HOLD_APPROVAL|DENY))?/gi;

  let match: RegExpExecArray | null = clauseRegex.exec(normalized);
  const fallbackActionMatch = /\b(ALLOW|HOLD_APPROVAL|DENY)\b/i.exec(normalized);
  const defaultAction = (
    fallbackActionMatch ? fallbackActionMatch[1].toUpperCase() : "HOLD_APPROVAL"
  ) as CosmosDslAstNode["action"];

  while (match !== null) {
    const field = match[1];
    const operator = match[2] as CosmosDslAstNode["operator"];
    const rawVal = match[3].replace(/^['"]|['"]$/g, "");
    const action = (match[4] ? match[4].toUpperCase() : defaultAction) as CosmosDslAstNode["action"];

    let parsedValue: number | string | boolean = rawVal;
    if (rawVal === "true" || rawVal === "false") {
      parsedValue = rawVal === "true";
    } else if (!Number.isNaN(Number(rawVal)) && rawVal !== "") {
      parsedValue = Number(rawVal);
    }

    ast.push({
      field,
      operator,
      value: parsedValue,
      action,
    });
    match = clauseRegex.exec(normalized);
  }

  const elapsed = Math.max(0.1, Number((performance.now() - start).toFixed(3)));
  return {
    astCompiled: ast.length > 0 || tokens.length > 0,
    compileTimeMs: elapsed,
    tokens,
    ast,
  };
}

/**
 * Evaluates a compiled Cosmos.AI DSL AST against a runtime execution context.
 */
export function evaluateCosmosDslAst(
  ast: CosmosDslAstNode[],
  context: Record<string, number | string | boolean>
): { matched: boolean; action?: "ALLOW" | "HOLD_APPROVAL" | "DENY" } {
  for (const node of ast) {
    const actual = context[node.field];
    if (actual === undefined) {
      continue;
    }
    let cond = false;
    switch (node.operator) {
      case ">":
        cond = Number(actual) > Number(node.value);
        break;
      case ">=":
        cond = Number(actual) >= Number(node.value);
        break;
      case "<":
        cond = Number(actual) < Number(node.value);
        break;
      case "<=":
        cond = Number(actual) <= Number(node.value);
        break;
      case "==":
        cond = String(actual) === String(node.value);
        break;
      case "!=":
        cond = String(actual) !== String(node.value);
        break;
    }
    if (cond) {
      return { matched: true, action: node.action };
    }
  }
  return { matched: false };
}

/**
 * Enforces the 72-hour minimum cooldown between invoice reminders (R-11, FDCPA / RBI compliance).
 */
export function evaluateInvoiceReminderCooldown(
  lastReminderSentAtIso: string | undefined,
  minHoursBetweenReminders = 72,
  nowIso: string = new Date().toISOString()
): ReminderCooldownVerdict {
  if (!lastReminderSentAtIso) {
    return {
      allowed: true,
      hoursElapsed: Number.POSITIVE_INFINITY,
      reasonCode: "RC_OK_NO_PRIOR_REMINDER",
    };
  }
  const lastMs = Date.parse(lastReminderSentAtIso);
  const nowMs = Date.parse(nowIso);
  if (Number.isNaN(lastMs) || Number.isNaN(nowMs)) {
    return {
      allowed: true,
      hoursElapsed: Number.POSITIVE_INFINITY,
      reasonCode: "RC_OK_TIMESTAMP_UNPARSEABLE",
    };
  }
  const hoursElapsed = Number(((nowMs - lastMs) / (1000 * 60 * 60)).toFixed(2));
  if (hoursElapsed < minHoursBetweenReminders) {
    return {
      allowed: false,
      hoursElapsed,
      reasonCode: "RC_11_REMINDER_COOLDOWN_72H_ACTIVE",
    };
  }
  return {
    allowed: true,
    hoursElapsed,
    reasonCode: "RC_OK_COOLDOWN_SATISFIED",
  };
}

/**
 * Core deterministic Cosmos.AI Policy Firewall evaluator (F-02).
 * 100% backward-compatible with tests/e2e/checkout-dispute.spec.ts.
 */
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
      matchedRuleCode: "POL-00-INJECTION-GUARD",
      openApiVerdict: "DENY",
    };
  }

  // Autonomy dial check: L0/L1/L2 holds all state-mutating tools for operator Passkey confirmation
  if (
    policy.autonomyLevel &&
    (policy.autonomyLevel === "L0" || policy.autonomyLevel === "L1" || policy.autonomyLevel === "L2") &&
    MUTATING_TOOLS.has(toolName)
  ) {
    return {
      verdict: "HELD_FOR_L2_PASSKEY",
      reasonCode: `RC_01_AUTONOMY_LEVEL_${policy.autonomyLevel}_REQUIRES_PASSKEY`,
      matchedRuleCode: "POL-01-AUTONOMY-GATE",
      openApiVerdict: "HOLD_APPROVAL",
    };
  }

  if (toolName === "create_refund" || toolName === "record_refund_for_invoice") {
    if (gnnRiskScore >= policy.maxGnnRiskScoreForAutoRefund) {
      return {
        verdict: "HELD_FOR_L2_PASSKEY",
        reasonCode: "RC_04_GNN_FRIENDLY_FRAUD_RISK_THRESHOLD_EXCEEDED",
        matchedRuleCode: "POL-02-REFUND-RISK-GATE",
        openApiVerdict: "HOLD_APPROVAL",
      };
    }
    if (amountUsd > policy.maxSingleAutoRefundUsd) {
      return {
        verdict: "HELD_FOR_L2_PASSKEY",
        reasonCode: "RC_02_EXCEEDS_SINGLE_REFUND_CAP_250_USD",
        matchedRuleCode: "POL-02-SINGLE-REFUND-CAP",
        openApiVerdict: "HOLD_APPROVAL",
      };
    }
    if (cumulative24hRefundUsd + amountUsd > policy.maxDailyRefundVelocityUsd) {
      return {
        verdict: "HELD_FOR_L2_PASSKEY",
        reasonCode: "RC_03_EXCEEDS_24H_VELOCITY_CAP_500_USD",
        matchedRuleCode: "POL-02-DAILY-VELOCITY-CAP",
        openApiVerdict: "HOLD_APPROVAL",
      };
    }
  }

  if (toolName === "send_invoice") {
    const maxInvoiceUsd = policy.maxSingleAutoInvoiceSendUsd ?? 5000;
    if (amountUsd > maxInvoiceUsd) {
      return {
        verdict: "HELD_FOR_L2_PASSKEY",
        reasonCode: "RC_05_EXCEEDS_SINGLE_INVOICE_CAP_5000_USD",
        matchedRuleCode: "POL-01-INVOICE-SEND-CAP",
        openApiVerdict: "HOLD_APPROVAL",
      };
    }
  }

  if (toolName === "accept_dispute_claim") {
    const maxDisputeAcceptUsd = policy.maxAutoDisputeClaimAcceptUsd ?? 50;
    if (gnnRiskScore >= policy.maxGnnRiskScoreForAutoRefund || amountUsd > maxDisputeAcceptUsd) {
      return {
        verdict: "HELD_FOR_L2_PASSKEY",
        reasonCode: "RC_06_DISPUTE_ACCEPT_REQUIRES_PASSKEY_OR_CONTEST",
        matchedRuleCode: "POL-04-DISPUTE-DEFENSE-GATE",
        openApiVerdict: "HOLD_APPROVAL",
      };
    }
  }

  if (DESTRUCTIVE_HITL_TOOLS.has(toolName) && policy.autonomyLevel !== "L4") {
    return {
      verdict: "HELD_FOR_L2_PASSKEY",
      reasonCode: "RC_07_DESTRUCTIVE_ACTION_REQUIRES_PASSKEY",
      matchedRuleCode: "POL-05-DESTRUCTIVE-ACTION-GATE",
      openApiVerdict: "HOLD_APPROVAL",
    };
  }

  return {
    verdict: "APPROVED_L3_AUTO",
    reasonCode: "RC_OK_POLICY_PASSED",
    matchedRuleCode: "POL-OK-DEFAULT-L3",
    openApiVerdict: "ALLOW",
  };
}
