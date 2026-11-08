"use client";

/**
 * PayOps AI (PayPal Sentinel) — Screen 5: Agentic B2B Procurement (Channel3), Fastlane Checkout & PYUSD Solana Bridge
 * Maps to: F-05 (Orders v2 & Fastlane), F-11 (PYUSD Solana Token-2022 Bridge), F-12 (Channel3 + Elastic + Zapier),
 * TKT-020, TKT-022, TKT-031, US-10, US-11, US-15, US-16, R-02, R-08, R-09
 * Write Owner: Dev 2 (100%)
 */

import React, { useState } from "react";
import {
  ShoppingBag,
  Search,
  Coins,
  Database,
  CheckCircle2,
  ArrowUpRight,
  Webhook,
  AlertTriangle,
  WifiOff,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import {
  buildZapierHoldApprovalWebhookPayload,
  MOCK_CHANNEL3_CATALOG,
  validatePyusdToken2022Memo,
  verifyAuditHashChain,
  type Channel3CatalogItem,
} from "@payops/shared/mock-fixtures";
import { FastlaneCheckoutIsland } from "../../../components/paypal/FastlaneCheckoutIsland";
import { formatCurrencyAmount, formatDualCurrency } from "../../../lib/formatters";
import {
  useCockpitStore,
  type InteractiveUiState,
} from "../../../stores/useCockpitStore";

const NATURAL_LANGUAGE_PROCUREMENT_PROMPTS: {
  label: string;
  prompt: string;
  skuId: string;
}[] = [
  {
    label: 'Prompt 1: "Restock 500 eco-mailer boxes under $450"',
    prompt: "Restock 500 eco-mailer boxes under $450",
    skuId: "C3-88210",
  },
  {
    label: 'Prompt 2: "Order 24-roll Zebra 4x6 carrier labels"',
    prompt: "Zebra ZP450 Thermal Carrier Label Rolls 4x6",
    skuId: "C3-90415",
  },
  {
    label: 'Prompt 3: "100kg GOTS organic cotton yarn lot"',
    prompt: "GOTS Certified Organic Combed Cotton Cone Yarn",
    skuId: "C3-77102",
  },
  {
    label: 'Prompt 4: "Bulk DTG Ink Case ($780 > $500 Hold)"',
    prompt: "Brother GTXpro Bulk Textile Pigment Ink",
    skuId: "C3-99501",
  },
];

export default function CheckoutBridgePage() {
  const {
    activeCurrency,
    uiState,
    setUiState,
    invoices,
    executions,
    openPyusdModal,
    settleInvoiceWithPyusd,
    lastPyusdSettlement,
    auditLogs,
    setStatusBanner,
  } = useCockpitStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSku, setSelectedSku] = useState<Channel3CatalogItem>(
    MOCK_CHANNEL3_CATALOG[0]
  );
  const [selectedBridgeInvoiceId, setSelectedBridgeInvoiceId] = useState<string>(
    "INV2-F19A-7704-6612-4002"
  );
  const [simulatedCorruptMemo, setSimulatedCorruptMemo] = useState<string | null>(null);
  const [chainVerifiedBanner, setChainVerifiedBanner] = useState<string | null>(null);
  const [showZapierPayload, setShowZapierPayload] = useState<boolean>(false);

  const filteredCatalog = MOCK_CHANNEL3_CATALOG.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.skuId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const crossBorderInvoice =
    invoices.find((inv) => inv.invoiceId === selectedBridgeInvoiceId) ??
    invoices.find((inv) => inv.invoiceNumber === "INV-2026-7704") ??
    invoices[0];

  const activeMemoString =
    simulatedCorruptMemo ??
    (crossBorderInvoice
      ? `PAYOPS:${crossBorderInvoice.invoiceId}:${crossBorderInvoice.idempotencyKey}`
      : "");

  const memoCheck = validatePyusdToken2022Memo(
    activeMemoString,
    crossBorderInvoice?.invoiceId
  );

  const chainVerification = verifyAuditHashChain(auditLogs);
  const heldExecutionForZapier =
    executions.find((ex) => ex.policyVerdict === "HELD_FOR_L2_PASSKEY") ?? executions[0];
  const zapierPayload = buildZapierHoldApprovalWebhookPayload(heldExecutionForZapier);

  const handleApplyNaturalPrompt = (promptItem: { prompt: string; skuId: string }) => {
    setSearchQuery("");
    const found =
      MOCK_CHANNEL3_CATALOG.find((c) => c.skuId === promptItem.skuId) ??
      MOCK_CHANNEL3_CATALOG[0];
    setSelectedSku(found);
    setUiState("success");
    setStatusBanner(
      `Channel3 MCP Discovery (F-12 · US-16): Matched prompt "${promptItem.prompt}" -> SKU #${found.skuId} ($${found.totalPriceUsd} USD).`
    );
  };

  const handleSimulateMemoErrorOnScreen = () => {
    if (!crossBorderInvoice) return;
    setSimulatedCorruptMemo(`INVALID_MEMO_MISSING_REQUEST_ID:${crossBorderInvoice.invoiceId}`);
    setUiState("error");
    setStatusBanner(
      `R-09 Memo Mismatch Guard Triggered: Blocked Solana Token-2022 PYUSD transfer because Memo Required string failed 'PAYOPS:<invoice_id>:<PayPal-Request-Id>' regex check.`
    );
  };

  const handleRestoreValidMemoOnScreen = () => {
    setSimulatedCorruptMemo(null);
    setUiState("success");
    if (crossBorderInvoice) {
      setStatusBanner(
        `Restored valid Solana Token-2022 Memo Required payload: PAYOPS:${crossBorderInvoice.invoiceId}:${crossBorderInvoice.idempotencyKey}.`
      );
    }
  };

  const handleQuickDirectPyusdSettle = () => {
    if (!crossBorderInvoice) return;
    if (!memoCheck.valid) {
      setUiState("error");
      setStatusBanner(
        memoCheck.errorReason ??
          "R-09 Memo Mismatch Guard: Cannot settle PYUSD with invalid memo."
      );
      return;
    }
    const sig = `5xPyusdSolanaToken2022Sig99102a${Date.now().toString(16)}`;
    settleInvoiceWithPyusd(crossBorderInvoice.invoiceId, sig, activeMemoString);
    setUiState("success");
  };

  const handleVerifyHashChain = () => {
    const check = verifyAuditHashChain(auditLogs);
    setChainVerifiedBanner(
      `SHA-256 Hash-Chain Verified (${check.totalChecked}/${check.totalChecked} entries · ${check.tamperedCount} Tampered · Head: ${check.headHash.slice(0, 16)}...)`
    );
    setStatusBanner(
      `Elastic 180-Day Immutable Audit Index (E-10 · F-12): Cryptographically verified ${check.totalChecked} hash-chained entries with ${check.tamperedCount} tampered records.`
    );
  };

  return (
    <div className="mx-auto max-w-[1750px] space-y-4">
      {/* Screen 5 Interactive UI State Bar (UI_SPEC.md Section 6.3: empty, loading, error, offline, success) */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2 font-mono">
          <Sparkles className="h-3.5 w-3.5 text-sky-400" />
          <span className="font-bold text-white">
            Screen 5 Interactive UI States (UI_SPEC.md §6.3):
          </span>
          <span className="text-slate-400">
            Active State: <strong className="text-emerald-300 uppercase">{uiState}</strong>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
          {(["success", "empty", "loading", "error", "offline"] as InteractiveUiState[]).map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  if (st === "error") {
                    handleSimulateMemoErrorOnScreen();
                  } else {
                    setSimulatedCorruptMemo(null);
                    setUiState(st);
                  }
                }}
                className={`rounded border px-2 py-0.5 uppercase cursor-pointer transition ${
                  uiState === st
                    ? "border-sky-500 bg-sky-950 text-sky-200 font-bold"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>
      </div>

      {/* State Banners for Offline / Loading / Error / Empty (UI_SPEC.md Section 6.3) */}
      {uiState === "offline" && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/50 bg-amber-950/40 px-4 py-2.5 font-mono text-xs text-amber-200"
        >
          <span className="inline-flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
            <strong>FF_DEMO_REPLAY_FALLBACK Active (R-06 · UI_SPEC §6.3):</strong> Serving
            deterministic PayPal Sandbox Order Capture (`5O190127TN364715T`) &amp; Solana Devnet
            Token-2022 replay receipts with zero network dependency.
          </span>
          <button
            type="button"
            onClick={() => setUiState("success")}
            className="rounded border border-amber-400/50 px-2.5 py-1 text-[11px] hover:bg-amber-900/50 cursor-pointer"
          >
            Return to Live Mode
          </button>
        </div>
      )}

      {uiState === "loading" && (
        <div
          aria-busy="true"
          className="flex items-center justify-between rounded-xl border border-sky-500/50 bg-sky-950/40 px-4 py-2.5 font-mono text-xs text-sky-200"
        >
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-sky-400 shrink-0" />
            <strong>Fastlane Passkey &amp; Solana Devnet Confirmation (&lt; 1.5s):</strong>{" "}
            Recognizing guest profile `maya@lumina.io` inside Zoid iframe &amp; verifying Solana
            Token-2022 `Memo Required` state...
          </span>
          <span className="text-[10px] text-sky-300">JunoDB 2PC Lock Active</span>
        </div>
      )}

      {uiState === "error" && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-500/60 bg-red-950/50 px-4 py-2.5 font-mono text-xs text-red-200"
        >
          <span className="inline-flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <strong>R-09 Settlement Blocked (RFC 7807):</strong> Solana Token-2022 `Memo Required`
            string `{activeMemoString}` failed regex check{" "}
            <code className="text-white">PAYOPS:&lt;invoice_id&gt;:&lt;PayPal-Request-Id&gt;</code>.
          </span>
          <button
            type="button"
            onClick={handleRestoreValidMemoOnScreen}
            className="inline-flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Restore Valid Token-2022 Memo
          </button>
        </div>
      )}

      {uiState === "empty" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-white">
            No Active B2B Procurement Cart or Selected Cross-Border Settlement (Empty State · UI_SPEC §6.3)
          </p>
          <p className="text-xs font-mono text-slate-400">
            Select a sample Channel3 B2B procurement prompt below or load open cross-border supplier
            invoices (`INV2-F19A-7704-6612-4002`) ready for 1.2s Solana Token-2022 PYUSD settlement.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {NATURAL_LANGUAGE_PROCUREMENT_PROMPTS.slice(0, 3).map((p) => (
              <button
                key={p.skuId}
                type="button"
                onClick={() => handleApplyNaturalPrompt(p)}
                className="rounded-lg border border-sky-500/50 bg-sky-950/60 hover:bg-sky-900/60 px-3 py-1.5 font-mono text-xs text-sky-200 cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Channel3 MCP B2B Catalog Discovery & PayPal Fastlane Checkout (F-05, F-12, US-10, US-16) */}
        <section
          aria-label="Channel3 MCP B2B Product Discovery and Fastlane Checkout"
          className="space-y-4"
        >
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-sky-400" />
                <div>
                  <h1 className="text-sm font-bold uppercase tracking-wider text-white">
                    1. Channel3 MCP B2B Catalog Discovery ($1,500 Track · F-12 · US-16)
                  </h1>
                  <p className="text-[11px] font-mono text-slate-400">
                    Normalized wholesale SKU discovery gated by Cosmos.AI Rule POL-01 (&le;$500
                    Auto-Cap) vs POL-02 (&gt;$500 Passkey Hold)
                  </p>
                </div>
              </div>
              <span className="rounded bg-sky-500/15 border border-sky-500/40 px-2 py-0.5 font-mono text-[10px] text-sky-300">
                MCP #31–#32 (`create_product`, `list_products`)
              </span>
            </div>

            {/* Natural-Language Procurement Prompt Presets (UI_SPEC.md Section 6.2) */}
            <div className="flex flex-wrap items-center gap-1.5">
              {NATURAL_LANGUAGE_PROCUREMENT_PROMPTS.map((item) => (
                <button
                  key={item.skuId}
                  type="button"
                  onClick={() => handleApplyNaturalPrompt(item)}
                  className={`rounded border px-2 py-1 font-mono text-[10px] cursor-pointer transition ${
                    selectedSku.skuId === item.skuId
                      ? "border-sky-500 bg-sky-950/70 text-sky-200 font-bold"
                      : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Channel3 Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search Channel3 MCP Catalog (e.g. "Eco-Mailer", "C3-88210", "Cotton Yarn", "C3-99501")...'
                aria-label="Search Channel3 B2B Catalog"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Catalog SKU Cards */}
            <div className="space-y-2.5">
              {filteredCatalog.map((item) => {
                const isSelected = item.skuId === selectedSku.skuId;
                const numericTotal = parseFloat(item.totalPriceUsd) || 0;
                const exceedsAutoCap = numericTotal > 500.0;
                const dualSkuPrice = formatDualCurrency(
                  item.totalPriceUsd,
                  "USD",
                  activeCurrency === "USD" ? "INR" : activeCurrency
                );

                return (
                  <div
                    key={item.skuId}
                    onClick={() => setSelectedSku(item)}
                    className={`rounded-lg border p-3.5 cursor-pointer transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-sky-500 bg-sky-950/40"
                        : "border-slate-800 bg-slate-950/70 hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                        <span className="font-bold text-sky-400">SKU #{item.skuId}</span>
                        <span className="text-white font-semibold">{item.title}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Vendor: {item.vendorName} · Pack: {item.packSize} units @ $
                        {item.unitPriceUsd} · Lead: {item.leadTimeDays}d ·{" "}
                        <span className="text-emerald-400">{item.sustainabilityBadge}</span>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <div className="text-sm font-bold text-emerald-400 financial-figure">
                        {formatCurrencyAmount(item.totalPriceUsd, "USD", activeCurrency)}
                      </div>
                      <div className="text-[10px] text-slate-400 financial-figure">
                        {dualSkuPrice.secondary}
                      </div>
                      <div
                        className={`text-[10px] font-bold ${
                          exceedsAutoCap ? "text-amber-300" : "text-emerald-300"
                        }`}
                      >
                        Policy {item.policyRuleId}:{" "}
                        {exceedsAutoCap ? "HOLD_APPROVAL (>$500)" : "ALLOW (<=$500)"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fastlane Checkout Island (F-05, F-06) */}
          <FastlaneCheckoutIsland selectedSku={selectedSku} />
        </section>

        {/* Right Column: Cross-Border PYUSD Solana Token-2022 Bridge (F-11) & Elastic Audit / Zapier Inspector (F-12) */}
        <section
          aria-label="Cross-Border PYUSD Solana Bridge and Elastic Audit Telemetry"
          className="space-y-4"
        >
          {/* PYUSD Solana Token-2022 Settlement Card */}
          <div className="rounded-xl border border-emerald-500/40 bg-slate-900/90 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-[#14F195]" />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    2. Cross-Border PYUSD Solana Token-2022 Bridge (F-11 · TKT-022 · US-15)
                  </h2>
                  <p className="text-[11px] font-mono text-[#14F195]">
                    Mint: 2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo · Mandatory Memo Extension
                    (R-09)
                  </p>
                </div>
              </div>
              <span className="rounded bg-emerald-500/20 px-2.5 py-1 font-mono text-xs font-bold text-emerald-300">
                Non-Custodial (R-08)
              </span>
            </div>

            {/* Open/Overdue Invoice Selector */}
            <div className="space-y-1">
              <label
                htmlFor="bridge-invoice-select"
                className="block font-mono text-[10px] uppercase text-slate-400"
              >
                Select Supplier Invoice to Settle via Solana Token-2022 PYUSD
              </label>
              <select
                id="bridge-invoice-select"
                value={crossBorderInvoice?.invoiceId ?? ""}
                onChange={(e) => {
                  setSelectedBridgeInvoiceId(e.target.value);
                  setSimulatedCorruptMemo(null);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white"
              >
                {invoices.map((inv) => (
                  <option key={inv.invoiceId} value={inv.invoiceId}>
                    {inv.invoiceNumber} ({inv.invoiceId}) · {inv.amountValue} {inv.currencyCode} ·{" "}
                    {inv.recipientEmail} [{inv.status}]
                  </option>
                ))}
              </select>
            </div>

            {crossBorderInvoice && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3.5 font-mono">
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">
                      Supplier Invoice ({crossBorderInvoice.invoiceNumber})
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {crossBorderInvoice.invoiceId}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {crossBorderInvoice.recipientEmail}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-slate-400">Settlement Amount</div>
                    <div className="text-base font-bold text-[#14F195] mt-0.5 financial-figure">
                      {crossBorderInvoice.amountValue} PYUSD
                    </div>
                    <div className="text-[10px] text-slate-400 financial-figure">
                      {
                        formatDualCurrency(
                          crossBorderInvoice.amountValue,
                          crossBorderInvoice.currencyCode,
                          activeCurrency === crossBorderInvoice.currencyCode
                            ? "INR"
                            : activeCurrency
                        ).secondary
                      }
                    </div>
                    <div className="text-[11px] text-emerald-300 font-semibold">
                      Status: {crossBorderInvoice.status}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 font-mono text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Legacy SWIFT Correspondent Wire:</span>
                    <span className="text-red-400 financial-figure">
                      $48.00 Fee + 3.2% FX · 4 Days
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-300 font-bold">
                    <span>PayPal PYUSD (Solana Token-2022):</span>
                    <span className="financial-figure">
                      $0.001 Fee · 1.2 Seconds · 0% FX Slippage
                    </span>
                  </div>
                  <div className="pt-1 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span
                      className={`truncate ${
                        memoCheck.valid ? "text-slate-300" : "text-red-300 font-bold"
                      }`}
                    >
                      Required Memo (R-09): {activeMemoString}
                    </span>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        memoCheck.valid
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {memoCheck.valid ? "MEMO VALID" : "R-09 BLOCKED"}
                    </span>
                  </div>
                </div>

                {/* Quick Test Buttons for R-09 Memo Validation & Direct Settlement */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateMemoErrorOnScreen}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/50 bg-red-950/40 hover:bg-red-900/50 py-2 px-3 font-mono text-[11px] font-semibold text-red-200 cursor-pointer"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                    Simulate Memo Mismatch Error (R-09)
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickDirectPyusdSettle}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-950/50 hover:bg-emerald-900/60 py-2 px-3 font-mono text-[11px] font-semibold text-emerald-200 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    1-Click Settle &amp; Reconcile (#13)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => openPyusdModal(crossBorderInvoice)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 px-4 text-xs font-bold text-white shadow transition cursor-pointer"
                >
                  <Coins className="h-4 w-4" />
                  Launch PYUSD Solana Token-2022 Settlement Modal (US-15)
                  <ArrowUpRight className="h-4 w-4" />
                </button>

                {/* Verified Solana Devnet Explorer Receipt (UI_SPEC.md Section 6.3 `success`) */}
                {lastPyusdSettlement && (
                  <div
                    role="status"
                    className="rounded-lg border border-[#14F195]/50 bg-emerald-950/30 p-3 font-mono text-[11px] space-y-1 text-emerald-200"
                  >
                    <div className="flex items-center justify-between font-bold text-[#14F195]">
                      <span>
                        ✓ Solana Token-2022 Settlement Confirmed &amp; Reconciled (`PAID`)
                      </span>
                      <span>1.2s Finality</span>
                    </div>
                    <div className="truncate text-slate-200">
                      Solana Devnet Signature: {lastPyusdSettlement.solanaTxSig}
                    </div>
                    <div className="truncate text-slate-300">
                      On-Chain Memo: {lastPyusdSettlement.memo}
                    </div>
                    <div className="text-sky-300">
                      MCP Reconciled: record_payment_for_invoice (#13) &rarr;{" "}
                      {lastPyusdSettlement.invoiceId} = PAID
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Elastic 180-Day Immutable Audit Index & Zapier Outbound Webhook Inspector (F-12, E-10) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                  3. Elastic Cloud 180-Day Audit Index &amp; Zapier Webhook Dispatcher (F-12 · E-10)
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleVerifyHashChain}
                  className="inline-flex items-center gap-1 rounded border border-emerald-500/50 bg-emerald-950/60 hover:bg-emerald-900/60 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-200 cursor-pointer"
                >
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  Verify Chain: {chainVerification.tamperedCount} Tampered Entries
                </button>
                <button
                  type="button"
                  onClick={() => setShowZapierPayload((v) => !v)}
                  className="inline-flex items-center gap-1 rounded border border-purple-500/50 bg-purple-950/60 hover:bg-purple-900/60 px-2.5 py-1 font-mono text-[10px] font-bold text-purple-200 cursor-pointer"
                >
                  <Webhook className="h-3 w-3 text-purple-300" />
                  {showZapierPayload ? "Hide Zapier Payload" : "Zapier HOLD_APPROVAL Payload"}
                </button>
              </div>
            </div>

            {chainVerifiedBanner && (
              <div
                role="status"
                className="rounded border border-emerald-500/50 bg-emerald-950/40 px-3 py-2 font-mono text-[11px] text-emerald-200 flex items-center justify-between"
              >
                <span>{chainVerifiedBanner}</span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  IMMUTABLE E-10 PASS
                </span>
              </div>
            )}

            {showZapierPayload && (
              <div className="rounded-lg border border-purple-500/40 bg-slate-950 p-3 font-mono text-[11px] space-y-1.5">
                <div className="flex items-center justify-between text-purple-300 font-bold">
                  <span>Outbound Zapier Webhook Payload (`PAYOPS.POLICY.HOLD_APPROVAL`):</span>
                  <span className="text-[10px] text-emerald-400">HTTP 200 Dispatched</span>
                </div>
                <pre className="overflow-x-auto text-[10px] text-slate-300 leading-relaxed">
                  {JSON.stringify(zapierPayload, null, 2)}
                </pre>
              </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-[11px]">
              {auditLogs.map((log) => (
                <div
                  key={log.logId}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300">
                      {log.logId} · {log.toolName} ({log.actorId})
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px]">
                      <CheckCircle2 className="h-3 w-3" />
                      {log.policyVerdict}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    prev_hash: {log.prevHash}
                  </div>
                  <div className="text-[10px] text-emerald-300 truncate">
                    entry_hash: {log.entryHash}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
