"use client";

/**
 * PayOps AI (PayPal Sentinel) — Screen 1: Increase.com-Inspired Executive Landing & Command Center
 * Modeled directly on Increase.com reference architecture (PDF Pages 1–4):
 *  - Section 1: Open Full-Bleed Hero with Lime Pill, 3-Line Dual-Tone Headline, Mint/White CTAs & Full-Scale 3D Folded Ribbon
 *  - Section 2: Partner Logo Strip + Architectural 4-Column Stat Strip
 *  - Section 3: Interactive Rail & Scenario Showcase ("Autonomous workflows on every PayPal rail")
 *  - Section 4: 2-Column Bento Cards (30-Day Cash Inflow Waterfall + Modular GNN Compliance)
 *  - Section 5: Live AG Grid Enterprise Financial Ledger & Expandable 3-Column Inspection Cards
 */

import React, { useState } from "react";
import {
  ArrowUpRight,
  Table,
  Check,
  ShieldCheck,
} from "lucide-react";
import { LedgerCommandGrid } from "../../../components/ag-grid/LedgerCommandGrid";
import { WebhookSimulatorToolbar } from "../../../components/agent/WebhookSimulatorToolbar";
import { formatCurrencyAmount, LOCALE_DICTIONARY } from "../../../lib/formatters";
import {
  computeLiveMerchantInsights,
  useCockpitStore,
} from "../../../stores/useCockpitStore";

const WATERFALL_BARS = [
  { label: "Invoiced (v2)", usd: 48200, pct: 100, color: "bg-chart-invoiced" },
  { label: "Collected Early (2% Disc)", usd: 31400, pct: 65, color: "bg-chart-early" },
  { label: "Auto-Dunning Recovered", usd: 11200, pct: 23, color: "bg-chart-dunning" },
  { label: "Disputes Defended (F-04)", usd: 4470, pct: 14, color: "bg-chart-disputes" },
];

export default function CommandCenterPage() {
  const {
    activeWorkspaceId,
    activeCurrency,
    activeLocale,
    executions,
    anmprBonusUsd,
    dsoDeltaDays,
    winRateDeltaPct,
    runFullGuidedPitchWalkthrough,
  } = useCockpitStore();
  const [showAccessibleChartTable, setShowAccessibleChartTable] = useState(false);
  const strings = LOCALE_DICTIONARY[activeLocale];
  const insights = computeLiveMerchantInsights(
    activeWorkspaceId,
    anmprBonusUsd,
    dsoDeltaDays,
    winRateDeltaPct
  );

  const heldCount = executions.filter(
    (e) => e.policyVerdict === "HELD_FOR_L2_PASSKEY"
  ).length;

  return (
    <div className="space-y-14 sm:space-y-16 animate-pop-in">
      {/* SECTION 1: Open Full-Bleed Hero + Immersive 3D Folded Ribbon */}
      <div>
        <section className="relative min-h-[480px] sm:min-h-[530px] lg:min-h-[560px] pt-10 sm:pt-14 pb-24">
          {/* Upper-Left Editorial Copy & Action Pair */}
          <div className="relative z-10 max-w-[620px] space-y-6">
            {/* Signature Acid Lime Announcement Pill */}
            <div className="inline-flex">
              <button
                type="button"
                onClick={() => runFullGuidedPitchWalkthrough()}
                className="group badge-lime px-3.5 py-1.5 text-[12.5px] transition-all duration-200 ease-spring hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
              >
                <span>Introducing PayPal Sentinel, Autonomous CFO</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>

            {/* 3-Line Dual-Tone Optical Display Headline */}
            <h1 className="text-[34px] sm:text-[44px] leading-[1.1] tracking-[-0.03em] font-semibold text-ink">
              Autonomous payment operations{" "}
              <br className="hidden sm:inline" />
              for ambitious merchants.{" "}
              <span className="font-normal text-ink-muted">
                Build resilient cashflow with an MCP-first bank rail.
              </span>
            </h1>

            {/* Tactile Mint & White CTA Pair */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => runFullGuidedPitchWalkthrough()}
                className="btn-primary-mint rounded-xl px-5 py-2.5 text-[13.5px] cursor-pointer"
              >
                Start walkthrough
              </button>
              <a
                href="#live-execution-ledger"
                className="btn-outline-subtle rounded-xl px-5 py-2.5 text-[13.5px]"
              >
                Inspect ledger
              </a>
            </div>
          </div>

          {/* Immersive Full-Scale 3D Folded Accordion Ribbon */}
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute bottom-0 left-[-4%] sm:left-[6%] lg:left-[12%] right-[-18%] sm:right-[-14%] lg:right-[-16%] z-0 flex items-end justify-end overflow-visible"
          >
            <svg
              viewBox="0 0 1200 560"
              className="w-full max-w-[1180px] h-auto overflow-visible transition-transform duration-700 ease-spring"
              preserveAspectRatio="xMaxYMax meet"
            >
              <defs>
                {/* Front Face 1: Acid Lime to Fresh Mint */}
                <linearGradient id="ribbonFace1" x1="15%" y1="15%" x2="85%" y2="95%">
                  <stop offset="0%" stopColor="#DDF969" />
                  <stop offset="55%" stopColor="#8CE99A" />
                  <stop offset="100%" stopColor="#6EE7B7" />
                </linearGradient>

                {/* Fold Shadow 1: Shaded Mint-Emerald */}
                <linearGradient id="ribbonFold1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#72DF9C" />
                  <stop offset="100%" stopColor="#56CFA5" />
                </linearGradient>

                {/* Front Face 2: Mint to Cyan-Sky */}
                <linearGradient id="ribbonFace2" x1="15%" y1="10%" x2="85%" y2="95%">
                  <stop offset="0%" stopColor="#7AE7B9" />
                  <stop offset="50%" stopColor="#63E2C6" />
                  <stop offset="100%" stopColor="#5BC8F7" />
                </linearGradient>

                {/* Fold Shadow 2: Shaded Cyan-Azure */}
                <linearGradient id="ribbonFold2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#56C8EE" />
                  <stop offset="100%" stopColor="#469CE8" />
                </linearGradient>

                {/* Front Face 3: Sky Blue to Vivid Azure */}
                <linearGradient id="ribbonFace3" x1="15%" y1="5%" x2="85%" y2="95%">
                  <stop offset="0%" stopColor="#67C3F8" />
                  <stop offset="55%" stopColor="#54A8F7" />
                  <stop offset="100%" stopColor="#4389F5" />
                </linearGradient>

                {/* Fold Shadow 3: Deep Cobalt Fold */}
                <linearGradient id="ribbonFold3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4895EF" />
                  <stop offset="100%" stopColor="#2F6FE4" />
                </linearGradient>

                {/* Front Face 4: Far-Right Ascending Wing */}
                <linearGradient id="ribbonFace4" x1="10%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor="#63B4F9" />
                  <stop offset="100%" stopColor="#3E82F7" />
                </linearGradient>
              </defs>

              {/* Back Fold Planes (Rendered behind the front ascending ribbons) */}
              <polygon
                points="325,345 555,515 568,560 392,560"
                fill="url(#ribbonFold1)"
              />
              <polygon
                points="612,165 895,382 952,560 735,560"
                fill="url(#ribbonFold2)"
              />
              <polygon
                points="905,-10 1190,220 1190,495 1045,435"
                fill="url(#ribbonFold3)"
              />

              {/* Primary Ascending Front Ribbon Planes */}
              <polygon
                points="170,415 325,345 392,560 225,560"
                fill="url(#ribbonFace1)"
              />
              <polygon
                points="450,240 612,165 735,560 568,560"
                fill="url(#ribbonFace2)"
              />
              <polygon
                points="740,65 905,-10 1085,560 915,560"
                fill="url(#ribbonFace3)"
              />
              <polygon
                points="1030,-80 1210,-150 1355,420 1190,495"
                fill="url(#ribbonFace4)"
              />
            </svg>
          </div>
        </section>

        {/* Full-Width Hairline Floor Divider + Typographic Partner Logo Strip */}
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen border-t border-b border-hairline bg-surface/60 backdrop-blur-md py-6">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-8 px-6 sm:px-10 text-ink">
            <span className="text-[16px] font-bold tracking-tight opacity-85 hover:opacity-100 transition-opacity">
              ≈payops
            </span>
            <span className="text-[15px] font-extrabold tracking-[0.14em] uppercase opacity-80 hover:opacity-100 transition-opacity">
              PAYPAL MCP
            </span>
            <span className="text-[16px] font-semibold tracking-tight opacity-80 hover:opacity-100 transition-opacity">
              AG Grid<sup className="text-[9px] font-mono ml-0.5">32</sup>
            </span>
            <span className="text-[16px] font-bold tracking-tight opacity-85 hover:opacity-100 transition-opacity">
              bryntum
            </span>
            <span className="text-[16px] font-extrabold tracking-tight opacity-85 hover:opacity-100 transition-opacity">
              elastic
            </span>
            <span className="text-[14px] font-bold tracking-[0.08em] uppercase opacity-80 hover:opacity-100 transition-opacity">
              APIMATIC
            </span>
            <span className="text-[16px] font-semibold tracking-tight opacity-85 hover:opacity-100 transition-opacity">
              PYUSD<span className="font-normal text-ink-muted ml-1 text-xs">↗</span>
            </span>
            <span className="text-[15px] font-bold tracking-tight opacity-75 hover:opacity-100 transition-opacity">
              ◎ JunoDB
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Structured 4-Column Apple KPI Cards (Generous Breathing Room & Tabular Numerals) */}
      <section
        aria-label="Executive North-Star KPI Ribbon (API-14)"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="surface-card p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-ink-muted">{strings.kpiAnmpr}</div>
            <div className="mt-2.5 kpi-stat-value text-3xl sm:text-[36px]">
              {formatCurrencyAmount(insights.annualizedSavingsUsd, "USD", activeCurrency, true)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle font-mono text-[11px] text-status-success-text tabular-nums">
            {anmprBonusUsd > 0
              ? `+${formatCurrencyAmount(anmprBonusUsd, "USD", activeCurrency)} Live`
              : "+38.4% YoY"}
            {" · "}INR {formatCurrencyAmount(insights.annualizedSavingsInr, "INR", "INR", true)}/yr
          </div>
        </div>

        <div className="surface-card p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-ink-muted">{strings.kpiDso}</div>
            <div className="mt-2.5 kpi-stat-value text-3xl sm:text-[36px]">
              {insights.dsoDaysCurrent.toFixed(1)} Days
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle font-mono text-[11px] text-ink-secondary tabular-nums">
            -{insights.dsoReductionPct}% vs 28d Baseline · 2% Net-10
          </div>
        </div>

        <div className="surface-card p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-ink-muted">
              {strings.kpiDisputeWinRate}
            </div>
            <div className="mt-2.5 kpi-stat-value text-3xl sm:text-[36px]">
              {insights.disputeWinRatePct.toFixed(1)}%
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle text-xs text-status-success-text font-medium tabular-nums">
            +42.0 pts Lift · Automated Delivery Proof
          </div>
        </div>

        <div className="surface-card p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-ink-muted">
              {strings.kpiPolicyFirewall}
            </div>
            <div className="mt-2.5 kpi-stat-value text-3xl sm:text-[36px]">
              100.0%
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle text-xs text-ink-secondary tabular-nums">
            Zero Duplicate Charges · {heldCount} Pending Review
          </div>
        </div>
      </section>

      {/* SECTION 3: Interactive Rail & Scenario Showcase */}
      <WebhookSimulatorToolbar />

      {/* SECTION 4: 2-Column Concentric Bento Cards */}
      <section
        aria-label="AG Charts Enterprise Financial Telemetry"
        className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8"
      >
        {/* Left Bento Card: 30-Day Cash Inflow & DSO Waterfall */}
        <div className="surface-bento rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold tracking-tight text-ink">
                30-Day Cash Inflow &amp; Receivables Velocity
              </h2>
              <button
                type="button"
                onClick={() => setShowAccessibleChartTable((v) => !v)}
                aria-pressed={showAccessibleChartTable}
                className="btn-outline-subtle px-2.5 py-1 text-xs cursor-pointer"
              >
                <Table className="h-3 w-3 text-ink-muted" />
                {showAccessibleChartTable ? "Show Visual Bars" : "View Table"}
              </button>
            </div>

            {/* Inner Crisp White Card */}
            <div className="rounded-xl border border-hairline bg-elevated p-5 shadow-xs">
              <div className="mb-5 flex items-baseline justify-between border-b border-border-subtle pb-4">
                <div>
                  <div className="kpi-stat-value text-2xl">
                    {formatCurrencyAmount(48200, "USD", activeCurrency, true)}
                  </div>
                  <div className="mt-1 text-xs text-ink-muted tabular-nums">
                    30-Day Gross Invoiced Volume · Early-Pay Velocity +65.1%
                  </div>
                </div>
                <span className="rounded-pill border border-status-success-border bg-status-success-bg px-2.5 py-0.5 text-xs font-medium text-status-success-text">
                  Live Cashflow
                </span>
              </div>

              {showAccessibleChartTable ? (
                <table
                  aria-label="Accessible Summary Table for 30-Day Cash Inflow Waterfall"
                  className="w-full text-left border-collapse text-xs"
                >
                  <thead>
                    <tr className="border-b border-hairline text-[10px] uppercase text-ink-muted">
                      <th className="py-2">Cashflow Stage</th>
                      <th className="py-2">Amount ({activeCurrency})</th>
                      <th className="py-2">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {WATERFALL_BARS.map((bar) => (
                      <tr key={bar.label}>
                        <td className="py-2 font-sans text-ink">{bar.label}</td>
                        <td className="py-2 text-ink font-semibold tabular-nums">
                          {formatCurrencyAmount(bar.usd, "USD", activeCurrency, true)}
                        </td>
                        <td className="py-2 text-status-success-text tabular-nums">{bar.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="space-y-3.5">
                  {WATERFALL_BARS.map((bar) => (
                    <div key={bar.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-secondary font-medium">{bar.label}</span>
                        <span className="text-ink font-semibold tabular-nums">
                          {formatCurrencyAmount(bar.usd, "USD", activeCurrency, true)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-subtle overflow-hidden">
                        <div
                          className={`h-full rounded-full ${bar.color}`}
                          style={{ width: `${bar.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Bento Card: Risk & Compliance Overview */}
        <div className="surface-bento rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight text-ink">
                Real-Time Fraud Screening &amp; Policy Compliance
              </h2>
              <span className="text-xs font-medium text-ink-muted">Instant Screening</span>
            </div>

            {/* Inner Crisp White Compliance Card */}
            <div className="rounded-xl border border-hairline bg-elevated p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between border-b border-border-subtle pb-3.5">
                <div>
                  <div className="text-sm font-semibold text-ink">
                    Buyer, Device &amp; Carrier Verification
                  </div>
                  <div className="mt-0.5 text-xs text-ink-muted">
                    Protected by{" "}
                    <span className="inline-flex items-center gap-1 font-medium text-ink">
                      <ShieldCheck className="h-3.5 w-3.5 text-status-success-bar" />
                      Sentinel Policy Guardrails
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-hairline bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-success-bar" />
                  Active Monitoring
                </span>
              </div>

              <dl className="divide-y divide-border-subtle text-xs tabular-nums">
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-ink-muted">Standard Transactions</dt>
                  <dd className="flex items-center gap-3 font-medium text-ink">
                    <span>82.0% · Automatically Approved</span>
                    <Check className="h-3.5 w-3.5 text-ink-muted" />
                  </dd>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-ink-muted">High-Value Refunds</dt>
                  <dd className="flex items-center gap-3 font-medium text-ink">
                    <span>12.0% · Routed for Passkey Sign-Off</span>
                    <Check className="h-3.5 w-3.5 text-ink-muted" />
                  </dd>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-ink-muted">Disputed Deliveries</dt>
                  <dd className="flex items-center gap-3 font-medium text-ink">
                    <span>6.0% · Contested with Carrier Proof</span>
                    <Check className="h-3.5 w-3.5 text-ink-muted" />
                  </dd>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-ink-muted">180-Day Compliance Log</dt>
                  <dd className="flex items-center gap-3 font-medium text-ink">
                    <span>Tamper-Proof &amp; Verified</span>
                    <Check className="h-3.5 w-3.5 text-ink-muted" />
                  </dd>
                </div>

                <div className="flex items-center justify-between pt-2.5">
                  <dt className="text-ink-muted">Returning Buyer Accuracy</dt>
                  <dd className="flex items-center gap-3 font-semibold text-status-success-text">
                    <span>98.6% Verified Accuracy</span>
                    <Check className="h-3.5 w-3.5 text-status-success-bar" />
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Primary AG Grid Enterprise Financial Ledger */}
      <div id="live-execution-ledger" className="scroll-mt-20">
        <LedgerCommandGrid />
      </div>
    </div>
  );
}
