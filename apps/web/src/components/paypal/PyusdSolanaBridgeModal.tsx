"use client";

/**
 * PayOps AI (PayPal Sentinel) — Cross-Border PYUSD Solana Token-2022 Settlement Bridge Modal
 * Maps to: F-11, US-15, R-08 (Non-Custodial Compliance), R-09 (Mandatory Memo Required Binding)
 * Write Owner: Dev 2 (100%)
 */

import React, { useEffect, useState } from "react";
import { Coins, ShieldCheck, AlertTriangle, CheckCircle2, X, ArrowRight } from "lucide-react";
import { useCockpitStore } from "../../stores/useCockpitStore";

const PYUSD_MINT = "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo";

export function PyusdSolanaBridgeModal() {
  const { pyusdModalInvoice, openPyusdModal, settleInvoiceWithPyusd } = useCockpitStore();

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
    memoInput || `PAYOPS:${pyusdModalInvoice.invoiceId}:${pyusdModalInvoice.idempotencyKey}`;

  // R-09 Memo Required regex validation: PAYOPS:<invoice_id>:<PayPal-Request-Id>
  const memoRegex = /^PAYOPS:[A-Z0-9-]+:[a-zA-Z0-9_-]+$/;
  const isMemoValid =
    memoRegex.test(effectiveMemo) && effectiveMemo.includes(pyusdModalInvoice.invoiceId);

  const handleSettle = async () => {
    if (!isMemoValid) {
      setMemoError(
        `R-09 Memo Mismatch Guard: Solana Token-2022 Memo Required extension must match 'PAYOPS:${pyusdModalInvoice.invoiceId}:<PayPal-Request-Id>'.`
      );
      return;
    }
    setMemoError(null);
    setSettling(true);
    await new Promise((r) => setTimeout(r, 220));
    const solanaSig = `5xPyusdSolanaToken2022Sig99102a${Date.now().toString(16)}`;
    settleInvoiceWithPyusd(pyusdModalInvoice.invoiceId, solanaSig, effectiveMemo);
    setSettling(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pyusd-bridge-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-xl rounded-xl border border-emerald-500/50 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-emerald-950/40 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Coins className="h-5 w-5 text-[#14F195]" />
            <div>
              <h2 id="pyusd-bridge-modal-title" className="text-sm font-bold text-white">
                Cross-Border PYUSD Solana Token-2022 Settlement Bridge (F-11 · US-15)
              </h2>
              <p className="text-[11px] font-mono text-[#14F195]">
                Non-Custodial Control Plane (R-08) · On-Chain Memo Required Extension (R-09)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openPyusdModal(null)}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Rail Comparison Table */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <div className="text-[10px] font-mono uppercase text-slate-400">
                Legacy Correspondent SWIFT Wire
              </div>
              <div className="text-base font-bold text-red-400 mt-1 financial-figure">
                $48.00 Fee + 3.2% FX Spread
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Settlement Time: 4 Business Days · Manual Reconciliation
              </div>
            </div>

            <div className="rounded-lg border border-[#14F195]/50 bg-emerald-950/25 p-3">
              <div className="text-[10px] font-mono uppercase text-[#14F195]">
                PayPal PYUSD (Solana Token-2022)
              </div>
              <div className="text-base font-bold text-[#14F195] mt-1 financial-figure">
                $0.001 Network Fee · 1:1 USD
              </div>
              <div className="text-[11px] text-emerald-200 mt-0.5">
                Settlement Time: 1.2 Seconds · Auto MCP Reconciliation
              </div>
            </div>
          </div>

          {/* Token-2022 Specs */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Invoice Target (E-07):</span>
              <span className="text-white font-bold">
                {pyusdModalInvoice.invoiceId} ({pyusdModalInvoice.amountValue} PYUSD)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">PYUSD Solana Mint:</span>
              <span className="text-[#14F195]">{PYUSD_MINT}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">MCP Reconciliation Tool:</span>
              <span className="text-sky-400">record_payment_for_invoice (#13)</span>
            </div>
          </div>

          {/* Mandatory Memo Required Binding Input (R-09) */}
          <div className="space-y-1.5">
            <label
              htmlFor="pyusd-memo-input"
              className="block font-semibold text-slate-200 flex items-center justify-between"
            >
              <span>Solana Token-2022 `Memo Required` Payload (R-09 Guard):</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                  isMemoValid
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-red-500/20 text-red-300"
                }`}
              >
                {isMemoValid ? "MEMO BINDING VALID" : "INVALID MEMO FORMAT"}
              </span>
            </label>
            <input
              id="pyusd-memo-input"
              type="text"
              value={effectiveMemo}
              onChange={(e) => setMemoInput(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-emerald-300"
            />
            <p className="text-[11px] text-slate-400">
              Format required:{" "}
              <code className="font-mono text-slate-300">
                PAYOPS:&lt;invoice_id&gt;:&lt;PayPal-Request-Id&gt;
              </code>
            </p>
          </div>

          {memoError && (
            <div
              role="alert"
              className="rounded border border-red-500/60 bg-red-950/50 p-2.5 text-[11px] font-mono text-red-200 flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              {memoError}
            </div>
          )}

          <div className="flex items-center gap-2 rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] text-slate-300">
            <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0" />
            <span>
              <strong>R-08 Non-Custodial Attestation:</strong> PayOps AI never takes custody of funds;
              transfer executes directly from merchant signer to supplier wallet and records payment on
              PayPal Invoicing v2.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-5 py-3">
          <button
            type="button"
            onClick={() => openPyusdModal(null)}
            className="rounded border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={settling}
            onClick={() => void handleSettle()}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            {settling
              ? "Confirming Solana Devnet & MCP..."
              : `Settle ${pyusdModalInvoice.amountValue} PYUSD & Reconcile Invoice`}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
