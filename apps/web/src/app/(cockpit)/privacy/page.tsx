import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, EyeOff, FileCheck, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "PayPal Sentinel Privacy Policy — Zero-PII telemetry, HMAC-SHA256 buyer masking, DPDP Act 2023 and GDPR data protection standards.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6 animate-pop-in max-w-4xl mx-auto">
      <div className="surface-bento p-5 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1.5">
            <span className="badge-lime px-3 py-1 text-xs">
              Data Protection & Privacy Policy
            </span>
            <h1 className="editorial-heading text-2xl sm:text-3xl pt-1">
              Privacy Policy & Zero-PII Safeguards
            </h1>
            <p className="text-xs text-ink-muted">
              Effective Date: November 2026 · Compliant with DPDP Act 2023, GDPR, and PCI-DSS v4.0
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
              <EyeOff className="w-4 h-4 text-brand-primary" />
              Zero Raw PII in Logs
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Buyer emails, phone numbers, and shipping street addresses are tokenized with HMAC-SHA256 prior to audit storage.
            </p>
          </div>

          <div className="surface-card p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink">
              <Lock className="w-4 h-4 text-emerald-700" />
              Server-Side Credentials
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              PayPal OAuth2 client secrets and webhook signing keys never leave the backend vault and are never exposed to the browser DOM.
            </p>
          </div>

          <div className="surface-card p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink">
              <FileCheck className="w-4 h-4 text-sky-700" />
              180-Day Chargeback Window
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Signed delivery receipts and dispute artifacts are retained for the statutory 180-day PayPal dispute window and purged on schedule.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-ink-secondary leading-relaxed border-t border-border-hairline pt-4">
          <section className="space-y-1.5">
            <h2 className="text-sm font-semibold text-ink">
              1. Information We Process
            </h2>
            <p>
              PayPal Sentinel processes merchant invoice identifiers, order totals, carrier tracking numbers, and dispute reason codes strictly to execute authorized accounts-receivable and chargeback-defense workflows on behalf of the subscribing business.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-semibold text-ink">
              2. Edge Redaction & Cryptographic Hashing
            </h2>
            <p>
              Before any workflow event is indexed or displayed in audit traces, personally identifiable fields are masked (for example, <code className="mono-code-pill">a***@acme-freight.io</code>) so finance operators can verify counterparties without exposing raw customer contact lists.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-semibold text-ink">
              3. Data Subject Rights & Erasure
            </h2>
            <p>
              Subscribing merchants and their buyers may request access, correction, or cryptographic erasure of historical invoice telemetry at any time through the workspace security settings, subject only to active financial dispute retention mandates.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
