"use client";

/**
 * PayOps AI (PayPal Sentinel) — Screen 1: Executive Financial Command Center
 * Above-the-fold layout:
 *  - Section 1: Compact Executive Header + Inline Natural-Language AI Command Studio (Cmd+K)
 *  - Section 2: 4-Column North-Star KPI Strip (Tabular Numerals)
 *  - Section 3: Autonomous Workflows & Judge Resilience Simulator
 *  - Section 4: Live AG Grid Enterprise 32 Financial Ledger & Expandable 3-Card Inspector
 *  - Section 5: 2-Column Bento Telemetry Cards (30-Day Cash Inflow Waterfall + Fraud Screening)
 */

import React, { useState } from "react";
import {
  ArrowUpRight,
  Table,
  Check,
  ShieldCheck,
} from "lucide-react";
import { InlineCommandStudio } from "../../../components/agent/GlobalCommandBar";
import { WebhookSimulatorToolbar } from "../../../components/agent/WebhookSimulatorToolbar";
import { LedgerCommandGrid } from "../../../components/ag-grid/LedgerCommandGrid";
import {
  AnimatedNumber,
  AnimatedProgressBar,
  IncreasePulseBars,
} from "../../../components/ui/AnimatedNumber";
import { formatCurrencyAmount, LOCALE_DICTIONARY } from "../../../lib/formatters";
import {
  computeLiveMerchantInsights,
  useCockpitStore,
} from "../../../stores/useCockpitStore";

const WATERFALL_BARS = [
  { label: "Smart Invoices Sent", usd: 48200, pct: 100, color: "bg-chart-invoiced" },
  { label: "Collected Early (2% Net-10)", usd: 31400, pct: 65, color: "bg-chart-early" },
  { label: "Polite Reminders Recovered", usd: 11200, pct: 23, color: "bg-chart-dunning" },
  { label: "Disputes Defended", usd: 4470, pct: 14, color: "bg-chart-disputes" },
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
    <div className="space-y-8 animate-pop-in">
      {/* SECTION 1: Compact Executive Header + Top-of-Page AI Command Bar (Above the Fold) */}
      <section className="space-y-5 pt-1">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex">
              <button
                type="button"
                onClick={() => runFullGuidedPitchWalkthrough()}
                className="group badge-lime px-3 py-1 text-xs transition-all duration-200 ease-spring hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
              >
                <span>PayPal Sentinel · Autonomous Treasury Workspace</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl leading-[1.15] tracking-[-0.025em] font-semibold text-ink">
              Autonomous payment operations for ambitious merchants.{" "}
              <span className="font-normal text-ink-muted">
                Automate invoicing, defend disputes, and protect refunds on PayPal.
              </span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => runFullGuidedPitchWalkthrough()}
              className="btn-primary-mint rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Start Guided Tour
            </button>
            <a
              href="#live-execution-ledger"
              className="btn-outline-subtle rounded-xl px-4 py-2 text-xs"
            >
              Jump to Ledger
            </a>
          </div>
        </div>

        {/* Top-of-Page Natural-Language Action Studio */}
        <InlineCommandStudio />
      </section>

      {/* SECTION 2: Structured 4-Column Apple KPI Cards (Visible Above the Fold) */}
      <section
        aria-label="Executive North-Star KPI Ribbon (API-14)"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="surface-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-medium text-ink-muted">{strings.kpiAnmpr}</div>
              <IncreasePulseBars bars={10} />
            </div>
            <div className="mt-2.5 kpi-stat-value text-3xl sm:text-[34px]">
              <AnimatedNumber
                value={Number(insights.annualizedSavingsUsd)}
                durationMs={1050}
                formatFn={(val) =>
                  formatCurrencyAmount(Math.round(val), "USD", activeCurrency, true)
                }
              />
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
            <div className="mt-2.5 kpi-stat-value text-3xl sm:text-[34px]">
              <AnimatedNumber
                value={insights.dsoDaysCurrent}
                decimals={1}
                suffix=" Days"
                durationMs={950}
              />
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
            <div className="mt-2.5 kpi-stat-value text-3xl sm:text-[34px]">
              <AnimatedNumber
                value={insights.disputeWinRatePct}
                decimals={1}
                suffix="%"
                durationMs={1000}
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle text-xs text-status-success-text font-medium tabular-nums">
            +42.0 pts Lift · Signed Delivery Proof
          </div>
        </div>

        <div className="surface-card p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-ink-muted">
              {strings.kpiPolicyFirewall}
            </div>
            <div className="mt-2.5 kpi-stat-value text-3xl sm:text-[34px]">
              <AnimatedNumber value={100.0} decimals={1} suffix="%" durationMs={900} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle text-xs text-ink-secondary tabular-nums">
            Zero Duplicate Charges · {heldCount} Pending Passkey
          </div>
        </div>
      </section>

      {/* SECTION 3: Interactive Rail & Scenario Showcase */}
      <WebhookSimulatorToolbar />

      {/* SECTION 4: Primary Financial Ledger */}
      <div id="live-execution-ledger" className="scroll-mt-20">
        <LedgerCommandGrid />
      </div>

      {/* SECTION 5: 2-Column Concentric Bento Cards */}
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

            <div className="rounded-xl border border-hairline bg-elevated p-5 shadow-xs">
              <div className="mb-5 flex items-baseline justify-between border-b border-border-subtle pb-4">
                <div>
                  <div className="kpi-stat-value text-2xl">
                    <AnimatedNumber
                      value={48200}
                      durationMs={1100}
                      formatFn={(val) =>
                        formatCurrencyAmount(Math.round(val), "USD", activeCurrency, true)
                      }
                    />
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
                  {WATERFALL_BARS.map((bar, idx) => (
                    <div key={bar.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-secondary font-medium">{bar.label}</span>
                        <span className="text-ink font-semibold tabular-nums">
                          <AnimatedNumber
                            value={bar.usd}
                            durationMs={950 + idx * 120}
                            formatFn={(val) =>
                              formatCurrencyAmount(Math.round(val), "USD", activeCurrency, true)
                            }
                          />
                        </span>
                      </div>
                      <AnimatedProgressBar
                        percent={bar.pct}
                        colorClass={bar.color}
                        delayMs={idx * 90}
                      />
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
                    <span>
                      <AnimatedNumber value={82.0} decimals={1} suffix="%" /> · Automatically Approved
                    </span>
                    <Check className="h-3.5 w-3.5 text-ink-muted" />
                  </dd>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-ink-muted">High-Value Refunds</dt>
                  <dd className="flex items-center gap-3 font-medium text-ink">
                    <span>
                      <AnimatedNumber value={12.0} decimals={1} suffix="%" /> · Routed for Passkey Sign-Off
                    </span>
                    <Check className="h-3.5 w-3.5 text-ink-muted" />
                  </dd>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-ink-muted">Disputed Deliveries</dt>
                  <dd className="flex items-center gap-3 font-medium text-ink">
                    <span>
                      <AnimatedNumber value={6.0} decimals={1} suffix="%" /> · Contested with Carrier Proof
                    </span>
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
                    <span>
                      <AnimatedNumber value={98.6} decimals={1} suffix="%" /> Verified Accuracy
                    </span>
                    <Check className="h-3.5 w-3.5 text-status-success-bar" />
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

