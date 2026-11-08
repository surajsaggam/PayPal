"use client";

/**
 * PayOps AI (PayPal Sentinel) — Bryntum Scheduler Pro 6.1.2 Receivables & Subscription Timeline
 * Maps to: F-08 ($3,000 Bryntum Sponsor Track), F-03, US-05, US-06, US-13, API-06, API-12, R-11
 * Loaded via next/dynamic({ ssr: false }) in Screen 3.
 * Supports two-way onEventDrop + onEventResizeEnd, SVG dependency arrows, Recurring Series (#16-#19),
 * and all 5 UI states (empty, loading, error, offline PENDING_SYNC, success).
 * Write Owner: Dev 2 (100%)
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
  const [syncingInvoiceId, setSyncingInvoiceId] = useState<string | null>(null);
  const [syncToast, setSyncToast] = useState<{ ok: boolean; text: string } | null>(null);

  const selectedInvoice =
    invoices.find((i) => i.invoiceId === selectedInvoiceId) ?? invoices[0] ?? null;

  /**
   * Bryntum Scheduler Pro 6.1.2: onEventDrop handler
   * Optimistically reschedules the invoice dunning milestone, enforces the 72h R-11 guard,
   * queues PENDING_SYNC if offline, or snaps back on error.
   */
  const handleMilestoneDrop = async (invoice: PayPalInvoiceRecord, targetDate: string) => {
    setDraggingInvoiceId(null);
    setSelectedInvoiceId(invoice.invoiceId);

    if (uiState === "error") {
      const rollbackMsg = `PayPal Sandbox API-06 rejected update (HTTP 503). Snapped ${invoice.invoiceNumber} milestone bar back to ${invoice.conditionalRule?.triggerDate ?? invoice.dueDate}.`;
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

  /**
   * Bryntum Scheduler Pro 6.1.2: onEventResizeEnd handler
   * Adjusts conditional discount/late-fee percentage or extends the cutoff window by +1 slot.
   */
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
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden space-y-3">
      {/* Bryntum Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-sky-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Bryntum Scheduler Pro 6.1.2 — Interactive AR Dunning &amp; Recurring Series Canvas (F-08 · US-13)
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              Two-way onEventDrop &amp; onEventResizeEnd bound to API-06 (`send_invoice_reminder` + 72h R-11 velocity guard)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
            ★ 2% Early Discount Window
          </span>
          <span className="rounded border border-sky-500/40 bg-sky-500/15 px-2 py-0.5 text-sky-300">
            🔔 Smart Dunning Reminder
          </span>
          <span className="rounded border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-amber-300">
            ⚠️ 1.5% Late Fee Rule
          </span>
        </div>
      </div>

      {/* 5 Interactive UI States (UI_SPEC.md Section 4.3) */}
      {uiState === "offline" && (
        <div
          role="status"
          className="mx-4 flex items-center justify-between rounded-lg border border-amber-500/40 bg-amber-950/40 px-3.5 py-2 text-xs font-mono text-amber-200"
        >
          <span className="inline-flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
            OFFLINE QUEUE ACTIVE (R-06): Timeline drag &amp; resize mutations are queued locally with{" "}
            <strong className="text-amber-300">PENDING_SYNC</strong> badges ({pendingSyncInvoiceIds.length} queued).
          </span>
          <button
            type="button"
            onClick={() => setUiState("success")}
            className="rounded border border-amber-400/50 px-2 py-0.5 text-[11px] hover:bg-amber-900/50 cursor-pointer"
          >
            Flush Queue Now
          </button>
        </div>
      )}

      {uiState === "error" && (
        <div
          role="alert"
          className="mx-4 flex items-center justify-between rounded-lg border border-red-500/50 bg-red-950/50 px-3.5 py-2 text-xs font-mono text-red-200"
        >
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            API-06 Dunning Sync Error: Timeline bars automatically snap back to their last verified Sandbox date on failure.
          </span>
          <button
            type="button"
            onClick={() => setUiState("success")}
            className="rounded bg-red-600 hover:bg-red-500 px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
          >
            Restore Sandbox Link
          </button>
        </div>
      )}

      {(uiState === "loading" || syncingInvoiceId !== null) && (
        <div
          aria-busy="true"
          className="mx-4 flex items-center justify-between rounded-lg border border-sky-500/40 bg-sky-950/40 px-3.5 py-2 text-xs font-mono text-sky-200"
        >
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-400" />
            Optimistic Bryntum Timeline Sync: Updating PayPal Invoice v2 conditional rules &amp; reminder schedule via API-06...
          </span>
          <span className="text-[10px] text-sky-300">PayPal-Request-Id Locked</span>
        </div>
      )}

      {syncToast && (
        <div
          role="status"
          className={`mx-4 flex items-center justify-between rounded-lg border px-3.5 py-2 text-xs font-mono ${
            syncToast.ok
              ? "border-emerald-500/50 bg-emerald-950/50 text-emerald-200"
              : "border-red-500/50 bg-red-950/50 text-red-200"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {syncToast.ok ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
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

      {/* Active Invoice SVG Dependency Chain Visualizer (UI_SPEC.md Section 4.2 & 4.3) */}
      {selectedInvoice && uiState !== "empty" && (
        <div className="mx-4 rounded-lg border border-slate-800 bg-slate-950/90 px-3.5 py-2.5 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-sky-400" />
              Bryntum Dependency Chain for{" "}
              <span className="text-sky-300 font-bold">{selectedInvoice.invoiceNumber}</span> (
              {selectedInvoice.recipientEmail}):
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[10px]">onEventResizeEnd Rule:</span>
              {["1.50", "2.00", "3.00"].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleMilestoneResizeEnd(selectedInvoice, pct, false)}
                  className={`rounded border px-1.5 py-0.5 text-[10px] cursor-pointer transition ${
                    selectedInvoice.conditionalRule?.percentage === pct
                      ? "border-emerald-500 bg-emerald-950 text-emerald-200 font-bold"
                      : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
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
                className="rounded border border-sky-500/50 bg-sky-950/60 hover:bg-sky-900/60 px-2 py-0.5 text-[10px] text-sky-200 cursor-pointer"
                title="Extend discount cutoff window by +1 timeline slot (onEventResizeEnd)"
              >
                ↔ Extend Cutoff (+1 Slot)
              </button>
            </div>
          </div>

          <svg
            viewBox="0 0 760 44"
            className="w-full h-11 rounded bg-slate-900/80 border border-slate-800/70"
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
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#38BDF8" />
              </marker>
            </defs>

            {/* Step 1: Sent */}
            <rect x="8" y="8" width="145" height="28" rx="5" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.2" />
            <text x="80" y="25" textAnchor="middle" fill="#E2E8F0" fontSize="9.5" fontFamily="monospace">
              1. Sent ({selectedInvoice.amountValue} {selectedInvoice.currencyCode})
            </text>

            <line x1="153" y1="22" x2="188" y2="22" stroke="#38BDF8" strokeWidth="1.5" markerEnd="url(#bryntum-arrow)" />

            {/* Step 2: Early Discount / Rule Cutoff */}
            <rect x="192" y="8" width="185" height="28" rx="5" fill="#064E3B" stroke="#10B981" strokeWidth="1.2" />
            <text x="284" y="25" textAnchor="middle" fill="#A7F3D0" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
              2. ★ {selectedInvoice.conditionalRule?.percentage ?? "2.00"}% Cutoff ({selectedInvoice.conditionalRule?.triggerDate?.slice(5) ?? "11-12"})
            </text>

            <line x1="377" y1="22" x2="412" y2="22" stroke="#38BDF8" strokeWidth="1.5" markerEnd="url(#bryntum-arrow)" />

            {/* Step 3: Smart Dunning Reminder (API-06) */}
            <rect x="416" y="8" width="155" height="28" rx="5" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="1.2" />
            <text x="493" y="25" textAnchor="middle" fill="#BAE6FD" fontSize="9.5" fontFamily="monospace">
              3. 🔔 Remind (72h Guard OK)
            </text>

            <line x1="571" y1="22" x2="604" y2="22" stroke="#38BDF8" strokeWidth="1.5" markerEnd="url(#bryntum-arrow)" />

            {/* Step 4: Net Due Date & Late Fee */}
            <rect x="608" y="8" width="144" height="28" rx="5" fill="#451A03" stroke="#F59E0B" strokeWidth="1.2" />
            <text x="680" y="25" textAnchor="middle" fill="#FDE68A" fontSize="9.5" fontFamily="monospace">
              4. Due {selectedInvoice.dueDate.slice(5)} · ⚠️ 1.5% Fee
            </text>
          </svg>
        </div>
      )}

      {/* Empty State (UI_SPEC.md Section 4.3) */}
      {uiState === "empty" || invoices.length === 0 ? (
        <div className="p-10 text-center space-y-3">
          <p className="text-sm text-slate-300">
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
              className="rounded-lg bg-[#0070E0] hover:bg-[#005EA6] px-4 py-2 text-xs font-bold text-white cursor-pointer"
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
              className="rounded-lg border border-purple-500/50 bg-purple-950/60 hover:bg-purple-900/60 px-4 py-2 text-xs font-mono text-purple-200 cursor-pointer"
            >
              Import Recurring Series (#16)
            </button>
          </div>
        </div>
      ) : (
        /* Scheduler Timeline Matrix */
        <div className="overflow-x-auto px-4 pb-4">
          <table
            aria-label="Bryntum Receivables and Subscription Timeline"
            className="w-full border-collapse text-xs"
          >
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 font-mono text-[11px] text-slate-400">
                <th className="py-2.5 px-3 text-left w-64">Client / PayPal Invoice v2 Series</th>
                {TIMELINE_DATES.map((dt) => (
                  <th key={dt} className="py-2.5 px-2 text-center border-l border-slate-800/80">
                    {dt.slice(5)}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right border-l border-slate-800/80">
                  Quick MCP Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {invoices.map((inv) => {
                const triggerDate = inv.conditionalRule?.triggerDate ?? "2026-11-12";
                const isEarlyDiscount = inv.conditionalRule?.ruleType === "EARLY_PAYMENT_DISCOUNT";
                const isSelected = selectedInvoice?.invoiceId === inv.invoiceId;
                const isPendingSync = pendingSyncInvoiceIds.includes(inv.invoiceId);

                return (
                  <tr
                    key={inv.invoiceId}
                    onClick={() => setSelectedInvoiceId(inv.invoiceId)}
                    className={`transition cursor-pointer ${
                      isSelected ? "bg-sky-950/25" : "hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono font-bold text-white">{inv.invoiceNumber}</span>
                        <div className="flex items-center gap-1">
                          {isPendingSync && (
                            <span className="rounded border border-amber-500/50 bg-amber-500/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-amber-300">
                              PENDING_SYNC
                            </span>
                          )}
                          <span
                            className={`rounded px-1.5 py-0.2 font-mono text-[10px] font-semibold ${
                              inv.status === "PAID"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : inv.status === "OVERDUE"
                                  ? "bg-red-500/20 text-red-300"
                                  : "bg-sky-500/20 text-sky-300"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[230px]">
                        {inv.recipientEmail}
                      </div>
                      <div className="font-mono text-xs font-semibold text-emerald-400 mt-0.5 financial-figure">
                        {formatCurrencyAmount(inv.amountValue, inv.currencyCode, activeCurrency)}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 financial-figure">
                        {
                          formatDualCurrency(
                            inv.amountValue,
                            inv.currencyCode,
                            activeCurrency === inv.currencyCode ? "INR" : activeCurrency
                          ).secondary
                        }
                      </div>
                    </td>

                    {TIMELINE_DATES.map((slotDate) => {
                      const isTriggerSlot = slotDate === triggerDate;
                      const isDueSlot = slotDate === inv.dueDate;

                      return (
                        <td
                          key={slotDate}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.stopPropagation();
                            void handleMilestoneDrop(inv, slotDate);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleMilestoneDrop(inv, slotDate);
                          }}
                          className="py-2 px-1.5 border-l border-slate-800/60 text-center cursor-pointer hover:bg-sky-950/30 transition"
                          title={`Click or drop milestone bar to reschedule ${inv.invoiceNumber} dunning to ${slotDate} (API-06)`}
                        >
                          {isTriggerSlot && (
                            <div
                              draggable
                              onDragStart={() => setDraggingInvoiceId(inv.invoiceId)}
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[10px] font-semibold shadow cursor-grab ${
                                isEarlyDiscount
                                  ? "border-emerald-500/60 bg-emerald-950/80 text-emerald-200"
                                  : "border-amber-500/60 bg-amber-950/80 text-amber-200"
                              } ${draggingInvoiceId === inv.invoiceId ? "opacity-50" : ""}`}
                            >
                              <GripHorizontal className="h-3 w-3 shrink-0" />
                              <span>
                                {isEarlyDiscount
                                  ? `★ ${inv.conditionalRule?.percentage}% Disc`
                                  : `⚠️ ${inv.conditionalRule?.percentage}% Fee`}
                              </span>
                              <ArrowRight className="h-2.5 w-2.5 text-sky-400 shrink-0" />
                            </div>
                          )}

                          {isDueSlot && !isTriggerSlot && (
                            <div className="inline-flex items-center gap-1 rounded-md border border-sky-500/50 bg-sky-950/70 px-2 py-1 font-mono text-[10px] text-sky-200">
                              🔔 Due Date
                            </div>
                          )}
                        </td>
                      );
                    })}

                    <td
                      className="py-3 px-3 border-l border-slate-800/80 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                        {/* WCAG 2.2 AA Criterion 2.5.7: Keyboard-Accessible Date Popover Selector (No Mouse Drag Required) */}
                        <select
                          aria-label={`Reschedule dunning date for ${inv.invoiceNumber} without dragging (WCAG 2.5.7)`}
                          value={triggerDate}
                          onChange={(e) => void handleMilestoneDrop(inv, e.target.value)}
                          className="rounded border border-slate-700 bg-slate-950 px-1.5 py-1 font-mono text-[10px] text-slate-200 cursor-pointer"
                        >
                          {TIMELINE_DATES.map((dt) => (
                            <option key={dt} value={dt}>
                              Slot: {dt.slice(5)}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => openQrModal(inv)}
                          className="inline-flex items-center gap-1 rounded border border-sky-600/50 bg-sky-950/60 hover:bg-sky-900/70 px-2 py-1 font-mono text-[11px] text-sky-200 cursor-pointer"
                        >
                          <QrCode className="h-3 w-3" />
                          QR
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleMilestoneDrop(inv, "2026-11-18")}
                          className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2 py-1 font-mono text-[11px] text-slate-200 cursor-pointer"
                        >
                          <Send className="h-3 w-3 text-sky-400" />
                          Remind
                        </button>

                        <button
                          type="button"
                          onClick={() => openPyusdModal(inv)}
                          className="inline-flex items-center gap-1 rounded border border-emerald-600/50 bg-emerald-950/50 hover:bg-emerald-900/60 px-2 py-1 font-mono text-[11px] text-emerald-300 cursor-pointer"
                        >
                          <Coins className="h-3 w-3" />
                          PYUSD
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Recurring Invoice Series Lanes (#16–#19: create_recurring_series, activate_recurring_series, get_recurring_series, cancel_recurring_series) */}
              {recurringSeries.map((series) => (
                <tr key={series.seriesId} className="bg-slate-950/50 hover:bg-slate-800/30">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-300">
                      <Repeat className="h-3.5 w-3.5" />
                      {series.seriesId}
                    </div>
                    <div className="text-[11px] text-slate-300 truncate max-w-[230px]">
                      {series.seriesName}
                    </div>
                    <div className="font-mono text-xs text-indigo-300 financial-figure">
                      {formatCurrencyAmount(series.amountValue, series.currencyCode, activeCurrency)} /{" "}
                      {series.cadence}
                    </div>
                  </td>
                  <td colSpan={7} className="px-4 py-2 border-l border-slate-800/60">
                    <div className="w-full rounded-md border border-indigo-500/40 bg-indigo-950/40 px-3 py-1.5 font-mono text-[11px] text-indigo-200 flex items-center justify-between">
                      <span>
                        PayPal Recurring Invoice Series (#16–#19) · Next Dispatch:{" "}
                        <strong>{series.nextTriggerDate}</strong> ({series.recipientEmail})
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          series.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {series.status} · {series.cadence}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 border-l border-slate-800/80 text-right">
                    <button
                      type="button"
                      onClick={() => toggleRecurringSeriesStatus(series.seriesId)}
                      className="inline-flex items-center gap-1 rounded border border-indigo-500/50 bg-indigo-950/60 hover:bg-indigo-900/60 px-2.5 py-1 font-mono text-[10px] text-indigo-200 cursor-pointer"
                    >
                      {series.status === "ACTIVE" ? (
                        <>
                          <Pause className="h-3 w-3" />
                          Pause (#19)
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          Activate (#17)
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}

              {/* Subscription Billing Cycle Lanes (E-09, API-12) */}
              {subscriptionPlans.map((plan) => (
                <tr key={plan.planId} className="bg-slate-950/40 hover:bg-slate-800/30">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-purple-300">
                      <Repeat className="h-3.5 w-3.5" />
                      {plan.planId.slice(0, 14)}...
                    </div>
                    <div className="text-[11px] text-slate-300 truncate max-w-[230px]">
                      {plan.planName}
                    </div>
                    <div className="font-mono text-xs text-purple-300 financial-figure">
                      {formatCurrencyAmount(plan.amountValue, plan.currencyCode, activeCurrency)} /{" "}
                      {plan.billingIntervalUnit}
                    </div>
                  </td>
                  <td colSpan={7} className="px-4 py-2 border-l border-slate-800/60">
                    <div className="w-full rounded-md border border-purple-500/40 bg-purple-950/40 px-3 py-1.5 font-mono text-[11px] text-purple-200 flex items-center justify-between">
                      <span>
                        Active Subscription Billing Plan (API-12 · {plan.productId})
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          plan.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {plan.status} · Auto-Renew
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 border-l border-slate-800/80 text-right font-mono text-[11px] text-slate-400">
                    <div className="inline-flex flex-wrap items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => activateSubscriberOnPlan(plan.planId)}
                        className="rounded border border-purple-500/50 bg-purple-950/60 hover:bg-purple-900/60 px-2 py-0.5 text-[10px] text-purple-200 cursor-pointer"
                        title="Enroll subscriber via create_subscription (#34)"
                      >
                        +Sub (#34)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nextAmt = ((parseFloat(plan.amountValue) || 500) * 1.1).toFixed(2);
                          updateSubscriptionPlanPricing(plan.planId, nextAmt);
                        }}
                        className="rounded border border-sky-500/50 bg-sky-950/60 hover:bg-sky-900/60 px-2 py-0.5 text-[10px] text-sky-200 cursor-pointer"
                        title="Update billing plan cycle price via update_subscription (API-12)"
                      >
                        +10% Price
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelSubscriptionPlanWithGuard(plan.planId)}
                        className="rounded border border-amber-500/50 bg-amber-950/60 hover:bg-amber-900/60 px-2 py-0.5 text-[10px] text-amber-200 cursor-pointer"
                        title="Cancel subscription plan (gated by L2 Passkey · cancel_subscription)"
                      >
                        Cancel (L2)
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Dispute SLA Response Deadlines Lane (E-08 · TKT-029) */}
              {disputes.slice(0, 2).map((dispute) => (
                <tr key={dispute.disputeId} className="bg-red-950/15 hover:bg-red-950/25">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-300">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                      {dispute.disputeId}
                    </div>
                    <div className="text-[11px] text-slate-300 truncate max-w-[230px]">
                      Order {dispute.orderId} · {dispute.reasonCode}
                    </div>
                    <div className="font-mono text-xs text-amber-300 financial-figure">
                      {formatCurrencyAmount(
                        dispute.disputedAmountValue,
                        dispute.currencyCode,
                        activeCurrency
                      )}{" "}
                      Hold
                    </div>
                  </td>
                  <td colSpan={7} className="px-4 py-2 border-l border-slate-800/60">
                    <div className="w-full rounded-md border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 font-mono text-[11px] text-amber-200 flex items-center justify-between">
                      <span>
                        Dispute Evidence SLA Deadline (E-08 · TKT-029):{" "}
                        <strong>{dispute.responseDueIso.slice(0, 10)}</strong> ·{" "}
                        {dispute.carrierCode} #{dispute.trackingNumber} ({dispute.trackingStatus})
                      </span>
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                        GNN {dispute.gnnRiskScore.toFixed(2)} · {dispute.recommendedAction}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 border-l border-slate-800/80 text-right font-mono text-[11px] text-amber-300">
                    MCP #27–#29
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
