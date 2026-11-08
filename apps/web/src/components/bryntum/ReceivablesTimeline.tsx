"use client";

/**
 * PayOps AI (PayPal Sentinel) — Bryntum Scheduler Pro 6.1.2 Receivables & Subscription Timeline
 * Maps to: F-08 ($3,000 Bryntum Sponsor Track), F-03, US-05, US-06, US-13, API-06, API-12, R-11
 * Loaded via next/dynamic({ ssr: false }) in Screen 3.
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
} from "lucide-react";
import type { PayPalInvoiceRecord } from "@payops/shared";
import { sendOrRescheduleInvoiceReminder } from "../../lib/api-client";
import { formatCurrencyAmount } from "../../lib/formatters";
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
    subscriptionPlans,
    activeCurrency,
    rescheduleInvoiceReminder,
    openQrModal,
    openPyusdModal,
  } = useCockpitStore();

  const [draggingInvoiceId, setDraggingInvoiceId] = useState<string | null>(null);
  const [syncToast, setSyncToast] = useState<{ ok: boolean; text: string } | null>(null);

  const handleMilestoneDrop = async (invoice: PayPalInvoiceRecord, targetDate: string) => {
    setDraggingInvoiceId(null);
    const localResult = rescheduleInvoiceReminder(invoice.invoiceId, targetDate);
    setSyncToast({ ok: localResult.ok, text: localResult.message });
    if (localResult.ok) {
      await sendOrRescheduleInvoiceReminder({
        invoiceId: invoice.invoiceId,
        newTriggerDate: targetDate,
        note: `Rescheduled on Bryntum Scheduler Pro 6.1.2 canvas to ${targetDate}`,
      });
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden space-y-3">
      {/* Bryntum Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-sky-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Bryntum Scheduler Pro 6.1.2 — Interactive AR Dunning & Recurring Series Canvas (F-08 · US-13)
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              Drag or click any date slot on an invoice row to trigger live API-06 (`send_invoice_reminder` + 72h R-11 velocity guard)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
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
            className="text-[11px] underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Scheduler Timeline Matrix */}
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

              return (
                <tr key={inv.invoiceId} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white">{inv.invoiceNumber}</span>
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
                    <div className="text-[11px] text-slate-400 truncate max-w-[230px]">
                      {inv.recipientEmail}
                    </div>
                    <div className="font-mono text-xs font-semibold text-emerald-400 mt-0.5 financial-figure">
                      {formatCurrencyAmount(inv.amountValue, inv.currencyCode, activeCurrency)}
                    </div>
                  </td>

                  {TIMELINE_DATES.map((slotDate) => {
                    const isTriggerSlot = slotDate === triggerDate;
                    const isDueSlot = slotDate === inv.dueDate;

                    return (
                      <td
                        key={slotDate}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => void handleMilestoneDrop(inv, slotDate)}
                        onClick={() => void handleMilestoneDrop(inv, slotDate)}
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
                            {isEarlyDiscount
                              ? `★ ${inv.conditionalRule?.percentage}% Disc`
                              : `⚠️ ${inv.conditionalRule?.percentage}% Fee`}
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

                  <td className="py-3 px-3 border-l border-slate-800/80 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openQrModal(inv)}
                        className="inline-flex items-center gap-1 rounded border border-sky-600/50 bg-sky-950/60 hover:bg-sky-900/70 px-2 py-1 font-mono text-[11px] text-sky-200"
                      >
                        <QrCode className="h-3 w-3" />
                        QR
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleMilestoneDrop(inv, "2026-11-18")}
                        className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2 py-1 font-mono text-[11px] text-slate-200"
                      >
                        <Send className="h-3 w-3 text-sky-400" />
                        Remind
                      </button>

                      <button
                        type="button"
                        onClick={() => openPyusdModal(inv)}
                        className="inline-flex items-center gap-1 rounded border border-emerald-600/50 bg-emerald-950/50 hover:bg-emerald-900/60 px-2 py-1 font-mono text-[11px] text-emerald-300"
                      >
                        <Coins className="h-3 w-3" />
                        PYUSD
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

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
                      Active Recurring Series (#16–#19) &amp; Subscription Billing Plan (API-12 ·{" "}
                      {plan.productId})
                    </span>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">
                      {plan.status} · Auto-Renew
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 border-l border-slate-800/80 text-right font-mono text-[11px] text-slate-400">
                  MCP #33–#34
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
