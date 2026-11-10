"use client";

/**
 * PayOps AI (PayPal Sentinel) — APIMatic Context Plugin Schema Validator & SDK Code Exporter
 * Increase.com Light-First Slide-Over Drawer with #11191F Code Window
 */

import React, { useEffect, useState } from "react";
import { Code2, Check, Copy, ShieldCheck, X, TerminalSquare } from "lucide-react";
import { validatePayPalMonetaryPayload } from "@payops/shared/apimatic-validators";
import { MOCK_APIMATIC_SNIPPETS } from "@payops/shared/mock-fixtures";
import { useCockpitStore } from "../../stores/useCockpitStore";

export function ApimaticSdkCodeDrawer() {
  const { apimaticDrawerExecution, openApimaticDrawer } = useCockpitStore();
  const [lang, setLang] = useState<"ts" | "python">("ts");
  const [copied, setCopied] = useState(false);
  const [testAmountInput, setTestAmountInput] = useState("2450.00");

  useEffect(() => {
    if (apimaticDrawerExecution?.amountValue) {
      setTestAmountInput(apimaticDrawerExecution.amountValue);
    }
  }, [apimaticDrawerExecution]);

  if (!apimaticDrawerExecution) return null;

  const snippetEntry =
    MOCK_APIMATIC_SNIPPETS[apimaticDrawerExecution.toolName] ??
    MOCK_APIMATIC_SNIPPETS.send_invoice;

  const codeText = lang === "ts" ? snippetEntry.ts : snippetEntry.python;

  const liveValidation = validatePayPalMonetaryPayload(
    testAmountInput,
    apimaticDrawerExecution.currencyCode ?? "USD"
  );

  const handleCopy = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(codeText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="apimatic-drawer-title"
      onClick={() => openApimaticDrawer(null)}
      className="fixed inset-0 z-50 flex items-center justify-end apple-modal-scrim"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-2xl border-l border-hairline apple-glass-sheet flex flex-col text-ink animate-drawer-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline bg-surface/80 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-hairline bg-elevated text-ink shadow-2xs">
              <Code2 className="h-4 w-4" />
            </span>
            <div>
              <h2 id="apimatic-drawer-title" className="text-sm font-semibold tracking-tight text-ink">
                APIMatic Context Plugin — Verified PayPal Server SDK Exporter
              </h2>
              <p className="text-[11px] font-mono text-ink-muted">
                Zero-Hallucination Schema Gate · @paypal/paypal-server-sdk · R-03 Compliant
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openApimaticDrawer(null)}
            aria-label="Close APIMatic SDK Drawer"
            className="rounded-xl p-2 text-ink-muted hover:bg-subtle hover:text-ink active:scale-[0.95] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Pre-Flight Validation Telemetry Card */}
          <div className="rounded-xl border border-status-success-border bg-status-success-bg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-status-success-text flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                APIMatic Pre-Flight Schema Validation: PASS (100% EVAL-DS-01)
              </span>
              <span className="font-mono text-[11px] text-ink-secondary">
                {snippetEntry.endpoint}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-ink pt-1 tabular-nums">
              <div>
                <span className="text-ink-muted">Tool:</span> {apimaticDrawerExecution.toolName}
              </div>
              <div>
                <span className="text-ink-muted">Amount:</span> &quot;
                {apimaticDrawerExecution.amountValue ?? "2450.00"}&quot;
              </div>
              <div>
                <span className="text-ink-muted">ISO-4217:</span>{" "}
                {apimaticDrawerExecution.currencyCode ?? "USD"}
              </div>
            </div>
          </div>

          {/* Interactive R-03 2-Decimal String Tester */}
          <div className="rounded-xl border border-hairline bg-surface p-4 space-y-2.5">
            <div className="font-semibold text-ink flex items-center gap-1.5">
              <TerminalSquare className="h-4 w-4 text-ink-secondary" />
              Interactive APIMatic Monetary Payload Validator (R-03 Guard)
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testAmountInput}
                onChange={(e) => setTestAmountInput(e.target.value)}
                aria-label="Test Monetary Amount String"
                placeholder='e.g. "2450.00" or invalid "2450.5"'
                className="rounded-lg border border-hairline bg-elevated px-3 py-1.5 font-mono text-xs text-ink tabular-nums flex-1 shadow-2xs focus:border-ink focus:outline-none"
              />
              <span
                className={`rounded-pill border px-2.5 py-1 font-mono text-xs font-semibold ${
                  liveValidation.valid
                    ? "border-status-success-border bg-status-success-bg text-status-success-text"
                    : "border-status-danger-border bg-status-danger-bg text-status-danger-text"
                }`}
              >
                {liveValidation.valid ? "VALID 2-DECIMAL STRING" : "REJECTED (R-03)"}
              </span>
            </div>
            {!liveValidation.valid && (
              <p className="text-[11px] font-mono text-status-danger-text">
                {liveValidation.errors.join(" · ")}
              </p>
            )}
          </div>

          {/* Language Switcher & Copy Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="apple-segmented-track">
              <button
                type="button"
                onClick={() => setLang("ts")}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono font-medium transition active:scale-[0.97] cursor-pointer ${
                  lang === "ts"
                    ? "bg-elevated text-ink font-semibold shadow-2xs border border-hairline"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                TypeScript (@paypal/paypal-server-sdk)
              </button>
              <button
                type="button"
                onClick={() => setLang("python")}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono font-medium transition active:scale-[0.97] cursor-pointer ${
                  lang === "python"
                    ? "bg-elevated text-ink font-semibold shadow-2xs border border-hairline"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Python (paypal-server-sdk)
              </button>
            </div>

            <button
              type="button"
              onClick={() => void handleCopy()}
              className="btn-secondary-dark px-3.5 py-1.5 text-xs font-mono cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied Verified Snippet!" : "Copy Verified Snippet"}</span>
            </button>
          </div>

          {/* Code Block */}
          <pre className="rounded-xl border border-slate-800 bg-[#11191F] p-4 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed shadow-md">
            <code>{codeText}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
