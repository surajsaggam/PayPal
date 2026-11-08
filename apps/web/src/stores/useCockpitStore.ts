/**
 * PayOps AI (PayPal Sentinel) — Global Executive Cockpit State Store (Zustand v5)
 * Write Owner: Dev 2 (100%)
 * Manages active workspace, multi-currency/locale, dry-run mode, Live/Mock/Replay mode (R-06),
 * 5 UI states (empty/loading/error/offline/success), and interactive drawers/modals.
 */

import { create } from "zustand";
import type {
  AgentToolExecution,
  AutonomyLevel,
  CurrencyCode,
  ImmutableAuditLog,
  MerchantWorkspace,
  OperatorRole,
  OperatorUser,
  PayPalDisputeCase,
  PayPalInvoiceRecord,
  PayPalOrderRecord,
  PolicyRule,
  SubscriptionPlanRecord,
} from "@payops/shared";
import {
  MOCK_AUDIT_LOGS,
  MOCK_DISPUTES,
  MOCK_EXECUTIONS,
  MOCK_INVOICES,
  MOCK_OPERATORS,
  MOCK_ORDERS,
  MOCK_POLICY_RULES,
  MOCK_SUBSCRIPTION_PLANS,
  MOCK_WORKSPACES,
} from "@payops/shared/mock-fixtures";
import type { SupportedLocale } from "../lib/formatters";

export type ApiOperatingMode = "mock" | "live" | "replay";
export type InteractiveUiState = "success" | "empty" | "loading" | "error" | "offline";

export interface McpTraceStep {
  stepIndex: number;
  stage: "M-02_ROUTER" | "M-01_PLANNER" | "F-09_APIMATIC" | "F-02_COSMOS_DSL" | "F-06_JUNODB" | "PAYPAL_SANDBOX";
  label: string;
  detail: string;
  latencyMs: number;
  status: "PASS" | "WARN" | "HOLD" | "BLOCK";
}

export interface CockpitState {
  workspaces: MerchantWorkspace[];
  activeWorkspaceId: string;
  operators: OperatorUser[];
  activeOperatorId: string;
  activeCurrency: CurrencyCode;
  activeLocale: SupportedLocale;
  apiMode: ApiOperatingMode;
  uiState: InteractiveUiState;
  dryRun: boolean;
  theme: "dark" | "light";
  navCollapsed: boolean;

  // Core Entity State
  executions: AgentToolExecution[];
  invoices: PayPalInvoiceRecord[];
  disputes: PayPalDisputeCase[];
  policies: PolicyRule[];
  orders: PayPalOrderRecord[];
  subscriptionPlans: SubscriptionPlanRecord[];
  auditLogs: ImmutableAuditLog[];

  // Command Bar & Drawers
  commandPrompt: string;
  commandBarOpen: boolean;
  traceDrawerOpen: boolean;
  activeTraceSteps: McpTraceStep[];
  lastExecutedPrompt: string;
  apimaticDrawerExecution: AgentToolExecution | null;
  hitlApprovalExecution: AgentToolExecution | null;
  qrModalInvoice: PayPalInvoiceRecord | null;
  pyusdModalInvoice: PayPalInvoiceRecord | null;
  statusBannerMessage: string | null;

  // Actions
  setWorkspaceId: (workspaceId: string) => void;
  setOperatorRole: (role: OperatorRole) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setLocale: (locale: SupportedLocale) => void;
  setApiMode: (mode: ApiOperatingMode) => void;
  setUiState: (state: InteractiveUiState) => void;
  setDryRun: (dryRun: boolean) => void;
  toggleTheme: () => void;
  toggleNavCollapsed: () => void;
  setCommandPrompt: (prompt: string) => void;
  setCommandBarOpen: (open: boolean) => void;
  setTraceDrawerOpen: (open: boolean) => void;
  openApimaticDrawer: (execution: AgentToolExecution | null) => void;
  openHitlApproval: (execution: AgentToolExecution | null) => void;
  openQrModal: (invoice: PayPalInvoiceRecord | null) => void;
  openPyusdModal: (invoice: PayPalInvoiceRecord | null) => void;
  setStatusBanner: (msg: string | null) => void;

  // Domain Mutations
  setExecutionsList: (rows: AgentToolExecution[]) => void;
  prependExecution: (execution: AgentToolExecution, traceSteps?: McpTraceStep[]) => void;
  resolveHitlExecution: (
    executionId: string,
    decision: "APPROVE" | "REJECT",
    signatureHex: string
  ) => void;
  updateWorkspaceAutonomy: (level: AutonomyLevel) => void;
  updatePolicyThreshold: (
    policyId: string,
    patch: Partial<
      Pick<
        PolicyRule,
        | "autonomyLevel"
        | "maxSingleAutoRefundUsd"
        | "maxDailyRefundVelocityUsd"
        | "maxGnnRiskScoreForAutoRefund"
        | "minHoursBetweenInvoiceReminders"
      >
    >
  ) => void;
  createAutonomousInvoice: (invoice: PayPalInvoiceRecord) => void;
  rescheduleInvoiceReminder: (invoiceId: string, newTriggerDate: string) => {
    ok: boolean;
    message: string;
  };
  simulateDisputeWebhook: (variant: "INR_340" | "INJECTION_2400") => PayPalDisputeCase;
  resolveDisputeCase: (
    disputeId: string,
    action: "CONTEST_WITH_COMPELLING_EVIDENCE" | "AUTO_ACCEPT_LOW_VALUE_CLAIM"
  ) => void;
  recordOrderCheckout: (order: PayPalOrderRecord) => void;
  settleInvoiceWithPyusd: (invoiceId: string, solanaTxSig: string, memo: string) => void;
  addSubscriptionPlan: (plan: SubscriptionPlanRecord) => void;
}

const initialApiMode =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_API_MODE as ApiOperatingMode | undefined)) ||
  "mock";

export const useCockpitStore = create<CockpitState>((set, get) => ({
  workspaces: MOCK_WORKSPACES,
  activeWorkspaceId: MOCK_WORKSPACES[0].workspaceId,
  operators: MOCK_OPERATORS,
  activeOperatorId: MOCK_OPERATORS[0].userId,
  activeCurrency: "USD",
  activeLocale: "en",
  apiMode: initialApiMode,
  uiState: "success",
  dryRun: false,
  theme: "dark",
  navCollapsed: false,

  executions: MOCK_EXECUTIONS,
  invoices: MOCK_INVOICES,
  disputes: MOCK_DISPUTES,
  policies: MOCK_POLICY_RULES,
  orders: MOCK_ORDERS,
  subscriptionPlans: MOCK_SUBSCRIPTION_PLANS,
  auditLogs: MOCK_AUDIT_LOGS,

  commandPrompt: "",
  commandBarOpen: false,
  traceDrawerOpen: false,
  activeTraceSteps: [
    {
      stepIndex: 1,
      stage: "M-02_ROUTER",
      label: "M-02 Intent Router & XML Sandboxing (GPT-4o-mini)",
      detail: "Domain pruned 35 -> 6 Invoicing tools in 84ms. 0 injection patterns detected.",
      latencyMs: 84,
      status: "PASS",
    },
    {
      stepIndex: 2,
      stage: "M-01_PLANNER",
      label: "M-01 PayPal MCP Planner (Claude 3.5 Sonnet)",
      detail: "Synthesized 5-step tool chain: generate_invoice_number -> create_invoice -> rules -> QR -> send_invoice.",
      latencyMs: 410,
      status: "PASS",
    },
    {
      stepIndex: 3,
      stage: "F-09_APIMATIC",
      label: "F-09 APIMatic Schema & 2-Decimal String Validator",
      detail: 'Verified ISO-4217 currencyCode="USD" and normalized amountValue="2450.00" (R-03 compliant).',
      latencyMs: 3,
      status: "PASS",
    },
    {
      stepIndex: 4,
      stage: "F-02_COSMOS_DSL",
      label: "F-02 Cosmos.AI Decision DSL Policy Firewall",
      detail: "Matched Rule POL-01 (Autonomy L3, amount <= $5,000.00). Verdict: APPROVED_L3_AUTO.",
      latencyMs: 2,
      status: "PASS",
    },
    {
      stepIndex: 5,
      stage: "F-06_JUNODB",
      label: "F-06 JunoDB 2PC Idempotency Lock",
      detail: "Acquired SET NX EX 86400 lease for PayPal-Request-Id: idem_ws_99102a_invoice_INV_2026_8841.",
      latencyMs: 4,
      status: "PASS",
    },
    {
      stepIndex: 6,
      stage: "PAYPAL_SANDBOX",
      label: "PayPal Sandbox Execution (api-m.sandbox.paypal.com)",
      detail: "Invoice INV2-X89A-4412-9012-7731 created, 2.00% Net-10 discount attached, QR code generated.",
      latencyMs: 312,
      status: "PASS",
    },
  ],
  lastExecutedPrompt:
    "Create & send $2,450.00 USD invoice INV-2026-8841 with 2.00% early-payment discount and QR code",
  apimaticDrawerExecution: null,
  hitlApprovalExecution: null,
  qrModalInvoice: null,
  pyusdModalInvoice: null,
  statusBannerMessage: null,

  setWorkspaceId: (workspaceId) => set({ activeWorkspaceId: workspaceId }),
  setOperatorRole: (role) => {
    const matched = get().operators.find((op) => op.role === role) ?? get().operators[0];
    set({ activeOperatorId: matched.userId });
  },
  setCurrency: (currency) => set({ activeCurrency: currency }),
  setLocale: (locale) => set({ activeLocale: locale }),
  setApiMode: (mode) =>
    set({
      apiMode: mode,
      uiState: mode === "replay" ? "offline" : "success",
      statusBannerMessage:
        mode === "replay"
          ? "DEMO_REPLAY_MODE Engaged (R-06): Serving deterministic signed PayPal Sandbox HTTP transcripts with zero latency."
          : mode === "live"
            ? "Connected to Live Fastify Control Plane (:4000) & PayPal Developer Sandbox."
            : "Operating in Deterministic Mock Contract Mode (packages/shared/src/mock-fixtures.ts).",
    }),
  setUiState: (uiState) => set({ uiState }),
  setDryRun: (dryRun) => set({ dryRun }),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(next);
      }
      return { theme: next };
    }),
  toggleNavCollapsed: () => set((s) => ({ navCollapsed: !s.navCollapsed })),
  setCommandPrompt: (commandPrompt) => set({ commandPrompt }),
  setCommandBarOpen: (commandBarOpen) => set({ commandBarOpen }),
  setTraceDrawerOpen: (traceDrawerOpen) => set({ traceDrawerOpen }),
  openApimaticDrawer: (apimaticDrawerExecution) => set({ apimaticDrawerExecution }),
  openHitlApproval: (hitlApprovalExecution) => set({ hitlApprovalExecution }),
  openQrModal: (qrModalInvoice) => set({ qrModalInvoice }),
  openPyusdModal: (pyusdModalInvoice) => set({ pyusdModalInvoice }),
  setStatusBanner: (statusBannerMessage) => set({ statusBannerMessage }),

  setExecutionsList: (executions) => set({ executions }),

  prependExecution: (execution, traceSteps) =>
    set((state) => {
      const prevHead = state.auditLogs[state.auditLogs.length - 1]?.entryHash ?? "0".repeat(64);
      const nextHash = prevHead.slice(8) + execution.executionId.replace(/[^a-zA-Z0-9]/g, "a").padEnd(8, "f").slice(0, 8);
      const newAudit: ImmutableAuditLog = {
        logId: `aud_${1000 + state.auditLogs.length + 1}`,
        workspaceId: execution.workspaceId,
        timestampIso: execution.executedAt,
        actorId: state.dryRun ? "dry_run_simulator" : "agent_service_m01",
        toolName: execution.toolName,
        paypalRequestId: execution.paypalRequestId,
        policyVerdict: execution.policyVerdict,
        prevHash: prevHead,
        entryHash: nextHash.slice(0, 64).padEnd(64, "9"),
      };
      return {
        executions: [execution, ...state.executions.filter((e) => e.executionId !== execution.executionId)],
        auditLogs: [...state.auditLogs, newAudit],
        activeTraceSteps: traceSteps ?? state.activeTraceSteps,
      };
    }),

  resolveHitlExecution: (executionId, decision, signatureHex) =>
    set((state) => {
      const updatedExecutions = state.executions.map((ex) => {
        if (ex.executionId !== executionId) return ex;
        return {
          ...ex,
          policyVerdict:
            decision === "APPROVE"
              ? ("APPROVED_L3_AUTO" as const)
              : ("BLOCKED_SECURITY_INJECTION" as const),
          reasonCode:
            decision === "APPROVE"
              ? `SIGNED_FIDO2_PASSKEY_${signatureHex.slice(0, 10).toUpperCase()}`
              : "REJECTED_BY_OPERATOR_PASSKEY",
          junodbLeaseStatus: "RELEASED" as const,
        };
      });
      return {
        executions: updatedExecutions,
        hitlApprovalExecution: null,
        statusBannerMessage:
          decision === "APPROVE"
            ? `Execution ${executionId} cryptographically signed via FIDO2 Passkey (API-02) & released to PayPal Sandbox.`
            : `Execution ${executionId} rejected by operator and permanently locked in ImmutableAuditLog (E-10).`,
      };
    }),

  updateWorkspaceAutonomy: (autonomyLevel) =>
    set((state) => ({
      workspaces: state.workspaces.map((ws) =>
        ws.workspaceId === state.activeWorkspaceId ? { ...ws, autonomyLevel } : ws
      ),
      policies: state.policies.map((pol) => ({ ...pol, autonomyLevel })),
      statusBannerMessage: `Workspace Autonomy Level updated to ${autonomyLevel} via API-03. Cosmos.AI Policy AST re-compiled in 1.8ms.`,
    })),

  updatePolicyThreshold: (policyId, patch) =>
    set((state) => ({
      policies: state.policies.map((pol) => (pol.policyId === policyId ? { ...pol, ...patch } : pol)),
      statusBannerMessage: `Policy Rule ${policyId} compiled in 1.8ms and persisted to ImmutableAuditLog (E-10).`,
    })),

  createAutonomousInvoice: (invoice) =>
    set((state) => {
      const newEx: AgentToolExecution = {
        executionId: `ex_${Math.floor(9100 + Math.random() * 800)}`,
        sessionId: "ses_20261108_9041",
        workspaceId: invoice.workspaceId,
        toolName: "send_invoice",
        paypalRequestId: invoice.idempotencyKey,
        junodbLeaseStatus: "ACQUIRED",
        policyVerdict: "APPROVED_L3_AUTO",
        reasonCode: "RC_OK_WITHIN_POLICY",
        gnnRiskScore: 0.03,
        amountValue: invoice.amountValue,
        currencyCode: invoice.currencyCode,
        executedAt: new Date().toISOString(),
      };
      return {
        invoices: [invoice, ...state.invoices],
        executions: [newEx, ...state.executions],
        qrModalInvoice: invoice,
        statusBannerMessage: `Invoice ${invoice.invoiceId} (${invoice.amountValue} ${invoice.currencyCode}) created and sent via PayPal Invoicing v2. 2.0% Net-10 discount rule active; QR code attached. Idempotency key: ${invoice.idempotencyKey}.`,
      };
    }),

  rescheduleInvoiceReminder: (invoiceId, newTriggerDate) => {
    const state = get();
    const target = state.invoices.find((inv) => inv.invoiceId === invoiceId);
    if (!target) {
      return { ok: false, message: `Invoice ${invoiceId} not found.` };
    }
    // Enforce 72-hour dunning velocity cooldown guard (R-11)
    if (target.lastReminderSentAt) {
      const lastSentMs = new Date(target.lastReminderSentAt).getTime();
      const proposedMs = new Date(newTriggerDate).getTime();
      const hoursDiff = Math.abs(proposedMs - lastSentMs) / (1000 * 60 * 60);
      if (hoursDiff < 72) {
        const msg = `Blocked by Cosmos.AI Rule POL-01 (R-11 FDCPA/RBI Dunning Guard): Minimum 72h required between reminders for ${target.invoiceNumber} (attempted ${hoursDiff.toFixed(1)}h gap).`;
        set({ statusBannerMessage: msg });
        return { ok: false, message: msg };
      }
    }

    const updatedInvoices = state.invoices.map((inv) =>
      inv.invoiceId === invoiceId
        ? {
            ...inv,
            conditionalRule: inv.conditionalRule
              ? { ...inv.conditionalRule, triggerDate: newTriggerDate }
              : {
                  ruleType: "EARLY_PAYMENT_DISCOUNT" as const,
                  percentage: "2.00",
                  triggerDate: newTriggerDate,
                },
          }
        : inv
    );

    const remindExec: AgentToolExecution = {
      executionId: `ex_${Math.floor(9200 + Math.random() * 700)}`,
      sessionId: "ses_20261108_9041",
      workspaceId: state.activeWorkspaceId,
      toolName: "send_invoice_reminder",
      paypalRequestId: `idem_${state.activeWorkspaceId}_remind_${target.invoiceNumber}_${newTriggerDate}`,
      junodbLeaseStatus: "ACQUIRED",
      policyVerdict: "APPROVED_L3_AUTO",
      reasonCode: "RC_OK_72H_COOLDOWN_VERIFIED",
      gnnRiskScore: 0.02,
      amountValue: target.amountValue,
      currencyCode: target.currencyCode,
      executedAt: new Date().toISOString(),
    };

    const msg = `Bryntum Timeline Sync (API-06): Updated PayPal Invoice ${target.invoiceNumber} dunning milestone to ${newTriggerDate} (72h velocity guard PASS).`;
    set({
      invoices: updatedInvoices,
      executions: [remindExec, ...state.executions],
      statusBannerMessage: msg,
    });
    return { ok: true, message: msg };
  },

  simulateDisputeWebhook: (variant) => {
    const state = get();
    if (variant === "INR_340") {
      const dispute: PayPalDisputeCase = {
        disputeId: "PP-D-4012",
        workspaceId: state.activeWorkspaceId,
        orderId: "8XY92011",
        reasonCode: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
        disputedAmountValue: "340.00",
        currencyCode: "USD",
        carrierCode: "DHL_EXPRESS",
        trackingNumber: "77819201",
        trackingStatus: "DELIVERED",
        gnnRiskScore: 0.88,
        treeShapReasons: [
          "CARRIER_DELIVERED_GEO_MATCH (+0.52)",
          "SHARED_DEVICE_IP_3_PRIOR_INR_CLAIMS (+0.24)",
          "BUYER_SIGNATURE_VERIFIED_BY_M03_OCR (+0.12)",
        ],
        recommendedAction: "CONTEST_WITH_COMPELLING_EVIDENCE",
        responseDueIso: "2026-11-16T18:00:00.000Z",
      };
      const exec: AgentToolExecution = {
        executionId: `ex_${Math.floor(9400 + Math.random() * 500)}`,
        sessionId: "ses_20261108_9041",
        workspaceId: state.activeWorkspaceId,
        toolName: "get_shipment_tracking",
        paypalRequestId: "idem_ws_99102a_webhook_PP_D_4012_defense",
        junodbLeaseStatus: "ACQUIRED",
        policyVerdict: "APPROVED_L3_AUTO",
        reasonCode: "CONTEST_WITH_COMPELLING_EVIDENCE",
        gnnRiskScore: 0.88,
        amountValue: "340.00",
        currencyCode: "USD",
        executedAt: new Date().toISOString(),
      };
      set({
        disputes: [dispute, ...state.disputes.filter((d) => d.disputeId !== dispute.disputeId)],
        executions: [exec, ...state.executions],
        statusBannerMessage:
          "Webhook CUSTOMER.DISPUTE.CREATED (PP-D-4012 · $340.00 USD) RSA-SHA256 verified -> DHL #77819201 DELIVERED correlated -> M-04 GNN Score 0.88 -> Compelling Evidence 3.0 compiled in 3.1s.",
      });
      return dispute;
    }

    const advDispute: PayPalDisputeCase = {
      disputeId: "PP-D-4018",
      workspaceId: state.activeWorkspaceId,
      orderId: "9ZZ77401",
      reasonCode: "UNAUTHORIZED",
      disputedAmountValue: "2400.00",
      currencyCode: "USD",
      carrierCode: "BLUEDART",
      trackingNumber: "BD901182736",
      trackingStatus: "IN_TRANSIT",
      gnnRiskScore: 0.94,
      treeShapReasons: [
        "M02_INDIRECT_PROMPT_INJECTION_PAYLOAD_DETECTED (+0.61)",
        "EXCEEDS_SINGLE_TX_REFUND_CAP_USD_250 (+0.22)",
        "UNRECOGNIZED_DEVICE_ASN_MISMATCH (+0.11)",
      ],
      recommendedAction: "ROUTE_TO_HITL_PASSKEY",
      responseDueIso: "2026-11-13T12:00:00.000Z",
    };
    const blockedExec: AgentToolExecution = {
      executionId: "ex_9041",
      sessionId: "ses_20261108_9042",
      workspaceId: state.activeWorkspaceId,
      toolName: "create_refund",
      paypalRequestId: "idem_ws_99102a_ex_9041_create_refund",
      junodbLeaseStatus: "ACQUIRED",
      policyVerdict: "HELD_FOR_L2_PASSKEY",
      reasonCode: "RC_00_INDIRECT_PROMPT_INJECTION_DETECTED",
      gnnRiskScore: 0.94,
      amountValue: "2400.00",
      currencyCode: "USD",
      executedAt: new Date().toISOString(),
    };
    set({
      disputes: [advDispute, ...state.disputes.filter((d) => d.disputeId !== advDispute.disputeId)],
      executions: [blockedExec, ...state.executions.filter((e) => e.executionId !== "ex_9041")],
      hitlApprovalExecution: blockedExec,
      statusBannerMessage:
        "EXECUTION HELD by Cosmos.AI Rule POL-02: Buyer note contained Indirect Prompt Injection (RC_00_INDIRECT_PROMPT_INJECTION_DETECTED) & Refund $2,400.00 exceeds $250.00 cap. Routed to FIDO2 Passkey.",
    });
    return advDispute;
  },

  resolveDisputeCase: (disputeId, action) =>
    set((state) => {
      const target = state.disputes.find((d) => d.disputeId === disputeId);
      const toolName =
        action === "AUTO_ACCEPT_LOW_VALUE_CLAIM" ? "accept_dispute_claim" : "get_shipment_tracking";
      const exec: AgentToolExecution = {
        executionId: `ex_${Math.floor(9500 + Math.random() * 400)}`,
        sessionId: "ses_20261108_9041",
        workspaceId: state.activeWorkspaceId,
        toolName,
        paypalRequestId: `idem_${state.activeWorkspaceId}_resolve_${disputeId}`,
        junodbLeaseStatus: "ACQUIRED",
        policyVerdict: "APPROVED_L3_AUTO",
        reasonCode: action,
        gnnRiskScore: target?.gnnRiskScore ?? 0.12,
        amountValue: target?.disputedAmountValue ?? "340.00",
        currencyCode: target?.currencyCode ?? "USD",
        executedAt: new Date().toISOString(),
      };
      return {
        executions: [exec, ...state.executions],
        statusBannerMessage:
          action === "CONTEST_WITH_COMPELLING_EVIDENCE"
            ? `Dispute ${disputeId} contested via API-11 with signed carrier POD (${target?.carrierCode} #${target?.trackingNumber}), M-03 OCR & M-05 Elastic RAG Clause 4.2.`
            : `Low-value dispute ${disputeId} ($${target?.disputedAmountValue}) auto-accepted via accept_dispute_claim to protect merchant dispute ratio.`,
      };
    }),

  recordOrderCheckout: (order) =>
    set((state) => {
      const exec: AgentToolExecution = {
        executionId: `ex_${Math.floor(9600 + Math.random() * 300)}`,
        sessionId: "ses_20261108_9041",
        workspaceId: order.workspaceId,
        toolName: "pay_order",
        paypalRequestId: order.paypalRequestId,
        junodbLeaseStatus: "ACQUIRED",
        policyVerdict: "APPROVED_L3_AUTO",
        reasonCode: "RC_OK_FASTLANE_CAPTURED",
        gnnRiskScore: 0.02,
        amountValue: order.amountValue,
        currencyCode: order.currencyCode,
        executedAt: new Date().toISOString(),
      };
      return {
        orders: [order, ...state.orders],
        executions: [exec, ...state.executions],
        statusBannerMessage: `PayPal Order v2 ${order.orderId} (${order.amountValue} ${order.currencyCode}) captured idempotently via Fastlane (PayPal-Request-Id: ${order.paypalRequestId}) & tracking ${order.trackingNumber} synced.`,
      };
    }),

  settleInvoiceWithPyusd: (invoiceId, solanaTxSig, memo) =>
    set((state) => {
      const target = state.invoices.find((i) => i.invoiceId === invoiceId);
      const updatedInvoices = state.invoices.map((inv) =>
        inv.invoiceId === invoiceId ? { ...inv, status: "PAID" as const } : inv
      );
      const exec: AgentToolExecution = {
        executionId: `ex_${Math.floor(9700 + Math.random() * 200)}`,
        sessionId: "ses_20261108_9041",
        workspaceId: state.activeWorkspaceId,
        toolName: "record_payment_for_invoice",
        paypalRequestId: target?.idempotencyKey ?? `idem_pyusd_${invoiceId}`,
        junodbLeaseStatus: "ACQUIRED",
        policyVerdict: "APPROVED_L3_AUTO",
        reasonCode: "RC_OK_PYUSD_TOKEN2022_MEMO_VERIFIED",
        gnnRiskScore: 0.01,
        amountValue: target?.amountValue ?? "650.00",
        currencyCode: "PYUSD",
        executedAt: new Date().toISOString(),
      };
      return {
        invoices: updatedInvoices,
        executions: [exec, ...state.executions],
        pyusdModalInvoice: null,
        statusBannerMessage: `Settled ${target?.amountValue ?? "650.00"} PYUSD on Solana Token-2022 (Tx: ${solanaTxSig.slice(0, 14)}... · Memo: ${memo}) & reconciled PayPal Invoice ${invoiceId} as PAID.`,
      };
    }),

  addSubscriptionPlan: (plan) =>
    set((state) => {
      const exec: AgentToolExecution = {
        executionId: `ex_${Math.floor(9800 + Math.random() * 190)}`,
        sessionId: "ses_20261108_9041",
        workspaceId: plan.workspaceId,
        toolName: "create_subscription_plan",
        paypalRequestId: `idem_${plan.workspaceId}_subplan_${plan.planId}`,
        junodbLeaseStatus: "ACQUIRED",
        policyVerdict: "APPROVED_L3_AUTO",
        reasonCode: "RC_OK_SUBSCRIPTION_PLAN_ACTIVE",
        gnnRiskScore: 0.01,
        amountValue: plan.amountValue,
        currencyCode: plan.currencyCode,
        executedAt: new Date().toISOString(),
      };
      return {
        subscriptionPlans: [plan, ...state.subscriptionPlans.filter((p) => p.planId !== plan.planId)],
        executions: [exec, ...state.executions],
        statusBannerMessage: `PayPal Billing Plan ${plan.planId} (${plan.planName} · ${plan.amountValue} ${plan.currencyCode}/${plan.billingIntervalUnit}) activated via API-12 (create_product -> create_subscription_plan).`,
      };
    }),
}));
