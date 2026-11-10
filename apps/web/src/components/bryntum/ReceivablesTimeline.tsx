"use client";

/**
 * PayOps AI (PayPal Sentinel) — Bryntum Scheduler Pro 6.1.2 Receivables & Subscription Timeline
 * Increase.com Light-First Editorial Redesign:
 *  - Clean bento surface with light-mode SVG dependency graph and tactile milestone bars
 *  - Preserves two-way onEventDrop + onEventResizeEnd, WCAG 2.5.7 keyboard selector, Recurring Series (#16-#19),
 *    Subscription Plans (API-12), and all 5 UI states
 */

import React, { useState } from "react";
import {
  CalendarClock,
  GripHorizontal,
  QrCode,
  Send,
  Coins,
  Repeat,
  AlertCircle,
  CheckCircle2,
  WifiOff,
  RefreshCw,
  ArrowRight,
  SlidersHorizontal,
  Play,
  Pause,
} from "lucide-react";
import type { PayPalInvoiceRecord } from "@payops/shared";
import { MOCK_INVOICES, MOCK_RECURRING_SERIES } from "@payops/shared/mock-fixtures";
import { sendOrRescheduleInvoiceReminder } from "../../lib/api-client";
import { formatCurrencyAmount, formatDualCurrency } from "../../lib/formatters";
import { useCockpitStore } from "../../stores/useCockpitStore";

const TIMELINE_DATES = [
  "2026-11-05",
  "2026-11-10",
  "2026-11-12",
  "2026-11-15",
  "2026-11-18",
  "2026-11-20",
  "2026-11-25",
];

export default function ReceivablesTimeline() {
  const {
    invoices,
    disputes,
    subscriptionPlans,
    recurringSeries,
    activeCurrency,
    uiState,
    setUiState,
    selectedInvoiceId,
    setSelectedInvoiceId,
    pendingSyncInvoiceIds,
    rescheduleInvoiceReminder,
    resizeInvoiceConditionalRule,
    toggleRecurringSeriesStatus,
    createRecurringSeries,
    createAutonomousInvoice,
    activateSubscriberOnPlan,
    updateSubscriptionPlanPricing,
    cancelSubscriptionPlanWithGuard,
    openQrModal,
    openPyusdModal,
  } = useCockpitStore();

  const [draggingInvoiceId, setDraggingInvoiceId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [syncingInvoiceId, setSyncingInvoiceId] = useState<string | null>(null);
  const [syncToast, setSyncToast] = useState<{ ok: boolean; text: string } | null>(null);

  const selectedInvoice =
    invoices.find((i) => i.invoiceId === selectedInvoiceId) ?? invoices[0] ?? null;

  const handleMilestoneDrop = async (invoice: PayPalInvoiceRecord, targetDate: string) => {
    setDraggingInvoiceId(null);
    setDragOverSlot(null);
    setSelectedInvoiceId(invoice.invoiceId);

    if (uiState === "error") {
      const rollbackMsg = `PayPal Sandbox rejected schedule update (HTTP 503). Snapped ${invoice.invoiceNumber} milestone bar back to ${invoice.conditionalRule?.triggerDate ?? invoice.dueDate}.`;
      setSyncToast({ ok: false, text: rollbackMsg });
      return;
    }

    const localResult = rescheduleInvoiceReminder(invoice.invoiceId, targetDate);
    setSyncToast({ ok: localResult.ok, text: localResult.message });
    if (localResult.ok && uiState !== "offline") {
      setSyncingInvoiceId(invoice.invoiceId);
      try {
        await sendOrRescheduleInvoiceReminder({
          invoiceId: invoice.invoiceId,
          newTriggerDate: targetDate,
          note: `Rescheduled on Bryntum Scheduler Pro 6.1.2 canvas (onEventDrop) to ${targetDate}`,
        });
      } finally {
        setSyncingInvoiceId(null);
      }
    }
  };

  const handleMilestoneResizeEnd = (
    invoice: PayPalInvoiceRecord,
    newPercentage: string,
    extendSlot = false
  ) => {
    setSelectedInvoiceId(invoice.invoiceId);
    const currentTrigger = invoice.conditionalRule?.triggerDate ?? "2026-11-12";
    const currentIdx = TIMELINE_DATES.indexOf(currentTrigger);
    const nextTriggerDate =
      extendSlot && currentIdx >= 0 && currentIdx < TIMELINE_DATES.length - 1
        ? TIMELINE_DATES[currentIdx + 1]
        : currentTrigger;

    const res = resizeInvoiceConditionalRule(
      invoice.invoiceId,
      newPercentage,
      nextTriggerDate,
      invoice.conditionalRule?.ruleType ?? "EARLY_PAYMENT_DISCOUNT"
    );
    setSyncToast({ ok: res.ok, text: res.message });
  };

  return (
    <div className="surface-bento rounded-2xl p-6 space-y-5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-ink-secondary" />
            <h2 className="text-base font-semibold tracking-tight text-ink">
              Receivables &amp; Payment Schedule Timeline
            </h2>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Click or drag any milestone to reschedule payment reminders with automatic 72-hour
            customer quiet-period protection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded-pill border border-status-success-border bg-status-success-bg px-2.5 py-0.5 font-medium text-status-success-text">
            ★ Early-Pay Discount
          </span>
          <span className="rounded-pill border border-status-info-border bg-status-info-bg px-2.5 py-0.5 font-medium text-status-info-text">
            Payment Due Date
          </span>
          <span className="rounded-pill border border-status-warning-border bg-status-warning-bg px-2.5 py-0.5 font-medium text-status-warning-text">
            Late Fee Window
          </span>
        </div>
      </div>

      {/* 5 Interactive UI States */}
      {uiState === "offline" && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-status-warning-border bg-status-warning-bg px-4 py-2.5 text-xs font-mono text-status-warning-text"
        >
          <span className="inline-flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            OFFLINE QUEUE ACTIVE: Timeline drag &amp; resize mutations queued locally with{" "}
            <strong>PENDING_SYNC</strong> ({pendingSyncInvoiceIds.length} queued).
          </span>
          <button
            type="button"
            onClick={() => setUiState("success")}
            className="btn-outline-subtle px-2.5 py-0.5 text-[11px] cursor-pointer"
          >
            Flush Queue Now
          </button>
        </div>
      )}

      {uiState === "error" && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-status-danger-border bg-status-danger-bg px-4 py-2.5 text-xs font-mono text-status-danger-text"
        >
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Schedule Sync Error: Timeline bars automatically snap back to their last verified
            PayPal Sandbox date.
          </span>
          <button
            type="button"
            onClick={() => setUiState("success")}
            className="btn-secondary-dark px-3 py-1 text-[11px] cursor-pointer"
          >
            Restore Sandbox Link
          </button>
        </div>
      )}

      {(uiState === "loading" || syncingInvoiceId !== null) && (
        <div
          aria-busy="true"
          className="flex items-center justify-between rounded-xl border border-status-info-border bg-status-info-bg px-4 py-2.5 text-xs font-mono text-status-info-text"
        >
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Optimistic Timeline Sync: Updating PayPal Invoice conditional rules &amp; reminder
            schedule...
          </span>
          <span className="text-[10px]">PayPal-Request-Id Locked</span>
        </div>
      )}

      {syncToast && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs font-mono ${
            syncToast.ok
              ? "border-status-success-border bg-status-success-bg text-status-success-text"
              : "border-status-danger-border bg-status-danger-bg text-status-danger-text"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {syncToast.ok ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {syncToast.text}
          </span>
          <button
            type="button"
            onClick={() => setSyncToast(null)}
            className="text-[11px] underline ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Invoice SVG Dependency Chain Visualizer */}
      {selectedInvoice && uiState !== "empty" && (
        <div className="dot-grid-surface rounded-xl border border-hairline p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium text-ink flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-ink-secondary" />
              Payment Schedule for{" "}
              <strong className="font-semibold text-ink">{selectedInvoice.invoiceNumber}</strong>
              <span className="text-ink-muted">({selectedInvoice.recipientEmail})</span>
            </span>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-ink-muted text-[11px]">Early Discount:</span>
              {["1.50", "2.00", "3.00"].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleMilestoneResizeEnd(selectedInvoice, pct, false)}
                  className={`rounded-md border px-2 py-0.5 text-[11px] transition-all duration-150 cursor-pointer ${
                    selectedInvoice.conditionalRule?.percentage === pct
                      ? "border-accent-dark bg-accent-dark text-accent-dark-ink font-semibold"
                      : "border-hairline bg-elevated text-ink-secondary hover:border-border-strong hover:text-ink"
                  }`}
                >
                  {pct}%
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  handleMilestoneResizeEnd(
                    selectedInvoice,
                    selectedInvoice.conditionalRule?.percentage ?? "2.00",
                    true
                  )
                }
                className="rounded-md border border-hairline bg-elevated px-2.5 py-0.5 text-[11px] font-medium text-ink shadow-2xs transition-all duration-150 hover:-translate-y-[1px] hover:border-border-strong cursor-pointer"
                title="Extend early-payment discount window by +1 date slot"
              >
                Extend Window (+1 Slot)
              </button>
              <label className="inline-flex items-center gap-1 text-[11px] text-ink-muted ml-1">
                <span>Custom Date:</span>
                <input
                  type="date"
                  aria-label="Custom reminder trigger date picker"
                  value={selectedInvoice.conditionalRule?.triggerDate ?? "2026-11-12"}
                  onChange={(e) => {
                    if (e.target.value) {
                      void handleMilestoneDrop(selectedInvoice, e.target.value);
                    }
                  }}
                  className="rounded-md border border-hairline bg-elevated px-1.5 py-0.5 font-mono text-[11px] text-ink tabular-nums"
                />
              </label>
            </div>
          </div>

          <svg
            viewBox="0 0 760 44"
            className="w-full h-11 rounded-lg bg-elevated border border-hairline shadow-2xs"
            role="img"
            aria-label={`Bryntum Dependency Graph for ${selectedInvoice.invoiceNumber}`}
          >
            <defs>
              <marker
                id="bryntum-arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748B" />
              </marker>
            </defs>

            {/* Step 1: Sent */}
            <rect
              x="8"
              y="8"
              width="145"
              height="28"
              rx="6"
              fill="#F8FAFC"
              stroke="#CBD5E1"
              strokeWidth="1.2"
            />
            <text
              x="80"
              y="25"
              textAnchor="middle"
              fill="#0F172A"
              fontSize="10"
              fontFamily="var(--font-sans), sans-serif"
              fontWeight="600"
            >
              1. Sent (${selectedInvoice.amountValue})
            </text>

            <line
              x1="153"
              y1="22"
              x2="188"
              y2="22"
              stroke="#94A3B8"
              strokeWidth="1.5"
              markerEnd="url(#bryntum-arrow)"
            />

            {/* Step 2: Early Discount / Rule Cutoff */}
            <rect
              x="192"
              y="8"
              width="185"
              height="28"
              rx="6"
              fill="#ECFDF5"
              stroke="#A7F3D0"
              strokeWidth="1.2"
            />
            <text
              x="284"
              y="25"
              textAnchor="middle"
              fill="#065F46"
              fontSize="10"
              fontFamily="var(--font-sans), sans-serif"
              fontWeight="600"
            >
              2. {selectedInvoice.conditionalRule?.percentage ?? "2.00"}% Early Discount (
              {selectedInvoice.conditionalRule?.triggerDate?.slice(5) ?? "11-12"})
            </text>

            <line
              x1="377"
              y1="22"
              x2="412"
              y2="22"
              stroke="#94A3B8"
              strokeWidth="1.5"
              markerEnd="url(#bryntum-arrow)"
            />

            {/* Step 3: Smart Dunning Reminder */}
            <rect
              x="416"
              y="8"
              width="155"
              height="28"
              rx="6"
              fill="#EFF6FF"
              stroke="#BFDBFE"
              strokeWidth="1.2"
            />
            <text
              x="493"
              y="25"
              textAnchor="middle"
              fill="#1E40AF"
              fontSize="10"
              fontFamily="var(--font-sans), sans-serif"
              fontWeight="600"
            >
              3. Friendly Reminder (72h Safe)
            </text>

            <line
              x1="571"
              y1="22"
              x2="604"
              y2="22"
              stroke="#94A3B8"
              strokeWidth="1.5"
              markerEnd="url(#bryntum-arrow)"
            />

            {/* Step 4: Net Due Date & Late Fee */}
            <rect
              x="608"
              y="8"
              width="144"
              height="28"
              rx="6"
              fill="#FFFBEB"
              stroke="#FDE68A"
              strokeWidth="1.2"
            />
            <text
              x="680"
              y="25"
              textAnchor="middle"
              fill="#92400E"
              fontSize="10"
              fontFamily="var(--font-sans), sans-serif"
              fontWeight="600"
            >
              4. Due {selectedInvoice.dueDate.slice(5)} · 1.5% Late Fee
            </text>
          </svg>
        </div>
      )}

      {/* Empty State */}
      {uiState === "empty" || invoices.length === 0 ? (
        <div className="rounded-xl border border-hairline bg-elevated p-10 text-center space-y-3">
          <p className="text-sm text-ink-secondary">
            No scheduled PayPal Invoices or Recurring Series in this timeline view.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUiState("success");
                if (invoices.length === 0 && MOCK_INVOICES[0]) {
                  createAutonomousInvoice(MOCK_INVOICES[0]);
                }
              }}
              className="btn-primary-mint px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Create First Autonomous PayPal Invoice v2
            </button>
            <button
              type="button"
              onClick={() => {
                setUiState("success");
                if (MOCK_RECURRING_SERIES[0]) {
                  createRecurringSeries(MOCK_RECURRING_SERIES[0]);
                }
              }}
              className="btn-outline-subtle px-4 py-2 text-xs font-mono cursor-pointer"
            >
              Import Recurring Series (#16)
            </button>
          </div>
        </div>
      ) : (
        /* Scheduler Timeline Matrix */
        <div className="overflow-x-auto rounded-xl border border-hairline bg-elevated shadow-xs">
          <table
            aria-label="Bryntum Receivables and Subscription Timeline"
            className="w-full min-w-[640px] table-fixed border-collapse text-xs"
          >
            <thead>
              <tr className="border-b border-hairline bg-surface/80 text-[10px] font-semibold uppercase tracking-[0.03em] text-ink-muted">
                <th className="py-2.5 px-2 text-left w-[148px]">Customer / Invoice</th>
                {TIMELINE_DATES.map((dt) => (
                  <th
                    key={dt}
                    className="py-2.5 px-0.5 text-center border-l border-border-subtle text-[10px] font-medium tabular-nums"
                  >
                    {dt.slice(5)}
                  </th>
                ))}
                <th className="py-2.5 px-2 text-right border-l border-border-subtle w-[148px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {invoices.map((inv) => {
                const triggerDate = inv.conditionalRule?.triggerDate ?? "2026-11-12";
                const isEarlyDiscount = inv.conditionalRule?.ruleType === "EARLY_PAYMENT_DISCOUNT";
                const isSelected = selectedInvoice?.invoiceId === inv.invoiceId;
                const isPendingSync = pendingSyncInvoiceIds.includes(inv.invoiceId);
                const shortPct = parseFloat(inv.conditionalRule?.percentage ?? "2").toString();

                return (
                  <tr
                    key={inv.invoiceId}
                    onClick={() => setSelectedInvoiceId(inv.invoiceId)}
                    className={`cursor-pointer ${isSelected ? "ledger-row-active" : "ledger-row"}`}
                  >
                    <td className="py-2.5 px-2 overflow-hidden">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold text-ink tabular-nums truncate">
                          {inv.invoiceNumber}
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {isPendingSync && (
                            <span className="rounded-pill border border-status-warning-border bg-status-warning-bg px-1 py-0 text-[9px] font-semibold text-status-warning-text">
                              Q
                            </span>
                          )}
                          <span
                            className={`rounded-pill border px-1.5 py-0 text-[9px] font-medium ${
                              inv.status === "PAID"
                                ? "border-status-success-border bg-status-success-bg text-status-success-text"
                                : inv.status === "OVERDUE"
                                  ? "border-status-danger-border bg-status-danger-bg text-status-danger-text"
                                  : "border-status-info-border bg-status-info-bg text-status-info-text"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-0.5 text-[10px] text-ink-muted truncate">
                        {inv.recipientEmail}
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-1 tabular-nums truncate">
                        <span className="text-[11px] font-semibold text-ink">
                          {formatCurrencyAmount(inv.amountValue, inv.currencyCode, activeCurrency)}
                        </span>
                        <span className="text-[9.5px] text-ink-muted truncate">
                          {
                            formatDualCurrency(
                              inv.amountValue,
                              inv.currencyCode,
                              activeCurrency === inv.currencyCode ? "INR" : activeCurrency
                            ).secondary
                          }
                        </span>
                      </div>
                    </td>

                    {TIMELINE_DATES.map((slotDate) => {
                      const isTriggerSlot = slotDate === triggerDate;
                      const isDueSlot = slotDate === inv.dueDate;
                      const slotKey = `${inv.invoiceId}:${slotDate}`;
                      const isDragOverTarget = dragOverSlot === slotKey;

                      return (
                        <td
                          key={slotDate}
                          onDragOver={(e) => e.preventDefault()}
                          onDragEnter={() => setDragOverSlot(slotKey)}
                          onDragLeave={() =>
                            setDragOverSlot((prev) => (prev === slotKey ? null : prev))
                          }
                          onDrop={(e) => {
                            e.stopPropagation();
                            void handleMilestoneDrop(inv, slotDate);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleMilestoneDrop(inv, slotDate);
                          }}
                          className={`py-2.5 px-0.5 border-l border-border-subtle text-center cursor-pointer transition-colors hover:bg-surface ${
                            isDragOverTarget
                              ? "bg-paypal-blue/10 ring-1 ring-inset ring-paypal-blue/40"
                              : ""
                          }`}
                          title={`Click or drop milestone bar to reschedule ${inv.invoiceNumber} reminder to ${slotDate}`}
                        >
                          {isTriggerSlot && (
                            <div
                              draggable
                              onDragStart={() => setDraggingInvoiceId(inv.invoiceId)}
                              onDragEnd={() => {
                                setDraggingInvoiceId(null);
                                setDragOverSlot(null);
                              }}
                              className={`inline-flex items-center rounded-md border px-1 py-0.5 text-[10px] font-semibold tabular-nums shadow-2xs transition-all duration-150 hover:-translate-y-[1px] active:scale-[0.97] cursor-grab whitespace-nowrap ${
                                isEarlyDiscount
                                  ? "border-status-success-border bg-status-success-bg text-status-success-text"
                                  : "border-status-warning-border bg-status-warning-bg text-status-warning-text"
                              } ${draggingInvoiceId === inv.invoiceId ? "opacity-50" : ""}`}
                            >
                              <span>
                                {isEarlyDiscount ? `★${shortPct}%` : `⚠${shortPct}%`}
                              </span>
                            </div>
                          )}

                          {isDueSlot && !isTriggerSlot && (
                            <div className="inline-flex items-center rounded-md border border-status-info-border bg-status-info-bg px-1 py-0.5 text-[10px] font-medium text-status-info-text whitespace-nowrap">
                              Due
                            </div>
                          )}
                        </td>
                      );
                    })}

                    <td
                      className="py-2.5 px-2 border-l border-border-subtle text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col items-end gap-1">
                        {/* WCAG 2.2 AA Criterion 2.5.7: Keyboard-Accessible Date Popover Selector */}
                        <select
                          aria-label={`Reschedule dunning date for ${inv.invoiceNumber} without dragging (WCAG 2.5.7)`}
                          value={triggerDate}
                          onChange={(e) => void handleMilestoneDrop(inv, e.target.value)}
                          className="w-full rounded-md border border-hairline bg-surface px-1 py-0.5 text-[10px] font-medium text-ink tabular-nums cursor-pointer hover:border-border-strong"
                        >
                          {TIMELINE_DATES.map((dt) => (
                            <option key={dt} value={dt}>
                              Date: {dt.slice(5)}
                            </option>
                          ))}
                        </select>

                        <div className="inline-flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() => openQrModal(inv)}
                            className="rounded border border-hairline bg-elevated px-1.5 py-0.5 text-[9.5px] font-medium text-ink-secondary shadow-2xs transition-all duration-150 hover:border-border-strong hover:text-ink cursor-pointer"
                            title="View QR Payment Code"
                          >
                            QR
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleMilestoneDrop(inv, "2026-11-18")}
                            className="rounded border border-hairline bg-elevated px-1.5 py-0.5 text-[9.5px] font-medium text-ink-secondary shadow-2xs transition-all duration-150 hover:border-border-strong hover:text-ink cursor-pointer"
                            title="Send Friendly Reminder"
                          >
                            Remind
                          </button>

                          <button
                            type="button"
                            onClick={() => openPyusdModal(inv)}
                            className="rounded border border-status-success-border bg-status-success-bg px-1.5 py-0.5 text-[9.5px] font-semibold text-status-success-text shadow-2xs transition-all duration-150 cursor-pointer"
                            title="Settle via PYUSD"
                          >
                            PYUSD
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Recurring Invoice Series Lanes */}
              {recurringSeries.map((series) => (
                <tr key={series.seriesId} className="ledger-row">
                  <td className="py-2.5 px-2 overflow-hidden">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-ink">
                      <Repeat className="h-3 w-3 text-ink-secondary shrink-0" />
                      <span className="truncate">{series.seriesId}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-ink-muted truncate">
                      {series.seriesName}
                    </div>
                    <div className="mt-0.5 text-[11px] font-semibold text-ink tabular-nums">
                      {formatCurrencyAmount(series.amountValue, series.currencyCode, activeCurrency)}{" "}
                      / {series.cadence === "MONTHLY" ? "Mo" : series.cadence}
                    </div>
                  </td>
                  <td colSpan={7} className="px-2 py-2 border-l border-border-subtle">
                    <div className="w-full rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-[11px] text-ink-secondary flex items-center justify-between gap-2 min-w-0">
                      <span className="truncate min-w-0">
                        Monthly Retainer · Next:{" "}
                        <strong className="font-semibold text-ink tabular-nums">
                          {series.nextTriggerDate}
                        </strong>
                      </span>
                      <span
                        className={`shrink-0 rounded-pill border px-2 py-0.5 text-[10px] font-medium ${
                          series.status === "ACTIVE"
                            ? "border-status-success-border bg-status-success-bg text-status-success-text"
                            : "border-status-warning-border bg-status-warning-bg text-status-warning-text"
                        }`}
                      >
                        {series.status === "ACTIVE" ? "Active · Monthly" : "Paused"}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 border-l border-border-subtle text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleRecurringSeriesStatus(series.seriesId)}
                      className="inline-flex items-center gap-1 rounded-md border border-hairline bg-elevated px-2 py-1 text-[10px] font-medium text-ink shadow-2xs transition-all duration-150 hover:border-border-strong cursor-pointer"
                    >
                      {series.status === "ACTIVE" ? (
                        <>
                          <Pause className="h-3 w-3" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          Resume
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}

              {/* Subscription Billing Cycle Lanes */}
              {subscriptionPlans.map((plan) => (
                <tr key={plan.planId} className="ledger-row">
                  <td className="py-2.5 px-2 overflow-hidden">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-ink">
                      <Repeat className="h-3 w-3 text-ink-secondary shrink-0" />
                      <span className="truncate">
                        {plan.planName.split("—")[0]?.trim() || "Retainer Plan"}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-ink-muted truncate">
                      {plan.planName}
                    </div>
                    <div className="mt-0.5 text-[11px] font-semibold text-ink tabular-nums">
                      {formatCurrencyAmount(plan.amountValue, plan.currencyCode, activeCurrency)} /{" "}
                      {plan.billingIntervalUnit === "MONTH" ? "Mo" : "Yr"}
                    </div>
                  </td>
                  <td colSpan={7} className="px-2 py-2 border-l border-border-subtle">
                    <div className="w-full rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-[11px] text-ink-secondary flex items-center justify-between gap-2 min-w-0">
                      <span className="truncate min-w-0">Recurring Subscription · Auto-Renewing</span>
                      <span
                        className={`shrink-0 rounded-pill border px-2 py-0.5 text-[10px] font-medium ${
                          plan.status === "ACTIVE"
                            ? "border-status-success-border bg-status-success-bg text-status-success-text"
                            : "border-status-danger-border bg-status-danger-bg text-status-danger-text"
                        }`}
                      >
                        {plan.status === "ACTIVE" ? "Active · Auto-Renew" : "Cancelled"}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-1.5 border-l border-border-subtle text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => activateSubscriberOnPlan(plan.planId)}
                        className="shrink-0 rounded border border-hairline bg-elevated px-1.5 py-0.5 text-[9.5px] font-medium text-ink shadow-2xs transition-all duration-150 hover:border-border-strong cursor-pointer"
                        title="Add Subscriber"
                      >
                        +Sub
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nextAmt = ((parseFloat(plan.amountValue) || 500) * 1.1).toFixed(2);
                          updateSubscriptionPlanPricing(plan.planId, nextAmt);
                        }}
                        className="shrink-0 rounded border border-hairline bg-elevated px-1.5 py-0.5 text-[9.5px] font-medium text-ink tabular-nums shadow-2xs transition-all duration-150 hover:border-border-strong cursor-pointer"
                        title="Adjust Plan Price (+10%)"
                      >
                        +10%
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelSubscriptionPlanWithGuard(plan.planId)}
                        className="shrink-0 rounded border border-status-warning-border bg-status-warning-bg px-1.5 py-0.5 text-[9.5px] font-semibold text-status-warning-text shadow-2xs transition-all duration-150 cursor-pointer"
                        title="Cancel Subscription Plan"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Dispute SLA Response Deadlines Lane */}
              {disputes.slice(0, 2).map((dispute) => (
                <tr key={dispute.disputeId} className="ledger-row">
                  <td className="py-2.5 px-2 overflow-hidden">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-status-warning-text">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span className="truncate">{dispute.disputeId}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-ink-muted truncate">
                      Order {dispute.orderId}
                    </div>
                    <div className="mt-0.5 text-[11px] font-semibold text-ink tabular-nums">
                      {formatCurrencyAmount(
                        dispute.disputedAmountValue,
                        dispute.currencyCode,
                        activeCurrency
                      )}{" "}
                      Hold
                    </div>
                  </td>
                  <td colSpan={7} className="px-2 py-2 border-l border-border-subtle">
                    <div className="w-full rounded-lg border border-status-warning-border bg-status-warning-bg px-2.5 py-1.5 text-[11px] text-status-warning-text flex items-center justify-between gap-2 min-w-0">
                      <span className="truncate min-w-0">
                        Evidence Due:{" "}
                        <strong className="tabular-nums">
                          {dispute.responseDueIso.slice(0, 10)}
                        </strong>{" "}
                        · {dispute.carrierCode.replace("_", " ")} (Delivered)
                      </span>
                      <span className="shrink-0 rounded-pill bg-elevated px-2 py-0.5 text-[10px] font-medium border border-status-warning-border">
                        Proof Ready
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 border-l border-border-subtle text-right text-[10.5px] font-medium text-ink-secondary whitespace-nowrap">
                    Auto-Defend
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
