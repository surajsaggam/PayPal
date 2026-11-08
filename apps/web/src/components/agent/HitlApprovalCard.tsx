"use client";

/**
 * PayOps AI (PayPal Sentinel) — Cryptographic WebAuthn FIDO2 Passkey Approval Card
 * Maps to: API-02 (POST /api/v1/agent/approve/{executionId}), US-03, F-02, TKT-015
 * Write Owner: Dev 2 (100%)
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
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [hitlApprovalExecution, signAndSubmitDecision]);

  if (!hitlApprovalExecution) return null;

  const isInjection =
    hitlApprovalExecution.reasonCode === "RC_00_INDIRECT_PROMPT_INJECTION_DETECTED" ||
    hitlApprovalExecution.policyVerdict === "BLOCKED_SECURITY_INJECTION";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hitl-passkey-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg rounded-xl border border-amber-500/50 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-amber-950/40 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <div>
              <h2 id="hitl-passkey-modal-title" className="text-sm font-bold text-white">
                Cosmos.AI Policy Firewall — L2 FIDO2 Passkey Gate (API-02 · US-03)
              </h2>
              <p className="text-[11px] font-mono text-amber-300">
                Execution Held: {hitlApprovalExecution.executionId} · Rule POL-02
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openHitlApproval(null)}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {isInjection && (
            <div className="rounded-lg border border-red-500/60 bg-red-950/50 p-3 text-red-200">
              <div className="font-bold text-red-300 flex items-center gap-1.5">
                <Lock className="h-4 w-4" />
                ALERT: Indirect Prompt Injection Intercepted (R-01)
              </div>
              <p className="mt-1 text-[11px] leading-relaxed">
                Reason Code:{" "}
                <code className="font-mono font-bold text-red-300">
                  RC_00_INDIRECT_PROMPT_INJECTION_DETECTED
                </code>
                . Untrusted buyer note attempted imperative command override inside{" "}
                <code className="font-mono">&lt;untrusted_external_data&gt;</code>.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 font-mono">
            <div>
              <div className="text-[10px] uppercase text-slate-400">MCP Tool Intercepted</div>
              <div className="text-sm font-bold text-sky-400 mt-0.5">
                {hitlApprovalExecution.toolName}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400">Monetary Amount</div>
              <div className="text-sm font-bold text-white mt-0.5 financial-figure">
                {formatCurrencyAmount(
                  hitlApprovalExecution.amountValue,
                  hitlApprovalExecution.currencyCode ?? "USD",
                  activeCurrency
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400">M-04 GNN Collusion Score</div>
              <div className="text-sm font-bold text-red-400 mt-0.5 financial-figure">
                {hitlApprovalExecution.gnnRiskScore.toFixed(2)} (Threshold: 0.35)
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400">JunoDB 2PC Lease (F-06)</div>
              <div className="text-xs font-semibold text-emerald-400 mt-0.5">
                {hitlApprovalExecution.junodbLeaseStatus}
              </div>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-800/80">
              <div className="text-[10px] uppercase text-slate-400">PayPal-Request-Id</div>
              <div className="text-[11px] text-slate-300 break-all">
                {hitlApprovalExecution.paypalRequestId}
              </div>
            </div>
          </div>

          {/* Operator RBAC Selector (TKT-015 verification) */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Fingerprint className="h-4 w-4 text-sky-400" />
                Active Operator RBAC Signer (E-02):
              </span>
              <select
                aria-label="Select Operator Role for Passkey Signing"
                value={activeOperator.role}
                onChange={(e) => setOperatorRole(e.target.value as typeof activeOperator.role)}
                className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-mono text-slate-200"
              >
                <option value="OWNER">OWNER (Ananya Rao · Passkey Valid)</option>
                <option value="FINANCE_ADMIN">FINANCE_ADMIN (Vikram Menon · Passkey Valid)</option>
                <option value="OPS_ANALYST">OPS_ANALYST (Rohan Das · Tests HTTP 403)</option>
                <option value="AUDITOR">AUDITOR (Priya Sharma · Tests HTTP 403)</option>
              </select>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Credential ID: {activeOperator.webauthnCredentialId ?? "NONE (Read-Only Role)"}
            </div>
          </div>

          {lastError && (
            <div
              role="alert"
              className="rounded border border-red-500/60 bg-red-950/60 p-2.5 text-[11px] font-mono text-red-200"
            >
              {lastError}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-5 py-3">
          <button
            type="button"
            disabled={signing}
            onClick={() => void signAndSubmitDecision(hitlApprovalExecution, "REJECT")}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-600/60 bg-red-950/60 hover:bg-red-900/70 px-3.5 py-2 text-xs font-semibold text-red-200 transition cursor-pointer"
          >
            <XCircle className="h-4 w-4" />
            Reject & Lock Audit (Alt+R)
          </button>

          <button
            type="button"
            disabled={signing}
            onClick={() => void signAndSubmitDecision(hitlApprovalExecution, "APPROVE")}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow transition cursor-pointer"
          >
            <KeyRound className="h-4 w-4" />
            <CheckCircle2 className="h-4 w-4" />
            {signing ? "Verifying FIDO2 Passkey..." : "Sign with Passkey & Release (Alt+A)"}
          </button>
        </div>
      </div>
    </div>
  );
}
