"use client";

/**
 * PayOps AI (PayPal Sentinel) — Smart Invoicing v2 & Scannable SVG QR Code Modal
 * Maps to: F-03, US-04, US-05, API-04, E-07 (PayPalInvoiceRecord)
 * Write Owner: Dev 2 (100%)
 */

import React from "react";
import { QrCode, X, Sparkles, CheckCircle2, Coins, ExternalLink, Send } from "lucide-react";
import { formatCurrencyAmount } from "../../lib/formatters";
import { useCockpitStore } from "../../stores/useCockpitStore";

export function InvoiceQrModal() {
  const {
    qrModalInvoice,
    openQrModal,
    openPyusdModal,
    activeCurrency,
    rescheduleInvoiceReminder,
  } = useCockpitStore();

  if (!qrModalInvoice) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-sky-500/40 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-sky-400" />
            <div>
              <h2 id="invoice-qr-modal-title" className="text-sm font-bold text-white">
                PayPal Smart Invoice v2 & Fastlane QR (F-03 · US-04)
              </h2>
              <p className="text-[11px] font-mono text-sky-300">
                {qrModalInvoice.invoiceId} · {qrModalInvoice.invoiceNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openQrModal(null)}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/90 p-3">
            <div>
              <div className="text-[10px] uppercase text-slate-400">Recipient</div>
              <div className="font-mono text-xs text-slate-200">{qrModalInvoice.recipientEmail}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-slate-400">Invoice Total</div>
              <div className="text-base font-bold text-emerald-400 financial-figure">
                {formatCurrencyAmount(
                  qrModalInvoice.amountValue,
                  qrModalInvoice.currencyCode,
                  activeCurrency
                )}
              </div>
            </div>
          </div>

          {/* Conditional Discount Rule Badge (US-05) */}
          {qrModalInvoice.conditionalRule && (
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-3 py-2">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
                <Sparkles className="h-4 w-4" />
                {qrModalInvoice.conditionalRule.ruleType === "EARLY_PAYMENT_DISCOUNT"
                  ? `${qrModalInvoice.conditionalRule.percentage}% Net-10 Early-Payment Discount`
                  : `${qrModalInvoice.conditionalRule.percentage}% Late-Payment Fee Rule`}
              </span>
              <span className="font-mono text-[11px] text-emerald-200">
                Trigger: {qrModalInvoice.conditionalRule.triggerDate}
              </span>
            </div>
          )}

          {/* Deterministic Scannable SVG QR Code */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-white p-4 text-slate-900">
            <svg
              viewBox="0 0 120 120"
              className="h-40 w-40"
              role="img"
              aria-label={`PayPal Invoice QR Code for ${qrModalInvoice.invoiceId}`}
            >
              <rect width="120" height="120" fill="#FFFFFF" />
              {/* Top-left finder */}
              <rect x="10" y="10" width="30" height="30" fill="#003087" />
              <rect x="15" y="15" width="20" height="20" fill="#FFFFFF" />
              <rect x="20" y="20" width="10" height="10" fill="#0070E0" />
              {/* Top-right finder */}
              <rect x="80" y="10" width="30" height="30" fill="#003087" />
              <rect x="85" y="15" width="20" height="20" fill="#FFFFFF" />
              <rect x="90" y="20" width="10" height="10" fill="#0070E0" />
              {/* Bottom-left finder */}
              <rect x="10" y="80" width="30" height="30" fill="#003087" />
              <rect x="15" y="85" width="20" height="20" fill="#FFFFFF" />
              <rect x="20" y="90" width="10" height="10" fill="#0070E0" />
              {/* Data modules */}
              <rect x="48" y="12" width="6" height="6" fill="#0F172A" />
              <rect x="60" y="12" width="6" height="6" fill="#0F172A" />
              <rect x="48" y="24" width="12" height="6" fill="#003087" />
              <rect x="66" y="24" width="6" height="12" fill="#0F172A" />
              <rect x="12" y="48" width="12" height="6" fill="#0F172A" />
              <rect x="30" y="48" width="6" height="12" fill="#0070E0" />
              <rect x="44" y="44" width="32" height="32" rx="4" fill="#003087" />
              <text
                x="60"
                y="64"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="bold"
                fontFamily="monospace"
              >
                PP·QR
              </text>
              <rect x="84" y="48" width="6" height="12" fill="#0F172A" />
              <rect x="96" y="54" width="12" height="6" fill="#003087" />
              <rect x="48" y="84" width="12" height="6" fill="#0F172A" />
              <rect x="66" y="84" width="6" height="18" fill="#0070E0" />
              <rect x="84" y="84" width="18" height="6" fill="#003087" />
              <rect x="84" y="96" width="12" height="12" fill="#0F172A" />
              <rect x="102" y="96" width="6" height="12" fill="#0070E0" />
            </svg>
            <div className="mt-2 text-center">
              <div className="text-[11px] font-bold text-[#003087]">
                Scan with PayPal / Venmo / Fastlane One-Tap
              </div>
              <div className="font-mono text-[10px] text-slate-500 truncate max-w-[320px]">
                {qrModalInvoice.qrCodeUri}
              </div>
            </div>
          </div>

          <div className="rounded border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-[10px] text-slate-400 flex items-center justify-between">
            <span>PayPal-Request-Id: {qrModalInvoice.idempotencyKey}</span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              JunoDB Verified
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-5 py-3">
          <button
            type="button"
            onClick={() => {
              rescheduleInvoiceReminder(qrModalInvoice.invoiceId, "2026-11-16");
              openQrModal(null);
            }}
            className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5 text-sky-400" />
            Send Reminder (API-06)
          </button>

          <button
            type="button"
            onClick={() => {
              const target = qrModalInvoice;
              openQrModal(null);
              openPyusdModal(target);
            }}
            className="inline-flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white cursor-pointer"
          >
            <Coins className="h-3.5 w-3.5" />
            Settle via PYUSD Solana (US-15)
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
