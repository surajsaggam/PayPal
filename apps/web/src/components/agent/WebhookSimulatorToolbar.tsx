"use client";

/**
 * PayOps AI (PayPal Sentinel) — 1-Click Judge Webhook Simulator & Guided Demo Control Bar
 * Maps to: API-13 (POST /api/v1/webhooks/paypal), TKT-035, TKT-036, R-06 Demo Replay Fallback, PITCH.md
 * Write Owner: Dev 2 (100%)
 */

import React from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  ShieldAlert,
  PlayCircle,
  Radio,
  RotateCcw,
  WifiOff,
  Award,
  CalendarClock,
  CheckCircle2,
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

export function WebhookSimulatorToolbar() {
  const router = useRouter();
  const {
    activeWorkspaceId,
    simulateDisputeWebhook,
    createAutonomousInvoice,
    rescheduleInvoiceReminder,
    openPyusdModal,
    invoices,
    setCommandPrompt,
    setTraceDrawerOpen,
    executeGuidedPitchScenario,
    runFullGuidedPitchWalkthrough,
    resetDemoStateToCleanSeed,
    activePitchScenario,
    pitchWalkthroughStep,
    lastReplayTranscript,
    circuitBreakerTripped,
    lastFailoverLatencyMs,
  } = useCockpitStore();

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
    <div className="border-b border-slate-800/90 bg-slate-900/95 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-1.5">
        {/* 4 PITCH.md 1-Click Guided Demo Scenarios + 2:52 Full Walkthrough */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-sky-400 mr-0.5">
            <PlayCircle className="h-3.5 w-3.5" />
            Pitch Choreography (TKT-035 · TKT-036):
          </span>

          <button
            type="button"
            aria-label="Run Full 4-Click Guided Pitch Walkthrough (2:52 Choreography)"
            onClick={() => {
              runFullGuidedPitchWalkthrough();
            }}
            className="inline-flex items-center gap-1 rounded border border-emerald-500/70 bg-emerald-950/70 hover:bg-emerald-900/80 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-200 shadow-sm transition cursor-pointer"
          >
            ▶ Run Full 4-Click Guided Pitch Walkthrough (2:52 Choreography)
          </button>

          <button
            type="button"
            title={MOCK_GUIDED_DEMO_SCENARIOS[0].expectedOutcome}
            onClick={() => void runGuidedScenario(MOCK_GUIDED_DEMO_SCENARIOS[0])}
            className="rounded border border-sky-700/50 bg-sky-950/50 hover:bg-sky-900/60 px-2 py-0.5 text-[11px] font-medium text-sky-200 transition cursor-pointer"
          >
            1. Smart Invoice + QR ($1,850)
          </button>

          <button
            type="button"
            title="Reschedule INV2-X89A-4412-9012-7731 dunning milestone on Bryntum Scheduler Pro 6.1.2 (API-06 · 72h R-11 guard)"
            onClick={() => void handleBryntumDunningDragShortcut()}
            className="inline-flex items-center gap-1 rounded border border-sky-700/50 bg-sky-950/50 hover:bg-sky-900/60 px-2 py-0.5 text-[11px] font-medium text-sky-200 transition cursor-pointer"
          >
            <CalendarClock className="h-3 w-3 text-sky-400" />
            2. Bryntum Dunning Drag (API-06)
          </button>

          <button
            type="button"
            title={MOCK_GUIDED_DEMO_SCENARIOS[1].expectedOutcome}
            onClick={() => void runGuidedScenario(MOCK_GUIDED_DEMO_SCENARIOS[1])}
            className="rounded border border-sky-700/50 bg-sky-950/50 hover:bg-sky-900/60 px-2 py-0.5 text-[11px] font-medium text-sky-200 transition cursor-pointer"
          >
            3. Dispute Webhook + GNN Defense ($340)
          </button>

          <button
            type="button"
            title={MOCK_GUIDED_DEMO_SCENARIOS[2].expectedOutcome}
            onClick={() => void runGuidedScenario(MOCK_GUIDED_DEMO_SCENARIOS[2])}
            className="rounded border border-sky-700/50 bg-sky-950/50 hover:bg-sky-900/60 px-2 py-0.5 text-[11px] font-medium text-sky-200 transition cursor-pointer"
          >
            4. Prompt Injection Block + Passkey ($2,400)
          </button>

          <button
            type="button"
            title={MOCK_GUIDED_DEMO_SCENARIOS[3].expectedOutcome}
            onClick={() => void runGuidedScenario(MOCK_GUIDED_DEMO_SCENARIOS[3])}
            className="rounded border border-purple-600/50 bg-purple-950/50 hover:bg-purple-900/60 px-2 py-0.5 text-[11px] font-medium text-purple-200 transition cursor-pointer"
          >
            PYUSD Solana Bridge ($650)
          </button>
        </div>

        {/* Circuit-Breaker Failover (R-06), H41 Reset & Direct Webhook Simulators (API-13) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            aria-label="Simulate HTTP 429 Upstream Rate-Limit -> Auto-Failover (R-06)"
            onClick={() => {
              void simulateUpstreamHttp429CircuitBreaker("/api/v1/agent/execute");
            }}
            className="inline-flex items-center gap-1 rounded border border-amber-500/60 bg-amber-950/60 hover:bg-amber-900/70 px-2 py-0.5 text-[11px] font-mono text-amber-200 transition cursor-pointer"
          >
            <WifiOff className="h-3 w-3 text-amber-400" />
            Simulate HTTP 429 Upstream Rate-Limit -&gt; Auto-Failover (R-06)
          </button>

          <button
            type="button"
            aria-label="Reset / Re-Seed Clean Demo State (H41 Pitch Reset)"
            onClick={() => resetDemoStateToCleanSeed()}
            className="inline-flex items-center gap-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-[11px] font-mono text-slate-200 transition cursor-pointer"
          >
            <RotateCcw className="h-3 w-3 text-sky-400" />
            Reset / Re-Seed Clean Demo State (H41 Pitch Reset)
          </button>

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
            className="inline-flex items-center gap-1 rounded border border-emerald-600/50 bg-emerald-950/50 hover:bg-emerald-900/60 px-2 py-0.5 text-[11px] font-mono text-emerald-300 transition cursor-pointer"
          >
            <Zap className="h-3 w-3" />
            Sim Webhook: INR ($340)
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
            className="inline-flex items-center gap-1 rounded border border-red-600/50 bg-red-950/50 hover:bg-red-900/60 px-2 py-0.5 text-[11px] font-mono text-red-300 transition cursor-pointer"
          >
            <ShieldAlert className="h-3 w-3" />
            Sim Injection ($2,400)
          </button>

          <span className="hidden 2xl:inline-flex items-center gap-1 font-mono text-[10px] text-slate-400">
            <Radio className="h-3 w-3 text-emerald-400" />
            RSA-SHA256 Guard: ARMED
          </span>
        </div>
      </div>

      {/* Guided Pitch Callout & Signed Sandbox Transcript Telemetry Strip */}
      {(activePitchScenario || circuitBreakerTripped || lastReplayTranscript) && (
        <div
          aria-label="Guided Pitch Choreography & Sandbox Resource ID Callout Strip"
          className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 bg-slate-950/90 px-4 py-1 text-[11px] font-mono"
        >
          <div className="flex flex-wrap items-center gap-2">
            {activePitchScenario && (
              <>
                <span className="inline-flex items-center gap-1 rounded bg-sky-950/90 border border-sky-500/40 px-2 py-0.5 text-sky-300 font-bold">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Step {pitchWalkthroughStep}/4 [{activePitchScenario.timecodeWindow} · 2:52 Target]:
                </span>
                <span className="text-slate-300">Sandbox IDs:</span>
                {activePitchScenario.sandboxResourceIds.map((resId) => (
                  <span
                    key={resId}
                    className="rounded border border-emerald-500/40 bg-emerald-950/40 px-1.5 py-0.5 text-emerald-300"
                  >
                    {resId}
                  </span>
                ))}
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {activePitchScenario &&
              activePitchScenario.judgeCallouts.map((judge) => (
                <span
                  key={judge}
                  className="inline-flex items-center gap-1 rounded border border-purple-500/40 bg-purple-950/40 px-2 py-0.5 text-[10px] text-purple-200"
                >
                  <Award className="h-3 w-3 text-purple-400" />
                  {judge}
                </span>
              ))}

            {lastReplayTranscript && (
              <span className="inline-flex items-center gap-1 rounded border border-amber-500/50 bg-amber-950/50 px-2 py-0.5 text-[10px] text-amber-200">
                R-06 Signed Transcript: {lastReplayTranscript.transcriptId} (
                {lastFailoverLatencyMs ?? lastReplayTranscript.replayFailoverLatencyMs}ms &lt; 50ms ·
                SHA-256: {lastReplayTranscript.sha256TranscriptSignature.slice(0, 12)}…)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
