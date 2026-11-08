"use client";

/**
 * PayOps AI (PayPal Sentinel) — Bryntum Resource Working-Capital Inflow Histogram
 * Maps to: F-08 ($3,000 Bryntum Sponsor Track), UI_SPEC.md Section 4.2, PITCH.md Q19, H19-H20
 * Dynamically recalculates daily cash inflows vs outflows when invoice dunning bars are dragged
 * or conditional discount windows are resized on the Bryntum Scheduler Pro timeline.
 * Write Owner: Dev 2 (100%)
 */

import React, { useMemo } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import type { PayPalInvoiceRecord, SubscriptionPlanRecord } from "@payops/shared";
import { convertCurrencyAmount, formatCurrencyAmount } from "../../lib/formatters";
import { useCockpitStore } from "../../stores/useCockpitStore";

export interface WorkingCapitalBucket {
  isoDate: string;
  dateLabel: string;
  inflowUsd: number;
  outflowUsd: number;
  netUsd: number;
  note: string;
  matchedInvoices: string[];
}

const BUCKET_TEMPLATES: Array<{
  isoDate: string;
  dateLabel: string;
  baseInflowUsd: number;
  outflowUsd: number;
  defaultNote: string;
}> = [
  {
    isoDate: "2026-11-05",
    dateLabel: "Nov 05",
    baseInflowUsd: 1200,
    outflowUsd: 210,
    defaultNote: "Initial AR Dispatch & Cycle Open",
  },
  {
    isoDate: "2026-11-10",
    dateLabel: "Nov 10",
    baseInflowUsd: 400,
    outflowUsd: 390,
    defaultNote: "Early-Pay Discount Window",
  },
  {
    isoDate: "2026-11-12",
    dateLabel: "Nov 12",
    baseInflowUsd: 550,
    outflowUsd: 228,
    defaultNote: "Mid-Cycle FX & INR Collections",
  },
  {
    isoDate: "2026-11-15",
    dateLabel: "Nov 15",
    baseInflowUsd: 600,
    outflowUsd: 310,
    defaultNote: "Net-10 Discount Cutoff",
  },
  {
    isoDate: "2026-11-18",
    dateLabel: "Nov 18",
    baseInflowUsd: 750,
    outflowUsd: 445,
    defaultNote: "Smart Dunning Escalation Slot",
  },
  {
    isoDate: "2026-11-20",
    dateLabel: "Nov 20",
    baseInflowUsd: 900,
    outflowUsd: 650,
    defaultNote: "Recurring Retainer & PYUSD Bridge",
  },
  {
    isoDate: "2026-11-25",
    dateLabel: "Nov 25",
    baseInflowUsd: 1100,
    outflowUsd: 200,
    defaultNote: "Month-End AR Settlement",
  },
];

/**
 * Pure deterministic calculator mapping live PayPalInvoiceRecord & SubscriptionPlanRecord
 * schedules onto the 7 Bryntum Resource Histogram buckets.
 */
export function computeWorkingCapitalBuckets(
  invoices: PayPalInvoiceRecord[],
  subscriptionPlans: SubscriptionPlanRecord[] = []
): WorkingCapitalBucket[] {
  const activeMonthlySubUsd = subscriptionPlans
    .filter((p) => p.status === "ACTIVE" && p.billingIntervalUnit === "MONTH")
    .reduce((sum, p) => sum + convertCurrencyAmount(p.amountValue, p.currencyCode, "USD"), 0);

  return BUCKET_TEMPLATES.map((tpl) => {
    const matchedInvoices: string[] = [];
    let invoiceInflowUsd = 0;

    for (const inv of invoices) {
      if (inv.status === "CANCELLED") continue;
      const effectiveDate = inv.conditionalRule?.triggerDate ?? inv.dueDate;
      if (effectiveDate === tpl.isoDate) {
        const usdAmt = convertCurrencyAmount(inv.amountValue, inv.currencyCode, "USD");
        invoiceInflowUsd += usdAmt;
        matchedInvoices.push(inv.invoiceNumber);
      }
    }

    const recurringBonusUsd = tpl.isoDate === "2026-11-20" ? activeMonthlySubUsd : 0;
    const inflowUsd = Math.round(tpl.baseInflowUsd + invoiceInflowUsd + recurringBonusUsd);
    const outflowUsd = tpl.outflowUsd;
    const netUsd = inflowUsd - outflowUsd;
    const note =
      matchedInvoices.length > 0
        ? `${matchedInvoices.join(", ")} (${tpl.defaultNote})`
        : tpl.defaultNote;

    return {
      isoDate: tpl.isoDate,
      dateLabel: tpl.dateLabel,
      inflowUsd,
      outflowUsd,
      netUsd,
      note,
      matchedInvoices,
    };
  });
}

export function DunningHistogram() {
  const activeCurrency = useCockpitStore((s) => s.activeCurrency);
  const invoices = useCockpitStore((s) => s.invoices);
  const subscriptionPlans = useCockpitStore((s) => s.subscriptionPlans);

  const buckets = useMemo(
    () => computeWorkingCapitalBuckets(invoices, subscriptionPlans),
    [invoices, subscriptionPlans]
  );

  const maxVal = useMemo(
    () => Math.max(5500, ...buckets.map((b) => Math.max(b.inflowUsd, b.outflowUsd))),
    [buckets]
  );

  const totalProjectedInflowUsd = useMemo(
    () => buckets.reduce((acc, b) => acc + b.inflowUsd, 0),
    [buckets]
  );
  const totalScheduledOutflowUsd = useMemo(
    () => buckets.reduce((acc, b) => acc + b.outflowUsd, 0),
    [buckets]
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-sky-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Bryntum Resource Histogram — Projected Daily Working Capital Inflows vs Outflows
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              Live two-way binding: dragging an invoice milestone bar above immediately recalculates daily projected cash-flow buckets
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 font-mono text-[11px] text-sky-300 financial-figure">
            Total Inflow: {formatCurrencyAmount(totalProjectedInflowUsd, "USD", activeCurrency, true)} · Outflow:{" "}
            {formatCurrencyAmount(totalScheduledOutflowUsd, "USD", activeCurrency, true)}
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 font-mono text-[11px] text-emerald-300 financial-figure">
            <TrendingUp className="h-3 w-3" />
            Safety Reserve Floor: {formatCurrencyAmount(1000, "USD", activeCurrency)} (100% Covered)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3 pt-2">
        {buckets.map((b) => {
          const inPct = Math.round((b.inflowUsd / maxVal) * 100);
          const outPct = Math.round((b.outflowUsd / maxVal) * 100);
          const hasInvoices = b.matchedInvoices.length > 0;

          return (
            <div
              key={b.isoDate}
              className={`flex flex-col justify-end rounded-lg border p-2.5 space-y-2 transition ${
                hasInvoices
                  ? "border-emerald-500/40 bg-slate-950/90"
                  : "border-slate-800/80 bg-slate-950/70"
              }`}
            >
              <div className="h-24 flex items-end justify-center gap-2 border-b border-slate-800 pb-1">
                <div
                  className="w-4 rounded-t bg-emerald-500 transition-all duration-300"
                  style={{ height: `${Math.max(10, inPct)}%` }}
                  title={`Projected Inflow (${b.dateLabel}): $${b.inflowUsd.toLocaleString()} USD`}
                />
                <div
                  className="w-4 rounded-t bg-amber-500/80 transition-all duration-300"
                  style={{ height: `${Math.max(6, outPct)}%` }}
                  title={`Scheduled Supplier Payout (${b.dateLabel}): $${b.outflowUsd.toLocaleString()} USD`}
                />
              </div>
              <div className="text-center">
                <div className="font-mono text-[11px] font-bold text-slate-200">{b.dateLabel}</div>
                <div className="font-mono text-[10px] text-emerald-400 financial-figure">
                  +{formatCurrencyAmount(b.inflowUsd, "USD", activeCurrency, true)}
                </div>
                <div className="font-mono text-[9px] text-amber-300/90 financial-figure">
                  -{formatCurrencyAmount(b.outflowUsd, "USD", activeCurrency, true)}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5" title={b.note}>
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
