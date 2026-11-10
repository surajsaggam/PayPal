"use client";

/**
 * PayOps AI (PayPal Sentinel) — Increase.com Exact Header & Navigation Shell
 * Modeled directly on Increase.com top navbar:
 *  - Left: |SENTINEL geometric logotype + single-line hover-animated navigation tabs
 *  - Right: Minimalist ghost Workspace/Environment triggers + crisp dark 'Guided Pitch' button
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
} from "lucide-react";
import type { CurrencyCode } from "@payops/shared";
import {
  fetchDisputes,
  fetchInvoices,
  fetchMerchantInsights,
  fetchWorkspacePolicies,
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

export function CockpitShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [envPopoverOpen, setEnvPopoverOpen] = useState(false);
  const envPopoverRef = useRef<HTMLDivElement>(null);

  const {
    workspaces,
    activeWorkspaceId,
    setWorkspaceId,
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
    statusBannerMessage,
    setStatusBanner,
    circuitBreakerTripped,
    replayedTranscriptCount,
    lastFailoverLatencyMs,
    runFullGuidedPitchWalkthrough,
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

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink transition-colors duration-200 overflow-x-hidden">
      {/* Top Navbar — Apple Translucent Chrome Layer (content scrolls underneath) */}
      <header className="sticky top-0 z-30 apple-glass-nav">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-6 sm:px-10">
          {/* Left: Geometric Wordmark + Segmented Hover-Pill Navigation */}
          <div className="flex items-center gap-7">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleNavCollapsed}
                aria-label="Toggle Left Navigation Rail"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-subtle hover:text-ink active:scale-95 transition-all lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>

              {/* |SENTINEL Geometric Brand Wordmark */}
              <Link
                href="/command-center"
                className="group flex items-center gap-1.5 text-[15px] font-extrabold uppercase tracking-[0.07em] text-ink transition-opacity hover:opacity-85 active:scale-[0.98] whitespace-nowrap"
              >
                <span className="inline-block h-4 w-[2.5px] rounded-full bg-ink transition-transform duration-200 ease-spring group-hover:scale-y-125" />
                <span>SENTINEL</span>
              </Link>
            </div>

            {/* Single-Line Navigation Links with Apple Pill Highlight & Instant Press */}
            <nav
              aria-label="Primary Cockpit Navigation"
              className="hidden lg:flex items-center gap-1.5"
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
                    className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[13px] transition-all duration-200 ease-spring active:scale-[0.975] ${
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
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 ease-spring active:scale-[0.975] cursor-pointer ${
                    envPopoverOpen
                      ? "bg-subtle text-ink font-semibold shadow-2xs"
                      : "text-ink-muted hover:bg-subtle/60 hover:text-ink"
                  }`}
                >
                  <span>Environment</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ease-spring ${
                      envPopoverOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Translucent Popover Anchored to Trigger (transform-origin: top left) */}
                {envPopoverOpen && (
                  <div className="animate-popover-origin apple-glass-sheet absolute left-0 mt-2.5 w-[490px] rounded-2xl p-5 z-50 grid grid-cols-12 gap-5">
                    {/* Left Column: Controls */}
                    <div className="col-span-7 space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface text-ink-secondary shadow-2xs">
                          <Cpu className="h-3.5 w-3.5" />
                        </span>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-ink">
                            Sandbox Operating Mode
                          </label>
                          <select
                            aria-label="Select API Mode (Mock / Live / Replay)"
                            value={apiMode}
                            onChange={(e) => setApiMode(e.target.value as ApiOperatingMode)}
                            className="mt-1.5 h-8 w-full rounded-lg border border-hairline bg-elevated px-2.5 font-mono text-[11px] text-ink shadow-2xs focus:border-ink focus:outline-none"
                          >
                            <option value="mock">SANDBOX: MOCK FIXTURES</option>
                            <option value="live">SANDBOX: LIVE (:4000)</option>
                            <option value="replay">REPLAY FALLBACK (R-06)</option>
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
                              Locale
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
                            UI State Inspector
                          </label>
                          <select
                            aria-label="Inspect 5 Interactive UI States"
                            value={uiState}
                            onChange={(e) => setUiState(e.target.value as InteractiveUiState)}
                            className="mt-1.5 h-8 w-full rounded-lg border border-hairline bg-elevated px-2.5 font-mono text-[11px] text-ink shadow-2xs focus:border-ink focus:outline-none"
                          >
                            <option value="success">UI State: success</option>
                            <option value="loading">UI State: loading</option>
                            <option value="empty">UI State: empty</option>
                            <option value="offline">UI State: offline (R-06)</option>
                            <option value="error">UI State: error (RFC 7807)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Concentric Bento Telemetry Cards */}
                    <div className="col-span-5 flex flex-col justify-between gap-3">
                      <div className="rounded-xl bg-surface/90 p-3.5 border border-hairline shadow-2xs">
                        <div className="text-xs font-semibold text-ink">JunoDB Quorum</div>
                        <div className="mt-0.5 text-[11px] text-ink-muted">
                          2PC Idempotency Active
                        </div>
                        <div className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold text-status-success-text tabular-nums">
                          <Database className="h-3 w-3" />
                          TTL 86,400s · OK
                        </div>
                      </div>

                      <div className="rounded-xl bg-surface/90 p-3.5 border border-hairline shadow-2xs">
                        <div className="text-xs font-semibold text-ink">Autonomy Tier</div>
                        <div className="mt-0.5 text-[11px] text-ink-muted">
                          {activeWorkspace.autonomyLevel} · 35 MCP Tools
                        </div>
                        <div className="mt-2.5 font-mono text-[10px] text-ink-secondary">
                          MIT LICENSE (R-12)
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right: Workspace Selector + Theme Toggle + Guided Pitch Action */}
          <div className="flex items-center gap-3">
            {(apiMode === "replay" || circuitBreakerTripped) && (
              <span
                role="status"
                aria-label="R-06 Circuit Breaker Replay Active"
                className="whitespace-nowrap rounded-pill border border-status-warning-border bg-status-warning-bg px-3 py-1 font-mono text-[10px] font-semibold text-status-warning-text tabular-nums"
              >
                REPLAY ({lastFailoverLatencyMs ?? 11}ms · {replayedTranscriptCount})
              </span>
            )}

            {/* Ghost Workspace Selector */}
            <select
              aria-label="Select Merchant Workspace (E-01)"
              value={activeWorkspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="hidden sm:inline-block max-w-[175px] truncate rounded-lg bg-transparent px-3 py-1.5 text-[13px] font-medium text-ink-muted transition-colors duration-150 hover:bg-subtle/70 hover:text-ink focus:outline-none cursor-pointer"
            >
              {workspaces.map((ws) => (
                <option key={ws.workspaceId} value={ws.workspaceId} className="bg-elevated text-ink">
                  {ws.merchantName}
                </option>
              ))}
            </select>

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
              className="btn-secondary-dark whitespace-nowrap rounded-lg px-4 py-1.5 text-[13px] font-medium cursor-pointer"
            >
              Guided Pitch
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        {!navCollapsed && (
          <nav
            aria-label="Mobile Cockpit Navigation"
            className="flex items-center gap-2 overflow-x-auto border-t border-hairline bg-surface/90 px-4 py-2.5 lg:hidden"
          >
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (pathname === "/" && item.href === "/command-center");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
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

        {/* Subtle Status Toast Banner */}
        {statusBannerMessage && (
          <div
            role="status"
            aria-live="polite"
            className="animate-tab-switch border-t border-hairline bg-surface/95 px-6 py-2.5 text-xs text-ink sm:px-10"
          >
            <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 font-mono text-[11px] tabular-nums">
                <CheckCircle2 className="h-3.5 w-3.5 text-status-success-bar shrink-0" />
                {statusBannerMessage}
              </span>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                aria-label="Dismiss Notification Banner"
                className="rounded-md p-1 text-ink-muted hover:bg-subtle hover:text-ink active:scale-95 transition-all cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Container — Generous Apple Spatial Breathing Room */}
      <main className="mx-auto w-full max-w-[1280px] flex-1 min-w-0 px-6 pt-6 pb-16 sm:px-10">
        {children}
      </main>

      {/* Shared Drawers, Modals & Command Studio */}
      <McpToolTraceDrawer />
      <HitlApprovalCard />
      <ApimaticSdkCodeDrawer />
      <InvoiceQrModal />
      <PyusdSolanaBridgeModal />
      <GlobalCommandBar />
    </div>
  );
}
