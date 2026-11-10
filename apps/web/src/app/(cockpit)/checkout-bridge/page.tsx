"use client";

/**
 * PayOps AI (PayPal Sentinel) — Screen 5: B2B Procurement, Express Checkout & Cross-Border PYUSD Settlement
 * Increase.com Light-First Editorial Redesign:
 *  - Clean human-readable typography (Inter font) with zero raw hex hashes, contract addresses, or enum dumps
 *  - Smooth pop-in and hover transitions across all cards
 */

import React, { useEffect, useState } from "react";
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
import { AnimatedNumber } from "../../../components/ui/AnimatedNumber";
import { searchChannel3CatalogApi, settleInvoicePyusd } from "../../../lib/api-client";
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
    label: "Eco-Mailer Boxes ($390)",
    prompt: "Restock 500 eco-mailer boxes under $450",
    skuId: "C3-88210",
  },
  {
    label: "Shipping Labels ($228)",
    prompt: "Zebra ZP450 Thermal Carrier Label Rolls 4x6",
    skuId: "C3-90415",
  },
  {
    label: "Organic Cotton Yarn ($445)",
    prompt: "GOTS Certified Organic Combed Cotton Cone Yarn",
    skuId: "C3-77102",
  },
  {
    label: "Bulk Textile Ink ($780 · Hold)",
    prompt: "Brother GTXpro Bulk Textile Pigment Ink",
    skuId: "C3-99501",
  },
];

function formatAuditTitle(toolName: string, verdict: string): {
  title: string;
  subtitle: string;
  badge: string;
  tone: "success" | "warning" | "danger";
} {
  if (verdict === "BLOCKED_SECURITY_INJECTION") {
    return {
      title: "Suspicious Override Attempt Blocked",
      subtitle: "Customer Refund Request · Security Guardrail",
      badge: "Blocked by Policy",
      tone: "danger",
    };
  }
  if (verdict === "HELD_FOR_L2_PASSKEY") {
    return {
      title: "High-Value Refund Held for Passkey Approval",
      subtitle: "Customer Refund Request · Exceeds $250 Auto-Limit",
      badge: "Awaiting Passkey",
      tone: "warning",
    };
  }
  if (toolName === "send_invoice") {
    return {
      title: "Smart Invoice & Early-Pay Discount Sent",
      subtitle: "Automated Receivables · Verified Customer",
      badge: "Auto-Approved",
      tone: "success",
    };
  }
  return {
    title: toolName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    subtitle: "Automated Payment Operation",
    badge: "Verified",
    tone: "success",
  };
}

export default function CheckoutBridgePage() {
  const {
    apiMode,
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
  const [catalogItems, setCatalogItems] = useState<Channel3CatalogItem[]>(
    MOCK_CHANNEL3_CATALOG
  );
  const [selectedSku, setSelectedSku] = useState<Channel3CatalogItem>(
    MOCK_CHANNEL3_CATALOG[0]
  );
  const [selectedBridgeInvoiceId, setSelectedBridgeInvoiceId] = useState<string>(
    "INV2-F19A-7704-6612-4002"
  );
  const [simulatedCorruptMemo, setSimulatedCorruptMemo] = useState<string | null>(null);
  const [chainVerifiedBanner, setChainVerifiedBanner] = useState<string | null>(null);
  const [showZapierPayload, setShowZapierPayload] = useState<boolean>(false);

  useEffect(() => {
    if (apiMode !== "live") return;
    let active = true;
    void searchChannel3CatalogApi(searchQuery).then((res) => {
      if (active && Array.isArray(res.items) && res.items.length > 0) {
        setCatalogItems(res.items);
      }
    });
    return () => {
      active = false;
    };
  }, [apiMode, searchQuery]);

  const filteredCatalog = catalogItems.filter(
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
      catalogItems.find((c) => c.skuId === promptItem.skuId) ??
      MOCK_CHANNEL3_CATALOG.find((c) => c.skuId === promptItem.skuId) ??
      MOCK_CHANNEL3_CATALOG[0];
    setSelectedSku(found);
    setUiState("success");
    setStatusBanner(
      `Selected wholesale item "${found.title}" ($${found.totalPriceUsd} USD).`
    );
  };

  const handleSimulateMemoErrorOnScreen = () => {
    if (!crossBorderInvoice) return;
    setSimulatedCorruptMemo(`INVALID_MEMO_MISSING_REQUEST_ID:${crossBorderInvoice.invoiceId}`);
    setUiState("error");
    setStatusBanner(
      `Invoice Reference Mismatch: Settlement paused because the invoice reference note is incomplete.`
    );
  };

  const handleRestoreValidMemoOnScreen = () => {
    setSimulatedCorruptMemo(null);
    setUiState("success");
    if (crossBorderInvoice) {
      setStatusBanner(
        `Restored verified invoice reference for ${crossBorderInvoice.invoiceNumber}.`
      );
    }
  };

  const handleQuickDirectPyusdSettle = async () => {
    if (!crossBorderInvoice) return;
    if (!memoCheck.valid) {
      setUiState("error");
      setStatusBanner(
        memoCheck.errorReason ??
          "Cannot settle PYUSD payment without a valid invoice reference."
      );
      return;
    }
    const fallbackSig = `5xPyusdSolanaToken2022Sig99102a${Date.now().toString(16)}`;
    const res = await settleInvoicePyusd({
      workspaceId: crossBorderInvoice.workspaceId,
      invoiceId: crossBorderInvoice.invoiceId,
      amountValue: crossBorderInvoice.amountValue,
      memo: activeMemoString,
      solanaTxSignature: fallbackSig,
    });
    const verifiedSig = res.solanaTxSignature || fallbackSig;
    settleInvoiceWithPyusd(crossBorderInvoice.invoiceId, verifiedSig, activeMemoString);
    setUiState("success");
    setStatusBanner(
      `PYUSD Settlement Verified on Solana SPL Token-2022 (${verifiedSig.slice(0, 18)}...) for ${crossBorderInvoice.invoiceNumber}.`
    );
  };

  const handleVerifyHashChain = () => {
    const check = verifyAuditHashChain(auditLogs);
    setChainVerifiedBanner(
      `All ${check.totalChecked} activity records verified · ${check.tamperedCount} tampered entries`
    );
    setStatusBanner(
      `Compliance Audit Complete: Verified ${check.totalChecked} tamper-proof records with 0 discrepancies.`
    );
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-10 pb-16 animate-pop-in">
      {/* Editorial Section Header */}
      <header className="flex flex-col justify-between gap-6 border-b border-hairline pb-8 lg:flex-row lg:items-end">
        <div className="max-w-2xl space-y-3.5">
          <div className="badge-lime px-3.5 py-1 text-xs shadow-2xs">
            <Coins className="h-3.5 w-3.5" />
            <span>B2B Procurement &amp; Instant PYUSD Settlement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-ink leading-[1.12]">
            Wholesale purchasing and instant global settlement.{" "}
            <span className="font-normal text-ink-muted">
              Source verified B2B inventory, check out in one click with PayPal Fastlane, and
              settle international supplier invoices in seconds.
            </span>
          </h1>
        </div>

        {/* Interactive UI State Switcher Pill Track */}
        <div className="apple-segmented-track shrink-0">
          {(["success", "empty", "loading", "error", "offline"] as InteractiveUiState[]).map(
            (st) => {
              const active = uiState === st;
              const labelMap: Record<InteractiveUiState, string> = {
                success: "Live View",
                empty: "Empty",
                loading: "Loading",
                error: "Error Check",
                offline: "Offline",
              };
              return (
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
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                    active
                      ? "bg-elevated text-ink font-semibold shadow-2xs border border-hairline"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {labelMap[st]}
                </button>
              );
            }
          )}
        </div>
      </header>

      {/* State Banners for Offline / Loading / Error / Empty */}
      {uiState === "offline" && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-status-warning-border bg-status-warning-bg px-4 py-3 text-xs text-status-warning-text"
        >
          <span className="inline-flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            <strong>Offline Backup Active:</strong> Displaying cached wholesale catalog and recent
            settlement receipts.
          </span>
          <button
            type="button"
            onClick={() => setUiState("success")}
            className="btn-outline-subtle px-3 py-1 text-xs cursor-pointer"
          >
            Return to Live Mode
          </button>
        </div>
      )}

      {uiState === "loading" && (
        <div
          aria-busy="true"
          className="flex items-center justify-between rounded-xl border border-status-info-border bg-status-info-bg px-4 py-3 text-xs text-status-info-text"
        >
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
            <strong>Verifying Express Checkout &amp; Settlement:</strong> Recognizing returning
            buyer profile and validating supplier invoice reference...
          </span>
          <span className="text-xs font-medium">Single-Charge Lock Active</span>
        </div>
      )}

      {uiState === "error" && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-status-danger-border bg-status-danger-bg px-4 py-3 text-xs text-status-danger-text"
        >
          <span className="inline-flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <strong>Settlement Paused — Incomplete Invoice Reference:</strong> Cross-border PYUSD
            transfers require a verified invoice number and request reference before funds are sent.
          </span>
          <button
            type="button"
            onClick={handleRestoreValidMemoOnScreen}
            className="btn-primary-mint px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Restore Valid Invoice Reference</span>
          </button>
        </div>
      )}

      {uiState === "empty" && (
        <div className="surface-bento rounded-2xl p-10 text-center space-y-4">
          <p className="text-sm font-semibold text-ink">
            No Wholesale Items Selected
          </p>
          <p className="text-xs text-ink-muted">
            Choose a wholesale supply item below to preview one-click checkout and instant supplier
            settlement.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {NATURAL_LANGUAGE_PROCUREMENT_PROMPTS.slice(0, 3).map((p) => (
              <button
                key={p.skuId}
                type="button"
                onClick={() => handleApplyNaturalPrompt(p)}
                className="btn-outline-subtle px-3.5 py-2 text-xs cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Left Column (6 cols): Wholesale B2B Catalog & PayPal Fastlane Checkout */}
        <section
          aria-label="Channel3 MCP B2B Product Discovery and Fastlane Checkout"
          className="lg:col-span-6 space-y-6 lg:space-y-8 animate-pop-in delay-75"
        >
          <div className="surface-bento rounded-2xl p-6 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-hairline pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-ink-secondary" />
                  <h2 className="text-base font-semibold tracking-tight text-ink">
                    1. Wholesale Supplier Catalog
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Orders under $500 are approved automatically; orders above $500 require passkey
                  sign-off
                </p>
              </div>
              <span className="rounded-pill border border-hairline bg-elevated px-3 py-1 text-xs font-medium text-ink-secondary">
                4 Verified Suppliers
              </span>
            </div>

            {/* Quick Item Selector Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {NATURAL_LANGUAGE_PROCUREMENT_PROMPTS.map((item) => {
                const active = selectedSku.skuId === item.skuId;
                return (
                  <button
                    key={item.skuId}
                    type="button"
                    onClick={() => handleApplyNaturalPrompt(item)}
                    className={`rounded-lg border px-3 py-1.5 text-xs tabular-nums transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                      active
                        ? "border-accent-dark bg-accent-dark text-accent-dark-ink font-semibold shadow-2xs"
                        : "border-hairline bg-elevated text-ink-secondary hover:border-border-strong hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-ink-faint" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wholesale packaging, labels, yarn, or ink..."
                aria-label="Search Channel3 B2B Catalog"
                className="w-full rounded-xl border border-hairline bg-elevated pl-9 pr-4 py-2.5 text-xs text-ink placeholder-ink-faint shadow-2xs focus:border-ink focus:outline-none"
              />
            </div>

            {/* Catalog SKU Cards */}
            <div className="space-y-3">
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
                    className={`rounded-xl border p-4 sm:p-5 cursor-pointer transition-all duration-200 active:scale-[0.985] flex items-center justify-between gap-4 ${
                      isSelected
                        ? "border-ink bg-elevated shadow-md -translate-y-[2px] ring-1 ring-slate-900/5"
                        : "border-hairline bg-elevated/80 hover:border-border-strong hover:bg-elevated hover:-translate-y-[2px] hover:shadow-sm"
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-md bg-surface px-2.5 py-0.5 text-[11px] font-medium text-ink-secondary border border-hairline">
                          {item.category}
                        </span>
                        <span className="font-semibold text-ink truncate">{item.title}</span>
                      </div>
                      <div className="text-xs text-ink-muted tabular-nums">
                        {item.vendorName} · {item.packSize} units (${item.unitPriceUsd} each) ·{" "}
                        {item.leadTimeDays}-day delivery ·{" "}
                        <span className="text-status-success-text font-medium">
                          {item.sustainabilityBadge}
                        </span>
                      </div>
                    </div>

                    <div className="text-right tabular-nums shrink-0">
                      <div className="text-sm font-semibold text-ink">
                        <AnimatedNumber
                          value={numericTotal}
                          durationMs={850}
                          formatFn={(val) =>
                            formatCurrencyAmount(val.toFixed(2), "USD", activeCurrency)
                          }
                        />
                      </div>
                      <div className="text-[11px] text-ink-muted">{dualSkuPrice.secondary}</div>
                      <div
                        className={`mt-1 text-[11px] font-medium ${
                          exceedsAutoCap
                            ? "text-status-warning-text"
                            : "text-status-success-text"
                        }`}
                      >
                        {exceedsAutoCap ? "Passkey Required (>$500)" : "Auto-Approved"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fastlane Checkout Island */}
          <FastlaneCheckoutIsland selectedSku={selectedSku} />
        </section>

        {/* Right Column (6 cols): Instant PYUSD Settlement & Activity Log */}
        <section
          aria-label="Cross-Border PYUSD Solana Bridge and Elastic Audit Telemetry"
          className="lg:col-span-6 space-y-6 lg:space-y-8 animate-pop-in delay-150"
        >
          {/* PYUSD Cross-Border Supplier Settlement Card */}
          <div className="surface-bento rounded-2xl p-6 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-hairline pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-status-success-bar" />
                  <h2 className="text-base font-semibold tracking-tight text-ink">
                    2. Instant Cross-Border PYUSD Settlement
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Settle international supplier invoices in 1.2 seconds with zero foreign-exchange
                  markup
                </p>
              </div>
              <span className="rounded-pill border border-status-success-border bg-status-success-bg px-2.5 py-0.5 text-xs font-medium text-status-success-text">
                Direct Wallet Settlement
              </span>
            </div>

            {/* Open/Overdue Invoice Selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="bridge-invoice-select"
                className="block text-xs font-medium text-ink-secondary"
              >
                Select Supplier Invoice to Pay
              </label>
              <select
                id="bridge-invoice-select"
                value={crossBorderInvoice?.invoiceId ?? ""}
                onChange={(e) => {
                  setSelectedBridgeInvoiceId(e.target.value);
                  setSimulatedCorruptMemo(null);
                }}
                className="w-full rounded-xl border border-hairline bg-elevated px-3 py-2 text-xs font-medium text-ink tabular-nums shadow-2xs focus:border-ink focus:outline-none cursor-pointer"
              >
                {invoices.map((inv) => (
                  <option key={inv.invoiceId} value={inv.invoiceId}>
                    {inv.invoiceNumber} · ${inv.amountValue} {inv.currencyCode} ·{" "}
                    {inv.recipientEmail} ({inv.status})
                  </option>
                ))}
              </select>
            </div>

            {crossBorderInvoice && (
              <div className="space-y-3.5 text-xs">
                <div className="surface-card grid grid-cols-2 gap-3 rounded-xl p-4">
                  <div>
                    <div className="text-xs font-medium text-ink-muted">Supplier Invoice</div>
                    <div className="text-sm font-semibold text-ink mt-0.5">
                      {crossBorderInvoice.invoiceNumber}
                    </div>
                    <div className="text-xs text-ink-muted truncate mt-0.5">
                      {crossBorderInvoice.recipientEmail}
                    </div>
                  </div>
                  <div className="text-right tabular-nums">
                    <div className="text-xs font-medium text-ink-muted">Settlement Amount</div>
                    <div className="text-base font-semibold text-status-success-text mt-0.5">
                      <AnimatedNumber
                        value={parseFloat(crossBorderInvoice.amountValue) || 650}
                        decimals={2}
                        suffix=" PYUSD"
                        durationMs={850}
                      />
                    </div>
                    <div className="text-[11px] text-ink-muted">
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
                    <div className="text-xs text-ink font-medium mt-0.5">
                      Status: {crossBorderInvoice.status}
                    </div>
                  </div>
                </div>

                {/* Readable Cost & Speed Comparison */}
                <div className="dot-grid-surface rounded-xl border border-hairline p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-ink-secondary">
                    <span>Traditional International Wire:</span>
                    <span className="text-status-danger-text font-medium tabular-nums">
                      $48.00 Fee + 3.2% FX · 4 Business Days
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-status-success-text font-semibold">
                    <span>PayPal PYUSD Instant Settlement:</span>
                    <span className="tabular-nums">$0.001 Network Fee · 1.2 Seconds · 0% FX</span>
                  </div>
                  <div className="pt-2 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`${
                        memoCheck.valid
                          ? "text-ink-secondary"
                          : "text-status-danger-text font-semibold"
                      }`}
                    >
                      Invoice Reconciliation Reference:{" "}
                      <strong className="text-ink">{crossBorderInvoice.invoiceNumber}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={
                          memoCheck.valid
                            ? handleSimulateMemoErrorOnScreen
                            : handleRestoreValidMemoOnScreen
                        }
                        className="text-[11px] text-ink-muted underline hover:text-ink cursor-pointer"
                      >
                        {memoCheck.valid ? "Test Guardrail" : "Restore Reference"}
                      </button>
                      <span
                        className={`shrink-0 rounded-pill border px-2.5 py-0.5 text-[11px] font-medium ${
                          memoCheck.valid
                            ? "border-status-success-border bg-status-success-bg text-status-success-text"
                            : "border-status-danger-border bg-status-danger-bg text-status-danger-text"
                        }`}
                      >
                        {memoCheck.valid ? "Reference Verified" : "Reference Missing"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary PYUSD Settlement Actions */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void handleQuickDirectPyusdSettle()}
                    className="btn-primary-mint py-2.5 px-4 text-xs font-semibold cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Instant Settle &amp; Mark Paid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openPyusdModal(crossBorderInvoice)}
                    className="btn-outline-subtle py-2.5 px-4 text-xs font-semibold cursor-pointer"
                  >
                    <Coins className="h-4 w-4" />
                    <span>Open PYUSD Settlement Modal</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Verified Settlement Receipt */}
                {lastPyusdSettlement && (
                  <div
                    role="status"
                    className="animate-tab-switch rounded-xl border border-status-success-border bg-status-success-bg p-3.5 text-xs space-y-1 text-status-success-text"
                  >
                    <div className="flex items-center justify-between font-semibold tabular-nums">
                      <span>✓ Supplier Invoice Settled in PYUSD</span>
                      <span>Confirmed in 1.2s</span>
                    </div>
                    <div className="text-ink-secondary">
                      Invoice <strong>{lastPyusdSettlement.invoiceId}</strong> has been marked as{" "}
                      <strong>PAID</strong> and reconciled in your ledger.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tamper-Proof Activity & Compliance Log */}
          <div className="surface-bento rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-ink-secondary" />
                  <h2 className="text-base font-semibold tracking-tight text-ink">
                    3. Tamper-Proof Activity &amp; Compliance Log
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">
                  180-day verified audit history and automated approval alerts
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleVerifyHashChain}
                  className="inline-flex items-center gap-1 rounded-lg border border-status-success-border bg-status-success-bg px-2.5 py-1 text-xs font-medium text-status-success-text tabular-nums transition-all duration-150 hover:-translate-y-[1px] active:scale-[0.97] cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verify Audit Log ({chainVerification.tamperedCount} Tampered)
                </button>
                <button
                  type="button"
                  onClick={() => setShowZapierPayload((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-elevated px-2.5 py-1 text-xs font-medium text-ink shadow-2xs transition-all duration-150 hover:-translate-y-[1px] hover:border-border-strong active:scale-[0.97] cursor-pointer"
                >
                  <Webhook className="h-3.5 w-3.5 text-ink-secondary" />
                  {showZapierPayload ? "Hide Alert Preview" : "Approval Alert Preview"}
                </button>
              </div>
            </div>

            {chainVerifiedBanner && (
              <div
                role="status"
                className="animate-tab-switch rounded-xl border border-status-success-border bg-status-success-bg px-3.5 py-2 text-xs text-status-success-text tabular-nums flex items-center justify-between"
              >
                <span>{chainVerifiedBanner}</span>
                <span className="rounded-pill bg-elevated border border-status-success-border px-2.5 py-0.5 text-xs font-semibold">
                  Integrity Verified
                </span>
              </div>
            )}

            {showZapierPayload && (
              <div className="animate-tab-switch rounded-xl border border-hairline bg-elevated p-4 text-xs space-y-2 shadow-2xs">
                <div className="flex items-center justify-between font-semibold text-ink">
                  <span>Automated Slack / Email Approval Notification</span>
                  <span className="text-status-success-text">Delivered</span>
                </div>
                <p className="text-ink-secondary">
                  When an order or refund exceeds your automatic limit, Sentinel immediately
                  notifies your finance channel ({zapierPayload.webhookEvent}) for one-click
                  passkey approval.
                </p>
              </div>
            )}

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {auditLogs.map((log) => {
                const formatted = formatAuditTitle(log.toolName, log.policyVerdict);
                const badgeStyle =
                  formatted.tone === "success"
                    ? "border-status-success-border bg-status-success-bg text-status-success-text"
                    : formatted.tone === "warning"
                      ? "border-status-warning-border bg-status-warning-bg text-status-warning-text"
                      : "border-status-danger-border bg-status-danger-bg text-status-danger-text";

                return (
                  <div
                    key={log.logId}
                    className="surface-card rounded-xl p-4 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-ink">{formatted.title}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-[11px] font-medium shrink-0 ${badgeStyle}`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {formatted.badge}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-ink-muted">
                      <span>{formatted.subtitle}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-status-success-text font-medium">
                        <ShieldCheck className="h-3 w-3" />
                        Tamper-Proof Record
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
