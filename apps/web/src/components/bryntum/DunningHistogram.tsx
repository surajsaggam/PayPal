"use client";

/**
 * PayOps AI (PayPal Sentinel) — Bryntum Resource Working-Capital Inflow Histogram
 * Increase.com Light-First Editorial Redesign:
 *  - Dynamically recalculates daily cash inflows vs outflows when invoice dunning bars are dragged
 *  - Preserves exported `computeWorkingCapitalBuckets` pure function for unit tests
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
    <div className="surface-bento rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-ink-secondary" />
            <h3 className="text-base font-semibold tracking-tight text-ink">
              Projected Daily Working Capital Inflows vs Outflows
            </h3>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Live two-way binding: dragging an invoice milestone bar above immediately recalculates
            projected cash-flow buckets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-pill border border-hairline bg-elevated px-3 py-1 text-ink shadow-2xs tabular-nums">
            Projected Inflow:{" "}
            <strong className="font-semibold">{formatCurrencyAmount(totalProjectedInflowUsd, "USD", activeCurrency, true)}</strong>{" "}
            · Outflow:{" "}
            <span className="text-ink-secondary">
              {formatCurrencyAmount(totalScheduledOutflowUsd, "USD", activeCurrency, true)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-pill border border-status-success-border bg-status-success-bg px-3 py-1 font-medium text-status-success-text tabular-nums">
            <TrendingUp className="h-3 w-3" />
            Reserve Floor: {formatCurrencyAmount(1000, "USD", activeCurrency)} (100% Covered)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-7 gap-3 pt-1">
        {buckets.map((b) => {
          const inPct = Math.round((b.inflowUsd / maxVal) * 100);
          const outPct = Math.round((b.outflowUsd / maxVal) * 100);
          const hasInvoices = b.matchedInvoices.length > 0;

          return (
            <div
              key={b.isoDate}
              className={`group flex flex-col justify-end rounded-xl border p-3 space-y-2.5 transition-all duration-200 ease-out hover:-translate-y-[2px] hover:shadow-md ${
                hasInvoices
                  ? "border-status-success-border bg-elevated shadow-2xs"
                  : "border-hairline bg-elevated/80 hover:border-border-strong"
              }`}
            >
              <div className="h-24 flex items-end justify-center gap-2 border-b border-border-subtle pb-1.5">
                <div
                  className="w-4 rounded-t-md bg-status-success-bar transition-all duration-300 ease-out group-hover:brightness-110"
                  style={{ height: `${Math.max(12, inPct)}%` }}
                  title={`Projected Inflow (${b.dateLabel}): $${b.inflowUsd.toLocaleString()} USD`}
                />
                <div
                  className="w-4 rounded-t-md bg-status-warning-bar/85 transition-all duration-300 ease-out"
                  style={{ height: `${Math.max(8, outPct)}%` }}
                  title={`Scheduled Supplier Payout (${b.dateLabel}): $${b.outflowUsd.toLocaleString()} USD`}
                />
              </div>
              <div className="text-center tabular-nums">
                <div className="text-xs font-semibold text-ink">{b.dateLabel}</div>
                <div className="text-[11px] font-semibold text-status-success-text">
                  +{formatCurrencyAmount(b.inflowUsd, "USD", activeCurrency, true)}
                </div>
                <div className="text-[10.5px] text-ink-muted">
                  -{formatCurrencyAmount(b.outflowUsd, "USD", activeCurrency, true)}
                </div>
                <div
                  className="text-[10px] text-ink-muted truncate mt-0.5"
                  title={b.note}
                >
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
