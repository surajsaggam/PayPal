"use client";

/**
 * PayOps AI (PayPal Sentinel) — Passkey Approval & Security Hold Card
 * Increase.com Light-First Editorial Modal:
 *  - Clean human-readable approval card with semantic status pills and tactile passkey actions
 *  - Preserves Alt+A / Alt+R keyboard shortcuts and role selector
 */

import React, { useEffect } from "react";
import {
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Lock,
  Fingerprint,
  X,
} from "lucide-react";
import { useHitlSignature } from "../../hooks/useHitlSignature";
import { formatCurrencyAmount } from "../../lib/formatters";
import { useCockpitStore } from "../../stores/useCockpitStore";

function formatToolDisplayName(toolName: string): string {
  const map: Record<string, string> = {
    create_refund: "Issue Customer Refund",
    send_invoice: "Send Customer Invoice",
    create_invoice: "Create Smart Invoice",
    send_invoice_reminder: "Send Payment Reminder",
    accept_dispute_claim: "Accept Dispute Claim",
    provide_evidence: "Submit Dispute Evidence",
    cancel_subscription: "Cancel Recurring Subscription",
    record_payment_for_invoice: "Record Invoice Payment",
  };
  return (
    map[toolName] ??
    toolName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function HitlApprovalCard() {
  const {
    hitlApprovalExecution,
    openHitlApproval,
    operators,
    activeOperatorId,
    setOperatorRole,
    activeCurrency,
  } = useCockpitStore();

  const { signing, lastError, signAndSubmitDecision } = useHitlSignature();

  const activeOperator =
    operators.find((op) => op.userId === activeOperatorId) ?? operators[0];

  useEffect(() => {
    if (!hitlApprovalExecution) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        void signAndSubmitDecision(hitlApprovalExecution, "APPROVE");
      } else if (e.altKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        void signAndSubmitDecision(hitlApprovalExecution, "REJECT");
      } else if (e.key === "Escape") {
        openHitlApproval(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [hitlApprovalExecution, signAndSubmitDecision, openHitlApproval]);

  if (!hitlApprovalExecution) return null;

  const isInjection =
    hitlApprovalExecution.reasonCode === "RC_00_INDIRECT_PROMPT_INJECTION_DETECTED" ||
    hitlApprovalExecution.policyVerdict === "BLOCKED_SECURITY_INJECTION";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hitl-passkey-modal-title"
      onClick={() => openHitlApproval(null)}
      className="fixed inset-0 z-50 flex items-center justify-center apple-modal-scrim p-4 sm:p-6 transition-opacity duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl apple-glass-sheet text-ink overflow-hidden animate-pop-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline bg-surface/80 px-6 py-5">
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-status-warning-border bg-status-warning-bg text-status-warning-text shadow-2xs">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <h2
                id="hitl-passkey-modal-title"
                className="text-base font-semibold tracking-tight text-ink"
              >
                Passkey Authorization Required
              </h2>
              <p className="text-xs text-ink-muted">
                High-value or sensitive payment action held for finance approval
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openHitlApproval(null)}
            aria-label="Close Passkey Approval Modal"
            className="rounded-xl p-2 text-ink-muted transition-all duration-200 hover:bg-subtle hover:text-ink active:scale-[0.95] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {isInjection && (
            <div className="rounded-2xl border border-status-danger-border bg-status-danger-bg p-4 text-status-danger-text">
              <div className="font-semibold flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 shrink-0" />
                <span>Unauthorized Refund Override Blocked</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed">
                A customer note attempted to bypass spending rules and force an immediate refund.
                The Policy Firewall isolated the instruction and paused execution.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-hairline bg-surface/70 p-4 sm:p-5">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                Payment Action
              </div>
              <div className="text-sm font-semibold text-ink mt-1">
                {formatToolDisplayName(hitlApprovalExecution.toolName)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                Transaction Amount
              </div>
              <div className="text-lg font-bold text-ink mt-0.5 tabular-nums">
                {formatCurrencyAmount(
                  hitlApprovalExecution.amountValue,
                  hitlApprovalExecution.currencyCode ?? "USD",
                  activeCurrency
                )}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                Fraud Risk Score
              </div>
              <div className="text-sm font-semibold text-status-danger-text mt-1 tabular-nums">
                {hitlApprovalExecution.gnnRiskScore.toFixed(2)} (Limit: 0.35)
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                Duplicate Protection
              </div>
              <div className="text-xs font-semibold text-status-success-text mt-1">
                Verified Single Execution
              </div>
            </div>
          </div>

          {/* Operator RBAC Selector */}
          <div className="rounded-2xl border border-hairline bg-elevated p-4 space-y-2 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Fingerprint className="h-4 w-4 text-ink-secondary" />
                Approving Team Member:
              </span>
              <select
                aria-label="Select Operator Role for Passkey Signing"
                value={activeOperator.role}
                onChange={(e) => setOperatorRole(e.target.value as typeof activeOperator.role)}
                className="rounded-xl border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink"
              >
                <option value="OWNER">Ananya Rao (Account Owner · Passkey Enabled)</option>
                <option value="FINANCE_ADMIN">Vikram Menon (Finance Admin · Passkey Enabled)</option>
                <option value="OPS_ANALYST">Rohan Das (Operations Analyst · View Only)</option>
                <option value="AUDITOR">Priya Sharma (Compliance Auditor · View Only)</option>
              </select>
            </div>
            <div className="text-[11px] text-ink-muted">
              Only Account Owners and Finance Admins can approve held refunds or payouts.
            </div>
          </div>

          {lastError && (
            <div
              role="alert"
              className="rounded-xl border border-status-danger-border bg-status-danger-bg p-3.5 text-xs font-medium text-status-danger-text"
            >
              {lastError}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-hairline bg-surface/90 px-6 py-4">
          <button
            type="button"
            disabled={signing}
            onClick={() => void signAndSubmitDecision(hitlApprovalExecution, "REJECT")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-status-danger-border bg-status-danger-bg px-4 py-2.5 text-xs font-semibold text-status-danger-text transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.975] cursor-pointer"
          >
            <XCircle className="h-4 w-4" />
            <span>Reject Action</span>
          </button>

          <button
            type="button"
            disabled={signing}
            onClick={() => void signAndSubmitDecision(hitlApprovalExecution, "APPROVE")}
            className="btn-primary-mint px-5 py-2.5 text-xs font-semibold cursor-pointer"
          >
            <KeyRound className="h-4 w-4" />
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {signing ? "Verifying Passkey..." : "Approve with Passkey"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
