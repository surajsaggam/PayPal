import React from "react";
import Link from "next/link";
import { Compass, ArrowLeft, ShieldCheck, FileText, Scale } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center py-12 px-4 animate-pop-in">
      <div className="surface-bento max-w-xl w-full p-6 sm:p-8 text-center space-y-5">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/25 flex items-center justify-center text-brand-primary">
          <Compass className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <span className="badge-lime px-3 py-1 text-xs">
            404 · Route Not Found
          </span>
          <h1 className="editorial-heading text-2xl sm:text-3xl pt-1">
            This treasury view does not exist
          </h1>
          <p className="editorial-subcopy text-sm max-w-md mx-auto">
            The ledger address or workflow route you requested could not be found. Return to the main treasury workspace or jump directly to an active module below.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-left">
          <Link
            href="/command-center"
            className="surface-card p-3 flex items-center gap-2.5 hover:border-brand-primary transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0" />
            <div>
              <div className="text-xs font-semibold text-ink">Overview</div>
              <div className="text-[11px] text-ink-muted">Live Ledger</div>
            </div>
          </Link>
          <Link
            href="/invoicing-scheduler"
            className="surface-card p-3 flex items-center gap-2.5 hover:border-brand-primary transition-colors"
          >
            <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-ink">Invoicing</div>
              <div className="text-[11px] text-ink-muted">Receivables</div>
            </div>
          </Link>
          <Link
            href="/dispute-war-room"
            className="surface-card p-3 flex items-center gap-2.5 hover:border-brand-primary transition-colors"
          >
            <Scale className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-ink">Disputes</div>
              <div className="text-[11px] text-ink-muted">Case Protection</div>
            </div>
          </Link>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/command-center"
            className="btn-secondary-dark px-5 py-2.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Treasury Overview
          </Link>
          <Link
            href="/about"
            className="btn-outline-subtle px-4 py-2.5 text-xs font-medium"
          >
            Help & FAQs
          </Link>
        </div>
      </div>
    </div>
  );
}
