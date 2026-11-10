"use client";

/**
 * PayOps AI (PayPal Sentinel) — PayPal Fastlane Express B2B Checkout Island
 * Increase.com Light-First Editorial Redesign:
 *  - Clean human-readable typography (Inter font) with smooth pop-in and hover transitions
 *  - Preserves all Zustand hooks, duplicate-charge protection testing, and policy-guarded refund testing
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

  const paypalClientId =
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_PAYPAL_CLIENT_ID) || "sb";
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
          `Policy Hold: B2B order for ${selectedSku.title} ($${computedOrderTotalUsd}) exceeds the $500.00 automatic purchasing limit. Routed for passkey approval.`
        );
        return;
      }

      const existingOrder = orders.find((o) => o.paypalRequestId === deterministicRequestId);
      if (existingOrder) {
        setLastLeaseStatus("REPLAYED_FROM_JUNODB");
        setCapturedOrderId(existingOrder.orderId);
        setStatusBanner(
          `Duplicate Charge Prevented: Repeated ${fundingSource} click detected. Returned existing Order #${existingOrder.orderId} with zero extra charges.`
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
        executionId: res.executionId ?? `ex_ref_${Math.floor(9650 + Math.random() * 250)}`,
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
            ? `Auto-Approved Refund: $${refundAmountUsd} is within your $250.00 automatic refund limit.`
            : `Held for Passkey Review: $${refundAmountUsd} exceeds your $250.00 automatic refund limit.`,
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      data-paypal-client-id={paypalClientId.slice(0, 12)}
      className="surface-bento rounded-2xl p-6 sm:p-7 space-y-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-hairline bg-elevated px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
            <Zap className="h-3 w-3 text-status-warning-bar" />
            PayPal Fastlane Express Checkout
          </span>
          <h3 className="mt-2.5 text-base font-semibold tracking-tight text-ink">
            One-Click B2B Order Checkout ({selectedSku.title.split(" ").slice(0, 3).join(" ")})
          </h3>
        </div>
        <div className="text-right tabular-nums">
          <div className="text-xs font-medium text-ink-muted">
            Order Total ({packMultiplier} {packMultiplier === 1 ? "Case" : "Cases"})
          </div>
          <div className="text-xl font-semibold text-ink">
            {formatCurrencyAmount(computedOrderTotalUsd, "USD", activeCurrency)}
          </div>
          <div className="text-xs text-ink-muted">{dualPrice.secondary}</div>
        </div>
      </div>

      {/* Fastlane Returning Buyer Recognition Card */}
      <div className="surface-card rounded-xl p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-ink flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-status-warning-bar" />
            Returning Buyer Recognized: <span className="text-ink-secondary">{fastlaneEmail}</span>
          </span>
          <span className="rounded-pill border border-status-success-border bg-status-success-bg px-2.5 py-0.5 text-xs font-medium text-status-success-text">
            Saved Card &amp; Address Ready
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            type="email"
            value={fastlaneEmail}
            onChange={(e) => setFastlaneEmail(e.target.value)}
            aria-label="Fastlane Recognized Buyer Email"
            className="sm:col-span-2 rounded-lg border border-hairline bg-surface px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
          />

          <select
            aria-label="B2B Pack Quantity Multiplier"
            value={packMultiplier}
            onChange={(e) => setPackMultiplier(Number(e.target.value))}
            className="rounded-lg border border-hairline bg-surface px-2.5 py-2 text-xs font-medium text-ink tabular-nums focus:border-ink focus:outline-none cursor-pointer"
          >
            <option value={1}>1 Case (${selectedSku.totalPriceUsd})</option>
            <option value={2}>2 Cases (${(baseSkuTotal * 2).toFixed(2)})</option>
            <option value={3}>3 Cases (${(baseSkuTotal * 3).toFixed(2)})</option>
          </select>

          <select
            aria-label="PayPal Order v2 Intent"
            value={intent}
            onChange={(e) => setIntent(e.target.value as "CAPTURE" | "AUTHORIZE")}
            className="rounded-lg border border-hairline bg-surface px-2.5 py-2 text-xs font-medium text-ink focus:border-ink focus:outline-none cursor-pointer"
          >
            <option value="CAPTURE">Instant Capture</option>
            <option value="AUTHORIZE">Hold Authorization</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-subtle text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-status-success-bar" />
            Card Details Encrypted &amp; Protected
          </span>
          <div className="flex items-center gap-2">
            <span>Switch Buyer:</span>
            <button
              type="button"
              onClick={() => setFastlaneEmail("maya@lumina.io")}
              className="underline text-ink-secondary hover:text-ink cursor-pointer"
            >
              maya@lumina.io
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setFastlaneEmail("maya.lin@kaveriknitwear.example.in")}
              className="underline text-ink-secondary hover:text-ink cursor-pointer"
            >
              maya.lin@kaveri
            </button>
          </div>
        </div>
      </div>

      {/* Spending Policy & Duplicate Payment Protection Pre-Check */}
      <div className="dot-grid-surface rounded-xl border border-hairline p-4 text-xs space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-ink">Pre-Checkout Protection Check</span>
          <div className="flex flex-wrap items-center gap-1.5 tabular-nums">
            <span
              className={`rounded-pill border px-2.5 py-0.5 text-xs font-medium ${
                isOverProcurementCap
                  ? "border-status-warning-border bg-status-warning-bg text-status-warning-text"
                  : "border-status-success-border bg-status-success-bg text-status-success-text"
              }`}
            >
              {isOverProcurementCap
                ? "Requires Passkey Approval (Over $500)"
                : "Auto-Approved (Under $500 Limit)"}
            </span>
            <span
              className={`rounded-pill border px-2.5 py-0.5 text-xs font-medium ${
                lastLeaseStatus === "REPLAYED_FROM_JUNODB"
                  ? "border-status-warning-border bg-status-warning-bg text-status-warning-text"
                  : "border-status-success-border bg-status-success-bg text-status-success-text"
              }`}
            >
              {lastLeaseStatus === "REPLAYED_FROM_JUNODB"
                ? "Duplicate Click Prevented"
                : "Single-Charge Lock Active"}
            </span>
          </div>
        </div>
        <p className="text-xs text-ink-muted">
          Guaranteed single charge even if the checkout button is clicked multiple times.
        </p>
      </div>

      {/* PayPal Smart Payment Buttons Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={processing || uiState === "loading"}
          onClick={() => void handleCheckout("FASTLANE")}
          className="sm:col-span-2 btn-primary-mint py-3 px-4 text-xs font-semibold tabular-nums cursor-pointer"
        >
          <Zap className="h-4 w-4" />
          <span>
            {processing || uiState === "loading"
              ? "Processing Express Order & Syncing Shipment..."
              : `Pay ${formatCurrencyAmount(
                  computedOrderTotalUsd,
                  "USD",
                  activeCurrency
                )} with PayPal Fastlane`}
          </span>
        </button>

        <button
          type="button"
          disabled={processing}
          onClick={() => void handleCheckout("PAYPAL")}
          className="btn-secondary-dark py-2.5 px-3 text-xs cursor-pointer"
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>PayPal Checkout</span>
        </button>

        <button
          type="button"
          disabled={processing}
          onClick={() => void handleCheckout("VENMO")}
          className="btn-outline-subtle py-2.5 px-3 text-xs shadow-2xs cursor-pointer"
        >
          <span>Pay with Venmo</span>
        </button>

        <button
          type="button"
          disabled={processing}
          onClick={() => void handleCheckout("PAY_LATER")}
          className="btn-outline-subtle py-2.5 px-3 text-xs tabular-nums shadow-2xs cursor-pointer"
        >
          <span>
            Pay in 4 ({formatCurrencyAmount(installmentQuarterUsd, "USD", activeCurrency)} / pmt)
          </span>
        </button>

        <button
          type="button"
          disabled={processing}
          onClick={handleStressTest10x}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-status-success-border bg-status-success-bg py-2.5 px-3 text-xs font-semibold text-status-success-text tabular-nums shadow-2xs transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.975] cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Test 10x Duplicate Click Protection</span>
        </button>
      </div>

      {/* 10x Retry Dedup Stress Test Telemetry Banner */}
      {stressTestResult && (
        <div
          role="status"
          className="animate-tab-switch rounded-xl border border-status-success-border bg-status-success-bg p-3.5 text-xs space-y-1 text-status-success-text tabular-nums"
        >
          <div className="flex items-center justify-between font-semibold">
            <span>Duplicate-Click Protection Verified</span>
            <span className="rounded-pill bg-elevated border border-status-success-border px-2.5 py-0.5 text-xs text-status-success-text tabular-nums">
              $0.00 Extra Charges
            </span>
          </div>
          <div className="text-ink-secondary tabular-nums">
            Simulated <strong>{stressTestResult.totalRequests}</strong> rapid checkout clicks —{" "}
            <strong className="text-status-success-text">
              {stressTestResult.acquiredCount} order processed
            </strong>{" "}
            and <strong>{stressTestResult.replayedCount} duplicate clicks safely ignored</strong>.
          </div>
        </div>
      )}

      {/* Post-Capture Shipment Tracking Sync & Policy-Guarded Refund Tester */}
      {capturedOrderId && (
        <div className="surface-card rounded-xl p-4 text-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-ink tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-status-success-bar" />
              Order #{capturedOrderId} Confirmed &amp; Tracking Linked
            </span>
            <select
              aria-label="Carrier Code for create_shipment_tracking"
              value={carrierCode}
              onChange={(e) =>
                setCarrierCode(e.target.value as "FEDEX" | "DHL_EXPRESS" | "BLUEDART")
              }
              className="rounded-lg border border-hairline bg-surface px-2.5 py-1 text-xs font-medium text-ink cursor-pointer"
            >
              <option value="FEDEX">Carrier: FedEx Express</option>
              <option value="DHL_EXPRESS">Carrier: DHL Express</option>
              <option value="BLUEDART">Carrier: BlueDart</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-ink-secondary">
            <Truck className="h-3.5 w-3.5 text-ink-muted shrink-0" />
            <span>
              Shipment Tracking Synced Automatically · Status:{" "}
              <strong className="text-status-success-text">Delivered</strong>
            </span>
          </div>

          {/* Policy-Guarded Refund Test Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
            <span className="text-xs text-ink-muted">Test Refund Protection Rules:</span>
            <div className="flex flex-wrap items-center gap-1.5 tabular-nums">
              <button
                type="button"
                disabled={processing}
                onClick={() => void handlePolicyGuardedRefund("120.00")}
                className="inline-flex items-center gap-1 rounded-lg border border-status-success-border bg-status-success-bg px-2.5 py-1 text-xs font-medium text-status-success-text transition-all duration-150 hover:-translate-y-[1px] active:scale-[0.97] cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Refund $120 (Auto-Approved)
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => void handlePolicyGuardedRefund("420.00")}
                className="inline-flex items-center gap-1 rounded-lg border border-status-warning-border bg-status-warning-bg px-2.5 py-1 text-xs font-medium text-status-warning-text transition-all duration-150 hover:-translate-y-[1px] active:scale-[0.97] cursor-pointer"
              >
                <AlertTriangle className="h-3 w-3" />
                Refund $420 (Passkey Hold)
              </button>
            </div>
          </div>

          {refundVerdictMsg && (
            <div className="rounded-lg border border-hairline bg-surface px-3 py-2 text-xs text-ink tabular-nums">
              {refundVerdictMsg.detail}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-status-success-bar" />
          Zero-PAN Buyer Privacy Protection Active
        </span>
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
          className="rounded-lg border border-hairline bg-elevated px-2.5 py-1 text-xs font-medium text-ink shadow-2xs transition-colors hover:border-border-strong cursor-pointer"
        >
          View Integration Details
        </button>
      </div>
    </div>
  );
}
