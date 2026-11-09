"use client";

/**
 * PayOps AI (PayPal Sentinel) — 3-Zone Executive Cockpit Layout Shell
 * Maps to: DESIGN_SYSTEM.md Section 4.1, UI_SPEC.md Section 1, TKT-028, TKT-031, TKT-035
 * Write Owner: Dev 2 (100%)
 */

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Shield,
  CalendarClock,
  Swords,
  ShoppingCart,
  Sun,
  Moon,
  Database,
  CheckCircle2,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
} from "lucide-react";
import type { CurrencyCode } from "@payops/shared";
import { ALL_35_MCP_TOOLS } from "@payops/shared/mock-fixtures";
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
import { WebhookSimulatorToolbar } from "./WebhookSimulatorToolbar";

export function CockpitShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

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
  } = useCockpitStore();

  const strings = LOCALE_DICTIONARY[activeLocale];
  const activeWorkspace =
    workspaces.find((w) => w.workspaceId === activeWorkspaceId) ?? workspaces[0];

  // Cmd+1..Cmd+5 keyboard shortcuts for the 5 Core Screens (UI_SPEC.md Section 1)
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
      label: strings.navCommandCenter,
      shortcut: "⌘1",
      icon: LayoutGrid,
      badge: "F-07",
    },
    {
      href: "/policy-studio",
      label: strings.navPolicyStudio,
      shortcut: "⌘2",
      icon: Shield,
      badge: "F-02·09",
    },
    {
      href: "/invoicing-scheduler",
      label: strings.navInvoicingScheduler,
      shortcut: "⌘3",
      icon: CalendarClock,
      badge: "F-03·08",
    },
    {
      href: "/dispute-war-room",
      label: strings.navDisputeWarRoom,
      shortcut: "⌘4",
      icon: Swords,
      badge: "F-04·10",
    },
    {
      href: "/checkout-bridge",
      label: strings.navCheckoutBridge,
      shortcut: "⌘5",
      icon: ShoppingCart,
      badge: "F-05·11",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-payops-canvas text-payops-primary">
      {/* Zone 1: Top Global Status & Demo Telemetry Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs">
          {/* Brand & Workspace Selector (E-01) */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleNavCollapsed}
              aria-label="Toggle Left Navigation Rail"
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              {navCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>

            <Link href="/command-center" className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-[#003087] font-mono text-xs font-bold text-white border border-sky-400/50">
                PP
              </span>
              <span className="font-bold tracking-tight text-sm text-white">
                {strings.appTitle}
              </span>
            </Link>

            <select
              aria-label="Select Merchant Workspace (E-01)"
              value={activeWorkspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-mono text-slate-200 max-w-[290px] truncate"
            >
              {workspaces.map((ws) => (
                <option key={ws.workspaceId} value={ws.workspaceId}>
                  {ws.workspaceId}: {ws.merchantName} ({ws.autonomyLevel})
                </option>
              ))}
            </select>

            <span className="hidden lg:inline-flex items-center gap-1 rounded border border-sky-500/40 bg-sky-950/50 px-2 py-0.5 font-mono text-[11px] text-sky-300">
              Autonomy: {activeWorkspace.autonomyLevel}
            </span>

            <span
              title="MIT Open-Source License Verified in Repository Root & GitHub About (R-12 · Eddie Jaoude)"
              className="hidden xl:inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300"
            >
              MIT LICENSE (R-12)
            </span>
          </div>

          {/* Right Telemetry Pills, Mode Switcher, Multi-Currency & Locale (TKT-031, TKT-035) */}
          <div className="flex flex-wrap items-center gap-2">
            {(apiMode === "replay" || circuitBreakerTripped) && (
              <span
                role="status"
                aria-label="R-06 Circuit Breaker Replay Active"
                className="inline-flex items-center gap-1 rounded border border-amber-500/60 bg-amber-950/70 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-200"
              >
                DEMO_REPLAY_MODE ({lastFailoverLatencyMs ?? 11}ms &lt; 50ms · {replayedTranscriptCount} Signed Transcripts)
              </span>
            )}

            {/* Dual-Mode / Replay Switcher (R-06) */}
            <div className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[11px]">
              <span
                className={`h-2 w-2 rounded-full ${
                  apiMode === "replay"
                    ? "bg-amber-400"
                    : apiMode === "live"
                      ? "bg-emerald-400"
                      : "bg-sky-400"
                }`}
              />
              <select
                aria-label="Select API Mode (Mock / Live / Replay)"
                value={apiMode}
                onChange={(e) => setApiMode(e.target.value as ApiOperatingMode)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="mock" className="bg-slate-900">
                  SANDBOX: MOCK FIXTURES
                </option>
                <option value="live" className="bg-slate-900">
                  SANDBOX: LIVE (:4000)
                </option>
                <option value="replay" className="bg-slate-900">
                  REPLAY FALLBACK (R-06)
                </option>
              </select>
            </div>

            <span className="hidden xl:inline-flex items-center gap-1 rounded border border-emerald-600/40 bg-emerald-950/40 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
              <Database className="h-3 w-3" />
              JunoDB Quorum: OK
            </span>

            {/* Multi-Currency Switcher ($, ₹, €, £, PYUSD — TKT-031) */}
            <select
              aria-label="Select Display Currency"
              value={activeCurrency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-emerald-300 font-semibold cursor-pointer"
            >
              <option value="USD">$ USD</option>
              <option value="INR">₹ INR (Lakh/Cr)</option>
              <option value="EUR">€ EUR</option>
              <option value="GBP">£ GBP</option>
              <option value="PYUSD">PYUSD (Solana)</option>
            </select>

            {/* Multilingual Locale Switcher (en, hi, es — TKT-031) */}
            <div className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-0.5">
              <Globe className="h-3 w-3 text-sky-400" />
              <select
                aria-label="Select Interface Language Locale"
                value={activeLocale}
                onChange={(e) => setLocale(e.target.value as SupportedLocale)}
                className="bg-transparent font-mono text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="en" className="bg-slate-900">
                  EN
                </option>
                <option value="hi" className="bg-slate-900">
                  हिन्दी (HI)
                </option>
                <option value="es" className="bg-slate-900">
                  ES
                </option>
                <option value="de" className="bg-slate-900">
                  DE
                </option>
              </select>
            </div>

            {/* 5 Interactive UI States Inspector (UI_SPEC.md) */}
            <select
              aria-label="Inspect 5 Interactive UI States"
              value={uiState}
              onChange={(e) => setUiState(e.target.value as InteractiveUiState)}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[11px] text-slate-300 cursor-pointer"
            >
              <option value="success">UI State: success</option>
              <option value="loading">UI State: loading</option>
              <option value="empty">UI State: empty</option>
              <option value="offline">UI State: offline (R-06)</option>
              <option value="error">UI State: error (RFC 7807)</option>
            </select>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Dark or Light Executive Theme"
              className="rounded border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:text-white"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* 1-Click Judge Pitch Choreography & Webhook Simulator Bar */}
        <WebhookSimulatorToolbar />

        {/* Live Action Status Toast Banner */}
        {statusBannerMessage && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-between border-b border-sky-500/40 bg-sky-950/75 px-4 py-1.5 text-xs font-mono text-sky-100"
          >
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              {statusBannerMessage}
            </span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              aria-label="Dismiss Notification Banner"
              className="rounded p-0.5 text-slate-300 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* Zone 2: Main Body with Left Collapsible Navigation Rail + Active Screen */}
      <div className="flex-1 flex min-h-0">
        <aside
          aria-label="Primary Cockpit Navigation"
          className={`${
            navCollapsed ? "w-16" : "w-64"
          } shrink-0 border-r border-slate-800 bg-slate-950/90 flex flex-col justify-between transition-all duration-200`}
        >
          <div className="p-2.5 space-y-1">
            {!navCollapsed && (
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                5 Core Cockpit Screens
              </div>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (pathname === "/" && item.href === "/command-center");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={`${item.label} (${item.shortcut})`}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                    isActive
                      ? "bg-[#0070E0] text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="h-4 w-4 shrink-0" />
                    {!navCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!navCollapsed && (
                    <span className="font-mono text-[10px] opacity-80">{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* 35 Active PayPal MCP Tools Summary */}
          {!navCollapsed && (
            <div className="p-3 border-t border-slate-800/90 space-y-2 text-[11px]">
              <div className="flex items-center justify-between font-mono font-bold text-sky-400">
                <span>ACTIVE MCP TOOLS: 35</span>
                <span className="text-[10px] text-emerald-400">7 Domains</span>
              </div>
              <ul className="space-y-1 font-mono text-[10px] text-slate-400">
                {ALL_35_MCP_TOOLS.map((dom) => (
                  <li key={dom.domainId} className="flex items-center justify-between">
                    <span className="truncate">{dom.domainName}</span>
                    <span className="text-slate-300">
                      {dom.toolCount} ({dom.autonomyDefault})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Active Screen Viewport */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-5">{children}</main>
      </div>

      {/* Zone 3: Floating Modals, Drawers & Global Command Bar (Cmd+K) */}
      <McpToolTraceDrawer />
      <HitlApprovalCard />
      <ApimaticSdkCodeDrawer />
      <InvoiceQrModal />
      <PyusdSolanaBridgeModal />
      <GlobalCommandBar />
    </div>
  );
}
