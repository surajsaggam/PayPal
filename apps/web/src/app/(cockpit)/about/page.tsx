"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Scale,
  Zap,
  ChevronDown,
  Lock,
  CheckCircle2,
  ArrowRight,
  Globe,
} from "lucide-react";
import { AnimatedNumber, IncreasePulseBars } from "@/components/ui/AnimatedNumber";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const SENTINEL_FAQS: FaqItem[] = [
  {
    id: "faq-1",
    category: "Autonomy & Control",
    question: "1. How do the L0–L4 autonomy levels protect our company bank and PayPal balances?",
    answer:
      "Every financial action is evaluated against deterministic spending policies before touching PayPal APIs. At L3 (Guarded Autonomy), low-risk actions such as invoice reminders and sub-$250 refunds execute automatically, while any high-value refund or payout above your threshold is held for hardware FIDO2 Passkey approval by an authorized CFO or controller.",
  },
  {
    id: "faq-2",
    category: "Smart Invoicing",
    question: "2. How does Smart Invoicing reduce Days Sales Outstanding (DSO) without spamming buyers?",
    answer:
      "PayPal Sentinel schedules payment reminders around buyer time zones, historical payment windows, and strict quiet hours. It also prevents reminder fatigue by enforcing a maximum of 3 reminders per 7-day rolling window and automatically pausing dunning the moment an active dispute or partial settlement is detected.",
  },
  {
    id: "faq-3",
    category: "Dispute Protection",
    question: "3. What evidence is assembled automatically when a buyer opens a PayPal chargeback or claim?",
    answer:
      "When an 'Item Not Received' or duplicate-charge claim arrives via webhook, Sentinel cross-references the PayPal Order ID with carrier proof-of-delivery signatures, GPS drop-off coordinates, and signed customs manifests, compiling a complete evidence bundle ready for one-click submission.",
  },
  {
    id: "faq-4",
    category: "PYUSD Settlement",
    question: "4. When should a treasury team choose PYUSD on Solana over a traditional SWIFT wire?",
    answer:
      "Cross-border supplier payouts settled in PayPal USD (PYUSD) finalize in under 5 seconds at ~$0.001 network cost, eliminating the $48.00 correspondent bank wire fee and 2–4 day settlement float while maintaining 1:1 USD backing.",
  },
  {
    id: "faq-5",
    category: "Security & Privacy",
    question: "5. How are customer PII, API credentials, and duplicate-charge risks handled?",
    answer:
      "Customer emails and phone numbers are masked and hashed at the edge using HMAC-SHA256 before logging. All PayPal client secrets remain strictly server-side, and every state-mutating request uses an atomic two-phase idempotency lock so network retries can never double-refund or double-invoice a buyer.",
  },
];

export default function AboutAndFaqPage() {
  const [openFaqId, setOpenFaqId] = useState<string>("faq-1");

  return (
    <div className="space-y-6 animate-pop-in">
      {/* Hero Banner */}
      <section className="surface-bento p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-lime px-3 py-1 text-xs">
                About PayPal Sentinel
              </span>
              <span className="mono-code-pill text-xs">
                PayPal Invoicing · Disputes · Fastlane · PYUSD
              </span>
            </div>
            <h1 className="editorial-heading text-2xl sm:text-3xl">
              Autonomous Treasury & Receivables Operations with CFO-Grade Guardrails
            </h1>
            <p className="editorial-subcopy text-sm leading-relaxed">
              PayPal Sentinel unifies accounts receivable collection, chargeback defense, policy-gated refunds, and instant cross-border vendor settlement into a single light-first financial workspace.
            </p>
          </div>

          <div className="surface-card p-4 flex items-center gap-4 shrink-0">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                Settlement Velocity
              </div>
              <div className="kpi-stat-value text-2xl mt-0.5">
                <AnimatedNumber value={99.98} decimals={2} suffix="%" />
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                Zero duplicate payouts
              </div>
            </div>
            <IncreasePulseBars />
          </div>
        </div>

        {/* 4 Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
          <div className="surface-card p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-ink">
              Policy-Gated Autonomy
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              Granular L0–L4 spending controls ensure routine operations run hands-free while high-value disbursements require hardware passkey sign-off.
            </p>
          </div>

          <div className="surface-card p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-ink">
              Smart Receivables
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              Automated PayPal Invoicing reminders with timezone awareness, quiet-hour enforcement, and instant QR payment links.
            </p>
          </div>

          <div className="surface-card p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-ink">
              Dispute Protection
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              Instant carrier tracking verification and automated proof-of-delivery evidence bundles to recover contested revenue.
            </p>
          </div>

          <div className="surface-card p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-ink">
              Fastlane & PYUSD
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              One-click wholesale buyer checkout paired with 5-second cross-border supplier settlement via PayPal USD.
            </p>
          </div>
        </div>
      </section>

      {/* Measurable Impact Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="surface-card p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-ink-muted font-medium">
              Average DSO Reduction
            </div>
            <div className="kpi-stat-value text-2xl mt-1 text-emerald-700">
              -<AnimatedNumber value={12.0} decimals={1} suffix=" Days" />
            </div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-600/80" />
        </div>

        <div className="surface-card p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-ink-muted font-medium">
              Dispute Recovery Win Rate
            </div>
            <div className="kpi-stat-value text-2xl mt-1 text-brand-primary">
              <AnimatedNumber value={84.0} decimals={1} suffix="%" />
            </div>
          </div>
          <Lock className="w-6 h-6 text-brand-primary/80" />
        </div>

        <div className="surface-card p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-ink-muted font-medium">
              Cross-Border Wire Fee Saved
            </div>
            <div className="kpi-stat-value text-2xl mt-1 text-ink">
              $<AnimatedNumber value={48.0} decimals={2} />
              <span className="text-xs font-normal text-ink-muted"> / payout</span>
            </div>
          </div>
          <Globe className="w-6 h-6 text-sky-600/80" />
        </div>
      </section>

      {/* 5 Frequently Asked Questions */}
      <section aria-labelledby="faq-heading" className="surface-bento p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="faq-heading" className="editorial-heading text-lg">
              Frequently Asked Questions (5 Core FAQs)
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Answers to common questions about security, autonomy guardrails, invoicing, disputes, and PYUSD settlement.
            </p>
          </div>
          <Link
            href="/command-center"
            className="btn-outline-subtle px-3.5 py-2 text-xs font-medium"
          >
            Open Live Workspace
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {SENTINEL_FAQS.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="surface-card overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqId(isOpen ? "" : faq.id)}
                  aria-expanded={isOpen}
                  className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 hover:bg-surface-subtle/50 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="mono-code-pill text-[11px]">
                      {faq.category}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-ink">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-ink-muted shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-ink" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-ink-secondary leading-relaxed border-t border-border-subtle">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
