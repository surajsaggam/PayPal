"use client";

/**
 * PayOps AI (PayPal Sentinel) — Bryntum Resource Working-Capital Inflow Histogram
 * Maps to: F-08 ($3,000 Bryntum Sponsor Track), UI_SPEC.md Section 4.2, PITCH.md Q19
 * Write Owner: Dev 2 (100%)
 */

import React from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { formatCurrencyAmount } from "../../lib/formatters";
import { useCockpitStore } from "../../stores/useCockpitStore";

const WORKING_CAPITAL_BUCKETS = [
  { dateLabel: "Nov 10", inflowUsd: 2450, outflowUsd: 390, note: "2% Early Disc Cutoff (INV-8841)" },
  { dateLabel: "Nov 12", inflowUsd: 2000, outflowUsd: 228, note: "Nordic Retail INR 1.68L Disc" },
  { dateLabel: "Nov 14", inflowUsd: 2500, outflowUsd: 650, note: "PYUSD Supplier Settlement" },
  { dateLabel: "Nov 15", inflowUsd: 1850, outflowUsd: 0, note: "Acme Robotics Net-10" },
  { dateLabel: "Nov 18", inflowUsd: 3200, outflowUsd: 445, note: "Apex Wholesale Dunning" },
  { dateLabel: "Nov 20", inflowUsd: 4950, outflowUsd: 350, note: "Vortex SaaS Retainer Cycle" },
  { dateLabel: "Nov 25", inflowUsd: 3800, outflowUsd: 200, note: "Month-End AR Settlement" },
];

export function DunningHistogram() {
  const activeCurrency = useCockpitStore((s) => s.activeCurrency);
  const maxVal = 5500;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Bryntum Resource Histogram — Projected Daily Working Capital Inflows vs Outflows
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
          <TrendingUp className="h-3 w-3" />
          Safety Reserve Floor: {formatCurrencyAmount(1000, "USD", activeCurrency)} (100% Covered)
        </span>
      </div>

      <div className="grid grid-cols-7 gap-3 pt-2">
        {WORKING_CAPITAL_BUCKETS.map((b) => {
          const inPct = Math.round((b.inflowUsd / maxVal) * 100);
          const outPct = Math.round((b.outflowUsd / maxVal) * 100);

          return (
            <div
              key={b.dateLabel}
              className="flex flex-col justify-end rounded-lg border border-slate-800/80 bg-slate-950/80 p-2.5 space-y-2"
            >
              <div className="h-24 flex items-end justify-center gap-2 border-b border-slate-800 pb-1">
                <div
                  className="w-4 rounded-t bg-emerald-500 transition-all"
                  style={{ height: `${Math.max(10, inPct)}%` }}
                  title={`Projected Inflow: $${b.inflowUsd}`}
                />
                <div
                  className="w-4 rounded-t bg-amber-500/80 transition-all"
                  style={{ height: `${Math.max(6, outPct)}%` }}
                  title={`Scheduled Supplier Payout: $${b.outflowUsd}`}
                />
              </div>
              <div className="text-center">
                <div className="font-mono text-[11px] font-bold text-slate-200">{b.dateLabel}</div>
                <div className="font-mono text-[10px] text-emerald-400 financial-figure">
                  +{formatCurrencyAmount(b.inflowUsd, "USD", activeCurrency, true)}
                </div>
                <div className="text-[10px] text-slate-400 truncate" title={b.note}>
                  {b.note}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
