"use client";

/**
 * PayOps AI (PayPal Sentinel) — Screen 3: Smart Invoicing v2 & Bryntum Receivables Scheduler
 * Maps to: F-03 (Smart Invoicing v2), F-08 ($3,000 Bryntum Sponsor Track), US-04, US-05, US-06, US-13
 * Write Owner: Dev 2 (100%)
 */

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { PlusCircle, QrCode, Sparkles, Coins, Repeat } from "lucide-react";
import type { CurrencyCode } from "@payops/shared";
import { DunningHistogram } from "../../../components/bryntum/DunningHistogram";
import {
  createAutonomousSmartInvoice,
  createSubscriptionPlan,
} from "../../../lib/api-client";
import { formatCurrencyAmount } from "../../../lib/formatters";
import { useCockpitStore } from "../../../stores/useCockpitStore";

// FRONTEND.md Section 3.2: Load Bryntum Scheduler Pro via next/dynamic({ ssr: false })
const ReceivablesTimeline = dynamic(
  () => import("../../../components/bryntum/ReceivablesTimeline"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-xl border border-slate-800 bg-slate-900/80 p-6 font-mono text-xs text-sky-300 animate-pulse">
        Hydrating Bryntum Scheduler Pro 6.1.2 Canvas &amp; Dependency Graph...
      </div>
    ),
  }
);

export default function InvoicingSchedulerPage() {
  const {
    activeWorkspaceId,
    activeCurrency,
    invoices,
    createAutonomousInvoice,
    addSubscriptionPlan,
    openQrModal,
    openPyusdModal,
  } = useCockpitStore();

  const [recipientEmail, setRecipientEmail] = useState("accounts@acmerobotics.example.io");
  const [amountValue, setAmountValue] = useState("1850.00");
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>("USD");
  const [dueDate, setDueDate] = useState("2026-11-20");
  const [discountPct, setDiscountPct] = useState("2.00");
  const [enableRecurring, setEnableRecurring] = useState(true);
  const [creating, setCreating] = useState(false);

  // API-12 Recurring Subscription Plan Creator State
  const [planName, setPlanName] = useState("Kaveri B2B Retainer — Pro Tier");
  const [planInterval, setPlanInterval] = useState<"MONTH" | "YEAR">("MONTH");
  const [planAmount, setPlanAmount] = useState("750.00");
  const [creatingPlan, setCreatingPlan] = useState(false);

  const selectedInvoice = invoices[0];

  const handleCreateSubscriptionPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPlan(true);
    try {
      const res = await createSubscriptionPlan({
        workspaceId: activeWorkspaceId,
        productName: "Kaveri Managed Agentic CFO Service",
        planName,
        billingIntervalUnit: planInterval,
        amountValue: planAmount,
        currencyCode,
      });
      addSubscriptionPlan(res.plan);
    } finally {
      setCreatingPlan(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await createAutonomousSmartInvoice({
        workspaceId: activeWorkspaceId,
        recipientEmail,
        amountValue,
        currencyCode,
        dueDate,
        earlyPaymentDiscountPct: discountPct,
        enableRecurringSeries: enableRecurring,
      });
      createAutonomousInvoice(created);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1750px] space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left 2 Columns: Bryntum Scheduler Pro & Working Capital Histogram (F-08) */}
        <div className="xl:col-span-2 space-y-4">
          <ReceivablesTimeline />
          <DunningHistogram />
        </div>

        {/* Right Column: Autonomous Smart Invoice Creator & Live QR Preview Drawer (F-03, E-07) */}
        <aside
          aria-label="Autonomous Smart Invoice v2 Creator and QR Preview"
          className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4"
        >
          <div className="border-b border-slate-800 pb-3">
            <span className="inline-flex items-center gap-1 rounded bg-sky-500/15 border border-sky-500/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-300">
              <Sparkles className="h-3 w-3" />
              API-04 · 5-Step PayPal Invoicing v2 Orchestrator
            </span>
            <h1 className="text-sm font-bold text-white mt-1">
              Create Autonomous Smart Invoice + QR (US-04 · US-05)
            </h1>
          </div>

          <form onSubmit={(e) => void handleCreateInvoice(e)} className="space-y-3 text-xs">
            <div>
              <label
                htmlFor="invoice-recipient-email"
                className="block font-mono text-[10px] uppercase text-slate-400"
              >
                Buyer / AP Recipient Email
              </label>
              <input
                id="invoice-recipient-email"
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="invoice-amount-input"
                  className="block font-mono text-[10px] uppercase text-slate-400"
                >
                  2-Decimal Amount (R-03)
                </label>
                <input
                  id="invoice-amount-input"
                  type="text"
                  required
                  value={amountValue}
                  onChange={(e) => setAmountValue(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-white financial-figure"
                />
              </div>

              <div>
                <label
                  htmlFor="invoice-currency-select"
                  className="block font-mono text-[10px] uppercase text-slate-400"
                >
                  ISO-4217 Currency
                </label>
                <select
                  id="invoice-currency-select"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value as CurrencyCode)}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="invoice-due-date"
                  className="block font-mono text-[10px] uppercase text-slate-400"
                >
                  Net Due Date
                </label>
                <input
                  id="invoice-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="invoice-discount-pct"
                  className="block font-mono text-[10px] uppercase text-slate-400"
                >
                  Early-Pay Discount (%)
                </label>
                <input
                  id="invoice-discount-pct"
                  type="text"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-emerald-300 financial-figure"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 rounded border border-slate-800 bg-slate-950/60 p-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={enableRecurring}
                onChange={(e) => setEnableRecurring(e.target.checked)}
                className="h-3.5 w-3.5 accent-sky-500"
              />
              <Repeat className="h-3.5 w-3.5 text-purple-400" />
              <span className="font-mono text-[11px] text-slate-300">
                Activate Recurring Invoice Series (`create_recurring_series` #16)
              </span>
            </label>

            <button
              type="submit"
              disabled={creating}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0070E0] hover:bg-[#005EA6] py-2.5 px-4 text-xs font-bold text-white shadow transition cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              {creating
                ? "Running 5 PayPal Invoicing v2 MCP Tools..."
                : "Generate Invoice + 2% Rule + QR (API-04)"}
            </button>
          </form>

          {/* Active Invoice Inspector Card */}
          {selectedInvoice && (
            <div className="border-t border-slate-800 pt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-sky-300">{selectedInvoice.invoiceId}</span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">
                  {selectedInvoice.status}
                </span>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] space-y-1">
                <div>
                  <span className="text-slate-400">Amount:</span>{" "}
                  <span className="text-white font-bold financial-figure">
                    {formatCurrencyAmount(
                      selectedInvoice.amountValue,
                      selectedInvoice.currencyCode,
                      activeCurrency
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Conditional Rule:</span>{" "}
                  <span className="text-emerald-300">
                    {selectedInvoice.conditionalRule?.percentage}% off by{" "}
                    {selectedInvoice.conditionalRule?.triggerDate}
                  </span>
                </div>
                <div className="truncate">
                  <span className="text-slate-400">PayPal-Request-Id:</span>{" "}
                  {selectedInvoice.idempotencyKey}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openQrModal(selectedInvoice)}
                  className="inline-flex items-center justify-center gap-1.5 rounded border border-sky-500/50 bg-sky-950/60 hover:bg-sky-900/60 py-2 px-3 font-mono text-xs text-sky-200 cursor-pointer"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  Inspect QR Modal
                </button>

                <button
                  type="button"
                  onClick={() => openPyusdModal(selectedInvoice)}
                  className="inline-flex items-center justify-center gap-1.5 rounded border border-emerald-500/50 bg-emerald-950/60 hover:bg-emerald-900/60 py-2 px-3 font-mono text-xs text-emerald-200 cursor-pointer"
                >
                  <Coins className="h-3.5 w-3.5" />
                  Settle via PYUSD
                </button>
              </div>
            </div>
          )}

          {/* API-12 Recurring Subscription Billing Plan Creator (E-09) */}
          <form
            onSubmit={(e) => void handleCreateSubscriptionPlan(e)}
            className="border-t border-slate-800 pt-4 space-y-2.5 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase text-purple-300">
                <Repeat className="h-3 w-3" />
                API-12 · PayPal Subscriptions v1 Plan Creator
              </span>
              <span className="font-mono text-[10px] text-slate-400">MCP #31–#35</span>
            </div>

            <div>
              <label
                htmlFor="sub-plan-name"
                className="block font-mono text-[10px] uppercase text-slate-400"
              >
                Subscription Plan Name
              </label>
              <input
                id="sub-plan-name"
                type="text"
                required
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="sub-plan-amount"
                  className="block font-mono text-[10px] uppercase text-slate-400"
                >
                  Cycle Amount ({currencyCode})
                </label>
                <input
                  id="sub-plan-amount"
                  type="text"
                  required
                  value={planAmount}
                  onChange={(e) => setPlanAmount(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-purple-200 financial-figure"
                />
              </div>

              <div>
                <label
                  htmlFor="sub-plan-interval"
                  className="block font-mono text-[10px] uppercase text-slate-400"
                >
                  Billing Interval
                </label>
                <select
                  id="sub-plan-interval"
                  value={planInterval}
                  onChange={(e) => setPlanInterval(e.target.value as "MONTH" | "YEAR")}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-white"
                >
                  <option value="MONTH">MONTH</option>
                  <option value="YEAR">YEAR</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingPlan}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-500/50 bg-purple-950/60 hover:bg-purple-900/60 py-2 px-3 font-mono text-xs font-semibold text-purple-200 transition cursor-pointer"
            >
              <Repeat className="h-3.5 w-3.5" />
              {creatingPlan
                ? "Activating PayPal Billing Plan..."
                : "Create Subscription Plan (API-12)"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
