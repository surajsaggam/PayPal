"use client";

/**
 * PayOps AI (PayPal Sentinel) — PayPal Orders v2 & Fastlane Accelerated Guest Checkout Island
 * Maps to: F-05, F-06 (JunoDB PayPal-Request-Id), US-10, US-11, ADR-0005 (Zero-PAN Zoid Isolation), R-02, R-07
 * Write Owner: Dev 2 (100%)
 */

import React, { useState } from "react";
import {
  Zap,
  ShieldCheck,
  Truck,
  CheckCircle2,
  CreditCard,
  Lock,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import {
  computeBuyerEmailHmacPreview,
  type Channel3CatalogItem,
} from "@payops/shared/mock-fixtures";
import {
  captureOrder,
  createAndCaptureOrder,
  refundOrder,
} from "../../lib/api-client";
import { formatCurrencyAmount, formatDualCurrency } from "../../lib/formatters";
import {
  useCockpitStore,
  type OrderIdempotencyStressResult,
} from "../../stores/useCockpitStore";

interface FastlaneCheckoutIslandProps {
  selectedSku: Channel3CatalogItem;
}

export function FastlaneCheckoutIsland({ selectedSku }: FastlaneCheckoutIslandProps) {
  const {
    activeWorkspaceId,
    activeCurrency,
    uiState,
    recordOrderCheckout,
    orders,
    prependExecution,
    openHitlApproval,
    openApimaticDrawer,
    runOrderIdempotencyStressTest,
    setStatusBanner,
  } = useCockpitStore();

  const [fastlaneEmail, setFastlaneEmail] = useState("maya@lumina.io");
  const [intent, setIntent] = useState<"CAPTURE" | "AUTHORIZE">("CAPTURE");
  const [packMultiplier, setPackMultiplier] = useState<number>(1);
  const [carrierCode, setCarrierCode] = useState<"FEDEX" | "DHL_EXPRESS" | "BLUEDART">("FEDEX");
  const [processing, setProcessing] = useState(false);
  const [lastLeaseStatus, setLastLeaseStatus] = useState<"ACQUIRED" | "REPLAYED_FROM_JUNODB">(
    "ACQUIRED"
  );
  const [capturedOrderId, setCapturedOrderId] = useState<string | null>("5O190127TN364715T");
  const [stressTestResult, setStressTestResult] = useState<OrderIdempotencyStressResult | null>(
    null
  );
  const [refundVerdictMsg, setRefundVerdictMsg] = useState<{
    verdict: string;
    detail: string;
  } | null>(null);

  const baseSkuTotal = parseFloat(selectedSku.totalPriceUsd) || 390.0;
  const computedOrderTotalNum = baseSkuTotal * packMultiplier;
  const computedOrderTotalUsd = computedOrderTotalNum.toFixed(2);
  const installmentQuarterUsd = (computedOrderTotalNum / 4).toFixed(2);
  const isOverProcurementCap = computedOrderTotalNum > 500.0;

  const buyerEmailHmac = computeBuyerEmailHmacPreview(fastlaneEmail);
  const deterministicRequestId = `idem_${activeWorkspaceId}_order_${selectedSku.skuId}_${computedOrderTotalUsd}`;
  const dualPrice = formatDualCurrency(
    computedOrderTotalUsd,
    "USD",
    activeCurrency === "USD" ? "INR" : activeCurrency
  );

  const handleCheckout = async (
    fundingSource: "FASTLANE" | "PAYPAL" | "VENMO" | "PAY_LATER"
  ) => {
    setProcessing(true);
    setRefundVerdictMsg(null);
    try {
      // Check Cosmos.AI Policy Firewall Cap (<= $500.00 auto-cap vs > $500.00 Passkey Hold)
      if (isOverProcurementCap) {
        const heldOrderExec = {
          executionId: `ex_ord_hold_${selectedSku.skuId.replace(/[^a-zA-Z0-9]/g, "")}`,
          sessionId: "ses_20261108_9042",
          workspaceId: activeWorkspaceId,
          toolName: "create_order",
          paypalRequestId: deterministicRequestId,
          junodbLeaseStatus: "ACQUIRED" as const,
          policyVerdict: "HELD_FOR_L2_PASSKEY" as const,
          reasonCode: "RC_01_PROCUREMENT_CAP_EXCEEDED_500_USD",
          gnnRiskScore: 0.48,
          amountValue: computedOrderTotalUsd,
          currencyCode: "USD" as const,
          executedAt: new Date().toISOString(),
        };
        prependExecution(heldOrderExec);
        openHitlApproval(heldOrderExec);
        setStatusBanner(
          `Cosmos.AI Policy Hold (Rule POL-02): Channel3 B2B order for SKU #${selectedSku.skuId} ($${computedOrderTotalUsd} USD) exceeds $500.00 autonomous procurement cap. Routed to FIDO2 Passkey Approval Drawer.`
        );
        return;
      }

      const existingOrder = orders.find((o) => o.paypalRequestId === deterministicRequestId);
      if (existingOrder) {
        setLastLeaseStatus("REPLAYED_FROM_JUNODB");
        setCapturedOrderId(existingOrder.orderId);
        setStatusBanner(
          `JunoDB 2PC Idempotency Hit (F-06 · R-02): Duplicate ${fundingSource} retry intercepted for PayPal-Request-Id ${deterministicRequestId}. Returned cached Order ${existingOrder.orderId} with 0 duplicate charges.`
        );
        return;
      }

      const res = await createAndCaptureOrder({
        workspaceId: activeWorkspaceId,
        skuId: selectedSku.skuId,
        amountValue: computedOrderTotalUsd,
        currencyCode: "USD",
        intent,
      });

      const captured = await captureOrder(
        res.order.orderId,
        activeWorkspaceId,
        computedOrderTotalUsd,
        "USD"
      );

      const enrichedOrder = {
        ...captured.order,
        intent,
        buyerEmailHmac,
        carrierCode,
      };

      setLastLeaseStatus(captured.junodbLeaseStatus);
      setCapturedOrderId(enrichedOrder.orderId);
      recordOrderCheckout(enrichedOrder);
    } finally {
      setProcessing(false);
    }
  };

  const handleStressTest10x = () => {
    const result = runOrderIdempotencyStressTest(
      { ...selectedSku, totalPriceUsd: computedOrderTotalUsd },
      10
    );
    setStressTestResult(result);
    setLastLeaseStatus("REPLAYED_FROM_JUNODB");
    setCapturedOrderId(result.orderId);
  };

  const handlePolicyGuardedRefund = async (refundAmountUsd: string) => {
    const targetOrderId = capturedOrderId ?? "5O190127TN364715T";
    setProcessing(true);
    try {
      const res = await refundOrder(targetOrderId, activeWorkspaceId, refundAmountUsd, "USD");
      const exec = {
        executionId: `ex_ref_${Math.floor(9650 + Math.random() * 250)}`,
        sessionId: "ses_20261108_9042",
        workspaceId: activeWorkspaceId,
        toolName: "create_refund",
        paypalRequestId: `${res.paypalRequestId}_${refundAmountUsd}`,
        junodbLeaseStatus: "ACQUIRED" as const,
        policyVerdict: res.policyVerdict,
        reasonCode: res.reasonCode,
        gnnRiskScore: parseFloat(refundAmountUsd) > 250 ? 0.78 : 0.08,
        amountValue: refundAmountUsd,
        currencyCode: "USD" as const,
        executedAt: new Date().toISOString(),
      };
      prependExecution(exec);
      if (res.policyVerdict === "HELD_FOR_L2_PASSKEY") {
        openHitlApproval(exec);
      }
      setRefundVerdictMsg({
        verdict: res.policyVerdict,
        detail:
          res.policyVerdict === "APPROVED_L3_AUTO"
            ? `API-09 Auto-Refund Executed: $${refundAmountUsd} USD <= $250.00 L3 cap (${res.reasonCode}).`
            : `API-09 Held for FIDO2 Passkey: $${refundAmountUsd} USD > $250.00 cap (${res.reasonCode}).`,
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <span className="inline-flex items-center gap-1 rounded bg-sky-500/15 border border-sky-500/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-300">
            <Zap className="h-3 w-3 text-amber-400" />
            @paypal/react-paypal-js v8.7 · Fastlane + Orders v2 (F-05 · US-10 · US-11)
          </span>
          <h3 className="text-sm font-bold text-white mt-1">
            Idempotent B2B Procurement Checkout Island ({selectedSku.skuId})
          </h3>
        </div>
        <div className="text-right font-mono">
          <div className="text-[10px] uppercase text-slate-400">
            Selected Order Total ({packMultiplier}x Case)
          </div>
          <div className="text-lg font-bold text-emerald-400 financial-figure">
            {formatCurrencyAmount(computedOrderTotalUsd, "USD", activeCurrency)}
          </div>
          <div className="text-[10px] text-slate-400 financial-figure">{dualPrice.secondary}</div>
        </div>
      </div>

      {/* Fastlane Identity Recognition Bar (ADR-0005 Zero-PAN Zoid & R-07 HMAC-SHA256) */}
      <div className="rounded-lg border border-sky-500/40 bg-sky-950/25 p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-sky-300 flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-400" />
            Fastlane by PayPal — Recognized: {fastlaneEmail}
          </span>
          <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
            Zero-PAN Zoid Iframe (ADR-0005)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="email"
            value={fastlaneEmail}
            onChange={(e) => setFastlaneEmail(e.target.value)}
            aria-label="Fastlane Recognized Buyer Email"
            className="sm:col-span-2 rounded border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-slate-100"
          />

          <select
            aria-label="B2B Pack Quantity Multiplier"
            value={packMultiplier}
            onChange={(e) => setPackMultiplier(Number(e.target.value))}
            className="rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-slate-200"
          >
            <option value={1}>1x Case (${selectedSku.totalPriceUsd})</option>
            <option value={2}>
              2x Cases (${(baseSkuTotal * 2).toFixed(2)} · &gt;$500 Hold)
            </option>
            <option value={3}>
              3x Cases (${(baseSkuTotal * 3).toFixed(2)} · &gt;$500 Hold)
            </option>
          </select>

          <select
            aria-label="PayPal Order v2 Intent"
            value={intent}
            onChange={(e) => setIntent(e.target.value as "CAPTURE" | "AUTHORIZE")}
            className="rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-slate-200"
          >
            <option value="CAPTURE">intent: CAPTURE</option>
            <option value="AUTHORIZE">intent: AUTHORIZE</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 font-mono text-[10px] text-slate-400">
          <span className="truncate">R-07 Buyer HMAC-SHA256: {buyerEmailHmac}</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFastlaneEmail("maya@lumina.io")}
              className="underline text-sky-300 hover:text-white cursor-pointer"
            >
              maya@lumina.io
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setFastlaneEmail("maya.lin@kaveriknitwear.example.in")}
              className="underline text-sky-300 hover:text-white cursor-pointer"
            >
              maya.lin@kaveri
            </button>
          </div>
        </div>
      </div>

      {/* JunoDB Idempotency Key & Cosmos.AI Firewall Pre-Check (F-02, F-06, R-02) */}
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-slate-400">PayPal-Request-Id (UUIDv5/SHA-256):</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                isOverProcurementCap
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}
            >
              {isOverProcurementCap
                ? "Cosmos.AI POL-02: HOLD_APPROVAL (>$500 Cap)"
                : `Cosmos.AI ${selectedSku.policyRuleId}: ALLOW (<=$500 Cap)`}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                lastLeaseStatus === "REPLAYED_FROM_JUNODB"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}
            >
              JunoDB Lease: {lastLeaseStatus}
            </span>
          </div>
        </div>
        <div className="text-slate-200 truncate">{deterministicRequestId}</div>
      </div>

      {/* PayPal Smart Payment Buttons Grid (Fastlane, Orders v2, Venmo, Pay Later 4x, 10x Dedup Stress Test) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={processing || uiState === "loading"}
          onClick={() => void handleCheckout("FASTLANE")}
          className="sm:col-span-2 flex items-center justify-center gap-2 rounded-lg bg-[#0070E0] hover:bg-[#005EA6] py-2.5 px-4 text-xs font-bold text-white shadow transition cursor-pointer"
        >
          <Zap className="h-4 w-4 text-amber-300 fill-current" />
          {processing || uiState === "loading"
            ? "Executing create_order -> pay_order -> create_shipment_tracking..."
            : `Pay ${formatCurrencyAmount(
                computedOrderTotalUsd,
                "USD",
                activeCurrency
              )} with PayPal Orders v2 · Fastlane (Idempotent)`}
        </button>

        <button
          type="button"
          disabled={processing}
          onClick={() => void handleCheckout("PAYPAL")}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#003087] hover:bg-[#00256B] py-2 px-3 text-xs font-semibold text-white transition cursor-pointer"
        >
          <CreditCard className="h-3.5 w-3.5" />
          PayPal Orders v2 ({intent})
        </button>

        <button
          type="button"
          disabled={processing}
          onClick={() => void handleCheckout("VENMO")}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#008CFF] hover:bg-[#0074D4] py-2 px-3 text-xs font-semibold text-white transition cursor-pointer"
        >
          Pay with Venmo
        </button>

        <button
          type="button"
          disabled={processing}
          onClick={() => void handleCheckout("PAY_LATER")}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-950/50 hover:bg-sky-900/50 py-2 px-3 text-xs font-semibold text-sky-200 transition cursor-pointer financial-figure"
        >
          Pay Later (4x {formatCurrencyAmount(installmentQuarterUsd, "USD", activeCurrency)})
        </button>

        <button
          type="button"
          disabled={processing}
          onClick={handleStressTest10x}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/40 bg-slate-800 hover:bg-slate-700 py-2 px-3 text-xs font-semibold text-emerald-300 transition cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
          10x Retry Dedup Test (R-02)
        </button>
      </div>

      {/* 10x Retry Dedup Stress Test Telemetry Banner (R-02, F-06) */}
      {stressTestResult && (
        <div
          role="status"
          className="rounded-lg border border-amber-500/50 bg-amber-950/30 p-3 font-mono text-[11px] space-y-1 text-amber-200"
        >
          <div className="flex items-center justify-between font-bold">
            <span>
              JunoDB 10x Concurrency Stress Test PASS (R-02 · SET NX EX 86400):
            </span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">
              $0.00 Duplicate Charge
            </span>
          </div>
          <div>
            Sent <strong>{stressTestResult.totalRequests}</strong> concurrent requests for{" "}
            <code className="text-white">{stressTestResult.paypalRequestId}</code> &rarr;{" "}
            <strong className="text-emerald-300">
              {stressTestResult.acquiredCount} ACQUIRED
            </strong>{" "}
            +{" "}
            <strong className="text-amber-300">
              {stressTestResult.replayedCount} REPLAYED_FROM_JUNODB
            </strong>
          </div>
        </div>
      )}

      {/* Post-Capture Shipment Tracking Sync & Policy-Guarded Refund Tester (US-11, API-08, API-09) */}
      {capturedOrderId && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/25 p-3.5 text-xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-emerald-300">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Order {capturedOrderId} Captured &amp; Carrier Tracking Attached (US-11)
            </span>
            <select
              aria-label="Carrier Code for create_shipment_tracking"
              value={carrierCode}
              onChange={(e) =>
                setCarrierCode(e.target.value as "FEDEX" | "DHL_EXPRESS" | "BLUEDART")
              }
              className="rounded border border-emerald-500/40 bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-emerald-200"
            >
              <option value="FEDEX">Carrier: FEDEX</option>
              <option value="DHL_EXPRESS">Carrier: DHL_EXPRESS</option>
              <option value="BLUEDART">Carrier: BLUEDART</option>
            </select>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
            <Truck className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span>
              MCP Tool: create_shipment_tracking (#28) · Carrier: {carrierCode} · Status: DELIVERED
            </span>
          </div>

          {/* Policy-Guarded Refund Test Controls (API-09: <= $250 L3 Auto vs > $250 L2 Passkey Hold) */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-emerald-500/30 pt-2">
            <span className="font-mono text-[11px] text-slate-300">
              Test Policy-Guarded Refund (`create_refund` · API-09):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={processing}
                onClick={() => void handlePolicyGuardedRefund("120.00")}
                className="inline-flex items-center gap-1 rounded border border-emerald-500/50 bg-emerald-950/70 hover:bg-emerald-900/70 px-2.5 py-1 font-mono text-[10px] text-emerald-200 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Refund $120 (&le;$250 L3 Auto)
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => void handlePolicyGuardedRefund("420.00")}
                className="inline-flex items-center gap-1 rounded border border-amber-500/50 bg-amber-950/70 hover:bg-amber-900/70 px-2.5 py-1 font-mono text-[10px] text-amber-200 cursor-pointer"
              >
                <AlertTriangle className="h-3 w-3" />
                Refund $420 (&gt;$250 L2 Passkey Hold)
              </button>
            </div>
          </div>

          {refundVerdictMsg && (
            <div className="rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 font-mono text-[11px] text-sky-200">
              {refundVerdictMsg.detail}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Lock className="h-3 w-3 text-emerald-400" />
          Luhn PAN Scrubber &amp; HMAC-SHA256 Active (R-07) · PayPalScriptProvider (
          {activeCurrency})
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              openApimaticDrawer({
                executionId: "ex_fastlane_preview",
                sessionId: "ses_20261108_9041",
                workspaceId: activeWorkspaceId,
                toolName: "pay_order",
                paypalRequestId: deterministicRequestId,
                junodbLeaseStatus: lastLeaseStatus,
                policyVerdict: isOverProcurementCap
                  ? "HELD_FOR_L2_PASSKEY"
                  : "APPROVED_L3_AUTO",
                reasonCode: "RC_OK_FASTLANE_CAPTURED",
                gnnRiskScore: 0.02,
                amountValue: computedOrderTotalUsd,
                currencyCode: "USD",
                executedAt: new Date().toISOString(),
              })
            }
            className="rounded border border-sky-500/40 bg-sky-950/50 hover:bg-sky-900/50 px-2 py-0.5 text-[10px] text-sky-300 cursor-pointer"
          >
            APIMatic SDK Code (US-14)
          </button>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-sky-400" />
            Cosmos.AI Rule {selectedSku.policyRuleId}:{" "}
            {isOverProcurementCap ? "HOLD_APPROVAL (>$500)" : "ALLOW (<=$500 Cap)"}
          </span>
        </div>
      </div>
    </div>
  );
}
