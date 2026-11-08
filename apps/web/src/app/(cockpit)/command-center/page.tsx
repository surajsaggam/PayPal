"use client";

/**
 * PayOps AI (PayPal Sentinel) — Screen 1: Executive Financial Command Center
 * Maps to: F-07 ($10,000 AG Grid + AG Charts Sponsor Track), API-14, US-12, TKT-028
 * Write Owner: Dev 2 (100%)
 */

import React from "react";
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  Award,
  BarChart2,
  PieChart,
} from "lucide-react";
import { MOCK_MERCHANT_INSIGHTS } from "@payops/shared/mock-fixtures";
import { LedgerCommandGrid } from "../../../components/ag-grid/LedgerCommandGrid";
import { formatCurrencyAmount, LOCALE_DICTIONARY } from "../../../lib/formatters";
import { useCockpitStore } from "../../../stores/useCockpitStore";

const WATERFALL_BARS = [
  { label: "Invoiced (v2)", usd: 48200, pct: 100, color: "bg-sky-500" },
  { label: "Collected Early (2% Disc)", usd: 31400, pct: 65, color: "bg-emerald-500" },
  { label: "Auto-Dunning Recovered", usd: 11200, pct: 23, color: "bg-teal-400" },
  { label: "Disputes Defended (F-04)", usd: 4470, pct: 14, color: "bg-indigo-400" },
];

export default function CommandCenterPage() {
  const { activeWorkspaceId, activeCurrency, activeLocale, executions } = useCockpitStore();
  const strings = LOCALE_DICTIONARY[activeLocale];
  const insights =
    MOCK_MERCHANT_INSIGHTS[activeWorkspaceId] ?? MOCK_MERCHANT_INSIGHTS.ws_99102a;

  const heldCount = executions.filter(
    (e) => e.policyVerdict === "HELD_FOR_L2_PASSKEY"
  ).length;

  return (
    <div className="mx-auto max-w-[1750px] space-y-4">
      {/* North-Star KPI Ribbon (API-14: get_merchant_insights) */}
      <section
        aria-label="Executive North-Star KPI Ribbon (API-14)"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
      >
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{strings.kpiAnmpr}</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-1.5 text-2xl font-bold text-white financial-figure">
            {formatCurrencyAmount(insights.annualizedSavingsUsd, "USD", activeCurrency, true)}
            <span className="ml-2 text-xs font-mono text-emerald-400">+38.4% YoY</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-slate-400">
            USD $26,960/yr · INR ₹22.65L/yr Protected
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{strings.kpiDso}</span>
            <Clock className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-1.5 text-2xl font-bold text-white financial-figure">
            {insights.dsoDaysCurrent.toFixed(1)} Days
            <span className="ml-2 text-xs font-mono text-emerald-400">
              -{insights.dsoReductionPct}% vs 28d Baseline
            </span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-slate-400">
            2% Net-10 Conditional Rules + Fastlane QR
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{strings.kpiDisputeWinRate}</span>
            <Award className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-1.5 text-2xl font-bold text-white financial-figure">
            {insights.disputeWinRatePct.toFixed(1)}%
            <span className="ml-2 text-xs font-mono text-emerald-400">+42.0 pts Lift</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-slate-400">
            M-04 GNN (&lt;18ms) + Carrier POD + Elastic RAG
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{strings.kpiPolicyFirewall}</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-1.5 text-2xl font-bold text-emerald-400 financial-figure">
            100.0% <span className="text-xs font-mono text-slate-300">(0 Leaks · 0 Dupes)</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-amber-300">
            {heldCount} Held for L2 Passkey · JunoDB 2PC Active
          </div>
        </div>
      </section>

      {/* AG Charts Enterprise Visual Analytics Row (F-07) */}
      <section
        aria-label="AG Charts Enterprise Financial Telemetry"
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* Chart 1: 30-Day Cash Inflow Waterfall */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-sky-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                AG Charts Enterprise — 30-Day Cash Inflow & DSO Waterfall (F-07)
              </h2>
            </div>
            <span className="font-mono text-[11px] text-emerald-400">
              Early-Pay Velocity: +65.1%
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {WATERFALL_BARS.map((bar) => (
              <div key={bar.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">{bar.label}</span>
                  <span className="text-white font-semibold financial-figure">
                    {formatCurrencyAmount(bar.usd, "USD", activeCurrency, true)}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${bar.color}`}
                    style={{ width: `${bar.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: GNN Friendly-Fraud Risk Distribution */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-purple-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                  M-04 Multi-Hop GNN Friendly-Fraud Risk Distribution (F-10)
                </h2>
              </div>
              <span className="font-mono text-[11px] text-sky-300">
                ONNX Runtime: 9.4ms p95
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/25 p-3">
                <div className="font-mono text-[11px] text-emerald-300">● Low Risk (&lt;0.35)</div>
                <div className="text-xl font-bold text-white mt-1 financial-figure">82.0%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  L3 Auto-Approved in &lt;50ms
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-950/25 p-3">
                <div className="font-mono text-[11px] text-amber-300">
                  ▲ Medium (0.35–0.69)
                </div>
                <div className="text-xl font-bold text-white mt-1 financial-figure">12.0%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Routed to L2 Passkey Queue
                </div>
              </div>

              <div className="rounded-lg border border-red-500/30 bg-red-950/25 p-3">
                <div className="font-mono text-[11px] text-red-300">■ High (&ge;0.70)</div>
                <div className="text-xl font-bold text-white mt-1 financial-figure">6.0%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Auto-Contested w/ DHL POD
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-2.5 text-[11px] font-mono text-slate-400">
            <span>Elastic Audit Index: payops-immutable-audit-180d (GREEN)</span>
            <span className="text-emerald-400">VIP Buyer FPR: 1.4% (&le;2.0% Gate)</span>
          </div>
        </div>
      </section>

      {/* Primary AG Grid Enterprise Financial Ledger (F-07) */}
      <LedgerCommandGrid />
    </div>
  );
}
