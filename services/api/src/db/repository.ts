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
  MOCK_OPERATORS,
  MOCK_POLICY_RULES,
  MOCK_EXECUTIONS,
  MOCK_ORDERS,
  MOCK_INVOICES,
  MOCK_DISPUTES,
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

export const POSTGRES_BOOTSTRAP_DDL_SQL = `
CREATE TABLE IF NOT EXISTS merchant_workspaces (
  workspace_id VARCHAR(64) PRIMARY KEY,
  merchant_name VARCHAR(160) NOT NULL,
  paypal_merchant_id VARCHAR(64) NOT NULL UNIQUE,
  paypal_client_id_ref VARCHAR(128) NOT NULL DEFAULT 'arn:aws:kms:us-west-2:payops:client-id-ref',
  risk_tier VARCHAR(24) NOT NULL DEFAULT 'LOW',
  base_currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  autonomy_level VARCHAR(8) NOT NULL DEFAULT 'L3',
  daily_autonomous_cap_minor BIGINT NOT NULL DEFAULT 50000,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operator_users (
  operator_id VARCHAR(64) PRIMARY KEY,
  workspace_id VARCHAR(64) NOT NULL REFERENCES merchant_workspaces(workspace_id),
  email_hash CHAR(64) NOT NULL UNIQUE,
  email VARCHAR(160) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  rbac_role VARCHAR(24) NOT NULL,
  passkey_public_key TEXT NOT NULL,
  webauthn_credential_id VARCHAR(128),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_sessions (
  session_id VARCHAR(64) PRIMARY KEY,
  workspace_id VARCHAR(64) NOT NULL REFERENCES merchant_workspaces(workspace_id),
  operator_id VARCHAR(64) NOT NULL REFERENCES operator_users(operator_id),
  active_persona VARCHAR(48) NOT NULL DEFAULT 'SENTINEL_CFO',
  intent_domain VARCHAR(32) NOT NULL DEFAULT 'INVOICES',
  max_tool_hops INTEGER NOT NULL DEFAULT 6,
  used_tool_hops INTEGER NOT NULL DEFAULT 0,
  token_budget_usd NUMERIC(8,4) NOT NULL DEFAULT 0.2500,
  spent_cost_usd NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
  trace_id VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policy_rules (
  policy_id VARCHAR(64) PRIMARY KEY,
  workspace_id VARCHAR(64) NOT NULL REFERENCES merchant_workspaces(workspace_id),
  rule_code VARCHAR(32) NOT NULL,
  rule_name VARCHAR(140) NOT NULL,
  autonomy_level VARCHAR(8) NOT NULL DEFAULT 'L3',
  dsl_expression TEXT NOT NULL,
  max_single_tx_minor BIGINT NOT NULL DEFAULT 25000,
  daily_velocity_cap_minor BIGINT NOT NULL DEFAULT 50000,
  max_single_auto_invoice_send_minor BIGINT NOT NULL DEFAULT 500000,
  max_auto_dispute_claim_accept_minor BIGINT NOT NULL DEFAULT 5000,
  required_approval_role VARCHAR(24) NOT NULL DEFAULT 'FINANCE_ADMIN',
  risk_threshold NUMERIC(4,3) NOT NULL DEFAULT 0.350,
  min_hours_between_invoice_reminders INTEGER NOT NULL DEFAULT 72,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_tool_executions (
  execution_id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL REFERENCES agent_sessions(session_id),
  workspace_id VARCHAR(64) NOT NULL REFERENCES merchant_workspaces(workspace_id),
  policy_id VARCHAR(64) NOT NULL REFERENCES policy_rules(policy_id),
  approved_by_operator_id VARCHAR(64) REFERENCES operator_users(operator_id),
  paypal_request_id VARCHAR(128) NOT NULL UNIQUE,
  mcp_tool_name VARCHAR(64) NOT NULL,
  validated_input_json JSONB NOT NULL,
  policy_verdict VARCHAR(32) NOT NULL,
  reason_code VARCHAR(64) NOT NULL DEFAULT 'RC_OK_POLICY_PASSED',
  junodb_lease_status VARCHAR(32) NOT NULL DEFAULT 'ACQUIRED',
  injection_score NUMERIC(4,3) NOT NULL DEFAULT 0.000,
  gnn_risk_score NUMERIC(4,3) NOT NULL DEFAULT 0.000,
  amount_value VARCHAR(32),
  currency_code VARCHAR(8),
  paypal_http_status INTEGER,
  paypal_response_json JSONB,
  operator_signature TEXT,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paypal_order_records (
  order_record_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id VARCHAR(64) NOT NULL REFERENCES merchant_workspaces(workspace_id),
  paypal_order_id VARCHAR(64) NOT NULL UNIQUE,
  paypal_capture_id VARCHAR(64),
  paypal_request_id VARCHAR(128) NOT NULL,
  intent VARCHAR(16) NOT NULL DEFAULT 'CAPTURE',
  status VARCHAR(24) NOT NULL DEFAULT 'CREATED',
  amount_minor BIGINT NOT NULL,
  currency_code VARCHAR(8) NOT NULL,
  buyer_hash CHAR(64) NOT NULL,
  fastlane_accelerated BOOLEAN NOT NULL DEFAULT FALSE,
  carrier_code VARCHAR(32),
  tracking_number VARCHAR(64),
  shipment_tracking_status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paypal_invoice_records (
  invoice_record_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id VARCHAR(64) NOT NULL REFERENCES merchant_workspaces(workspace_id),
  paypal_invoice_id VARCHAR(64) NOT NULL UNIQUE,
  invoice_number VARCHAR(64) NOT NULL,
  recipient_hash CHAR(64) NOT NULL,
  recipient_email VARCHAR(160) NOT NULL,
  amount_minor BIGINT NOT NULL,
  currency_code VARCHAR(8) NOT NULL,
  due_date DATE NOT NULL,
  qr_code_uri TEXT NOT NULL,
  dunning_state VARCHAR(32) NOT NULL DEFAULT 'SENT',
  conditional_rules_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  recurring_series_id VARCHAR(64),
  pyusd_tx_signature VARCHAR(128),
  last_reminder_sent_at TIMESTAMPTZ,
  idempotency_key VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paypal_dispute_cases (
  dispute_case_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id VARCHAR(64) NOT NULL REFERENCES merchant_workspaces(workspace_id),
  paypal_order_id VARCHAR(64) NOT NULL,
  paypal_dispute_id VARCHAR(64) NOT NULL UNIQUE,
  reason_code VARCHAR(64) NOT NULL,
  disputed_amount_minor BIGINT NOT NULL,
  currency_code VARCHAR(8) NOT NULL,
  response_deadline TIMESTAMPTZ NOT NULL,
  shipment_tracking_proof_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  gnn_risk_score NUMERIC(4,3) NOT NULL DEFAULT 0.000,
  gnn_reason_codes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_bundle_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  agent_action VARCHAR(48) NOT NULL DEFAULT 'PENDING',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_plan_records (
  subscription_record_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id VARCHAR(64) NOT NULL REFERENCES merchant_workspaces(workspace_id),
  paypal_product_id VARCHAR(64) NOT NULL,
  paypal_plan_id VARCHAR(64) NOT NULL UNIQUE,
  paypal_subscription_id VARCHAR(64) NOT NULL UNIQUE,
  plan_name VARCHAR(140) NOT NULL,
  billing_cycle_cadence VARCHAR(24) NOT NULL,
  recurring_amount_minor BIGINT NOT NULL,
  currency_code VARCHAR(8) NOT NULL,
  subscriber_status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
  churn_rescue_state VARCHAR(24) NOT NULL DEFAULT 'HEALTHY',
  next_billing_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS immutable_audit_logs (
  audit_seq BIGSERIAL PRIMARY KEY,
  log_id VARCHAR(64) NOT NULL UNIQUE,
  workspace_id VARCHAR(64) NOT NULL REFERENCES merchant_workspaces(workspace_id),
  execution_id VARCHAR(64),
  event_type VARCHAR(64) NOT NULL,
  actor_id VARCHAR(64) NOT NULL,
  paypal_request_id VARCHAR(128) NOT NULL,
  policy_verdict VARCHAR(64) NOT NULL,
  redacted_payload_json JSONB NOT NULL,
  prev_hash CHAR(64) NOT NULL,
  entry_hash CHAR(64) NOT NULL UNIQUE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ImmutableAuditLog (E-10) is append-only. UPDATE and DELETE are strictly prohibited.'
  USING ERRCODE = '23514';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_audit_log_protect ON immutable_audit_logs;
CREATE TRIGGER trg_immutable_audit_log_protect
BEFORE UPDATE OR DELETE ON immutable_audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
`;

export class DualModeRepository {
  public storageMode: "postgres" | "in-memory" = "in-memory";
  public db: NodePgDatabase<typeof schema> | null = null;
  private pool: pg.Pool | null = null;
  private postgresBootstrapped = false;

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

  public async initializePostgresIfConfigured(opts?: {
    waitForBootstrap?: boolean;
  }): Promise<void> {
    if (!envConfig.isLivePostgresConfigured) {
      this.storageMode = "in-memory";
      return;
    }
    if (process.env.VITEST === "true" && process.env.FORCE_LIVE_POSTGRES !== "true") {
      this.storageMode = "postgres";
      return;
    }
    if (this.pool && this.postgresBootstrapped) {
      this.storageMode = "postgres";
      return;
    }
    try {
      if (!this.pool) {
        const normalizedConnStr =
          envConfig.databaseUrl.includes("sslmode=require") &&
          !envConfig.databaseUrl.includes("uselibpqcompat=")
            ? envConfig.databaseUrl.replace(
                "sslmode=require",
                "uselibpqcompat=true&sslmode=require"
              )
            : envConfig.databaseUrl;
        this.pool = new Pool({
          connectionString: normalizedConnStr,
          connectionTimeoutMillis: 15000,
          idleTimeoutMillis: 30000,
          max: 10,
        });
        this.pool.on("error", () => undefined);
      }
      await this.pool.query("SELECT 1");
      this.db = drizzle(this.pool, { schema });
      this.storageMode = "postgres";
      if (!this.postgresBootstrapped) {
        this.postgresBootstrapped = true;
        if (opts?.waitForBootstrap) {
          try {
            await this.bootstrapAndSeedPostgresSchema();
          } catch (bootstrapErr) {
            console.warn("Postgres schema bootstrap warning:", (bootstrapErr as Error).message);
          }
        } else {
          void this.bootstrapAndSeedPostgresSchema().catch(() => undefined);
        }
      }
    } catch {
      this.storageMode = "in-memory";
      if (this.pool) {
        await this.pool.end().catch(() => undefined);
        this.pool = null;
      }
    }
  }

  private async bootstrapAndSeedPostgresSchema(): Promise<void> {
    if (!this.pool) {
      return;
    }
    await this.pool.query(POSTGRES_BOOTSTRAP_DDL_SQL);

    // Seed baseline E-01 Workspaces
    for (const ws of this.workspaces.values()) {
      await this.pool.query(
        `INSERT INTO merchant_workspaces (workspace_id, merchant_name, paypal_merchant_id, risk_tier, base_currency, autonomy_level)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (workspace_id) DO NOTHING`,
        [
          ws.workspaceId,
          ws.merchantName,
          ws.paypalMerchantId,
          ws.riskTier,
          ws.baseCurrency,
          ws.autonomyLevel,
        ]
      );
    }

    // Seed baseline E-02 Operators
    for (const op of this.operators.values()) {
      await this.pool.query(
        `INSERT INTO operator_users (operator_id, workspace_id, email_hash, email, display_name, rbac_role, passkey_public_key, webauthn_credential_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (operator_id) DO NOTHING`,
        [
          op.userId,
          op.workspaceId,
          hashBuyerIdentifier(op.email),
          op.email,
          op.displayName,
          op.role,
          op.publicKeyEd25519 ?? "MCowBQYDK2VwAyEAPayOpsSentinelDefaultPubKey=",
          op.webauthnCredentialId ?? null,
        ]
      );
    }

    // Seed baseline E-05 Policies
    for (const pol of this.policies.values()) {
      await this.pool.query(
        `INSERT INTO policy_rules (policy_id, workspace_id, rule_code, rule_name, autonomy_level, dsl_expression, max_single_tx_minor, daily_velocity_cap_minor, max_single_auto_invoice_send_minor, max_auto_dispute_claim_accept_minor, required_approval_role, risk_threshold, min_hours_between_invoice_reminders, is_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (policy_id) DO NOTHING`,
        [
          pol.policyId,
          pol.workspaceId,
          pol.rule_code,
          pol.ruleName,
          pol.autonomyLevel,
          pol.dsl_expression,
          pol.max_single_tx_minor,
          pol.daily_velocity_cap_minor,
          Math.round(pol.maxSingleAutoInvoiceSendUsd * 100),
          Math.round(pol.maxAutoDisputeClaimAcceptUsd * 100),
          pol.required_approval_role,
          pol.risk_threshold,
          pol.minHoursBetweenInvoiceReminders,
          pol.isActive,
        ]
      );
    }

    // Seed baseline E-03 AgentSession & E-04 AgentToolExecution
    await this.pool.query(
      `INSERT INTO agent_sessions (session_id, workspace_id, operator_id, active_persona, intent_domain, max_tool_hops, used_tool_hops, token_budget_usd, spent_cost_usd, trace_id, status)
       VALUES ('ses_baseline_001', 'ws_99102a', 'usr_maya_lin_owner', 'SENTINEL_CFO', 'INVOICES', 6, 1, 0.2500, 0.0120, 'trace_ses_baseline_001', 'COMPLETED')
       ON CONFLICT (session_id) DO NOTHING`
    );
    await this.pool.query(
      `INSERT INTO agent_tool_executions (execution_id, session_id, workspace_id, policy_id, paypal_request_id, mcp_tool_name, validated_input_json, policy_verdict, reason_code, junodb_lease_status, injection_score, gnn_risk_score, amount_value, currency_code, paypal_http_status, paypal_response_json, latency_ms, version)
       VALUES ('exec_baseline_001', 'ses_baseline_001', 'ws_99102a', 'pol_refund_risk_gate_01', 'idem_ws_99102a_baseline_send_invoice_01', 'send_invoice', '{"invoiceId":"INV2-X89A-4412-9012-7731","amountValue":"2450.00","currencyCode":"USD"}'::jsonb, 'APPROVED_L3_AUTO', 'RC_OK_POLICY_PASSED', 'ACQUIRED', 0.000, 0.050, '2450.00', 'USD', 200, '{"status":"SENT"}'::jsonb, 14, 1)
       ON CONFLICT (execution_id) DO NOTHING`
    );

    // Seed baseline E-06 Orders
    for (const ord of this.orders.values()) {
      await this.pool.query(
        `INSERT INTO paypal_order_records (workspace_id, paypal_order_id, paypal_capture_id, paypal_request_id, intent, status, amount_minor, currency_code, buyer_hash, fastlane_accelerated, carrier_code, tracking_number, shipment_tracking_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (paypal_order_id) DO NOTHING`,
        [
          ord.workspaceId,
          ord.orderId,
          ord.paypal_capture_id,
          ord.paypalRequestId,
          ord.intent,
          ord.status,
          ord.amount_minor,
          ord.currencyCode,
          ord.buyer_hash,
          ord.fastlane_accelerated,
          ord.carrierCode ?? null,
          ord.trackingNumber ?? null,
          ord.shipment_tracking_status,
        ]
      );
    }

    // Seed baseline E-07 Invoices
    for (const inv of this.invoices.values()) {
      await this.pool.query(
        `INSERT INTO paypal_invoice_records (workspace_id, paypal_invoice_id, invoice_number, recipient_hash, recipient_email, amount_minor, currency_code, due_date, qr_code_uri, dunning_state, conditional_rules_json, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)
         ON CONFLICT (paypal_invoice_id) DO NOTHING`,
        [
          inv.workspaceId,
          inv.invoiceId,
          inv.invoiceNumber,
          inv.recipient_hash,
          inv.recipientEmail,
          inv.amount_minor,
          inv.currencyCode,
          inv.dueDate,
          inv.qrCodeUri,
          inv.dunning_state,
          JSON.stringify(inv.conditional_rules_json ?? {}),
          inv.idempotencyKey,
        ]
      );
    }

    // Seed baseline E-08 Disputes
    for (const disp of this.disputes.values()) {
      await this.pool.query(
        `INSERT INTO paypal_dispute_cases (workspace_id, paypal_order_id, paypal_dispute_id, reason_code, disputed_amount_minor, currency_code, response_deadline, shipment_tracking_proof_json, gnn_risk_score, gnn_reason_codes_json, evidence_bundle_json, agent_action)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::jsonb, $11::jsonb, $12)
         ON CONFLICT (paypal_dispute_id) DO NOTHING`,
        [
          disp.workspaceId,
          disp.orderId,
          disp.disputeId,
          disp.reasonCode,
          disp.disputed_amount_minor,
          disp.currencyCode,
          disp.response_deadline,
          JSON.stringify(disp.shipment_tracking_proof_json ?? {}),
          disp.gnn_risk_score,
          JSON.stringify(disp.gnn_reason_codes ?? []),
          JSON.stringify(disp.evidence_bundle_json ?? {}),
          disp.agent_action,
        ]
      );
    }

    // Seed baseline E-09 Subscriptions
    for (const sub of this.subscriptions.values()) {
      await this.pool.query(
        `INSERT INTO subscription_plan_records (workspace_id, paypal_product_id, paypal_plan_id, paypal_subscription_id, plan_name, billing_cycle_cadence, recurring_amount_minor, currency_code, subscriber_status, churn_rescue_state, next_billing_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (paypal_plan_id) DO NOTHING`,
        [
          sub.workspaceId,
          sub.productId,
          sub.planId,
          sub.paypal_subscription_id,
          sub.planName,
          sub.billing_cycle_cadence,
          sub.recurring_amount_minor,
          sub.currencyCode,
          sub.subscriber_status,
          sub.churn_rescue_state,
          sub.next_billing_at,
        ]
      );
    }

    // Seed baseline E-10 Audit Logs
    for (const log of this.auditLogs) {
      await this.pool.query(
        `INSERT INTO immutable_audit_logs (log_id, workspace_id, execution_id, event_type, actor_id, paypal_request_id, policy_verdict, redacted_payload_json, prev_hash, entry_hash, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)
         ON CONFLICT (entry_hash) DO NOTHING`,
        [
          log.logId,
          log.workspaceId,
          log.execution_id ?? null,
          log.toolName,
          log.actorId,
          log.paypalRequestId,
          log.policyVerdict,
          log.rawPayloadJson,
          log.prevHash,
          log.entryHash,
          log.timestampIso,
        ]
      );
    }
  }

  public async getPostgresLiveStats(): Promise<{
    connected: boolean;
    storageMode: "postgres" | "in-memory";
    databaseHost: string;
    readWriteVerified: boolean;
    primaryWorkspace?: { workspaceId: string; merchantName: string; autonomyLevel: string };
    tableRowCounts: Record<string, number>;
  }> {
    if (!this.pool || this.storageMode !== "postgres") {
      return {
        connected: false,
        storageMode: this.storageMode,
        databaseHost: "in-memory-ledger",
        readWriteVerified: false,
        tableRowCounts: {},
      };
    }
    try {
      const res = await this.pool.query<{
        workspaces: string;
        operators: string;
        sessions: string;
        executions: string;
        policies: string;
        orders: string;
        invoices: string;
        disputes: string;
        subscriptions: string;
        audit_logs: string;
        ws_id: string | null;
        ws_name: string | null;
        ws_autonomy: string | null;
      }>(`
        SELECT
          (SELECT count(*) FROM merchant_workspaces) AS workspaces,
          (SELECT count(*) FROM operator_users) AS operators,
          (SELECT count(*) FROM agent_sessions) AS sessions,
          (SELECT count(*) FROM agent_tool_executions) AS executions,
          (SELECT count(*) FROM policy_rules) AS policies,
          (SELECT count(*) FROM paypal_order_records) AS orders,
          (SELECT count(*) FROM paypal_invoice_records) AS invoices,
          (SELECT count(*) FROM paypal_dispute_cases) AS disputes,
          (SELECT count(*) FROM subscription_plan_records) AS subscriptions,
          (SELECT count(*) FROM immutable_audit_logs) AS audit_logs,
          (SELECT workspace_id FROM merchant_workspaces WHERE workspace_id = 'ws_99102a' LIMIT 1) AS ws_id,
          (SELECT merchant_name FROM merchant_workspaces WHERE workspace_id = 'ws_99102a' LIMIT 1) AS ws_name,
          (SELECT autonomy_level FROM merchant_workspaces WHERE workspace_id = 'ws_99102a' LIMIT 1) AS ws_autonomy
      `);
      const row = res.rows[0];
      const hostMatch = /@([^/?]+)/.exec(envConfig.databaseUrl);
      return {
        connected: true,
        storageMode: "postgres",
        databaseHost: hostMatch ? hostMatch[1] : "neon-postgres",
        readWriteVerified: row?.ws_id === "ws_99102a",
        primaryWorkspace: row?.ws_id
          ? {
              workspaceId: row.ws_id,
              merchantName: row.ws_name ?? "",
              autonomyLevel: row.ws_autonomy ?? "L3",
            }
          : undefined,
        tableRowCounts: {
          merchant_workspaces: Number(row?.workspaces ?? 0),
          operator_users: Number(row?.operators ?? 0),
          agent_sessions: Number(row?.sessions ?? 0),
          agent_tool_executions: Number(row?.executions ?? 0),
          policy_rules: Number(row?.policies ?? 0),
          paypal_order_records: Number(row?.orders ?? 0),
          paypal_invoice_records: Number(row?.invoices ?? 0),
          paypal_dispute_cases: Number(row?.disputes ?? 0),
          subscription_plan_records: Number(row?.subscriptions ?? 0),
          immutable_audit_logs: Number(row?.audit_logs ?? 0),
        },
      };
    } catch {
      return {
        connected: false,
        storageMode: this.storageMode,
        databaseHost: "in-memory-ledger",
        readWriteVerified: false,
        tableRowCounts: {},
      };
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
    for (const op of [...seededOperators, ...MOCK_OPERATORS]) {
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
    for (const mockPol of MOCK_POLICY_RULES) {
      if (!this.policies.has(mockPol.policyId)) {
        this.policies.set(mockPol.policyId, {
          ...mockPol,
          policy_id: mockPol.policyId,
          workspace_id: mockPol.workspaceId,
          rule_code: mockPol.policyId,
          rule_name: mockPol.ruleName,
          autonomy_level: mockPol.autonomyLevel,
          dsl_expression:
            mockPol.policyId === "POL-02"
              ? pol1.dsl_expression
              : pol2.dsl_expression,
          max_single_tx_minor: Math.round(mockPol.maxSingleAutoRefundUsd * 100),
          daily_velocity_cap_minor: Math.round(mockPol.maxDailyRefundVelocityUsd * 100),
          required_approval_role: "FINANCE_ADMIN",
          risk_threshold: mockPol.maxGnnRiskScoreForAutoRefund,
          is_enabled: mockPol.isActive,
        });
      }
    }

    // 3b. E-04 Seeded AgentToolExecutions (matching MOCK_EXECUTIONS & UI fixtures)
    const extraExecs: AgentToolExecution[] = [
      {
        executionId: "ex_88101",
        sessionId: "ses_20261108_9041",
        workspaceId: "ws_99102a",
        toolName: "send_invoice",
        paypalRequestId: "idem_ws_99102a_ex_88101_send_invoice",
        junodbLeaseStatus: "ACQUIRED",
        policyVerdict: "APPROVED_L3_AUTO",
        reasonCode: "RC_OK_WITHIN_POLICY",
        gnnRiskScore: 0.04,
        amountValue: "2450.00",
        currencyCode: "USD",
        executedAt: "2026-11-08T18:40:00.000Z",
      },
      {
        executionId: "ex_88102",
        sessionId: "ses_20261108_9042",
        workspaceId: "ws_99102a",
        toolName: "create_refund",
        paypalRequestId: "idem_ws_99102a_ex_88102_create_refund",
        junodbLeaseStatus: "ACQUIRED",
        policyVerdict: "HELD_FOR_L2_PASSKEY",
        reasonCode: "RC_01_SINGLE_TX_CAP_EXCEEDED",
        gnnRiskScore: 0.89,
        amountValue: "420.00",
        currencyCode: "USD",
        executedAt: "2026-11-08T18:41:00.000Z",
      },
      {
        executionId: "ex_88103",
        sessionId: "ses_20261108_9041",
        workspaceId: "ws_99102a",
        toolName: "get_dispute",
        paypalRequestId: "idem_ws_99102a_ex_88103_get_dispute",
        junodbLeaseStatus: "ACQUIRED",
        policyVerdict: "APPROVED_L3_AUTO",
        reasonCode: "RC_OK_WITHIN_POLICY",
        gnnRiskScore: 0.88,
        amountValue: "340.00",
        currencyCode: "USD",
        executedAt: "2026-11-08T18:42:00.000Z",
      },
    ];
    for (const ex of [...MOCK_EXECUTIONS, ...extraExecs]) {
      this.executions.set(ex.executionId, {
        ...ex,
        execution_id: ex.executionId,
        session_id: ex.sessionId,
        workspace_id: ex.workspaceId,
        policy_id: "pol_refund_risk_gate_01",
        paypal_request_id: ex.paypalRequestId,
        mcp_tool_name: ex.toolName,
        intent_class: ex.toolName.includes("refund") ? "REFUND" : "INVOICING",
        injection_score: ex.policyVerdict === "BLOCKED_SECURITY_INJECTION" ? 0.94 : 0.01,
        gnn_risk_score: ex.gnnRiskScore,
        apimatic_schema_valid: true,
        policy_verdict:
          ex.policyVerdict === "HELD_FOR_L2_PASSKEY"
            ? "HOLD_APPROVAL"
            : ex.policyVerdict === "BLOCKED_SECURITY_INJECTION"
              ? "DENY"
              : "ALLOW",
        matched_rule_code:
          ex.policyVerdict === "HELD_FOR_L2_PASSKEY"
            ? "POL-02-REFUND-HOLD"
            : "POL-01-INVOICE-SEND",
        tool_calls: [],
        audit_entry_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        latency_ms: 8,
        version: 1,
        validated_input_json: {
          order_id: "8XL99102481",
          amountValue: ex.amountValue,
          currencyCode: ex.currencyCode,
        },
      });
    }

    // 4. E-06 Orders (matching SEED_DISPUTES & MOCK_ORDERS order IDs)
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
      {
        orderId: "5O190127TN364715T",
        workspaceId: "ws_99102a",
        paypalRequestId: "idem_ws_99102a_7a8b9c0d1e2f3a4b5c6d7e8f9012a3b4",
        intent: "CAPTURE",
        status: "COMPLETED",
        amountValue: "390.00",
        currencyCode: "USD",
        buyerEmailHmac: "hmac_sha256_4c81e90211ab77d23190cc4188210fa2",
        carrierCode: "FEDEX",
        trackingNumber: "794899102341",
        trackingStatus: "DELIVERED",
        order_record_id: "ord_rec_5o190127tn364715t",
        workspace_id: "ws_99102a",
        paypal_order_id: "5O190127TN364715T",
        paypal_capture_id: "2GG55190127TN",
        paypal_request_id: "idem_ws_99102a_7a8b9c0d1e2f3a4b5c6d7e8f9012a3b4",
        amount_minor: 39000,
        currency_code: "USD",
        buyer_hash: "hmac_sha256_4c81e90211ab77d23190cc4188210fa2",
        fastlane_accelerated: true,
        carrier_code: "FEDEX",
        tracking_number: "794899102341",
        shipment_tracking_status: "DELIVERED",
        approve_link: "https://www.sandbox.paypal.com/checkoutnow?token=5O190127TN364715T",
        created_at: "2026-11-03T11:00:00.000Z",
      },
      {
        orderId: "9K281044BC991023A",
        workspaceId: "ws_99102a",
        paypalRequestId: "idem_ws_99102a_order_9K281044BC991023A_capture",
        intent: "CAPTURE",
        status: "COMPLETED",
        amountValue: "35.00",
        currencyCode: "USD",
        buyerEmailHmac: hashBuyerIdentifier("buyer.9k@retail.example.com"),
        carrierCode: "FEDEX",
        trackingNumber: "794801928374",
        trackingStatus: "DELIVERED",
        order_record_id: "ord_rec_9k281044bc991023a",
        workspace_id: "ws_99102a",
        paypal_order_id: "9K281044BC991023A",
        paypal_capture_id: "2GG9K281044BC",
        paypal_request_id: "idem_ws_99102a_order_9K281044BC991023A_capture",
        amount_minor: 3500,
        currency_code: "USD",
        buyer_hash: hashBuyerIdentifier("buyer.9k@retail.example.com"),
        fastlane_accelerated: false,
        carrier_code: "FEDEX",
        tracking_number: "794801928374",
        shipment_tracking_status: "DELIVERED",
        approve_link: "https://www.sandbox.paypal.com/checkoutnow?token=9K281044BC991023A",
        created_at: "2026-11-03T12:00:00.000Z",
      },
      {
        orderId: "8XY92011",
        workspaceId: "ws_99102a",
        paypalRequestId: "idem_ws_99102a_11223344556677889900aabbccddeeff",
        intent: "CAPTURE",
        status: "COMPLETED",
        amountValue: "340.00",
        currencyCode: "USD",
        buyerEmailHmac: "hmac_sha256_7d12f009a8b1c2d3e4f5061728394a5b",
        carrierCode: "DHL_EXPRESS",
        trackingNumber: "77819201",
        trackingStatus: "DELIVERED",
        order_record_id: "ord_rec_8xy92011",
        workspace_id: "ws_99102a",
        paypal_order_id: "8XY92011",
        paypal_capture_id: "2GG8XY9201100",
        paypal_request_id: "idem_ws_99102a_11223344556677889900aabbccddeeff",
        amount_minor: 34000,
        currency_code: "USD",
        buyer_hash: "hmac_sha256_7d12f009a8b1c2d3e4f5061728394a5b",
        fastlane_accelerated: true,
        carrier_code: "DHL_EXPRESS",
        tracking_number: "77819201",
        shipment_tracking_status: "DELIVERED",
        approve_link: "https://www.sandbox.paypal.com/checkoutnow?token=8XY92011",
        created_at: "2026-11-04T09:00:00.000Z",
      },
      {
        orderId: "9ZZ77401",
        workspaceId: "ws_99102a",
        paypalRequestId: "idem_ws_99102a_order_9ZZ77401_capture",
        intent: "CAPTURE",
        status: "COMPLETED",
        amountValue: "2400.00",
        currencyCode: "USD",
        buyerEmailHmac: hashBuyerIdentifier("buyer.9zz@retail.example.com"),
        carrierCode: "BLUEDART",
        trackingNumber: "BD901182736",
        trackingStatus: "IN_TRANSIT",
        order_record_id: "ord_rec_9zz77401",
        workspace_id: "ws_99102a",
        paypal_order_id: "9ZZ77401",
        paypal_capture_id: "2GG9ZZ7740100",
        paypal_request_id: "idem_ws_99102a_order_9ZZ77401_capture",
        amount_minor: 240000,
        currency_code: "USD",
        buyer_hash: hashBuyerIdentifier("buyer.9zz@retail.example.com"),
        fastlane_accelerated: false,
        carrier_code: "BLUEDART",
        tracking_number: "BD901182736",
        shipment_tracking_status: "IN_TRANSIT",
        approve_link: "https://www.sandbox.paypal.com/checkoutnow?token=9ZZ77401",
        created_at: "2026-11-04T15:00:00.000Z",
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

    const extraMockInvoices: Array<PayPalInvoiceRecord & { settledTxHash?: string }> = [
      ...MOCK_INVOICES,
      {
        invoiceId: "INV2-Z90D-1122-3344-5566",
        workspaceId: "ws_99102a",
        invoiceNumber: "INV-2026-8843",
        recipientEmail: "ap@kaveri-yarn-supplier.example.in",
        amountValue: "890.00",
        currencyCode: "USD",
        status: "PAID",
        dueDate: "2026-11-18",
        qrCodeUri:
          "https://api-m.sandbox.paypal.com/v2/invoicing/invoices/INV2-Z90D-1122-3344-5566/generate-qr-code",
        conditionalRule: {
          ruleType: "EARLY_PAYMENT_DISCOUNT",
          percentage: "2.00",
          triggerDate: "2026-11-10",
        },
        settledTxHash: "5xPyuSD99102aSolanaTxSignature8843Confirmed11111111",
        idempotencyKey: "idem_ws_99102a_invoice_INV_2026_8843",
      },
      {
        invoiceId: "INV2-C50D-8821-3349-1920",
        workspaceId: "ws_99102a",
        invoiceNumber: "INV-2026-8840",
        recipientEmail: "billing@globaltextiles.example.com",
        amountValue: "1250.00",
        currencyCode: "USD",
        status: "SENT",
        dueDate: "2026-11-21",
        qrCodeUri:
          "https://api-m.sandbox.paypal.com/v2/invoicing/invoices/INV2-C50D-8821-3349-1920/generate-qr-code",
        conditionalRule: {
          ruleType: "EARLY_PAYMENT_DISCOUNT",
          percentage: "2.00",
          triggerDate: "2026-11-14",
        },
        idempotencyKey: "idem_ws_99102a_invoice_INV_2026_8840",
      },
    ];
    for (const mInv of extraMockInvoices) {
      if (!this.invoices.has(mInv.invoiceId)) {
        const dunningState =
          mInv.status === "PAID"
            ? "PAID"
            : mInv.status === "OVERDUE"
              ? "OVERDUE"
              : "SENT";
        this.invoices.set(mInv.invoiceId, {
          ...mInv,
          invoice_record_id: `inv_rec_${mInv.invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          workspace_id: mInv.workspaceId,
          paypal_invoice_id: mInv.invoiceId,
          invoice_number: mInv.invoiceNumber,
          recipient_hash: hashBuyerIdentifier(mInv.recipientEmail),
          recipient_email: mInv.recipientEmail,
          amount_minor: Math.round(parseFloat(mInv.amountValue) * 100),
          currency_code: mInv.currencyCode,
          due_date: mInv.dueDate,
          qr_code_uri: mInv.qrCodeUri,
          dunning_state: dunningState,
          conditional_rules_json: (mInv.conditionalRule ?? {}) as Record<string, unknown>,
          recurring_series_id: null,
          pyusd_tx_signature: mInv.settledTxHash ?? null,
          aging_bucket: mInv.status === "OVERDUE" ? "1_30_DAYS" : "CURRENT",
          bryntum_task: {
            id: mInv.invoiceId,
            name: `${mInv.invoiceNumber} (${mInv.currencyCode} ${mInv.amountValue})`,
            startDate: "2026-11-05",
            endDate: mInv.dueDate,
            dunningState,
          },
        });
      }
    }

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

    const extraMockDisputes: PayPalDisputeCase[] = [
      ...MOCK_DISPUTES,
      {
        disputeId: "PP-D-4490",
        workspaceId: "ws_99102a",
        orderId: "8XY92011",
        reasonCode: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
        disputedAmountValue: "340.00",
        currencyCode: "USD",
        carrierCode: "DHL_EXPRESS",
        trackingNumber: "789102938102",
        trackingStatus: "DELIVERED",
        gnnRiskScore: 0.88,
        treeShapReasons: [
          "CARRIER_DELIVERED_GEO_MATCH (+0.52)",
          "SHARED_DEVICE_IP_3_PRIOR_INR_CLAIMS (+0.24)",
          "BUYER_SIGNATURE_VERIFIED_BY_M03_OCR (+0.12)",
        ],
        recommendedAction: "CONTEST_WITH_COMPELLING_EVIDENCE",
        responseDueIso: "2026-11-16T18:00:00.000Z",
      },
      {
        disputeId: "PP-D-3988",
        workspaceId: "ws_99102a",
        orderId: "4KM22019482",
        reasonCode: "SIGNIFICANTLY_NOT_AS_DESCRIBED",
        disputedAmountValue: "35.00",
        currencyCode: "USD",
        carrierCode: "FEDEX",
        trackingNumber: "794801928374",
        trackingStatus: "DELIVERED",
        gnnRiskScore: 0.14,
        treeShapReasons: [
          "LOW_VALUE_FIRST_TIME_BUYER_DISPUTE (-0.38)",
          "NO_SHARED_DEVICE_CLUSTER_ANOMALY (-0.21)",
        ],
        recommendedAction: "AUTO_ACCEPT_LOW_VALUE_CLAIM",
        responseDueIso: "2026-11-17T18:00:00.000Z",
      },
    ];
    for (const mDisp of extraMockDisputes) {
      if (!this.disputes.has(mDisp.disputeId)) {
        this.disputes.set(mDisp.disputeId, {
          ...mDisp,
          dispute_case_id: `disp_rec_${mDisp.disputeId.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          workspace_id: mDisp.workspaceId,
          paypal_dispute_id: mDisp.disputeId,
          paypal_order_id: mDisp.orderId,
          reason_code: mDisp.reasonCode,
          disputed_amount_minor: Math.round(parseFloat(mDisp.disputedAmountValue) * 100),
          currency_code: mDisp.currencyCode,
          response_deadline: mDisp.responseDueIso,
          shipment_tracking_proof_json: {
            carrier: mDisp.carrierCode,
            tracking_number: mDisp.trackingNumber,
            status: mDisp.trackingStatus,
            signed_by: "VERIFIED_RECIPIENT",
          },
          gnn_risk_score: mDisp.gnnRiskScore,
          gnn_reason_codes: mDisp.treeShapReasons,
          evidence_bundle_json: {},
          agent_action: mDisp.recommendedAction,
        });
      }
    }

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
    if (this.pool && this.storageMode === "postgres") {
      void this.pool
        .query(
          `UPDATE policy_rules
           SET rule_name = $2, autonomy_level = $3, dsl_expression = $4, max_single_tx_minor = $5,
               daily_velocity_cap_minor = $6, risk_threshold = $7, is_enabled = $8, updated_at = NOW()
           WHERE policy_id = $1`,
          [
            updated.policyId,
            updated.ruleName,
            updated.autonomyLevel,
            updated.dsl_expression,
            updated.max_single_tx_minor,
            updated.daily_velocity_cap_minor,
            updated.risk_threshold,
            updated.isActive,
          ]
        )
        .catch(() => undefined);
    }
    return {
      policy: updated,
      ast_compiled: compiled.astCompiled,
      compile_time_ms: compiled.compileTimeMs,
    };
  }

  public saveExecution(exec: HydratedExecutionRecord): HydratedExecutionRecord {
    this.executions.set(exec.executionId, exec);
    if (this.pool && this.storageMode === "postgres") {
      void this.pool
        .query(
          `INSERT INTO agent_sessions (session_id, workspace_id, operator_id, intent_domain, trace_id, status)
           VALUES ($1, $2, 'usr_maya_lin_owner', 'INVOICES', $3, 'COMPLETED')
           ON CONFLICT (session_id) DO NOTHING`,
          [exec.sessionId, exec.workspaceId, `trace_${exec.sessionId}`]
        )
        .then(() =>
          this.pool?.query(
            `INSERT INTO agent_tool_executions (execution_id, session_id, workspace_id, policy_id, paypal_request_id, mcp_tool_name, validated_input_json, policy_verdict, reason_code, junodb_lease_status, injection_score, gnn_risk_score, amount_value, currency_code, paypal_http_status, paypal_response_json, latency_ms, version)
             VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17, $18)
             ON CONFLICT (execution_id) DO UPDATE SET policy_verdict = EXCLUDED.policy_verdict, version = EXCLUDED.version, operator_signature = $19`,
            [
              exec.executionId,
              exec.sessionId,
              exec.workspaceId,
              exec.policy_id,
              exec.paypalRequestId,
              exec.toolName,
              JSON.stringify(exec.validated_input_json ?? {}),
              exec.policyVerdict,
              exec.reasonCode,
              exec.junodbLeaseStatus,
              exec.injection_score,
              exec.gnnRiskScore,
              exec.amountValue ?? null,
              exec.currencyCode ?? null,
              exec.paypal_http_status ?? 200,
              JSON.stringify(exec.paypal_response_json ?? {}),
              exec.latency_ms,
              exec.version,
              exec.operator_signature ?? null,
            ]
          )
        )
        .catch(() => undefined);
    }
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
        !exec.approved_by_operator_id &&
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
    if (this.pool && this.storageMode === "postgres") {
      void this.pool
        .query(
          `INSERT INTO paypal_invoice_records (workspace_id, paypal_invoice_id, invoice_number, recipient_hash, recipient_email, amount_minor, currency_code, due_date, qr_code_uri, dunning_state, conditional_rules_json, pyusd_tx_signature, idempotency_key)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13)
           ON CONFLICT (paypal_invoice_id) DO UPDATE SET
             dunning_state = EXCLUDED.dunning_state,
             due_date = EXCLUDED.due_date,
             pyusd_tx_signature = EXCLUDED.pyusd_tx_signature,
             updated_at = NOW()`,
          [
            invoice.workspaceId,
            invoice.invoiceId,
            invoice.invoiceNumber,
            invoice.recipient_hash,
            invoice.recipientEmail,
            invoice.amount_minor,
            invoice.currencyCode,
            invoice.dueDate,
            invoice.qrCodeUri,
            invoice.dunning_state,
            JSON.stringify(invoice.conditional_rules_json ?? {}),
            invoice.pyusd_tx_signature ?? null,
            invoice.idempotencyKey,
          ]
        )
        .catch(() => undefined);
    }
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
    if (this.pool && this.storageMode === "postgres") {
      void this.pool
        .query(
          `INSERT INTO paypal_order_records (workspace_id, paypal_order_id, paypal_capture_id, paypal_request_id, intent, status, amount_minor, currency_code, buyer_hash, fastlane_accelerated, carrier_code, tracking_number, shipment_tracking_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (paypal_order_id) DO UPDATE SET
             status = EXCLUDED.status,
             paypal_capture_id = EXCLUDED.paypal_capture_id,
             carrier_code = EXCLUDED.carrier_code,
             tracking_number = EXCLUDED.tracking_number,
             shipment_tracking_status = EXCLUDED.shipment_tracking_status,
             updated_at = NOW()`,
          [
            order.workspaceId,
            order.orderId,
            order.paypal_capture_id,
            order.paypalRequestId,
            order.intent,
            order.status,
            order.amount_minor,
            order.currencyCode,
            order.buyer_hash,
            order.fastlane_accelerated,
            order.carrierCode ?? null,
            order.trackingNumber ?? null,
            order.shipment_tracking_status,
          ]
        )
        .catch(() => undefined);
    }
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
    if (this.pool && this.storageMode === "postgres") {
      void this.pool
        .query(
          `UPDATE paypal_dispute_cases
           SET agent_action = $2, evidence_bundle_json = $3::jsonb, updated_at = NOW()
           WHERE paypal_dispute_id = $1`,
          [
            dispute.disputeId,
            dispute.agent_action,
            JSON.stringify(dispute.evidence_bundle_json ?? {}),
          ]
        )
        .catch(() => undefined);
    }
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
    if (this.pool && this.storageMode === "postgres") {
      void this.pool
        .query(
          `INSERT INTO subscription_plan_records (workspace_id, paypal_product_id, paypal_plan_id, paypal_subscription_id, plan_name, billing_cycle_cadence, recurring_amount_minor, currency_code, subscriber_status, churn_rescue_state, next_billing_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (paypal_plan_id) DO UPDATE SET
             subscriber_status = EXCLUDED.subscriber_status,
             next_billing_at = EXCLUDED.next_billing_at,
             updated_at = NOW()`,
          [
            plan.workspaceId,
            plan.productId,
            plan.planId,
            plan.paypal_subscription_id,
            plan.planName,
            plan.billing_cycle_cadence,
            plan.recurring_amount_minor,
            plan.currencyCode,
            plan.subscriber_status,
            plan.churn_rescue_state,
            plan.next_billing_at,
          ]
        )
        .catch(() => undefined);
    }
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
    if (this.pool && this.storageMode === "postgres") {
      void this.pool
        .query(
          `INSERT INTO immutable_audit_logs (log_id, workspace_id, execution_id, event_type, actor_id, paypal_request_id, policy_verdict, redacted_payload_json, prev_hash, entry_hash, recorded_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)
           ON CONFLICT (entry_hash) DO NOTHING`,
          [
            entry.logId,
            entry.workspaceId,
            entry.execution_id ?? null,
            entry.toolName,
            entry.actorId,
            entry.paypalRequestId,
            entry.policyVerdict,
            entry.rawPayloadJson,
            entry.prevHash,
            entry.entryHash,
            entry.timestampIso,
          ]
        )
        .catch(() => undefined);
    }
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
