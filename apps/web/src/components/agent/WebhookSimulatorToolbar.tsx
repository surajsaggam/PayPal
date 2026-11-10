"use client";

/**
 * PayOps AI (PayPal Sentinel) — Autonomous CFO Workflows & Judge Resilience Simulator
 * Separates real CFO business actions from Judge/Chaos simulation controls (R-4).
 */

import React from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  ShieldAlert,
  PlayCircle,
  RotateCcw,
  WifiOff,
  CalendarClock,
  CheckCircle2,
  QrCode,
  Swords,
  Coins,
  Check,
  ShieldCheck,
  ArrowUpRight,
  FlaskConical,
} from "lucide-react";
import {
  MOCK_GUIDED_DEMO_SCENARIOS,
  type GuidedDemoScenario,
} from "@payops/shared/mock-fixtures";
import {
  createAutonomousSmartInvoice,
  sendOrRescheduleInvoiceReminder,
  simulatePayPalWebhook,
  simulateUpstreamHttp429CircuitBreaker,
} from "../../lib/api-client";
import { useCockpitStore } from "../../stores/useCockpitStore";

function formatReadableToolName(toolName?: string): {
  title: string;
  category: string;
  summary: string;
} {
  switch (toolName) {
    case "create_invoice":
    case "send_invoice":
    case "generate_invoice_qr_code":
      return {
        title: "Smart Invoice & Early-Pay Discount",
        category: "Accounts Receivable",
        summary: "Automatically generated invoice with a 2% Net-10 discount and QR payment link.",
      };
    case "send_invoice_reminder":
      return {
        title: "Scheduled Payment Reminder",
        category: "Receivables Schedule",
        summary: "Friendly customer reminder scheduled with 72-hour quiet-period protection.",
      };
    case "create_refund":
      return {
        title: "Customer Refund Request",
        category: "Refund Protection",
        summary: "Evaluated against your spending limits and fraud risk rules before payout.",
      };
    case "get_dispute":
    case "provide_dispute_evidence":
    case "accept_dispute_claim":
      return {
        title: "Automated Dispute Defense",
        category: "Revenue Protection",
        summary: "Matched signed carrier delivery receipt and buyer order history automatically.",
      };
    case "record_payment_for_invoice":
      return {
        title: "Cross-Border PYUSD Settlement",
        category: "Supplier Payouts",
        summary: "Instant supplier invoice settlement completed in 1.2 seconds with zero FX fees.",
      };
    default:
      return {
        title: "Smart Invoice & Early-Pay Discount",
        category: "Accounts Receivable",
        summary: "Automatically generated invoice with a 2% Net-10 discount and QR payment link.",
      };
  }
}

function formatReadableVerdict(verdict?: string): {
  label: string;
  tone: "success" | "warning" | "danger";
} {
  if (verdict === "BLOCKED_SECURITY_INJECTION") {
    return { label: "Blocked by Security Guard", tone: "danger" };
  }
  if (verdict === "HELD_FOR_L2_PASSKEY") {
    return { label: "Held for Passkey Approval", tone: "warning" };
  }
  return { label: "Auto-Approved & Verified", tone: "success" };
}

export function WebhookSimulatorToolbar() {
  const router = useRouter();
  const {
    activeWorkspaceId,
    simulateDisputeWebhook,
    createAutonomousInvoice,
    rescheduleInvoiceReminder,
    openPyusdModal,
    invoices,
    executions,
    setCommandPrompt,
    setTraceDrawerOpen,
    executeGuidedPitchScenario,
    runFullGuidedPitchWalkthrough,
    resetDemoStateToCleanSeed,
    activePitchScenario,
    pitchWalkthroughStep,
    circuitBreakerTripped,
  } = useCockpitStore();

  const latestExec = executions[0];
  const readableOp = formatReadableToolName(latestExec?.toolName);
  const readableVerdict = formatReadableVerdict(latestExec?.policyVerdict);

  const runGuidedScenario = async (scenario: GuidedDemoScenario) => {
    setCommandPrompt(scenario.prompt);
    router.push(scenario.targetRoute);

    if (scenario.scenarioId === "DEMO_1_SMART_INVOICE") {
      const created = await createAutonomousSmartInvoice({
        workspaceId: activeWorkspaceId,
        recipientEmail: "accounts@acmerobotics.example.io",
        amountValue: "1850.00",
        currencyCode: "USD",
        dueDate: "2026-11-22",
        earlyPaymentDiscountPct: "2.00",
        enableRecurringSeries: true,
      });
      createAutonomousInvoice(created);
      executeGuidedPitchScenario(scenario.scenarioId);
      setTraceDrawerOpen(true);
    } else if (scenario.scenarioId === "DEMO_2_DISPUTE_DEFENSE") {
      executeGuidedPitchScenario(scenario.scenarioId);
      setTraceDrawerOpen(true);
    } else if (scenario.scenarioId === "DEMO_3_INJECTION_BLOCK") {
      executeGuidedPitchScenario(scenario.scenarioId);
    } else if (scenario.scenarioId === "DEMO_4_PYUSD_BRIDGE") {
      executeGuidedPitchScenario(scenario.scenarioId);
      const targetInv =
        invoices.find((i) => i.invoiceNumber === "INV-2026-7704") ?? invoices[0];
      if (targetInv) {
        openPyusdModal(targetInv);
      }
    }
  };

  const handleBryntumDunningDragShortcut = async () => {
    router.push("/invoicing-scheduler");
    await sendOrRescheduleInvoiceReminder({
      invoiceId: "INV2-X89A-4412-9012-7731",
      newTriggerDate: "2026-11-15",
    });
    rescheduleInvoiceReminder("INV2-X89A-4412-9012-7731", "2026-11-15");
  };

  return (
    <section aria-label="Autonomous PayPal Rail & Scenario Showcase" className="space-y-4">
      <div className="surface-bento rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Left Column: 5 Clean Core Business Workflows */}
          <div className="space-y-4 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-ink">
                  One-Click Autonomous PayPal Workflows
                </h2>
                <p className="text-xs text-ink-muted">
                  Launch end-to-end invoicing, dispute defense, or supplier payouts.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Run Full 4-Click Guided Pitch Walkthrough (2:52 Choreography)"
                  onClick={() => runFullGuidedPitchWalkthrough()}
                  className="btn-primary-mint px-3 py-1.5 text-xs font-medium cursor-pointer"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  Guided Tour
                </button>
                <button
                  type="button"
                  aria-label="Reset / Re-Seed Clean Demo State (H41 Pitch Reset)"
                  onClick={() => resetDemoStateToCleanSeed()}
                  className="btn-outline-subtle px-2.5 py-1.5 text-xs cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3 text-ink-muted" />
                  Reset Demo
                </button>
              </div>
            </div>

            {/* 5 Core CFO Business Workflow Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Tile 1: Smart Invoice + QR */}
              <button
                type="button"
                onClick={() => void runGuidedScenario(MOCK_GUIDED_DEMO_SCENARIOS[0])}
                className="group flex items-center gap-3.5 rounded-xl border border-hairline/70 bg-elevated/80 p-3.5 text-left transition-all duration-200 ease-spring hover:-translate-y-[1px] hover:border-border-strong hover:bg-elevated hover:shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-mint/40 text-accent-mint-ink shadow-2xs">
                  <QrCode className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-semibold text-ink">1. Smart Invoice &amp; QR</div>
                  <div className="text-[11px] text-ink-muted tabular-nums">$1,850 · 2% Early-Pay Discount</div>
                </div>
              </button>

              {/* Tile 2: Payment Reminder Schedule */}
              <button
                type="button"
                onClick={() => void handleBryntumDunningDragShortcut()}
                className="group flex items-center gap-3.5 rounded-xl border border-hairline/70 bg-elevated/80 p-3.5 text-left transition-all duration-200 ease-spring hover:-translate-y-[1px] hover:border-border-strong hover:bg-elevated hover:shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-status-info-bg text-status-info-text shadow-2xs">
                  <CalendarClock className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-semibold text-ink">2. Payment Reminders</div>
                  <div className="text-[11px] text-ink-muted tabular-nums">72-Hour Customer Quiet Period</div>
                </div>
              </button>

              {/* Tile 3: Dispute Defense */}
              <button
                type="button"
                onClick={() => void runGuidedScenario(MOCK_GUIDED_DEMO_SCENARIOS[1])}
                className="group flex items-center gap-3.5 rounded-xl border border-hairline/70 bg-elevated/80 p-3.5 text-left transition-all duration-200 ease-spring hover:-translate-y-[1px] hover:border-border-strong hover:bg-elevated hover:shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-status-success-bg text-status-success-text shadow-2xs">
                  <Swords className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-semibold text-ink">3. Dispute Protection</div>
                  <div className="text-[11px] text-ink-muted tabular-nums">$340 · Signed Delivery Proof</div>
                </div>
              </button>

              {/* Tile 4: High-Value Refund Gate */}
              <button
                type="button"
                onClick={() => void runGuidedScenario(MOCK_GUIDED_DEMO_SCENARIOS[2])}
                className="group flex items-center gap-3.5 rounded-xl border border-hairline/70 bg-elevated/80 p-3.5 text-left transition-all duration-200 ease-spring hover:-translate-y-[1px] hover:border-border-strong hover:bg-elevated hover:shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-status-warning-bg text-status-warning-text shadow-2xs">
                  <ShieldAlert className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-semibold text-ink">4. High-Value Refund Gate</div>
                  <div className="text-[11px] text-ink-muted tabular-nums">$2,400 · Passkey Approval</div>
                </div>
              </button>

              {/* Tile 5: PYUSD Instant Settlement (Spans 2 columns on desktop for symmetry) */}
              <button
                type="button"
                onClick={() => void runGuidedScenario(MOCK_GUIDED_DEMO_SCENARIOS[3])}
                className="sm:col-span-2 group flex items-center justify-between gap-3.5 rounded-xl border border-hairline/70 bg-elevated/80 p-3.5 text-left transition-all duration-200 ease-spring hover:-translate-y-[1px] hover:border-border-strong hover:bg-elevated hover:shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-subtle text-ink shadow-2xs">
                    <Coins className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-ink">5. Instant PYUSD Supplier Settlement</div>
                    <div className="text-[11px] text-ink-muted tabular-nums">$650 · 1.2s Cross-Border Solana Token-2022 Payout</div>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-ink-muted group-hover:text-ink transition-colors" />
              </button>
            </div>
          </div>

          {/* Right Column: Live Workflow Protection Preview Card */}
          <div className="relative lg:col-span-5">
            <div className="rounded-2xl bg-[#11191F] p-6 pb-14 text-slate-200 shadow-elevated space-y-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
                <span className="font-medium text-slate-300">
                  Live Workflow Protection Preview
                </span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Active Protection
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 space-y-1">
                  <div className="text-[11px] text-slate-400">Current Workflow</div>
                  <div className="font-semibold text-white">{readableOp.title}</div>
                  <div className="text-[11px] text-emerald-400">{readableOp.category}</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 space-y-1">
                  <div className="text-[11px] text-slate-400">Policy Verification</div>
                  <div className="font-semibold text-white">{readableVerdict.label}</div>
                  <div className="text-[11px] text-slate-400">
                    Duplicate-charge lock verified
                  </div>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-300">
                {readableOp.summary}
              </p>
            </div>

            <div className="relative -mt-9 ml-4 mr-2 rounded-xl border border-hairline bg-elevated p-4 shadow-elevated sm:ml-8 transition-transform duration-200 ease-spring hover:-translate-y-[2px]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="kpi-stat-value text-2xl tabular-nums">
                    ${latestExec?.amountValue ?? "1,850.00"}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-status-success-bg text-status-success-text">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    <span className="font-medium text-ink">{readableOp.title}</span>
                    <span>·</span>
                    <span>2PC Idempotent</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-pill border border-status-success-border bg-status-success-bg px-3 py-1 text-xs font-medium text-status-success-text shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Separated Judge & Resilience Chaos Simulator Bar (R-4) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4 text-xs">
          <div className="inline-flex items-center gap-2 text-ink-muted font-medium">
            <FlaskConical className="h-3.5 w-3.5 text-ink-secondary" />
            <span>Judge &amp; Webhook Simulator:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void simulatePayPalWebhook({
                  id: "WH-INR-340-PP-D-4012",
                  event_type: "CUSTOMER.DISPUTE.CREATED",
                  create_time: new Date().toISOString(),
                  resource: { dispute_id: "PP-D-4012", amount: "340.00" },
                });
                simulateDisputeWebhook("INR_340");
              }}
              className="btn-outline-subtle rounded-lg px-3 py-1.5 text-xs tabular-nums cursor-pointer"
            >
              <Zap className="h-3 w-3 text-status-success-bar" />
              <span>Incoming Dispute Webhook ($340)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                void simulatePayPalWebhook({
                  id: "WH-INJ-2400-PP-D-4018",
                  event_type: "CUSTOMER.DISPUTE.CREATED",
                  create_time: new Date().toISOString(),
                  resource: { dispute_id: "PP-D-4018", amount: "2400.00" },
                });
                simulateDisputeWebhook("INJECTION_2400");
              }}
              className="btn-outline-subtle rounded-lg px-3 py-1.5 text-xs tabular-nums cursor-pointer"
            >
              <ShieldAlert className="h-3 w-3 text-status-danger-bar" />
              <span>Prompt-Injection Refund ($2,400)</span>
            </button>

            <button
              type="button"
              aria-label="Simulate HTTP 429 Upstream Rate-Limit -> Auto-Failover (R-06)"
              onClick={() => {
                void simulateUpstreamHttp429CircuitBreaker("/api/v1/agent/execute");
              }}
              className="btn-outline-subtle rounded-lg px-3 py-1.5 text-xs cursor-pointer"
            >
              <WifiOff className="h-3 w-3 text-ink-muted" />
              <span>Test Rate-Limit Failover</span>
            </button>
          </div>
        </div>

        {/* Guided Pitch Choreography & Sandbox Resource ID Callout Strip */}
        {(activePitchScenario || circuitBreakerTripped) && (
          <div
            aria-label="Guided Pitch Choreography & Sandbox Resource ID Callout Strip"
            className="animate-tab-switch flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent-lime-border bg-accent-lime/35 px-4 py-3 text-xs text-ink"
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="badge-lime px-2.5 py-0.5 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {activePitchScenario
                  ? `Guided Tour · Step ${pitchWalkthroughStep} of 4`
                  : "Backup Failover Mode Active"}
              </span>
              <span className="font-medium text-ink">
                {activePitchScenario
                  ? activePitchScenario.title
                  : "High-traffic backup protection is active with zero interrupted payments."}
              </span>
              {activePitchScenario && (
                <span className="text-ink-secondary hidden sm:inline">
                  — {activePitchScenario.expectedOutcome}
                </span>
              )}
            </div>

            {activePitchScenario && (
              <button
                type="button"
                onClick={() => router.push(activePitchScenario.targetRoute)}
                className="btn-outline-subtle rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer"
              >
                <span>Open Screen</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
