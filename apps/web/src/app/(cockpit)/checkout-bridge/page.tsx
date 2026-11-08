"use client";

/**
 * PayOps AI (PayPal Sentinel) — Screen 5: Agentic B2B Procurement (Channel3), Fastlane Checkout & PYUSD Solana Bridge
 * Maps to: F-05 (Orders v2 & Fastlane), F-11 (PYUSD Solana Token-2022 Bridge), F-12 (Channel3 + Elastic + Zapier),
 * US-10, US-11, US-15, US-16
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
} from "lucide-react";
import { MOCK_CHANNEL3_CATALOG, type Channel3CatalogItem } from "@payops/shared/mock-fixtures";
import { FastlaneCheckoutIsland } from "../../../components/paypal/FastlaneCheckoutIsland";
import { formatCurrencyAmount } from "../../../lib/formatters";
import { useCockpitStore } from "../../../stores/useCockpitStore";

export default function CheckoutBridgePage() {
  const { activeCurrency, invoices, openPyusdModal, auditLogs } = useCockpitStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSku, setSelectedSku] = useState<Channel3CatalogItem>(MOCK_CHANNEL3_CATALOG[0]);

  const filteredCatalog = MOCK_CHANNEL3_CATALOG.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.skuId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const crossBorderInvoice =
    invoices.find((inv) => inv.invoiceNumber === "INV-2026-7704") ?? invoices[0];

  return (
    <div className="mx-auto max-w-[1750px] space-y-4">
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
                    Real-time normalized wholesale SKU discovery gated by Cosmos.AI Rule POL-01 (&le;$500 Auto-Cap)
                  </p>
                </div>
              </div>
            </div>

            {/* Channel3 Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search Channel3 MCP Catalog (e.g. "Eco-Mailer", "C3-88210", "Cotton Yarn")...'
                aria-label="Search Channel3 B2B Catalog"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Catalog SKU Cards */}
            <div className="space-y-2.5">
              {filteredCatalog.map((item) => {
                const isSelected = item.skuId === selectedSku.skuId;
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
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-bold text-sky-400">SKU #{item.skuId}</span>
                        <span className="text-white font-semibold">{item.title}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Vendor: {item.vendorName} · Pack: {item.packSize} units @ ${item.unitPriceUsd} ·{" "}
                        <span className="text-emerald-400">{item.sustainabilityBadge}</span>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <div className="text-sm font-bold text-emerald-400 financial-figure">
                        {formatCurrencyAmount(item.totalPriceUsd, "USD", activeCurrency)}
                      </div>
                      <div className="text-[10px] text-emerald-300">
                        Policy {item.policyRuleId}: ALLOW
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
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-[#14F195]" />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    2. Cross-Border PYUSD Solana Token-2022 Bridge (F-11 · US-15)
                  </h2>
                  <p className="text-[11px] font-mono text-[#14F195]">
                    Mint: 2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo · Mandatory Memo Extension
                  </p>
                </div>
              </div>
              <span className="rounded bg-emerald-500/20 px-2.5 py-1 font-mono text-xs font-bold text-emerald-300">
                Non-Custodial (R-08)
              </span>
            </div>

            {crossBorderInvoice && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3.5 font-mono">
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">Supplier Invoice</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {crossBorderInvoice.invoiceId}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {crossBorderInvoice.recipientEmail}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-slate-400">Settlement Amount</div>
                    <div className="text-base font-bold text-[#14F195] mt-0.5 financial-figure">
                      {crossBorderInvoice.amountValue} PYUSD
                    </div>
                    <div className="text-[11px] text-emerald-300">
                      Status: {crossBorderInvoice.status}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 font-mono text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Legacy SWIFT Correspondent Wire:</span>
                    <span className="text-red-400">$48.00 Fee + 3.2% FX · 4 Days</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-300 font-bold">
                    <span>PayPal PYUSD (Solana Token-2022):</span>
                    <span>$0.001 Fee · 1.2 Seconds · 0% FX Slippage</span>
                  </div>
                  <div className="pt-1 border-t border-slate-800 text-slate-400 truncate">
                    Required Memo (R-09): PAYOPS:{crossBorderInvoice.invoiceId}:
                    {crossBorderInvoice.idempotencyKey}
                  </div>
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
              </div>
            )}
          </div>

          {/* Elastic 180-Day Immutable Audit Index & Zapier Outbound Webhook Inspector (F-12) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                  3. Elastic Cloud 180-Day Audit Index &amp; Zapier Webhook Dispatcher (F-12 · E-10)
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                <Webhook className="h-3.5 w-3.5" />
                Zapier + Elastic: SYNCED
              </span>
            </div>

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
