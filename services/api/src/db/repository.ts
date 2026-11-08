/**
 * PayOps AI (PayPal Sentinel) — Dual-Mode Persistence Repository (E-01 to E-10)
 * Supports Drizzle PostgreSQL 16 when live DATABASE_URL is reachable, with automatic
 * zero-config pre-seeded In-Memory Ledger fallback matching scripts/seed-sandbox.ts.
 */

import pg from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  twoDecimalStringToMinorUnits,
  compileCosmosDslExpression,
  type AutonomyLevel,
  type CurrencyCode,
  type MerchantWorkspace,
  type OperatorUser,
  type AgentSession,
  type AgentToolExecution,
  type PolicyRule,
  type PayPalOrderRecord,
  type PayPalInvoiceRecord,
  type PayPalDisputeCase,
  type SubscriptionPlanRecord,
} from "@payops/shared";
import { envConfig } from "../config/env.js";
import { hashBuyerIdentifier } from "../lib/pii-scrubber.js";
import * as schema from "./schema.js";
import {
  GENESIS_AUDIT_HASH,
  buildChainedAuditEntry,
  computeDeterministicIdempotencyKey,
  guardImmutableAuditMutation,
  verifyAuditChain,
  type AuditLogExtendedEntry,
} from "./audit-chain.js";

const { Pool } = pg;

export const WORKSPACE_UUID_ALIAS_MAP: Readonly<Record<string, string>> = {
  "550e8400-e29b-41d4-a716-446655440000": "ws_99102a",
  ws_99102a: "ws_99102a",
  ws_88410b: "ws_88410b",
};

export function normalizeWorkspaceId(rawWorkspaceId?: string): string {
  if (!rawWorkspaceId) {
    return "ws_99102a";
  }
  return WORKSPACE_UUID_ALIAS_MAP[rawWorkspaceId] ?? rawWorkspaceId;
}

export interface HydratedPolicyRule extends PolicyRule {
  policy_id: string;
  workspace_id: string;
  rule_code: string;
  rule_name: string;
  autonomy_level: AutonomyLevel;
  dsl_expression: string;
  max_single_tx_minor: number;
  daily_velocity_cap_minor: number;
  required_approval_role: string;
  risk_threshold: number;
  is_enabled: boolean;
}

export interface HydratedOrderRecord extends PayPalOrderRecord {
  order_record_id: string;
  workspace_id: string;
  paypal_order_id: string;
  paypal_capture_id: string | null;
  paypal_request_id: string;
  amount_minor: number;
  currency_code: CurrencyCode;
  buyer_hash: string;
  fastlane_accelerated: boolean;
  carrier_code?: string;
  tracking_number?: string;
  shipment_tracking_status: string;
  approve_link: string;
  created_at: string;
}

export interface HydratedInvoiceRecord extends PayPalInvoiceRecord {
  invoice_record_id: string;
  workspace_id: string;
  paypal_invoice_id: string;
  invoice_number: string;
  recipient_hash: string;
  recipient_email: string;
  amount_minor: number;
  currency_code: CurrencyCode;
  due_date: string;
  qr_code_uri: string;
  dunning_state: "DRAFT" | "SENT" | "REMINDER_1_SENT" | "OVERDUE" | "PAID" | "CANCELLED";
  conditional_rules_json: Record<string, unknown>;
  recurring_series_id: string | null;
  pyusd_tx_signature: string | null;
  aging_bucket: "CURRENT" | "1_30_DAYS" | "31_60_DAYS" | "60_PLUS_DAYS";
  bryntum_task: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    dunningState: string;
  };
}

export interface HydratedDisputeCase extends PayPalDisputeCase {
  dispute_case_id: string;
  workspace_id: string;
  paypal_dispute_id: string;
  paypal_order_id: string;
  reason_code: PayPalDisputeCase["reasonCode"];
  disputed_amount_minor: number;
  currency_code: CurrencyCode;
  response_deadline: string;
  shipment_tracking_proof_json: {
    carrier: string;
    tracking_number: string;
    status: string;
    signed_by: string;
  };
  gnn_risk_score: number;
  gnn_reason_codes: string[];
  evidence_bundle_json: Record<string, unknown>;
  agent_action: string;
}

export interface HydratedSubscriptionPlan extends SubscriptionPlanRecord {
  subscription_record_id: string;
  workspace_id: string;
  paypal_product_id: string;
  paypal_plan_id: string;
  paypal_subscription_id: string;
  plan_name: string;
  billing_cycle_cadence: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  recurring_amount_minor: number;
  currency_code: CurrencyCode;
  subscriber_status: "ACTIVE" | "SUSPENDED" | "CANCELLED" | "APPROVAL_PENDING";
  churn_rescue_state: "HEALTHY" | "AT_RISK" | "RESCUE_OFFER_SENT";
  next_billing_at: string;
}

export interface HydratedExecutionRecord extends AgentToolExecution {
  execution_id: string;
  session_id: string;
  workspace_id: string;
  policy_id: string;
  paypal_request_id: string;
  mcp_tool_name: string;
  intent_class: string;
  injection_score: number;
  gnn_risk_score: number;
  apimatic_schema_valid: boolean;
  policy_verdict: "ALLOW" | "HOLD_APPROVAL" | "DENY" | "COMPLETED" | "REJECTED";
  matched_rule_code: string;
  tool_calls: Array<{
    tool_name: string;
    paypal_request_id: string;
    arguments: Record<string, unknown>;
    execution_status: string;
    paypal_response?: Record<string, unknown>;
  }>;
  audit_entry_hash: string;
  latency_ms: number;
  version: number;
  validated_input_json: Record<string, unknown>;
  paypal_http_status?: number;
  paypal_response_json?: Record<string, unknown>;
  approved_by_operator_id?: string;
  operator_signature?: string;
}

export class DualModeRepository {
  public storageMode: "postgres" | "in-memory" = "in-memory";
  public db: NodePgDatabase<typeof schema> | null = null;
  private pool: pg.Pool | null = null;

  private workspaces = new Map<string, MerchantWorkspace>();
  private operators = new Map<string, OperatorUser>();
  private sessions = new Map<string, AgentSession>();
  private policies = new Map<string, HydratedPolicyRule>();
  private executions = new Map<string, HydratedExecutionRecord>();
  private orders = new Map<string, HydratedOrderRecord>();
  private invoices = new Map<string, HydratedInvoiceRecord>();
  private disputes = new Map<string, HydratedDisputeCase>();
  private subscriptions = new Map<string, HydratedSubscriptionPlan>();
  private auditLogs: AuditLogExtendedEntry[] = [];
  private invoiceSequence = 8843;

  constructor() {
    this.seedInMemoryLedger();
  }

  public async initializePostgresIfConfigured(): Promise<void> {
    if (!envConfig.isLivePostgresConfigured) {
      this.storageMode = "in-memory";
      return;
    }
    try {
      this.pool = new Pool({
        connectionString: envConfig.databaseUrl,
        connectionTimeoutMillis: 1500,
      });
      await this.pool.query("SELECT 1");
      this.db = drizzle(this.pool, { schema });
      this.storageMode = "postgres";
    } catch {
      this.storageMode = "in-memory";
      if (this.pool) {
        await this.pool.end().catch(() => undefined);
        this.pool = null;
      }
    }
  }

  /**
   * Resets and seeds the deterministic Sandbox fixtures matching scripts/seed-sandbox.ts and @payops/shared.
   */
  public seedInMemoryLedger(): void {
    this.workspaces.clear();
    this.operators.clear();
    this.sessions.clear();
    this.policies.clear();
    this.executions.clear();
    this.orders.clear();
    this.invoices.clear();
    this.disputes.clear();
    this.subscriptions.clear();
    this.auditLogs = [];
    this.invoiceSequence = 8843;

    // 1. E-01 Workspaces (matching SEED_WORKSPACES & MOCK_WORKSPACES)
    const ws1: MerchantWorkspace = {
      workspaceId: "ws_99102a",
      merchantName: "Kaveri Sustainable Knitwear Exports Pvt Ltd (Bengaluru & Tiruppur)",
      paypalMerchantId: "7XK9910248102",
      baseCurrency: "USD",
      riskTier: "LOW",
      autonomyLevel: "L3",
      createdAt: "2026-10-01T00:00:00.000Z",
    };
    const ws2: MerchantWorkspace = {
      workspaceId: "ws_88410b",
      merchantName: "Vance Precision Prototyping & Design LLC (Austin, TX)",
      paypalMerchantId: "9AB8841029384",
      baseCurrency: "USD",
      riskTier: "LOW",
      autonomyLevel: "L3",
      createdAt: "2026-10-01T00:00:00.000Z",
    };
    this.workspaces.set(ws1.workspaceId, ws1);
    this.workspaces.set(ws2.workspaceId, ws2);

    // 2. E-02 Operator Users (for RBAC & WebAuthn FIDO2 / Ed25519 approval tests)
    const seededOperators: OperatorUser[] = [
      {
        userId: "usr_maya_lin_owner",
        workspaceId: "ws_99102a",
        email: "maya.lin@kaveriknitwear.example.com",
        displayName: "Maya Lin (Head of Finance & Owner)",
        role: "OWNER",
        webauthnCredentialId: "cred_passkey_maya_01",
        publicKeyEd25519: "MCowBQYDK2VwAyEAPayOpsSentinelMayaOwnerEd25519PubKey0001=",
      },
      {
        userId: "usr_arjun_mehta_admin",
        workspaceId: "ws_99102a",
        email: "arjun.mehta@kaveriknitwear.example.com",
        displayName: "Arjun Mehta (Finance Admin)",
        role: "FINANCE_ADMIN",
        webauthnCredentialId: "cred_passkey_arjun_02",
        publicKeyEd25519: "MCowBQYDK2VwAyEAPayOpsSentinelArjunAdminEd25519PubKey002=",
      },
      {
        userId: "usr_elena_rostova_ops",
        workspaceId: "ws_99102a",
        email: "elena.rostova@kaveriknitwear.example.com",
        displayName: "Elena Rostova (Ops Analyst)",
        role: "OPS_ANALYST",
      },
      {
        userId: "usr_marcus_vance_auditor",
        workspaceId: "ws_99102a",
        email: "marcus.vance@auditfirm.example.com",
        displayName: "Marcus Vance (External Auditor)",
        role: "AUDITOR",
      },
      {
        userId: "agent_service_m01",
        workspaceId: "ws_99102a",
        email: "sentinel-agent@payops.ai",
        displayName: "PayOps Sentinel Autonomous Agent Service",
        role: "AGENT_SERVICE",
      },
    ];
    for (const op of seededOperators) {
      this.operators.set(op.userId, op);
    }

    // 3. E-05 Policy Rules
    const pol1: HydratedPolicyRule = {
      policyId: "pol_refund_risk_gate_01",
      workspaceId: "ws_99102a",
      ruleName: "POL-02: Autonomous Refund & Friendly-Fraud Risk Hold Gate",
      autonomyLevel: "L3",
      maxSingleAutoRefundUsd: 250.0,
      maxDailyRefundVelocityUsd: 500.0,
      maxSingleAutoInvoiceSendUsd: 5000.0,
      maxAutoDisputeClaimAcceptUsd: 50.0,
      maxGnnRiskScoreForAutoRefund: 0.35,
      minHoursBetweenInvoiceReminders: 72,
      isActive: true,
      policy_id: "pol_refund_risk_gate_01",
      workspace_id: "ws_99102a",
      rule_code: "POL-02-REFUND-HOLD",
      rule_name: "POL-02: Autonomous Refund & Friendly-Fraud Risk Hold Gate",
      autonomy_level: "L3",
      dsl_expression:
        "WHEN tool == 'create_refund' AND (amount_minor > 25000 OR gnn_risk_score >= 0.35) THEN HOLD_APPROVAL",
      max_single_tx_minor: 25000,
      daily_velocity_cap_minor: 50000,
      required_approval_role: "FINANCE_ADMIN",
      risk_threshold: 0.35,
      is_enabled: true,
    };
    const pol2: HydratedPolicyRule = {
      policyId: "pol_invoice_auto_send_02",
      workspaceId: "ws_99102a",
      ruleName: "POL-01: Smart Invoicing Auto-Dispatch & 72h Dunning Cooldown",
      autonomyLevel: "L3",
      maxSingleAutoRefundUsd: 250.0,
      maxDailyRefundVelocityUsd: 500.0,
      maxSingleAutoInvoiceSendUsd: 5000.0,
      maxAutoDisputeClaimAcceptUsd: 50.0,
      maxGnnRiskScoreForAutoRefund: 0.35,
      minHoursBetweenInvoiceReminders: 72,
      isActive: true,
      policy_id: "pol_invoice_auto_send_02",
      workspace_id: "ws_99102a",
      rule_code: "POL-01-INVOICE-SEND",
      rule_name: "POL-01: Smart Invoicing Auto-Dispatch & 72h Dunning Cooldown",
      autonomy_level: "L3",
      dsl_expression: "WHEN tool == 'send_invoice' AND amount_minor <= 500000 THEN ALLOW",
      max_single_tx_minor: 500000,
      daily_velocity_cap_minor: 2500000,
      required_approval_role: "FINANCE_ADMIN",
      risk_threshold: 0.35,
      is_enabled: true,
    };
    this.policies.set(pol1.policyId, pol1);
    this.policies.set(pol2.policyId, pol2);

    // 4. E-06 Orders (matching SEED_DISPUTES order IDs)
    const seededOrders: HydratedOrderRecord[] = [
      {
        orderId: "8XL99102481",
        workspaceId: "ws_99102a",
        paypalRequestId: computeDeterministicIdempotencyKey(
          "ws_99102a",
          "order",
          "8XL99102481",
          "capture"
        ),
        intent: "CAPTURE",
        status: "COMPLETED",
        amountValue: "420.00",
        currencyCode: "USD",
        buyerEmailHmac: hashBuyerIdentifier("buyer.dispute1@pacificboutique-la.example.com"),
        carrierCode: "DHL_EXPRESS",
        trackingNumber: "JJD014600009812",
        trackingStatus: "DELIVERED",
        order_record_id: "ord_rec_8xl99102481",
        workspace_id: "ws_99102a",
        paypal_order_id: "8XL99102481",
        paypal_capture_id: "2GG8810293841",
        paypal_request_id: computeDeterministicIdempotencyKey(
          "ws_99102a",
          "order",
          "8XL99102481",
          "capture"
        ),
        amount_minor: 42000,
        currency_code: "USD",
        buyer_hash: hashBuyerIdentifier("buyer.dispute1@pacificboutique-la.example.com"),
        fastlane_accelerated: true,
        carrier_code: "DHL_EXPRESS",
        tracking_number: "JJD014600009812",
        shipment_tracking_status: "DELIVERED",
        approve_link: "https://www.sandbox.paypal.com/checkoutnow?token=8XL99102481",
        created_at: "2026-11-01T10:00:00.000Z",
      },
      {
        orderId: "4KM22019482",
        workspaceId: "ws_99102a",
        paypalRequestId: computeDeterministicIdempotencyKey(
          "ws_99102a",
          "order",
          "4KM22019482",
          "capture"
        ),
        intent: "CAPTURE",
        status: "COMPLETED",
        amountValue: "35.00",
        currencyCode: "USD",
        buyerEmailHmac: hashBuyerIdentifier("buyer.snad@retail-Austin.example.com"),
        carrierCode: "FEDEX",
        trackingNumber: "794801928374",
        trackingStatus: "DELIVERED",
        order_record_id: "ord_rec_4km22019482",
        workspace_id: "ws_99102a",
        paypal_order_id: "4KM22019482",
        paypal_capture_id: "2GG4420194820",
        paypal_request_id: computeDeterministicIdempotencyKey(
          "ws_99102a",
          "order",
          "4KM22019482",
          "capture"
        ),
        amount_minor: 3500,
        currency_code: "USD",
        buyer_hash: hashBuyerIdentifier("buyer.snad@retail-Austin.example.com"),
        fastlane_accelerated: false,
        carrier_code: "FEDEX",
        tracking_number: "794801928374",
        shipment_tracking_status: "DELIVERED",
        approve_link: "https://www.sandbox.paypal.com/checkoutnow?token=4KM22019482",
        created_at: "2026-11-02T14:20:00.000Z",
      },
    ];
    for (const ord of seededOrders) {
      this.orders.set(ord.orderId, ord);
    }

    // 5. E-07 Invoices (matching SEED_INVOICES & MOCK_INVOICES exactly)
    const inv1Fixture = {
      invoiceId: "INV2-X89A-4412-9012-7731",
      invoiceNumber: "INV-2026-8841",
      recipientEmail: "procurement@pacificboutique-la.example.com",
      amountValue: "2450.00",
      currencyCode: "USD" as const,
      dueDate: "2026-11-20",
      qrCodeUri:
        "https://api-m.sandbox.paypal.com/v2/invoicing/invoices/INV2-X89A-4412-9012-7731/generate-qr-code",
      conditionalRule: {
        ruleType: "EARLY_PAYMENT_DISCOUNT" as const,
        percentage: "2.00",
        triggerDate: "2026-11-10",
      },
      idempotencyKey: computeDeterministicIdempotencyKey(
        "ws_99102a",
        "invoice",
        "INV-2026-8841",
        "create_and_send"
      ),
    };

    const inv2Fixture = {
      invoiceId: "INV2-B71C-3390-1184-6620",
      invoiceNumber: "INV-2026-8842",
      recipientEmail: "ap@nordicretail-berlin.example.com",
      amountValue: "168000.00",
      currencyCode: "INR" as const,
      dueDate: "2026-11-25",
      qrCodeUri:
        "https://api-m.sandbox.paypal.com/v2/invoicing/invoices/INV2-B71C-3390-1184-6620/generate-qr-code",
      conditionalRule: {
        ruleType: "EARLY_PAYMENT_DISCOUNT" as const,
        percentage: "1.50",
        triggerDate: "2026-11-12",
      },
      idempotencyKey: computeDeterministicIdempotencyKey(
        "ws_99102a",
        "invoice",
        "INV-2026-8842",
        "create_and_send"
      ),
    };

    const inv1: HydratedInvoiceRecord = {
      ...inv1Fixture,
      workspaceId: "ws_99102a",
      status: "SENT",
      invoice_record_id: "inv_rec_8841",
      workspace_id: "ws_99102a",
      paypal_invoice_id: inv1Fixture.invoiceId,
      invoice_number: inv1Fixture.invoiceNumber,
      recipient_hash: hashBuyerIdentifier(inv1Fixture.recipientEmail),
      recipient_email: inv1Fixture.recipientEmail,
      amount_minor: 245000,
      currency_code: "USD",
      due_date: inv1Fixture.dueDate,
      qr_code_uri: inv1Fixture.qrCodeUri,
      dunning_state: "SENT",
      conditional_rules_json: inv1Fixture.conditionalRule,
      recurring_series_id: null,
      pyusd_tx_signature: null,
      aging_bucket: "CURRENT",
      bryntum_task: {
        id: inv1Fixture.invoiceId,
        name: `${inv1Fixture.invoiceNumber} ($${inv1Fixture.amountValue})`,
        startDate: "2026-11-05",
        endDate: inv1Fixture.dueDate,
        dunningState: "SENT",
      },
    };

    const inv2: HydratedInvoiceRecord = {
      ...inv2Fixture,
      workspaceId: "ws_99102a",
      status: "SENT",
      invoice_record_id: "inv_rec_8842",
      workspace_id: "ws_99102a",
      paypal_invoice_id: inv2Fixture.invoiceId,
      invoice_number: inv2Fixture.invoiceNumber,
      recipient_hash: hashBuyerIdentifier(inv2Fixture.recipientEmail),
      recipient_email: inv2Fixture.recipientEmail,
      amount_minor: 16800000,
      currency_code: "INR",
      due_date: inv2Fixture.dueDate,
      qr_code_uri: inv2Fixture.qrCodeUri,
      dunning_state: "SENT",
      conditional_rules_json: inv2Fixture.conditionalRule,
      recurring_series_id: null,
      pyusd_tx_signature: null,
      aging_bucket: "CURRENT",
      bryntum_task: {
        id: inv2Fixture.invoiceId,
        name: `${inv2Fixture.invoiceNumber} (INR ${inv2Fixture.amountValue})`,
        startDate: "2026-11-05",
        endDate: inv2Fixture.dueDate,
        dunningState: "SENT",
      },
    };

    this.invoices.set(inv1.invoiceId, inv1);
    this.invoices.set(inv2.invoiceId, inv2);

    // 6. E-08 Disputes (matching SEED_DISPUTES & MOCK_DISPUTES)
    const disp1Fixture = {
      disputeId: "PP-D-90412",
      orderId: "8XL99102481",
      reasonCode: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED" as const,
      disputedAmountValue: "420.00",
      currencyCode: "USD" as const,
      carrierCode: "DHL_EXPRESS" as const,
      trackingNumber: "JJD014600009812",
      trackingStatus: "DELIVERED" as const,
      gnnRiskScore: 0.89,
      recommendedAction: "CONTEST_WITH_COMPELLING_EVIDENCE" as const,
    };

    const disp2Fixture = {
      disputeId: "PP-D-90419",
      orderId: "4KM22019482",
      reasonCode: "SIGNIFICANTLY_NOT_AS_DESCRIBED" as const,
      disputedAmountValue: "35.00",
      currencyCode: "USD" as const,
      carrierCode: "FEDEX" as const,
      trackingNumber: "794801928374",
      trackingStatus: "DELIVERED" as const,
      gnnRiskScore: 0.12,
      recommendedAction: "AUTO_ACCEPT_LOW_VALUE_CLAIM" as const,
    };

    const disp1: HydratedDisputeCase = {
      ...disp1Fixture,
      workspaceId: "ws_99102a",
      treeShapReasons: [
        "CARRIER_SIGNED_DELIVERY_MATCHES_BUYER_ZIP (+0.44)",
        "REPEAT_INR_CLAIM_ACROSS_3_MERCHANTS_90D (+0.31)",
        "DEVICE_FINGERPRINT_MATCHES_CHECKOUT_IP (+0.14)",
      ],
      responseDueIso: "2026-11-14T23:59:59.000Z",
      dispute_case_id: "disp_rec_90412",
      workspace_id: "ws_99102a",
      paypal_dispute_id: disp1Fixture.disputeId,
      paypal_order_id: disp1Fixture.orderId,
      reason_code: disp1Fixture.reasonCode,
      disputed_amount_minor: 42000,
      currency_code: "USD",
      response_deadline: "2026-11-14T23:59:59.000Z",
      shipment_tracking_proof_json: {
        carrier: "DHL_EXPRESS",
        tracking_number: "JJD014600009812",
        status: "DELIVERED",
        signed_by: "R. SMITH",
      },
      gnn_risk_score: 0.89,
      gnn_reason_codes: [
        "CARRIER_SIGNED_DELIVERY_MATCHES_BUYER_ZIP (+0.44)",
        "REPEAT_INR_CLAIM_ACROSS_3_MERCHANTS_90D (+0.31)",
        "DEVICE_FINGERPRINT_MATCHES_CHECKOUT_IP (+0.14)",
      ],
      evidence_bundle_json: {
        paypal_order_capture_id: "2GG8810293841",
        carrier_tracking: "DHL_EXPRESS:JJD014600009812",
        elastic_policy_citation:
          "PayPal Seller Protection Compelling Evidence 3.0 §4.2: Signed Carrier Proof of Delivery",
      },
      agent_action: "CONTEST_WITH_COMPELLING_EVIDENCE",
    };

    const disp2: HydratedDisputeCase = {
      ...disp2Fixture,
      workspaceId: "ws_99102a",
      treeShapReasons: [
        "LOW_VALUE_FIRST_TIME_BUYER_DISPUTE (-0.38)",
        "NO_SHARED_DEVICE_CLUSTER_ANOMALY (-0.21)",
      ],
      responseDueIso: "2026-11-16T23:59:59.000Z",
      dispute_case_id: "disp_rec_90419",
      workspace_id: "ws_99102a",
      paypal_dispute_id: disp2Fixture.disputeId,
      paypal_order_id: disp2Fixture.orderId,
      reason_code: disp2Fixture.reasonCode,
      disputed_amount_minor: 3500,
      currency_code: "USD",
      response_deadline: "2026-11-16T23:59:59.000Z",
      shipment_tracking_proof_json: {
        carrier: "FEDEX",
        tracking_number: "794801928374",
        status: "DELIVERED",
        signed_by: "FRONT_DESK",
      },
      gnn_risk_score: 0.12,
      gnn_reason_codes: [
        "LOW_VALUE_FIRST_TIME_BUYER_DISPUTE (-0.38)",
        "NO_SHARED_DEVICE_CLUSTER_ANOMALY (-0.21)",
      ],
      evidence_bundle_json: {},
      agent_action: "AUTO_ACCEPT_LOW_VALUE_CLAIM",
    };

    this.disputes.set(disp1.disputeId, disp1);
    this.disputes.set(disp2.disputeId, disp2);

    // 7. E-09 Subscriptions
    const sub1: HydratedSubscriptionPlan = {
      planId: "P-5ML4271244454362WXNWU5NQ",
      workspaceId: "ws_99102a",
      productId: "PROD-88102KAVERI",
      planName: "Kaveri Knitwear Monthly B2B Wholesale Retainer",
      billingIntervalUnit: "MONTH",
      amountValue: "2500.00",
      currencyCode: "USD",
      status: "ACTIVE",
      subscription_record_id: "sub_rec_01",
      workspace_id: "ws_99102a",
      paypal_product_id: "PROD-88102KAVERI",
      paypal_plan_id: "P-5ML4271244454362WXNWU5NQ",
      paypal_subscription_id: "I-BW452GLLEP1G",
      plan_name: "Kaveri Knitwear Monthly B2B Wholesale Retainer",
      billing_cycle_cadence: "MONTHLY",
      recurring_amount_minor: 250000,
      currency_code: "USD",
      subscriber_status: "ACTIVE",
      churn_rescue_state: "HEALTHY",
      next_billing_at: "2026-12-01T00:00:00.000Z",
    };
    this.subscriptions.set(sub1.planId, sub1);

    // 8. E-10 Hash-Chained Audit Ledger (matching scripts/seed-sandbox.ts genesis & first 2 entries)
    const seedTimestamp = "2026-11-05T08:00:00.000Z";
    const entry1 = buildChainedAuditEntry({
      seq: 1,
      prevHash: GENESIS_AUDIT_HASH,
      workspaceId: "ws_99102a",
      actorId: "agent_service_m01",
      toolName: "send_invoice",
      paypalRequestId: inv1Fixture.idempotencyKey,
      policyVerdict: "APPROVED_L3_AUTO",
      payload: inv1Fixture,
      timestampIso: seedTimestamp,
      exactPayloadJsonOverride: JSON.stringify(inv1Fixture),
    });
    this.auditLogs.push(entry1);

    const entry2 = buildChainedAuditEntry({
      seq: 2,
      prevHash: entry1.entryHash,
      workspaceId: "ws_99102a",
      actorId: "agent_service_m01",
      toolName: "get_shipment_tracking",
      paypalRequestId: computeDeterministicIdempotencyKey(
        "ws_99102a",
        "dispute",
        disp1Fixture.disputeId,
        "get_shipment_tracking"
      ),
      policyVerdict: "CONTEST_WITH_COMPELLING_EVIDENCE",
      payload: disp1Fixture,
      timestampIso: seedTimestamp,
      exactPayloadJsonOverride: JSON.stringify(disp1Fixture),
    });
    this.auditLogs.push(entry2);
  }

  public getWorkspace(workspaceId?: string): MerchantWorkspace {
    const norm = normalizeWorkspaceId(workspaceId);
    return (
      this.workspaces.get(norm) ??
      this.workspaces.get("ws_99102a")!
    );
  }

  public getOperator(userIdOrRole?: string): OperatorUser | undefined {
    if (!userIdOrRole) {
      return this.operators.get("usr_maya_lin_owner");
    }
    if (this.operators.has(userIdOrRole)) {
      return this.operators.get(userIdOrRole);
    }
    const upper = userIdOrRole.toUpperCase();
    for (const op of this.operators.values()) {
      if (op.role === upper) {
        return op;
      }
    }
    return undefined;
  }

  public createOrUpdateSession(session: AgentSession): AgentSession {
    this.sessions.set(session.sessionId, session);
    return session;
  }

  public getSession(sessionId: string): AgentSession | undefined {
    return this.sessions.get(sessionId);
  }

  public listPolicies(workspaceId?: string): HydratedPolicyRule[] {
    const norm = normalizeWorkspaceId(workspaceId);
    const matches = Array.from(this.policies.values()).filter((p) => p.workspaceId === norm);
    return matches.length > 0 ? matches : Array.from(this.policies.values());
  }

  public getActiveRefundPolicy(workspaceId?: string): HydratedPolicyRule {
    const list = this.listPolicies(workspaceId);
    return list[0];
  }

  public updatePolicy(
    policyIdInput: string | undefined,
    updates: {
      autonomyLevel?: AutonomyLevel;
      maxSingleAutoRefundUsd?: number;
      maxDailyRefundVelocityUsd?: number;
      maxSingleAutoInvoiceSendUsd?: number;
      maxAutoDisputeClaimAcceptUsd?: number;
      maxGnnRiskScoreForAutoRefund?: number;
      minHoursBetweenInvoiceReminders?: number;
      dslExpression?: string;
      ruleName?: string;
      isEnabled?: boolean;
    }
  ): { policy: HydratedPolicyRule; ast_compiled: boolean; compile_time_ms: number } {
    const existing =
      (policyIdInput ? this.policies.get(policyIdInput) : undefined) ??
      this.policies.get("pol_refund_risk_gate_01")!;

    const nextSingleRefundUsd =
      updates.maxSingleAutoRefundUsd ?? existing.maxSingleAutoRefundUsd;
    const nextDailyVelocityUsd =
      updates.maxDailyRefundVelocityUsd ?? existing.maxDailyRefundVelocityUsd;
    const nextGnnThreshold =
      updates.maxGnnRiskScoreForAutoRefund ?? existing.maxGnnRiskScoreForAutoRefund;
    const nextAutonomy = updates.autonomyLevel ?? existing.autonomyLevel;
    const nextDsl =
      updates.dslExpression ??
      `WHEN tool == 'create_refund' AND (amount_minor > ${Math.round(nextSingleRefundUsd * 100)} OR gnn_risk_score >= ${nextGnnThreshold}) THEN HOLD_APPROVAL`;

    const compiled = compileCosmosDslExpression(nextDsl);

    const updated: HydratedPolicyRule = {
      ...existing,
      policyId: policyIdInput || existing.policyId,
      policy_id: policyIdInput || existing.policy_id,
      ruleName: updates.ruleName ?? existing.ruleName,
      rule_name: updates.ruleName ?? existing.rule_name,
      autonomyLevel: nextAutonomy,
      autonomy_level: nextAutonomy,
      maxSingleAutoRefundUsd: nextSingleRefundUsd,
      maxDailyRefundVelocityUsd: nextDailyVelocityUsd,
      maxSingleAutoInvoiceSendUsd:
        updates.maxSingleAutoInvoiceSendUsd ?? existing.maxSingleAutoInvoiceSendUsd,
      maxAutoDisputeClaimAcceptUsd:
        updates.maxAutoDisputeClaimAcceptUsd ?? existing.maxAutoDisputeClaimAcceptUsd,
      maxGnnRiskScoreForAutoRefund: nextGnnThreshold,
      minHoursBetweenInvoiceReminders:
        updates.minHoursBetweenInvoiceReminders ?? existing.minHoursBetweenInvoiceReminders,
      isActive: updates.isEnabled ?? existing.isActive,
      is_enabled: updates.isEnabled ?? existing.is_enabled,
      dsl_expression: nextDsl,
      max_single_tx_minor: Math.round(nextSingleRefundUsd * 100),
      daily_velocity_cap_minor: Math.round(nextDailyVelocityUsd * 100),
      risk_threshold: nextGnnThreshold,
    };

    this.policies.set(updated.policyId, updated);
    return {
      policy: updated,
      ast_compiled: compiled.astCompiled,
      compile_time_ms: compiled.compileTimeMs,
    };
  }

  public saveExecution(exec: HydratedExecutionRecord): HydratedExecutionRecord {
    this.executions.set(exec.executionId, exec);
    return exec;
  }

  public getExecution(executionId: string): HydratedExecutionRecord | undefined {
    return this.executions.get(executionId);
  }

  public listExecutions(workspaceId?: string): HydratedExecutionRecord[] {
    const norm = normalizeWorkspaceId(workspaceId);
    return Array.from(this.executions.values()).filter((e) => e.workspaceId === norm);
  }

  public getCumulative24hRefundUsd(workspaceId?: string): number {
    const norm = normalizeWorkspaceId(workspaceId);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    let sum = 0;
    for (const exec of this.executions.values()) {
      if (
        exec.workspaceId === norm &&
        (exec.toolName === "create_refund" || exec.toolName === "record_refund_for_invoice") &&
        exec.policyVerdict === "APPROVED_L3_AUTO" &&
        Date.parse(exec.executedAt) >= cutoff
      ) {
        sum += Number(exec.amountValue ?? 0);
      }
    }
    return Number(sum.toFixed(2));
  }

  public nextInvoiceNumber(): string {
    const num = this.invoiceSequence;
    this.invoiceSequence += 1;
    return `INV-2026-${num}`;
  }

  public saveInvoice(invoice: HydratedInvoiceRecord): HydratedInvoiceRecord {
    this.invoices.set(invoice.invoiceId, invoice);
    return invoice;
  }

  public getInvoice(invoiceId: string): HydratedInvoiceRecord | undefined {
    if (this.invoices.has(invoiceId)) {
      return this.invoices.get(invoiceId);
    }
    for (const inv of this.invoices.values()) {
      if (inv.invoiceNumber === invoiceId) {
        return inv;
      }
    }
    return undefined;
  }

  public listInvoices(filters?: {
    workspaceId?: string;
    dunningState?: string;
    currency?: string;
    limit?: number;
  }): HydratedInvoiceRecord[] {
    const norm = normalizeWorkspaceId(filters?.workspaceId);
    let items = Array.from(this.invoices.values()).filter((inv) => inv.workspaceId === norm);
    if (items.length === 0) {
      items = Array.from(this.invoices.values());
    }
    if (filters?.dunningState) {
      const target = filters.dunningState.toUpperCase();
      items = items.filter(
        (i) => i.dunning_state.toUpperCase() === target || i.status.toUpperCase() === target
      );
    }
    if (filters?.currency) {
      const curr = filters.currency.toUpperCase();
      items = items.filter((i) => i.currencyCode === curr);
    }
    if (filters?.limit && filters.limit > 0) {
      items = items.slice(0, filters.limit);
    }
    return items;
  }

  public saveOrder(order: HydratedOrderRecord): HydratedOrderRecord {
    this.orders.set(order.orderId, order);
    return order;
  }

  public getOrder(orderId: string): HydratedOrderRecord | undefined {
    return this.orders.get(orderId);
  }

  public listOrders(workspaceId?: string): HydratedOrderRecord[] {
    const norm = normalizeWorkspaceId(workspaceId);
    return Array.from(this.orders.values()).filter((o) => o.workspaceId === norm);
  }

  public saveDispute(dispute: HydratedDisputeCase): HydratedDisputeCase {
    this.disputes.set(dispute.disputeId, dispute);
    return dispute;
  }

  public getDispute(disputeId: string): HydratedDisputeCase | undefined {
    return this.disputes.get(disputeId);
  }

  public listDisputes(workspaceId?: string): HydratedDisputeCase[] {
    const norm = normalizeWorkspaceId(workspaceId);
    const items = Array.from(this.disputes.values()).filter((d) => d.workspaceId === norm);
    return items.length > 0 ? items : Array.from(this.disputes.values());
  }

  public saveSubscriptionPlan(plan: HydratedSubscriptionPlan): HydratedSubscriptionPlan {
    this.subscriptions.set(plan.planId, plan);
    return plan;
  }

  public getSubscriptionPlan(planId: string): HydratedSubscriptionPlan | undefined {
    if (this.subscriptions.has(planId)) {
      return this.subscriptions.get(planId);
    }
    for (const plan of this.subscriptions.values()) {
      if (plan.paypal_subscription_id === planId || plan.paypal_product_id === planId) {
        return plan;
      }
    }
    return undefined;
  }

  public listSubscriptionPlans(workspaceId?: string): HydratedSubscriptionPlan[] {
    const norm = normalizeWorkspaceId(workspaceId);
    const items = Array.from(this.subscriptions.values()).filter((s) => s.workspaceId === norm);
    return items.length > 0 ? items : Array.from(this.subscriptions.values());
  }

  public appendAuditLog(params: {
    workspaceId?: string;
    actorId: string;
    toolName: string;
    paypalRequestId: string;
    policyVerdict: string;
    payload: unknown;
    executionId?: string;
    timestampIso?: string;
  }): Readonly<AuditLogExtendedEntry> {
    const prevHash =
      this.auditLogs.length > 0
        ? this.auditLogs[this.auditLogs.length - 1].entryHash
        : GENESIS_AUDIT_HASH;
    const seq = this.auditLogs.length + 1;
    const entry = buildChainedAuditEntry({
      seq,
      prevHash,
      workspaceId: normalizeWorkspaceId(params.workspaceId),
      actorId: params.actorId,
      toolName: params.toolName,
      paypalRequestId: params.paypalRequestId,
      policyVerdict: params.policyVerdict,
      payload: params.payload,
      executionId: params.executionId,
      timestampIso: params.timestampIso,
    });
    this.auditLogs.push(entry);
    return entry;
  }

  public listAuditLogs(workspaceId?: string): ReadonlyArray<AuditLogExtendedEntry> {
    if (!workspaceId) {
      return [...this.auditLogs];
    }
    const norm = normalizeWorkspaceId(workspaceId);
    return this.auditLogs.filter((l) => l.workspaceId === norm);
  }

  public verifyAuditLedgerIntegrity(): ReturnType<typeof verifyAuditChain> {
    return verifyAuditChain(this.auditLogs);
  }

  public updateAuditLog(): never {
    return guardImmutableAuditMutation("UPDATE");
  }

  public deleteAuditLog(): never {
    return guardImmutableAuditMutation("DELETE");
  }
}

export const repository = new DualModeRepository();
export { twoDecimalStringToMinorUnits };
