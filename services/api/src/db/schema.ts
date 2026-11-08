/**
 * PayOps AI (PayPal Sentinel) — Drizzle ORM PostgreSQL 16 Schema (E-01 to E-10)
 * Maps to: docs/03-engineering/DATA_MODEL.md & packages/shared/src/entities.ts
 * @canonical E-01..E-10 (including E-06 PayPalOrderRecord & E-10 ImmutableAuditLog)
 */

import {
  pgTable,
  uuid,
  varchar,
  char,
  text,
  bigint,
  integer,
  numeric,
  boolean,
  date,
  timestamp,
  jsonb,
  bigserial,
} from "drizzle-orm/pg-core";

/**
 * E-01: MerchantWorkspace (merchant_workspaces)
 */
export const merchantWorkspaces = pgTable("merchant_workspaces", {
  workspaceId: varchar("workspace_id", { length: 64 }).primaryKey(),
  merchantName: varchar("merchant_name", { length: 160 }).notNull(),
  paypalMerchantId: varchar("paypal_merchant_id", { length: 64 }).notNull().unique(),
  paypalClientIdRef: varchar("paypal_client_id_ref", { length: 128 })
    .notNull()
    .default("arn:aws:kms:us-west-2:payops:client-id-ref"),
  riskTier: varchar("risk_tier", { length: 24 }).notNull().default("LOW"),
  baseCurrency: varchar("base_currency", { length: 8 }).notNull().default("USD"),
  autonomyLevel: varchar("autonomy_level", { length: 8 }).notNull().default("L3"),
  dailyAutonomousCapMinor: bigint("daily_autonomous_cap_minor", { mode: "number" })
    .notNull()
    .default(50000),
  settingsJson: jsonb("settings_json").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * E-02: OperatorUser (operator_users)
 */
export const operatorUsers = pgTable("operator_users", {
  operatorId: varchar("operator_id", { length: 64 }).primaryKey(),
  workspaceId: varchar("workspace_id", { length: 64 })
    .notNull()
    .references(() => merchantWorkspaces.workspaceId),
  emailHash: char("email_hash", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 160 }).notNull(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  rbacRole: varchar("rbac_role", { length: 24 }).notNull(),
  passkeyPublicKey: text("passkey_public_key").notNull(),
  webauthnCredentialId: varchar("webauthn_credential_id", { length: 128 }),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * E-03: AgentSession (agent_sessions)
 */
export const agentSessions = pgTable("agent_sessions", {
  sessionId: varchar("session_id", { length: 64 }).primaryKey(),
  workspaceId: varchar("workspace_id", { length: 64 })
    .notNull()
    .references(() => merchantWorkspaces.workspaceId),
  operatorId: varchar("operator_id", { length: 64 })
    .notNull()
    .references(() => operatorUsers.operatorId),
  activePersona: varchar("active_persona", { length: 48 }).notNull().default("SENTINEL_CFO"),
  intentDomain: varchar("intent_domain", { length: 32 }).notNull().default("INVOICES"),
  maxToolHops: integer("max_tool_hops").notNull().default(6),
  usedToolHops: integer("used_tool_hops").notNull().default(0),
  tokenBudgetUsd: numeric("token_budget_usd", { precision: 8, scale: 4 })
    .notNull()
    .default("0.2500"),
  spentCostUsd: numeric("spent_cost_usd", { precision: 8, scale: 4 }).notNull().default("0.0000"),
  traceId: varchar("trace_id", { length: 64 }).notNull().unique(),
  status: varchar("status", { length: 32 }).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * E-05: PolicyRule (policy_rules)
 */
export const policyRules = pgTable("policy_rules", {
  policyId: varchar("policy_id", { length: 64 }).primaryKey(),
  workspaceId: varchar("workspace_id", { length: 64 })
    .notNull()
    .references(() => merchantWorkspaces.workspaceId),
  ruleCode: varchar("rule_code", { length: 32 }).notNull(),
  ruleName: varchar("rule_name", { length: 140 }).notNull(),
  autonomyLevel: varchar("autonomy_level", { length: 8 }).notNull().default("L3"),
  dslExpression: text("dsl_expression").notNull(),
  maxSingleTxMinor: bigint("max_single_tx_minor", { mode: "number" }).notNull().default(25000),
  dailyVelocityCapMinor: bigint("daily_velocity_cap_minor", { mode: "number" })
    .notNull()
    .default(50000),
  maxSingleAutoInvoiceSendMinor: bigint("max_single_auto_invoice_send_minor", { mode: "number" })
    .notNull()
    .default(500000),
  maxAutoDisputeClaimAcceptMinor: bigint("max_auto_dispute_claim_accept_minor", { mode: "number" })
    .notNull()
    .default(5000),
  requiredApprovalRole: varchar("required_approval_role", { length: 24 })
    .notNull()
    .default("FINANCE_ADMIN"),
  riskThreshold: numeric("risk_threshold", { precision: 4, scale: 3 }).notNull().default("0.350"),
  minHoursBetweenInvoiceReminders: integer("min_hours_between_invoice_reminders")
    .notNull()
    .default(72),
  isEnabled: boolean("is_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * E-04: AgentToolExecution (agent_tool_executions)
 */
export const agentToolExecutions = pgTable("agent_tool_executions", {
  executionId: varchar("execution_id", { length: 64 }).primaryKey(),
  sessionId: varchar("session_id", { length: 64 })
    .notNull()
    .references(() => agentSessions.sessionId),
  workspaceId: varchar("workspace_id", { length: 64 })
    .notNull()
    .references(() => merchantWorkspaces.workspaceId),
  policyId: varchar("policy_id", { length: 64 })
    .notNull()
    .references(() => policyRules.policyId),
  approvedByOperatorId: varchar("approved_by_operator_id", { length: 64 }).references(
    () => operatorUsers.operatorId
  ),
  paypalRequestId: varchar("paypal_request_id", { length: 128 }).notNull().unique(),
  mcpToolName: varchar("mcp_tool_name", { length: 64 }).notNull(),
  validatedInputJson: jsonb("validated_input_json").notNull(),
  policyVerdict: varchar("policy_verdict", { length: 32 }).notNull(),
  reasonCode: varchar("reason_code", { length: 64 }).notNull().default("RC_OK_POLICY_PASSED"),
  junodbLeaseStatus: varchar("junodb_lease_status", { length: 32 }).notNull().default("ACQUIRED"),
  injectionScore: numeric("injection_score", { precision: 4, scale: 3 })
    .notNull()
    .default("0.000"),
  gnnRiskScore: numeric("gnn_risk_score", { precision: 4, scale: 3 }).notNull().default("0.000"),
  amountValue: varchar("amount_value", { length: 32 }),
  currencyCode: varchar("currency_code", { length: 8 }),
  paypalHttpStatus: integer("paypal_http_status"),
  paypalResponseJson: jsonb("paypal_response_json"),
  operatorSignature: text("operator_signature"),
  latencyMs: integer("latency_ms").notNull().default(0),
  version: integer("version").notNull().default(1),
  executedAt: timestamp("executed_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * E-06: PayPalOrderRecord (paypal_order_records)
 */
export const paypalOrderRecords = pgTable("paypal_order_records", {
  orderRecordId: uuid("order_record_id").defaultRandom().primaryKey(),
  workspaceId: varchar("workspace_id", { length: 64 })
    .notNull()
    .references(() => merchantWorkspaces.workspaceId),
  paypalOrderId: varchar("paypal_order_id", { length: 64 }).notNull().unique(),
  paypalCaptureId: varchar("paypal_capture_id", { length: 64 }),
  paypalRequestId: varchar("paypal_request_id", { length: 128 }).notNull(),
  intent: varchar("intent", { length: 16 }).notNull().default("CAPTURE"),
  status: varchar("status", { length: 24 }).notNull().default("CREATED"),
  amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
  currencyCode: varchar("currency_code", { length: 8 }).notNull(),
  buyerHash: char("buyer_hash", { length: 64 }).notNull(),
  fastlaneAccelerated: boolean("fastlane_accelerated").notNull().default(false),
  carrierCode: varchar("carrier_code", { length: 32 }),
  trackingNumber: varchar("tracking_number", { length: 64 }),
  shipmentTrackingStatus: varchar("shipment_tracking_status", { length: 24 })
    .notNull()
    .default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * E-07: PayPalInvoiceRecord (paypal_invoice_records)
 */
export const paypalInvoiceRecords = pgTable("paypal_invoice_records", {
  invoiceRecordId: uuid("invoice_record_id").defaultRandom().primaryKey(),
  workspaceId: varchar("workspace_id", { length: 64 })
    .notNull()
    .references(() => merchantWorkspaces.workspaceId),
  paypalInvoiceId: varchar("paypal_invoice_id", { length: 64 }).notNull().unique(),
  invoiceNumber: varchar("invoice_number", { length: 64 }).notNull(),
  recipientHash: char("recipient_hash", { length: 64 }).notNull(),
  recipientEmail: varchar("recipient_email", { length: 160 }).notNull(),
  amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
  currencyCode: varchar("currency_code", { length: 8 }).notNull(),
  dueDate: date("due_date").notNull(),
  qrCodeUri: text("qr_code_uri").notNull(),
  dunningState: varchar("dunning_state", { length: 32 }).notNull().default("SENT"),
  conditionalRulesJson: jsonb("conditional_rules_json").notNull().default({}),
  recurringSeriesId: varchar("recurring_series_id", { length: 64 }),
  pyusdTxSignature: varchar("pyusd_tx_signature", { length: 128 }),
  lastReminderSentAt: timestamp("last_reminder_sent_at", { withTimezone: true }),
  idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * E-08: PayPalDisputeCase (paypal_dispute_cases)
 */
export const paypalDisputeCases = pgTable("paypal_dispute_cases", {
  disputeCaseId: uuid("dispute_case_id").defaultRandom().primaryKey(),
  workspaceId: varchar("workspace_id", { length: 64 })
    .notNull()
    .references(() => merchantWorkspaces.workspaceId),
  paypalOrderId: varchar("paypal_order_id", { length: 64 }).notNull(),
  paypalDisputeId: varchar("paypal_dispute_id", { length: 64 }).notNull().unique(),
  reasonCode: varchar("reason_code", { length: 64 }).notNull(),
  disputedAmountMinor: bigint("disputed_amount_minor", { mode: "number" }).notNull(),
  currencyCode: varchar("currency_code", { length: 8 }).notNull(),
  responseDeadline: timestamp("response_deadline", { withTimezone: true }).notNull(),
  shipmentTrackingProofJson: jsonb("shipment_tracking_proof_json").notNull().default({}),
  gnnRiskScore: numeric("gnn_risk_score", { precision: 4, scale: 3 }).notNull().default("0.000"),
  gnnReasonCodesJson: jsonb("gnn_reason_codes_json").notNull().default([]),
  evidenceBundleJson: jsonb("evidence_bundle_json").notNull().default({}),
  agentAction: varchar("agent_action", { length: 48 }).notNull().default("PENDING"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * E-09: SubscriptionPlanRecord (subscription_plan_records)
 */
export const subscriptionPlanRecords = pgTable("subscription_plan_records", {
  subscriptionRecordId: uuid("subscription_record_id").defaultRandom().primaryKey(),
  workspaceId: varchar("workspace_id", { length: 64 })
    .notNull()
    .references(() => merchantWorkspaces.workspaceId),
  paypalProductId: varchar("paypal_product_id", { length: 64 }).notNull(),
  paypalPlanId: varchar("paypal_plan_id", { length: 64 }).notNull().unique(),
  paypalSubscriptionId: varchar("paypal_subscription_id", { length: 64 }).notNull().unique(),
  planName: varchar("plan_name", { length: 140 }).notNull(),
  billingCycleCadence: varchar("billing_cycle_cadence", { length: 24 }).notNull(),
  recurringAmountMinor: bigint("recurring_amount_minor", { mode: "number" }).notNull(),
  currencyCode: varchar("currency_code", { length: 8 }).notNull(),
  subscriberStatus: varchar("subscriber_status", { length: 24 }).notNull().default("ACTIVE"),
  churnRescueState: varchar("churn_rescue_state", { length: 24 }).notNull().default("HEALTHY"),
  nextBillingAt: timestamp("next_billing_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * E-10: ImmutableAuditLog (immutable_audit_logs)
 * @canonical E-10 · E-06 tamper-evident hash-chained ledger
 */
export const immutableAuditLogs = pgTable("immutable_audit_logs", {
  auditSeq: bigserial("audit_seq", { mode: "number" }).primaryKey(),
  logId: varchar("log_id", { length: 64 }).notNull().unique(),
  workspaceId: varchar("workspace_id", { length: 64 })
    .notNull()
    .references(() => merchantWorkspaces.workspaceId),
  executionId: varchar("execution_id", { length: 64 }).references(
    () => agentToolExecutions.executionId
  ),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  actorId: varchar("actor_id", { length: 64 }).notNull(),
  paypalRequestId: varchar("paypal_request_id", { length: 128 }).notNull(),
  policyVerdict: varchar("policy_verdict", { length: 64 }).notNull(),
  redactedPayloadJson: jsonb("redacted_payload_json").notNull(),
  prevHash: char("prev_hash", { length: 64 }).notNull(),
  entryHash: char("entry_hash", { length: 64 }).notNull().unique(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});
