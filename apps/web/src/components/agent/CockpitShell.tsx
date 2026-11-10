"use client";

/**
 * PayOps AI (PayPal Sentinel) — Executive Header, Global Autonomy Control & Guided Tour Shell
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sun,
  Moon,
  CheckCircle2,
  X,
  Menu,
  ChevronDown,
  ShieldCheck,
  Database,
  Globe,
  Cpu,
  Sparkles,
  ArrowRight,
  ArrowUp,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import type { AutonomyLevel, CurrencyCode } from "@payops/shared";
import { MOCK_GUIDED_DEMO_SCENARIOS } from "@payops/shared/mock-fixtures";
import {
  fetchDisputes,
  fetchInvoices,
  fetchMerchantInsights,
  fetchWorkspacePolicies,
  updateWorkspacePolicy,
} from "../../lib/api-client";
import { LOCALE_DICTIONARY, type SupportedLocale } from "../../lib/formatters";
import {
  useCockpitStore,
  type ApiOperatingMode,
  type InteractiveUiState,
} from "../../stores/useCockpitStore";
import { ApimaticSdkCodeDrawer } from "../apimatic/ApimaticSdkCodeDrawer";
import { InvoiceQrModal } from "../paypal/InvoiceQrModal";
import { PyusdSolanaBridgeModal } from "../paypal/PyusdSolanaBridgeModal";
import { GlobalCommandBar } from "./GlobalCommandBar";
import { HitlApprovalCard } from "./HitlApprovalCard";
import { McpToolTraceDrawer } from "./McpToolTraceDrawer";

const AUTONOMY_LEVELS: { level: AutonomyLevel; label: string; title: string }[] = [
  { level: "L0", label: "L0", title: "L0 Manual Shadow (Observe Only)" },
  { level: "L1", label: "L1", title: "L1 Assisted Drafts ($50 Auto Cap)" },
  { level: "L2", label: "L2", title: "L2 Passkey Gated ($100 Cap + Hardware Key)" },
  { level: "L3", label: "L3", title: "L3 Policy-Bounded ($250 Auto Cap)" },
  { level: "L4", label: "L4", title: "L4 High-Velocity Autonomous ($500 Auto Cap)" },
];

const ROUTE_BREADCRUMB_LABELS: Record<string, string> = {
  "/": "Command Center",
  "/command-center": "Command Center",
  "/policy-studio": "Policy Studio",
  "/invoicing-scheduler": "Smart Invoicing",
  "/dispute-war-room": "Dispute Defense",
  "/checkout-bridge": "Fastlane & PYUSD",
  "/about": "About & FAQs",
  "/privacy": "Privacy Policy",
  "/terms": "Terms & Conditions",
};

export function CockpitShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [envPopoverOpen, setEnvPopoverOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const envPopoverRef = useRef<HTMLDivElement>(null);

  const {
    workspaces,
    activeWorkspaceId,
    setWorkspaceId,
    updateWorkspaceAutonomy,
    activeCurrency,
    setCurrency,
    activeLocale,
    setLocale,
    apiMode,
    setApiMode,
    uiState,
    setUiState,
    theme,
    toggleTheme,
    navCollapsed,
    toggleNavCollapsed,
    setCommandBarOpen,
    statusBannerMessage,
    setStatusBanner,
    circuitBreakerTripped,
    replayedTranscriptCount,
    lastFailoverLatencyMs,
    activePitchScenario,
    pitchWalkthroughStep,
    executeGuidedPitchScenario,
    runFullGuidedPitchWalkthrough,
    openPyusdModal,
    invoices,
  } = useCockpitStore();

  const strings = LOCALE_DICTIONARY[activeLocale];
  const activeWorkspace =
    workspaces.find((w) => w.workspaceId === activeWorkspaceId) ?? workspaces[0];

  // Hydrate live endpoints (API-03, API-05, API-10, API-14) when operating in live mode
  useEffect(() => {
    if (apiMode !== "live") return;
    void fetchMerchantInsights(activeWorkspaceId);
    void fetchWorkspacePolicies(activeWorkspaceId);
    void fetchInvoices(activeWorkspaceId);
    void fetchDisputes(activeWorkspaceId);
  }, [apiMode, activeWorkspaceId]);

  // Sync HTML theme class with Zustand store
  useEffect(() => {
    if (typeof document !== "undefined") {
      const htmlEl = document.documentElement;
      if (theme === "light") {
        htmlEl.classList.remove("dark");
        htmlEl.classList.add("light");
      } else {
        htmlEl.classList.remove("light");
        htmlEl.classList.add("dark");
      }
    }
  }, [theme]);

  // Track vertical scroll for Back to Top floating button
  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 240);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close Environment popover on route change, outside pointerdown, or Escape
  useEffect(() => {
    setEnvPopoverOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!envPopoverOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (envPopoverRef.current && !envPopoverRef.current.contains(e.target as Node)) {
        setEnvPopoverOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEnvPopoverOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [envPopoverOpen]);

  // Cmd+1..Cmd+5 keyboard shortcuts for the 5 Core Screens
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "1") {
          e.preventDefault();
          router.push("/command-center");
        } else if (e.key === "2") {
          e.preventDefault();
          router.push("/policy-studio");
        } else if (e.key === "3") {
          e.preventDefault();
          router.push("/invoicing-scheduler");
        } else if (e.key === "4") {
          e.preventDefault();
          router.push("/dispute-war-room");
        } else if (e.key === "5") {
          e.preventDefault();
          router.push("/checkout-bridge");
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  const handleGlobalAutonomySwitch = (level: AutonomyLevel) => {
    const tierThresholds: Record<
      AutonomyLevel,
      {
        maxSingleAutoRefundUsd: number;
        maxDailyRefundVelocityUsd: number;
        maxGnnRiskScoreForAutoRefund: number;
      }
    > = {
      L0: { maxSingleAutoRefundUsd: 0, maxDailyRefundVelocityUsd: 0, maxGnnRiskScoreForAutoRefund: 0.0 },
      L1: { maxSingleAutoRefundUsd: 50, maxDailyRefundVelocityUsd: 200, maxGnnRiskScoreForAutoRefund: 0.15 },
      L2: { maxSingleAutoRefundUsd: 100, maxDailyRefundVelocityUsd: 300, maxGnnRiskScoreForAutoRefund: 0.25 },
      L3: { maxSingleAutoRefundUsd: 250, maxDailyRefundVelocityUsd: 500, maxGnnRiskScoreForAutoRefund: 0.35 },
      L4: { maxSingleAutoRefundUsd: 500, maxDailyRefundVelocityUsd: 1500, maxGnnRiskScoreForAutoRefund: 0.45 },
    };
    const thresholds = tierThresholds[level];
    updateWorkspaceAutonomy(level);
    const storeState = useCockpitStore.getState();
    const primaryPolicy = storeState.policies.find((p) => p.workspaceId === activeWorkspaceId);
    if (primaryPolicy) {
      storeState.updatePolicyThreshold(primaryPolicy.policyId, thresholds);
      void updateWorkspacePolicy({
        policyId: primaryPolicy.policyId,
        autonomyLevel: level,
        ...thresholds,
      });
    }
    setStatusBanner(
      `Global Autonomy Tier switched to ${level} ($${thresholds.maxSingleAutoRefundUsd} Single Refund Cap · $${thresholds.maxDailyRefundVelocityUsd}/day).`
    );
  };

  const handleJumpTourStep = (index: number) => {
    const scenario = MOCK_GUIDED_DEMO_SCENARIOS[index];
    if (!scenario) return;
    executeGuidedPitchScenario(scenario.scenarioId);
    router.push(scenario.targetRoute);
    if (scenario.scenarioId === "DEMO_4_PYUSD_BRIDGE") {
      const targetInv =
        invoices.find((i) => i.invoiceNumber === "INV-2026-7704") ?? invoices[0];
      if (targetInv) {
        openPyusdModal(targetInv);
      }
    }
  };

  const navItems = [
    {
      href: "/command-center",
      shortLabel: "Command Center",
      fullLabel: strings.navCommandCenter,
      shortcut: "⌘1",
    },
    {
      href: "/policy-studio",
      shortLabel: "Policy Studio",
      fullLabel: strings.navPolicyStudio,
      shortcut: "⌘2",
    },
    {
      href: "/invoicing-scheduler",
      shortLabel: "Smart Invoicing",
      fullLabel: strings.navInvoicingScheduler,
      shortcut: "⌘3",
    },
    {
      href: "/dispute-war-room",
      shortLabel: "Dispute Defense",
      fullLabel: strings.navDisputeWarRoom,
      shortcut: "⌘4",
    },
    {
      href: "/checkout-bridge",
      shortLabel: "Fastlane & PYUSD",
      fullLabel: strings.navCheckoutBridge,
      shortcut: "⌘5",
    },
  ];

  const currentBreadcrumb =
    ROUTE_BREADCRUMB_LABELS[pathname] ?? "Treasury Workspace";

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink transition-colors duration-200 overflow-x-hidden">
      {/* Top Navbar — Apple Translucent Chrome Layer */}
      <header className="sticky top-0 z-30 apple-glass-nav">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-10">
          {/* Left: Geometric Wordmark + Segmented Hover-Pill Navigation */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleNavCollapsed}
                aria-label="Toggle Left Navigation Rail"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-subtle hover:text-ink active:scale-95 transition-all lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>

              <Link
                href="/command-center"
                className="group flex items-center gap-1.5 text-[15px] font-extrabold uppercase tracking-[0.07em] text-ink transition-opacity hover:opacity-85 active:scale-[0.98] whitespace-nowrap"
              >
                <span className="inline-block h-4 w-[2.5px] rounded-full bg-ink transition-transform duration-200 ease-spring group-hover:scale-y-125" />
                <span>SENTINEL</span>
              </Link>
            </div>

            {/* Single-Line Navigation Links */}
            <nav
              aria-label="Primary Cockpit Navigation"
              className="hidden lg:flex items-center gap-1"
            >
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (pathname === "/" && item.href === "/command-center");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={`${item.fullLabel} (${item.shortcut})`}
                    className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12.5px] transition-all duration-200 ease-spring active:scale-[0.975] ${
                      isActive
                        ? "bg-subtle/95 text-ink font-semibold shadow-2xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
                        : "font-medium text-ink-muted hover:bg-subtle/60 hover:text-ink"
                    }`}
                  >
                    {item.shortLabel}
                  </Link>
                );
              })}

              {/* Origin-Anchored Environment Popover Trigger */}
              <div ref={envPopoverRef} className="relative">
                <button
                  type="button"
                  aria-expanded={envPopoverOpen}
                  onClick={() => setEnvPopoverOpen((v) => !v)}
                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-all duration-200 ease-spring active:scale-[0.975] cursor-pointer ${
                    envPopoverOpen
                      ? "bg-subtle text-ink font-semibold shadow-2xs"
                      : "text-ink-muted hover:bg-subtle/60 hover:text-ink"
                  }`}
                >
                  <span>Settings</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ease-spring ${
                      envPopoverOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {envPopoverOpen && (
                  <div className="animate-popover-origin apple-glass-sheet absolute left-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-[460px] max-w-[460px] rounded-2xl p-5 z-50 grid grid-cols-1 sm:grid-cols-12 gap-5">
                    <div className="sm:col-span-7 space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface text-ink-secondary shadow-2xs">
                          <Cpu className="h-3.5 w-3.5" />
                        </span>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-ink">
                            PayPal Sandbox Connection
                          </label>
                          <select
                            aria-label="Select API Mode (Mock / Live / Replay)"
                            value={apiMode}
                            onChange={(e) => setApiMode(e.target.value as ApiOperatingMode)}
                            className="mt-1.5 h-8 w-full rounded-lg border border-hairline bg-elevated px-2.5 font-mono text-[11px] text-ink shadow-2xs focus:border-ink focus:outline-none"
                          >
                            <option value="live">LIVE PAYPAL SANDBOX (:4000)</option>
                            <option value="mock">SANDBOX FIXTURES (OFFLINE DEMO)</option>
                            <option value="replay">SIGNED TRANSCRIPT REPLAY</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface text-ink-secondary shadow-2xs">
                          <Globe className="h-3.5 w-3.5" />
                        </span>
                        <div className="flex-1 grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-ink">
                              Currency
                            </label>
                            <select
                              aria-label="Select Display Currency"
                              value={activeCurrency}
                              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                              className="mt-1.5 h-8 w-full rounded-lg border border-hairline bg-elevated px-2 font-mono text-[11px] text-ink shadow-2xs focus:border-ink focus:outline-none"
                            >
                              <option value="USD">$ USD</option>
                              <option value="INR">₹ INR</option>
                              <option value="EUR">€ EUR</option>
                              <option value="GBP">£ GBP</option>
                              <option value="PYUSD">PYUSD</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-ink">
                              Language
                            </label>
                            <select
                              aria-label="Select Interface Language Locale"
                              value={activeLocale}
                              onChange={(e) => setLocale(e.target.value as SupportedLocale)}
                              className="mt-1.5 h-8 w-full rounded-lg border border-hairline bg-elevated px-2 font-mono text-[11px] text-ink shadow-2xs focus:border-ink focus:outline-none"
                            >
                              <option value="en">EN</option>
                              <option value="hi">HI</option>
                              <option value="es">ES</option>
                              <option value="de">DE</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface text-ink-secondary shadow-2xs">
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </span>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-ink">
                            Workspace State Preview
                          </label>
                          <select
                            aria-label="Inspect 5 Interactive UI States"
                            value={uiState}
                            onChange={(e) => setUiState(e.target.value as InteractiveUiState)}
                            className="mt-1.5 h-8 w-full rounded-lg border border-hairline bg-elevated px-2.5 font-mono text-[11px] text-ink shadow-2xs focus:border-ink focus:outline-none"
                          >
                            <option value="success">Normal Connected State</option>
                            <option value="loading">Syncing / Loading State</option>
                            <option value="empty">Clean Empty Workspace</option>
                            <option value="offline">Offline Queue Mode</option>
                            <option value="error">Rate-Limit Recovery Mode</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-5 flex flex-col justify-between gap-3">
                      <div className="rounded-xl bg-surface/90 p-3.5 border border-hairline shadow-2xs">
                        <div className="text-xs font-semibold text-ink">Duplicate-Charge Lock</div>
                        <div className="mt-0.5 text-[11px] text-ink-muted">
                          Atomic Idempotency Active
                        </div>
                        <div className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold text-status-success-text tabular-nums">
                          <Database className="h-3 w-3" />
                          24H LEASE · VERIFIED
                        </div>
                      </div>

                      <div className="rounded-xl bg-surface/90 p-3.5 border border-hairline shadow-2xs">
                        <div className="text-xs font-semibold text-ink">Active Autonomy</div>
                        <div className="mt-0.5 text-[11px] text-ink-muted">
                          Tier {activeWorkspace.autonomyLevel} · 35 PayPal Actions
                        </div>
                        <div className="mt-2.5 font-mono text-[10px] text-status-success-text font-semibold">
                          Real-Time Policy Guard
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right: Ask AI (Cmd+K) + Theme + Guided Pitch */}
          <div className="flex items-center gap-2 shrink-0">
            {(apiMode === "replay" || circuitBreakerTripped) && (
              <span
                role="status"
                aria-label="R-06 Circuit Breaker Replay Active"
                className="whitespace-nowrap rounded-pill border border-status-warning-border bg-status-warning-bg px-2.5 py-1 font-mono text-[10px] font-semibold text-status-warning-text tabular-nums"
              >
                REPLAY ({lastFailoverLatencyMs ?? 11}ms · {replayedTranscriptCount})
              </span>
            )}

            {/* Spotlight Ask AI Trigger (C-1) */}
            <button
              type="button"
              onClick={() => setCommandBarOpen(true)}
              aria-label="Open Sentinel AI Spotlight Command Palette (Cmd+K)"
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-elevated px-2.5 sm:px-3 py-1.5 text-xs font-medium text-ink shadow-2xs hover:border-border-strong active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-ink-secondary" />
              <span className="hidden sm:inline">Quick Action</span>
              <kbd className="rounded bg-subtle px-1.5 py-0.2 font-mono text-[10px] text-ink-muted">
                ⌘K
              </kbd>
            </button>

            {/* Tactile Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Dark or Light Executive Theme"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-all duration-150 hover:bg-subtle/70 hover:text-ink active:scale-95 cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5 text-status-warning-bar" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Primary Dark Pill CTA */}
            <button
              type="button"
              onClick={() => runFullGuidedPitchWalkthrough()}
              className="btn-secondary-dark whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer"
            >
              Guided Tour
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        {!navCollapsed && (
          <nav
            aria-label="Mobile Cockpit Navigation"
            className="flex items-center gap-1.5 overflow-x-auto border-t border-hairline bg-surface/95 px-4 py-2.5 lg:hidden"
          >
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (pathname === "/" && item.href === "/command-center");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                    isActive
                      ? "bg-elevated text-ink border border-hairline shadow-2xs font-semibold"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {item.shortLabel}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Interactive 4-Step Guided Tour Overlay Banner (A-2) */}
        {activePitchScenario && (
          <div className="border-t border-accent-lime-border bg-accent-lime/25 px-4 py-2.5 text-xs text-ink sm:px-10">
            <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-lime px-2.5 py-0.5 font-semibold">
                  Interactive Tour · Step {pitchWalkthroughStep ?? 1}/4
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {MOCK_GUIDED_DEMO_SCENARIOS.map((sc, idx) => {
                    const isCurrent = activePitchScenario.scenarioId === sc.scenarioId;
                    return (
                      <button
                        key={sc.scenarioId}
                        type="button"
                        onClick={() => handleJumpTourStep(idx)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-ink text-canvas font-semibold shadow-2xs"
                            : "bg-elevated/80 text-ink-secondary hover:bg-elevated hover:text-ink"
                        }`}
                      >
                        {idx + 1}. {sc.title.split("(")[0].trim()}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const currentIdx = MOCK_GUIDED_DEMO_SCENARIOS.findIndex(
                      (s) => s.scenarioId === activePitchScenario.scenarioId
                    );
                    const nextIdx = (currentIdx + 1) % MOCK_GUIDED_DEMO_SCENARIOS.length;
                    handleJumpTourStep(nextIdx);
                  }}
                  className="btn-secondary-dark rounded-lg px-3 py-1 text-[11px] font-semibold cursor-pointer"
                >
                  <span>Next Step</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subtle Status Toast Banner */}
        {statusBannerMessage && (
          <div
            role="status"
            aria-live="polite"
            className="animate-tab-switch border-t border-hairline bg-surface/95 px-4 py-2 text-xs text-ink sm:px-10"
          >
            <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 font-mono text-[11px] tabular-nums break-words">
                <CheckCircle2 className="h-3.5 w-3.5 text-status-success-bar shrink-0" />
                <span>{statusBannerMessage}</span>
              </span>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                aria-label="Dismiss Notification Banner"
                className="rounded-md p-1 text-ink-muted hover:bg-subtle hover:text-ink active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Breadcrumb & Global Workspace Control Bar */}
      <div className="border-b border-subtle bg-surface/40">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-[11px] text-ink-muted sm:px-10">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
            <Link
              href="/command-center"
              className="font-medium text-ink-secondary hover:text-ink transition-colors"
            >
              PayPal Sentinel
            </Link>
            <ChevronRight className="h-3 w-3 text-ink-faint" />
            <span className="font-semibold text-ink">{currentBreadcrumb}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Merchant Workspace Selector */}
            <select
              aria-label="Select Merchant Workspace (E-01)"
              value={activeWorkspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="hidden sm:inline-block max-w-[230px] truncate rounded-md border border-hairline bg-elevated/80 px-2 py-0.5 text-[11px] font-medium text-ink-secondary transition-colors duration-150 hover:text-ink focus:outline-none cursor-pointer"
            >
              {workspaces.map((ws) => (
                <option key={ws.workspaceId} value={ws.workspaceId} className="bg-elevated text-ink">
                  {ws.merchantName}
                </option>
              ))}
            </select>

            {/* Global L0-L4 Autonomy Segmented Selector (C-4) */}
            <div
              role="group"
              aria-label="Global Autonomy Tier Selector (L0-L4)"
              className="inline-flex items-center rounded-lg border border-hairline bg-subtle/80 p-0.5"
            >
              {AUTONOMY_LEVELS.map((tier) => {
                const isSelected = activeWorkspace.autonomyLevel === tier.level;
                return (
                  <button
                    key={tier.level}
                    type="button"
                    title={tier.title}
                    onClick={() => handleGlobalAutonomySwitch(tier.level)}
                    className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-elevated text-ink font-bold shadow-2xs"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {tier.label}
                  </button>
                );
              })}
            </div>

            <Link
              href="/about"
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-ink-secondary hover:bg-subtle hover:text-ink transition-colors"
            >
              <HelpCircle className="h-3 w-3" />
              <span>About &amp; FAQs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-[1280px] flex-1 min-w-0 px-4 pt-6 pb-14 sm:px-10">
        {children}
      </main>

      {/* Executive Footer with About/FAQ, Privacy Policy, Terms & Conditions, and State Controls */}
      <footer className="border-t border-hairline bg-surface/70 mt-auto">
        <div className="mx-auto flex max-w-[1280px] flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 py-5 text-xs text-ink-muted sm:px-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold tracking-wider uppercase text-ink text-[11px]">
              PayPal Sentinel
            </span>
            <span>·</span>
            <span>Autonomous CFO Treasury, Invoicing &amp; Dispute Protection</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/about" className="hover:text-ink transition-colors font-medium">
              About &amp; 5 FAQs
            </Link>
            <Link href="/privacy" className="hover:text-ink transition-colors font-medium">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-ink transition-colors font-medium">
              Terms &amp; Conditions
            </Link>
            <button
              type="button"
              onClick={() => setUiState(uiState === "empty" ? "success" : "empty")}
              className="rounded-md border border-hairline bg-elevated px-2.5 py-1 text-[11px] font-medium text-ink-secondary hover:text-ink hover:border-border-strong transition-colors cursor-pointer"
            >
              {uiState === "empty" ? "Restore Active Ledger" : "Preview Empty State"}
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll Back to Top"
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-1.5 rounded-full border border-hairline bg-ink px-3.5 py-2 text-xs font-semibold text-canvas shadow-elevated transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ArrowUp className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Top</span>
        </button>
      )}

      {/* Shared Drawers, Modals & Spotlight Command Studio */}
      <McpToolTraceDrawer />
      <HitlApprovalCard />
      <ApimaticSdkCodeDrawer />
      <InvoiceQrModal />
      <PyusdSolanaBridgeModal />
      <GlobalCommandBar />
    </div>
  );
}

