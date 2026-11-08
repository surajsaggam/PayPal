"use client";

/**
 * PayOps AI (PayPal Sentinel) — 1-Click Judge Webhook Simulator & Guided Demo Control Bar
 * Maps to: API-13 (POST /api/v1/webhooks/paypal), TKT-035, R-06 Demo Replay Fallback, PITCH.md
 * Write Owner: Dev 2 (100%)
 */

import React from "react";
import { useRouter } from "next/navigation";
import { Zap, ShieldAlert, PlayCircle, Radio } from "lucide-react";
import {
  MOCK_GUIDED_DEMO_SCENARIOS,
  type GuidedDemoScenario,
} from "@payops/shared/mock-fixtures";
import { createAutonomousSmartInvoice, simulatePayPalWebhook } from "../../lib/api-client";
import { useCockpitStore } from "../../stores/useCockpitStore";

export function WebhookSimulatorToolbar() {
  const router = useRouter();
  const {
    activeWorkspaceId,
    simulateDisputeWebhook,
    createAutonomousInvoice,
    openPyusdModal,
    invoices,
    setCommandPrompt,
    setTraceDrawerOpen,
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
      setTraceDrawerOpen(true);
    } else if (scenario.scenarioId === "DEMO_2_DISPUTE_DEFENSE") {
      simulateDisputeWebhook("INR_340");
      setTraceDrawerOpen(true);
    } else if (scenario.scenarioId === "DEMO_3_INJECTION_BLOCK") {
      simulateDisputeWebhook("INJECTION_2400");
    } else if (scenario.scenarioId === "DEMO_4_PYUSD_BRIDGE") {
      const targetInv =
        invoices.find((i) => i.invoiceNumber === "INV-2026-7704") ?? invoices[0];
      if (targetInv) {
        openPyusdModal(targetInv);
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-900/90 px-4 py-1.5 text-xs">
      {/* 4 PITCH.md 1-Click Guided Demo Scenarios */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-sky-400 mr-1">
          <PlayCircle className="h-3.5 w-3.5" />
          Pitch Choreography (TKT-035):
        </span>
        {MOCK_GUIDED_DEMO_SCENARIOS.map((sc) => (
          <button
            key={sc.scenarioId}
            type="button"
            title={sc.expectedOutcome}
            onClick={() => void runGuidedScenario(sc)}
            className="rounded border border-sky-700/50 bg-sky-950/50 hover:bg-sky-900/60 px-2.5 py-0.5 text-[11px] font-medium text-sky-200 transition cursor-pointer"
          >
            {sc.shortLabel}
          </button>
        ))}
      </div>

      {/* Direct Webhook Simulators (API-13) */}
      <div className="flex items-center gap-2">
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
          className="inline-flex items-center gap-1 rounded border border-emerald-600/50 bg-emerald-950/50 hover:bg-emerald-900/60 px-2.5 py-0.5 text-[11px] font-mono text-emerald-300 transition cursor-pointer"
        >
          <Zap className="h-3 w-3" />
          Sim Webhook: INR Dispute ($340 · DHL OK)
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
          className="inline-flex items-center gap-1 rounded border border-amber-600/50 bg-amber-950/50 hover:bg-amber-900/60 px-2.5 py-0.5 text-[11px] font-mono text-amber-300 transition cursor-pointer"
        >
          <ShieldAlert className="h-3 w-3" />
          Sim Adversarial Refund Injection ($2,400)
        </button>

        <span className="hidden 2xl:inline-flex items-center gap-1 font-mono text-[10px] text-slate-400">
          <Radio className="h-3 w-3 text-emerald-400" />
          RSA-SHA256 Webhook Guard: ARMED
        </span>
      </div>
    </div>
  );
}
