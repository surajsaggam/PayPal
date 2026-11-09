"use client";

/**
 * PayOps AI (PayPal Sentinel) — Instant PYUSD Supplier Settlement Card
 * Increase.com Light-First Editorial Modal:
 *  - Clean human-readable supplier invoice settlement card
 *  - Smooth pop-in animation and tactile button micro-interactions
 */

import React, { useEffect, useState } from "react";
import {
  Coins,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowRight,
  RotateCcw,
  Zap,
  Globe2,
  FileText,
} from "lucide-react";
import { validatePyusdToken2022Memo } from "@payops/shared/mock-fixtures";
import { formatDualCurrency } from "../../lib/formatters";
import { settleInvoicePyusd } from "../../lib/api-client";
import { useCockpitStore } from "../../stores/useCockpitStore";

export function PyusdSolanaBridgeModal() {
  const {
    invoices,
    activeCurrency,
    pyusdModalInvoice,
    openPyusdModal,
    settleInvoiceWithPyusd,
  } = useCockpitStore();

  const defaultMemo = pyusdModalInvoice
    ? `PAYOPS:${pyusdModalInvoice.invoiceId}:${pyusdModalInvoice.idempotencyKey}`
    : "";

  const [memoInput, setMemoInput] = useState(defaultMemo);
  const [settling, setSettling] = useState(false);
  const [memoError, setMemoError] = useState<string | null>(null);

  useEffect(() => {
    if (pyusdModalInvoice) {
      setMemoInput(
        `PAYOPS:${pyusdModalInvoice.invoiceId}:${pyusdModalInvoice.idempotencyKey}`
      );
      setMemoError(null);
    }
  }, [pyusdModalInvoice]);

  if (!pyusdModalInvoice) return null;

  const effectiveMemo =
    memoInput !== ""
      ? memoInput
      : `PAYOPS:${pyusdModalInvoice.invoiceId}:${pyusdModalInvoice.idempotencyKey}`;

  const memoValidation = validatePyusdToken2022Memo(
    effectiveMemo,
    pyusdModalInvoice.invoiceId
  );
  const isMemoValid = memoValidation.valid;

  const dualInvoiceAmt = formatDualCurrency(
    pyusdModalInvoice.amountValue,
    pyusdModalInvoice.currencyCode,
    activeCurrency === pyusdModalInvoice.currencyCode ? "INR" : activeCurrency
  );

  const handleSimulateCorruptMemo = () => {
    const corrupt = `INVALID_MEMO:${pyusdModalInvoice.invoiceId}`;
    setMemoInput(corrupt);
    const check = validatePyusdToken2022Memo(corrupt, pyusdModalInvoice.invoiceId);
    setMemoError(
      check.errorReason ??
        `Invoice reference memo does not match Invoice ${pyusdModalInvoice.invoiceNumber}. Settlement blocked to prevent unlinked transfer.`
    );
  };

  const handleRestoreValidMemo = () => {
    const valid = `PAYOPS:${pyusdModalInvoice.invoiceId}:${pyusdModalInvoice.idempotencyKey}`;
    setMemoInput(valid);
    setMemoError(null);
  };

  const handleSettle = async () => {
    if (!isMemoValid) {
      setMemoError(
        memoValidation.errorReason ??
          `Invoice reference memo does not match Invoice ${pyusdModalInvoice.invoiceNumber}.`
      );
      return;
    }
    setMemoError(null);
    setSettling(true);
    await new Promise((r) => setTimeout(r, 220));
    const solanaSig = `5xPyusdSolanaToken2022Sig99102a${Date.now().toString(16)}`;
    const res = await settleInvoicePyusd({
      workspaceId: pyusdModalInvoice.workspaceId,
      invoiceId: pyusdModalInvoice.invoiceId,
      amountValue: pyusdModalInvoice.amountValue,
      memo: effectiveMemo,
      solanaTxSignature: solanaSig,
    });
    settleInvoiceWithPyusd(
      pyusdModalInvoice.invoiceId,
      res.solanaTxSignature ?? solanaSig,
      effectiveMemo
    );
    setSettling(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pyusd-bridge-modal-title"
      onClick={() => openPyusdModal(null)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4 sm:p-6 transition-opacity duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-3xl border border-hairline bg-elevated shadow-popover text-ink overflow-hidden animate-pop-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline bg-surface/80 px-6 py-4.5">
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-status-success-border bg-status-success-bg text-status-success-text shadow-2xs">
              <Coins className="h-5 w-5" />
            </span>
            <div>
              <h2
                id="pyusd-bridge-modal-title"
                className="text-base font-semibold tracking-tight text-ink"
              >
                Instant PYUSD Supplier Settlement
              </h2>
              <p className="text-xs text-ink-muted">
                Direct 1:1 USD settlement with automatic invoice reconciliation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openPyusdModal(null)}
            aria-label="Close PYUSD Settlement Modal"
            className="rounded-xl p-2 text-ink-muted transition-all duration-200 hover:bg-subtle hover:text-ink hover:rotate-90 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Supplier Invoice Selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="pyusd-modal-invoice-select"
              className="flex items-center gap-1.5 text-xs font-semibold text-ink"
            >
              <FileText className="h-3.5 w-3.5 text-ink-secondary" />
              <span>Select Invoice to Settle</span>
            </label>
            <select
              id="pyusd-modal-invoice-select"
              value={pyusdModalInvoice.invoiceId}
              onChange={(e) => {
                const chosen = invoices.find((inv) => inv.invoiceId === e.target.value);
                if (chosen) openPyusdModal(chosen);
              }}
              className="w-full rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-xs font-medium text-ink transition-colors focus:border-ink focus:outline-none"
            >
              {invoices.map((inv) => (
                <option key={inv.invoiceId} value={inv.invoiceId}>
                  Invoice {inv.invoiceNumber} · {inv.recipientEmail} — ${inv.amountValue}{" "}
                  {inv.currencyCode} ({inv.status})
                </option>
              ))}
            </select>
          </div>

          {/* Rail Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-hairline bg-surface p-4">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-muted">
                <Globe2 className="h-3.5 w-3.5 text-ink-muted" />
                <span>Traditional International Wire</span>
              </div>
              <div className="text-base font-bold text-status-danger-text mt-1 tabular-nums">
                $48.00 Fee + 3.2% FX Spread
              </div>
              <div className="text-xs text-ink-muted mt-0.5">
                3–4 Business Days · Manual Bank Matching
              </div>
            </div>

            <div className="rounded-2xl border border-status-success-border bg-status-success-bg/85 p-4">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-status-success-text">
                <Zap className="h-3.5 w-3.5" />
                <span>PayPal PYUSD Instant Rail</span>
              </div>
              <div className="text-base font-bold text-status-success-text mt-1 tabular-nums">
                $0.001 Network Fee · 1:1 USD
              </div>
              <div className="text-xs text-status-success-text/90 mt-0.5">
                ~1.2 Seconds · Automatic Invoice Paid Status
              </div>
            </div>
          </div>

          {/* Clean Settlement Summary */}
          <div className="rounded-2xl border border-hairline bg-surface/70 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Selected Invoice</span>
              <span className="text-ink font-semibold">
                Invoice {pyusdModalInvoice.invoiceNumber} ({pyusdModalInvoice.recipientEmail})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Settlement Amount</span>
              <span className="text-ink font-bold tabular-nums">
                {pyusdModalInvoice.amountValue} PYUSD ({dualInvoiceAmt.secondary})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Invoice Matching</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-status-success-text">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Automatic Invoice Reconciliation
              </span>
            </div>
          </div>

          {/* Invoice Reference Verification */}
          <div className="rounded-2xl border border-hairline bg-surface/50 p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-ink">
                Invoice Reference Verification
              </span>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-pill border font-semibold ${
                  isMemoValid
                    ? "border-status-success-border bg-status-success-bg text-status-success-text"
                    : "border-status-danger-border bg-status-danger-bg text-status-danger-text"
                }`}
              >
                {isMemoValid ? "Reference Matched" : "Reference Mismatch"}
              </span>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed">
              Every PYUSD transfer automatically attaches the invoice reference so the payment is
              never lost or unlinked.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleSimulateCorruptMemo}
                className="rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-1 text-[11px] font-medium text-status-danger-text transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
              >
                Test Missing Reference Guard
              </button>
              <button
                type="button"
                onClick={handleRestoreValidMemo}
                className="inline-flex items-center gap-1 rounded-lg border border-status-success-border bg-status-success-bg px-3 py-1 text-[11px] font-medium text-status-success-text transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Restore Valid Reference
              </button>
            </div>
          </div>

          {memoError && (
            <div
              role="alert"
              className="rounded-xl border border-status-danger-border bg-status-danger-bg p-3.5 text-xs font-medium text-status-danger-text flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{memoError}</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 rounded-xl border border-hairline bg-surface px-4 py-3 text-xs text-ink-secondary">
            <ShieldCheck className="h-4 w-4 text-status-success-bar shrink-0" />
            <span>
              <strong className="text-ink">Direct Non-Custodial Settlement:</strong> Funds transfer
              directly from your merchant account to the supplier and automatically mark Invoice{" "}
              {pyusdModalInvoice.invoiceNumber} as Paid.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-hairline bg-surface/90 px-6 py-4">
          <button
            type="button"
            onClick={() => openPyusdModal(null)}
            className="btn-outline-subtle px-4 py-2 text-xs font-medium transition-all duration-200 ease-spring hover:-translate-y-0.5 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={settling}
            onClick={() => void handleSettle()}
            className="btn-primary-mint px-4.5 py-2 text-xs font-semibold transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {settling
                ? "Completing Settlement..."
                : `Settle ${pyusdModalInvoice.amountValue} PYUSD Now`}
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
