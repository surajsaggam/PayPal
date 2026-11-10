import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Scale, ShieldCheck, KeyRound, Coins, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "PayPal Sentinel Terms of Service — Autonomy tier governance, hardware passkey sign-off rules, and PYUSD cross-border settlement conditions.",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="space-y-6 animate-pop-in max-w-4xl mx-auto">
      <div className="surface-bento p-5 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1.5">
            <span className="badge-lime px-3 py-1 text-xs">
              Treasury Governance Terms
            </span>
            <h1 className="editorial-heading text-2xl sm:text-3xl pt-1">
              Terms & Conditions of Autonomous Operation
            </h1>
            <p className="text-xs text-ink-muted">
              Last Updated: November 2026 · Applies to all PayPal Invoicing, Dispute, and PYUSD Settlement workflows
            </p>
          </div>
          <Link
            href="/command-center"
            className="btn-outline-subtle px-3.5 py-2 text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Workspace
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="surface-card p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              Policy-First Execution
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              No invoice reminder, refund, or dispute submission bypasses the merchant’s configured L0–L4 spending policy.
            </p>
          </div>

          <div className="surface-card p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink">
              <KeyRound className="w-4 h-4 text-amber-700" />
              Passkey Sign-Off
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Disbursements above the policy threshold require cryptographic FIDO2 passkey verification by an authorized officer.
            </p>
          </div>

          <div className="surface-card p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink">
              <Coins className="w-4 h-4 text-emerald-700" />
              2-Decimal Precision
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              All currency payloads are validated as exact 2-decimal strings before transmission to PayPal APIs.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-ink-secondary leading-relaxed border-t border-border-hairline pt-4">
          <section className="space-y-1.5">
            <h2 className="text-sm font-semibold text-ink">
              1. Authorization of Treasury Workflows
            </h2>
            <p>
              By enabling L2 (Co-Pilot), L3 (Policy-Gated), or L4 (Autonomous) tiers in Policy Studio, the subscribing organization authorizes PayPal Sentinel to initiate scheduled invoice reminders, compile carrier proof-of-delivery evidence, and execute refunds strictly within the configured dollar caps.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-semibold text-ink">
              2. Idempotency & Duplicate-Charge Prevention
            </h2>
            <p>
              Every financial mutation is bound to a deterministic idempotency token (`PayPal-Request-Id`). In the event of upstream rate limits or network interruptions, requests are safely queued and replayed without creating duplicate charges or refunds.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-semibold text-ink">
              3. Cross-Border PYUSD Settlement
            </h2>
            <p>
              When settling vendor invoices via PayPal USD (PYUSD), on-chain transfers are final upon block confirmation. Organizations must verify recipient treasury addresses prior to approving high-value vendor disbursements.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
