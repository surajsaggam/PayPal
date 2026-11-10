"use client";

/**
 * PayOps AI (PayPal Sentinel) — Screen 3: Smart Invoicing & Cash-Flow Scheduler
 * Increase.com Light-First Editorial Redesign:
 *  - Clean human-readable typography (Inter font) with smooth pop-in and hover transitions
 *  - 12-column responsive layout: Receivables Timeline + Working-Capital Histogram (left 8 cols) +
 *    Smart Invoice Creator & Subscription Billing Plan Creator (right 4 cols)
 */

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { PlusCircle, QrCode, Sparkles, Coins, Repeat, CalendarClock, ShieldCheck } from "lucide-react";
import type { CurrencyCode } from "@payops/shared";
import { DunningHistogram } from "../../../components/bryntum/DunningHistogram";
import {
  createAutonomousSmartInvoice,
  createSubscriptionPlan,
} from "../../../lib/api-client";
import { formatCurrencyAmount } from "../../../lib/formatters";
import { useCockpitStore } from "../../../stores/useCockpitStore";

const ReceivablesTimeline = dynamic(
  () => import("../../../components/bryntum/ReceivablesTimeline"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 surface-bento rounded-2xl p-6 text-xs text-ink-secondary animate-pulse">
        Loading Receivables Timeline &amp; Payment Schedule...
      </div>
    ),
  }
);

export default function InvoicingSchedulerPage() {
  const {
    activeWorkspaceId,
    activeCurrency,
    invoices,
    selectedInvoiceId,
    createAutonomousInvoice,
    createRecurringSeries,
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

  const [planName, setPlanName] = useState("Kaveri B2B Retainer — Pro Tier");
  const [planInterval, setPlanInterval] = useState<"MONTH" | "YEAR">("MONTH");
  const [planAmount, setPlanAmount] = useState("750.00");
  const [creatingPlan, setCreatingPlan] = useState(false);

  const selectedInvoice =
    invoices.find((i) => i.invoiceId === selectedInvoiceId) ?? invoices[0];

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
      if (enableRecurring) {
        createRecurringSeries({
          seriesId: `RS-${created.invoiceNumber.slice(-4)}`,
          workspaceId: activeWorkspaceId,
          seriesName: `Monthly Retainer for ${recipientEmail}`,
          recipientEmail,
          cadence: "MONTHLY",
          nextTriggerDate: dueDate,
          amountValue: created.amountValue,
          currencyCode: created.currencyCode,
          status: "ACTIVE",
          mcpToolsBound: [
            "create_recurring_series",
            "activate_recurring_series",
            "get_recurring_series",
            "cancel_recurring_series",
          ],
        });
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-10 pb-16 animate-pop-in">
      {/* Editorial Section Header */}
      <header className="flex flex-col justify-between gap-6 border-b border-hairline pb-8 lg:flex-row lg:items-end">
        <div className="max-w-2xl space-y-3.5">
          <div className="badge-lime px-3.5 py-1 text-xs shadow-2xs">
            <CalendarClock className="h-3.5 w-3.5" />
            <span>Smart Invoicing &amp; Cash-Flow Scheduler</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-ink leading-[1.12]">
            Automated receivables and cash-flow scheduling.{" "}
            <span className="font-normal text-ink-muted">
              Offer early-payment incentives, schedule polite payment reminders, and manage
              recurring retainers from one timeline.
            </span>
          </h1>
        </div>

        {selectedInvoice && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => openQrModal(selectedInvoice)}
              className="btn-outline-subtle h-10 rounded-xl px-4 text-xs shadow-2xs cursor-pointer"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>View QR Link ({selectedInvoice.invoiceNumber})</span>
            </button>
            <button
              type="button"
              onClick={() => openPyusdModal(selectedInvoice)}
              className="btn-secondary-dark h-10 rounded-xl px-4 text-xs shadow-xs cursor-pointer"
            >
              <Coins className="h-3.5 w-3.5" />
              <span>Settle via PYUSD</span>
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
        {/* Left 8 Columns: Receivables Timeline & Working Capital Histogram */}
        <div className="xl:col-span-8 space-y-6 lg:space-y-8 animate-pop-in delay-75">
          <ReceivablesTimeline />
          <DunningHistogram />
        </div>

        {/* Right 4 Columns: Smart Invoice Creator & Recurring Plan Creator */}
        <aside
          aria-label="Autonomous Smart Invoice v2 Creator and QR Preview"
          className="xl:col-span-4 space-y-6 lg:space-y-8 animate-pop-in delay-150"
        >
          {/* Card 1: Smart Invoice Creator */}
          <div className="surface-bento rounded-2xl p-6 sm:p-7 space-y-5">
            <div className="border-b border-hairline pb-4">
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-hairline bg-elevated px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
                <Sparkles className="h-3 w-3" />
                Instant Invoice &amp; QR Link
              </span>
              <h2 className="mt-2.5 text-base font-semibold tracking-tight text-ink">
                Create Smart Invoice
              </h2>
            </div>

            <form onSubmit={(e) => void handleCreateInvoice(e)} className="space-y-4 text-xs">
              <div>
                <label
                  htmlFor="invoice-recipient-email"
                  className="block text-xs font-medium text-ink-secondary"
                >
                  Customer Email Address
                </label>
                <input
                  id="invoice-recipient-email"
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-hairline bg-elevated px-3.5 py-2.5 text-xs text-ink shadow-2xs focus:border-ink focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="invoice-amount-input"
                    className="block text-xs font-medium text-ink-secondary"
                  >
                    Invoice Amount
                  </label>
                  <input
                    id="invoice-amount-input"
                    type="text"
                    required
                    value={amountValue}
                    onChange={(e) => setAmountValue(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-hairline bg-elevated px-3 py-2 text-sm font-semibold text-ink tabular-nums shadow-2xs focus:border-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="invoice-currency-select"
                    className="block text-xs font-medium text-ink-secondary"
                  >
                    Currency
                  </label>
                  <select
                    id="invoice-currency-select"
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value as CurrencyCode)}
                    className="mt-1.5 w-full rounded-xl border border-hairline bg-elevated px-2.5 py-2 text-xs font-medium text-ink shadow-2xs focus:border-ink focus:outline-none cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="invoice-due-date"
                    className="block text-xs font-medium text-ink-secondary"
                  >
                    Payment Due Date
                  </label>
                  <input
                    id="invoice-due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-hairline bg-elevated px-2.5 py-2 text-xs text-ink tabular-nums shadow-2xs focus:border-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="invoice-discount-pct"
                    className="block text-xs font-medium text-ink-secondary"
                  >
                    Early-Pay Discount (%)
                  </label>
                  <input
                    id="invoice-discount-pct"
                    type="text"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-hairline bg-elevated px-2.5 py-2 text-xs font-semibold text-status-success-text tabular-nums shadow-2xs focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 rounded-xl border border-hairline bg-elevated p-3 shadow-2xs cursor-pointer transition-colors hover:border-border-strong">
                <input
                  type="checkbox"
                  checked={enableRecurring}
                  onChange={(e) => setEnableRecurring(e.target.checked)}
                  className="h-3.5 w-3.5 accent-slate-900"
                />
                <Repeat className="h-3.5 w-3.5 text-ink-secondary" />
                <span className="text-xs font-medium text-ink-secondary">
                  Enable Monthly Recurring Billing
                </span>
              </label>

              <button
                type="submit"
                disabled={creating}
                className="btn-primary-mint w-full py-2.5 px-4 text-xs font-semibold cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>
                  {creating ? "Sending Smart Invoice..." : "Send Invoice & Generate QR Link"}
                </span>
              </button>
            </form>

            {/* Active Invoice Inspector Card */}
            {selectedInvoice && (
              <div className="border-t border-hairline pt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">
                    Selected · {selectedInvoice.invoiceNumber}
                  </span>
                  <span className="rounded-pill border border-status-success-border bg-status-success-bg px-2.5 py-0.5 text-xs font-medium text-status-success-text">
                    {selectedInvoice.status}
                  </span>
                </div>

                <div className="surface-card rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Invoice Total</span>
                    <span className="text-ink font-semibold tabular-nums">
                      {formatCurrencyAmount(
                        selectedInvoice.amountValue,
                        selectedInvoice.currencyCode,
                        activeCurrency
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Early-Pay Incentive</span>
                    <span className="text-status-success-text font-medium tabular-nums">
                      {selectedInvoice.conditionalRule?.percentage}% off before{" "}
                      {selectedInvoice.conditionalRule?.triggerDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-ink-muted pt-1.5 border-t border-border-subtle">
                    <ShieldCheck className="h-3.5 w-3.5 text-status-success-text shrink-0" />
                    <span>Duplicate-Request Protection Active</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openQrModal(selectedInvoice)}
                    className="btn-outline-subtle py-2 px-3 text-xs cursor-pointer"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>View QR Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openPyusdModal(selectedInvoice)}
                    className="btn-secondary-dark py-2 px-3 text-xs cursor-pointer"
                  >
                    <Coins className="h-3.5 w-3.5" />
                    <span>Settle PYUSD</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Recurring Subscription Plan Creator */}
          <form
            onSubmit={(e) => void handleCreateSubscriptionPlan(e)}
            className="surface-bento rounded-2xl p-6 sm:p-7 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3.5">
              <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-ink">
                <Repeat className="h-4 w-4 text-ink-secondary" />
                Recurring Subscription Plan
              </span>
              <span className="rounded-pill border border-hairline bg-elevated px-2.5 py-0.5 text-[11px] font-medium text-ink-muted">
                Auto-Billing
              </span>
            </div>

            <div>
              <label
                htmlFor="sub-plan-name"
                className="block text-xs font-medium text-ink-secondary"
              >
                Subscription Plan Name
              </label>
              <input
                id="sub-plan-name"
                type="text"
                required
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-hairline bg-elevated px-3.5 py-2.5 text-xs text-ink shadow-2xs focus:border-ink focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="sub-plan-amount"
                  className="block text-xs font-medium text-ink-secondary"
                >
                  Billing Amount ($)
                </label>
                <input
                  id="sub-plan-amount"
                  type="text"
                  required
                  value={planAmount}
                  onChange={(e) => setPlanAmount(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-hairline bg-elevated px-3.5 py-2 text-sm font-semibold text-ink tabular-nums shadow-2xs focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="sub-plan-interval"
                  className="block text-xs font-medium text-ink-secondary"
                >
                  Billing Cycle
                </label>
                <select
                  id="sub-plan-interval"
                  value={planInterval}
                  onChange={(e) => setPlanInterval(e.target.value as "MONTH" | "YEAR")}
                  className="mt-1.5 w-full rounded-xl border border-hairline bg-elevated px-2.5 py-2.5 text-xs font-medium text-ink shadow-2xs focus:border-ink focus:outline-none cursor-pointer"
                >
                  <option value="MONTH">Monthly</option>
                  <option value="YEAR">Annual</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingPlan}
              className="btn-secondary-dark w-full py-2.5 px-4 text-xs font-semibold cursor-pointer"
            >
              <Repeat className="h-3.5 w-3.5" />
              <span>{creatingPlan ? "Creating Plan..." : "Create Subscription Plan"}</span>
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
