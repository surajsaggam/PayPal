"use client";

/**
 * PayOps AI (PayPal Sentinel) — Screen 4: Dispute Defense War-Room
 * Increase.com Light-First Editorial Redesign:
 *  - Clean human-readable typography (Inter font) with zero raw SCREAMING_SNAKE_CASE enums or ML feature dumps
 *  - Smooth pop-in animations when switching dispute cases or inspecting 3-hop relationship nodes
 *  - Preserves `svg[aria-label="3-Hop Buyer Device Carrier Fraud Graph"]`, all 5 UI states, and API-10/API-11 bindings
 */

import React, { useState } from "react";
import {
  Swords,
  Zap,
  ShieldAlert,
  Truck,
  FileCheck,
  Network,
  CheckCircle2,
  KeyRound,
  Languages,
  Clock,
  Table,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  UploadCloud,
  Download,
  Sparkles,
} from "lucide-react";
import {
  getM04HopTelemetry,
  type M04GraphNodeId,
} from "@payops/shared/mock-fixtures";
import { useSseExecutionStream } from "../../../hooks/useSseExecutionStream";
import { resolveDispute, simulatePayPalWebhook } from "../../../lib/api-client";
import {
  formatCurrencyAmount,
  formatDualCurrency,
  formatSlaCountdown,
} from "../../../lib/formatters";
import { useCockpitStore } from "../../../stores/useCockpitStore";

function formatReasonLabel(reasonCode: string): string {
  const map: Record<string, string> = {
    MERCHANDISE_OR_SERVICE_NOT_RECEIVED: "Item Not Received Claim",
    SIGNIFICANTLY_NOT_AS_DESCRIBED: "Item Significantly Not as Described",
    UNAUTHORIZED: "Unauthorized Transaction Claim",
  };
  return map[reasonCode] ?? reasonCode.replace(/_/g, " ");
}

function formatRecommendedAction(action: string): string {
  const map: Record<string, string> = {
    CONTEST_WITH_COMPELLING_EVIDENCE: "Auto-Contest with Delivery Proof",
    AUTO_ACCEPT_LOW_VALUE_CLAIM: "Auto-Accept Low-Value Claim",
    ROUTE_TO_HITL_PASSKEY: "Hold for Passkey Review",
  };
  return map[action] ?? action.replace(/_/g, " ");
}

function formatCarrierName(carrierCode: string): string {
  const map: Record<string, string> = {
    DHL_EXPRESS: "DHL Express",
    FEDEX: "FedEx Priority",
    BLUEDART: "BlueDart Express",
    UPS: "UPS Ground",
  };
  return map[carrierCode] ?? carrierCode.replace(/_/g, " ");
}

function formatShapReason(rawReason: string): {
  title: string;
  impact: string;
  description: string;
} {
  if (rawReason.includes("CARRIER_SIGNED_DELIVERY")) {
    return {
      title: "Signed Carrier Delivery Matches Buyer Postal Code",
      impact: "+44% Defense Confidence",
      description: "Carrier GPS and recipient signature match the checkout shipping address.",
    };
  }
  if (rawReason.includes("REPEAT_INR_CLAIM")) {
    return {
      title: "Repeat 'Item Not Received' Claims Across 3 Merchants",
      impact: "+31% Collusion Signal",
      description: "Buyer device has filed three similar non-receipt claims within 90 days.",
    };
  }
  if (rawReason.includes("DEVICE_FINGERPRINT")) {
    return {
      title: "Checkout Device & IP Match Prior Completed Orders",
      impact: "+14% Identity Match",
      description: "Order was placed from a recognized buyer device and residential IP.",
    };
  }
  return {
    title: rawReason
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    impact: "Verified Signal",
    description: "Correlated across order history and carrier delivery records.",
  };
}

function formatHopBadge(badge: string): string {
  const map: Record<string, string> = {
    SIGNED_POD_VERIFIED_M03: "Signed Delivery Verified",
    BUYER_HMAC_VERIFIED: "Buyer Identity Verified",
    ORDER_IP_GEO_MATCH: "Order & Address Matched",
    CROSS_MERCHANT_RING_DETECTED: "Repeat Claim Pattern",
  };
  return map[badge] ?? badge.replace(/_/g, " ");
}

export default function DisputeWarRoomPage() {
  const {
    activeWorkspaceId,
    disputes,
    activeCurrency,
    uiState,
    setUiState,
    simulateDisputeWebhook,
    uploadManualCarrierPodOcr,
    resolveDisputeCase,
    openHitlApproval,
    executions,
  } = useCockpitStore();

  useSseExecutionStream(null, activeWorkspaceId);

  const [selectedDisputeId, setSelectedDisputeId] = useState<string>(
    disputes[0]?.disputeId ?? "PP-D-90412"
  );
  const [selectedHopId, setSelectedHopId] = useState<M04GraphNodeId>("HOP_3A_CARRIER");
  const [submitting, setSubmitting] = useState(false);
  const [submittedIds, setSubmittedIds] = useState<Record<string, string>>({});
  const [showGraphTextSummary, setShowGraphTextSummary] = useState(false);
  const [showBhashiniOcrInspector, setShowBhashiniOcrInspector] = useState(true);
  const [manualTrackingInput, setManualTrackingInput] = useState("DHL-POD-9948102");

  const activeDispute =
    disputes.find((d) => d.disputeId === selectedDisputeId) ?? disputes[0];

  const hopTelemetryMap = activeDispute ? getM04HopTelemetry(activeDispute) : null;
  const activeHopTelemetry = hopTelemetryMap ? hopTelemetryMap[selectedHopId] : null;

  const handleSimulateWebhookClick = (variant: "INR_340" | "INJECTION_2400") => {
    void simulatePayPalWebhook({
      id: variant === "INR_340" ? "WH-INR-340-PP-D-4012" : "WH-INJ-2400-PP-D-4018",
      event_type: "CUSTOMER.DISPUTE.CREATED",
      create_time: new Date().toISOString(),
      resource: {
        dispute_id: variant === "INR_340" ? "PP-D-4012" : "PP-D-4018",
        amount: variant === "INR_340" ? "340.00" : "2400.00",
      },
    });
    const created = simulateDisputeWebhook(variant);
    setSelectedDisputeId(created.disputeId);
    setSelectedHopId(variant === "INR_340" ? "HOP_3A_CARRIER" : "HOP_2_ORDER");
    if (uiState === "empty") {
      setUiState("success");
    }
  };

  const handleResolve = async (
    action: "CONTEST_WITH_COMPELLING_EVIDENCE" | "AUTO_ACCEPT_LOW_VALUE_CLAIM"
  ) => {
    if (!activeDispute) return;
    setSubmitting(true);
    try {
      const res = await resolveDispute({
        disputeId: activeDispute.disputeId,
        action,
        carrierTrackingNumber: activeDispute.trackingNumber,
      });
      resolveDisputeCase(activeDispute.disputeId, action);
      setSubmittedIds((prev) => ({
        ...prev,
        [activeDispute.disputeId]: res.paypalRequestId,
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportEvidenceBundle = () => {
    if (!activeDispute) return;
    if (typeof window !== "undefined" && typeof URL.createObjectURL === "function") {
      const bundleJson = JSON.stringify(
        {
          schema: "PayPal-Compelling-Evidence-3.0",
          disputeId: activeDispute.disputeId,
          orderId: activeDispute.orderId,
          disputedAmount: `${activeDispute.disputedAmountValue} ${activeDispute.currencyCode}`,
          carrierProof: {
            carrierCode: activeDispute.carrierCode,
            trackingNumber: activeDispute.trackingNumber,
            trackingStatus: activeDispute.trackingStatus,
          },
          assembledAtIso: new Date().toISOString(),
        },
        null,
        2
      );
      const blob = new Blob([bundleJson], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evidence-package-${activeDispute.disputeId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="mx-auto max-w-[1160px] space-y-8 pb-12 animate-pop-in">
      {/* Editorial Section Header */}
      <header className="flex flex-col justify-between gap-6 border-b border-hairline pb-8 lg:flex-row lg:items-end">
        <div className="max-w-2xl space-y-3">
          <div className="badge-lime px-3 py-1 text-xs">
            <Swords className="h-3.5 w-3.5" />
            <span>Automated Dispute Defense</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink leading-[1.12]">
            Protect revenue from friendly-fraud claims.{" "}
            <span className="font-normal text-ink-muted">
              Automatically match carrier delivery proof, buyer order history, and regional
              shipping receipts in seconds.
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSimulateWebhookClick("INR_340")}
            className="btn-primary-mint h-9 rounded-xl px-4 text-xs font-semibold cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Simulate Delivered Claim ($340)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateWebhookClick("INJECTION_2400")}
            className="btn-outline-subtle h-9 rounded-xl px-3.5 text-xs shadow-2xs transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm cursor-pointer"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-status-warning-text" />
            <span>Simulate High-Value Claim ($2,400)</span>
          </button>
        </div>
      </header>

      {/* Interactive UI States */}
      {uiState === "offline" && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-status-warning-border bg-status-warning-bg px-4 py-2.5 text-xs text-status-warning-text"
        >
          <span className="inline-flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            Offline Mode Active: Displaying cached dispute evidence and carrier verification
            records.
          </span>
          <button
            type="button"
            onClick={() => setUiState("success")}
            className="btn-outline-subtle px-2.5 py-0.5 text-[11px] cursor-pointer"
          >
            Reconnect Live Feed
          </button>
        </div>
      )}

      {uiState === "loading" && (
        <div
          aria-busy="true"
          className="surface-bento rounded-2xl p-5 space-y-3 text-xs text-ink-secondary"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-semibold text-ink">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Verifying carrier delivery status, buyer device history, and seller protection
              eligibility...
            </span>
            <span className="text-xs text-status-success-text font-semibold">
              Response Target &lt; 4.0s
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-subtle overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-chart-invoiced animate-pulse" />
          </div>
        </div>
      )}

      {uiState === "error" && activeDispute && (
        <div
          role="alert"
          className="rounded-xl border border-status-danger-border bg-status-danger-bg p-4 space-y-3 text-xs text-status-danger-text"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Carrier Tracking Timeout ({formatCarrierName(activeDispute.carrierCode)}): Upload a
              delivery receipt scan below to verify manually:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-status-danger-border bg-elevated p-3">
            <UploadCloud className="h-5 w-5 text-ink-secondary shrink-0" />
            <input
              type="text"
              aria-label="Manual Carrier Tracking or POD Reference"
              value={manualTrackingInput}
              onChange={(e) => setManualTrackingInput(e.target.value)}
              className="rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs text-ink"
            />
            <button
              type="button"
              onClick={() =>
                uploadManualCarrierPodOcr(
                  activeDispute.disputeId,
                  activeDispute.carrierCode,
                  manualTrackingInput
                )
              }
              className="btn-primary-mint px-3 py-1.5 text-xs font-semibold cursor-pointer"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload Delivery Receipt</span>
            </button>
          </div>
        </div>
      )}

      {uiState === "empty" || disputes.length === 0 ? (
        <div className="surface-bento rounded-2xl p-10 text-center space-y-3">
          <p className="text-sm text-ink-secondary font-medium">
            All customer disputes have been resolved. Click{" "}
            <strong className="text-ink">Simulate Delivered Claim ($340)</strong> to preview
            automated evidence assembly.
          </p>
          <button
            type="button"
            onClick={() => handleSimulateWebhookClick("INR_340")}
            className="btn-primary-mint px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            <Zap className="h-4 w-4" />
            <span>Simulate Delivered Claim ($340)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left 5 Columns: Active Dispute Queue */}
          <section
            aria-label="Active PayPal Dispute Queue (E-08)"
            className="lg:col-span-5 surface-bento rounded-2xl p-6 space-y-4 animate-pop-in delay-75"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3.5">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-ink">
                  Open Customer Disputes
                </h2>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Select a claim to inspect delivery verification and defense evidence
                </p>
              </div>
              <span className="rounded-pill border border-hairline bg-elevated px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
                {disputes.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {disputes.map((d) => {
                const isSelected = d.disputeId === activeDispute?.disputeId;
                const isHighFraud = d.gnnRiskScore >= 0.7;
                const submittedReqId = submittedIds[d.disputeId];
                const isSubmitted = Boolean(submittedReqId);
                const sla = formatSlaCountdown(d.responseDueIso);
                const dualAmt = formatDualCurrency(
                  d.disputedAmountValue,
                  d.currencyCode,
                  activeCurrency === d.currencyCode ? "INR" : activeCurrency
                );

                return (
                  <div
                    key={d.disputeId}
                    onClick={() => setSelectedDisputeId(d.disputeId)}
                    className={`group rounded-xl border p-4 cursor-pointer transition-all duration-200 ease-out space-y-2.5 ${
                      isSelected
                        ? "border-ink bg-elevated shadow-md -translate-y-[2px]"
                        : "border-hairline bg-elevated/80 hover:border-border-strong hover:bg-elevated hover:-translate-y-[2px] hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-semibold text-ink">{d.disputeId}</span>
                          <span className="text-ink-muted">· Order #{d.orderId}</span>
                        </div>
                        <div className="mt-0.5 text-xs font-medium text-ink-secondary">
                          {formatReasonLabel(d.reasonCode)}
                        </div>
                      </div>
                      <div className="text-right tabular-nums shrink-0">
                        <div className="text-sm font-semibold text-ink">
                          {formatCurrencyAmount(
                            d.disputedAmountValue,
                            d.currencyCode,
                            activeCurrency
                          )}
                        </div>
                        <div className="text-[10.5px] text-ink-muted">{dualAmt.secondary}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-ink-secondary">
                        <Truck className="h-3.5 w-3.5 text-ink-muted" />
                        {formatCarrierName(d.carrierCode)} ·{" "}
                        <span className="font-medium text-ink">
                          {d.trackingStatus === "DELIVERED" ? "Delivered & Signed" : "In Transit"}
                        </span>
                      </span>

                      <span
                        title={`Response Deadlines:\n• ${sla.tooltipTimezones.utc}\n• ${sla.tooltipTimezones.ist}`}
                        className={`inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-[11px] font-medium ${
                          sla.isUrgent
                            ? "border-status-warning-border bg-status-warning-bg text-status-warning-text"
                            : "border-hairline bg-surface text-ink-secondary"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {sla.badgeText}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
                      <span className="text-ink-muted">Recommended Action</span>
                      <span
                        className={`rounded-pill border px-2.5 py-0.5 text-[11px] font-medium ${
                          isSubmitted
                            ? "border-status-success-border bg-status-success-bg text-status-success-text"
                            : isHighFraud
                              ? "border-status-danger-border bg-status-danger-bg text-status-danger-text"
                              : "border-status-success-border bg-status-success-bg text-status-success-text"
                        }`}
                      >
                        {isSubmitted
                          ? "Evidence Submitted ✓"
                          : formatRecommendedAction(d.recommendedAction)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right 7 Columns: Relationship Graph + Evidence Package */}
          {activeDispute && (
            <section
              key={activeDispute.disputeId}
              aria-label="Multi-Hop GNN Fraud Graph and Compelling Evidence Bundle"
              className="lg:col-span-7 surface-bento rounded-2xl p-6 space-y-5 animate-tab-switch"
            >
              {/* Success Stamp when Evidence is Submitted */}
              {submittedIds[activeDispute.disputeId] && (
                <div
                  role="status"
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-status-success-border bg-status-success-bg px-4 py-2.5 text-xs text-status-success-text"
                >
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    Defense Evidence Submitted to PayPal ({activeDispute.disputeId})
                  </span>
                  <span className="rounded-pill bg-elevated border border-status-success-border px-2.5 py-0.5 text-xs font-semibold">
                    +
                    {formatCurrencyAmount(
                      activeDispute.disputedAmountValue,
                      activeDispute.currencyCode,
                      activeCurrency
                    )}{" "}
                    Protected
                  </span>
                </div>
              )}

              {/* 3-Hop Buyer-Order-Carrier Verification Graph */}
              <div className="dot-grid-surface rounded-xl border border-hairline p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-ink-secondary" />
                    <h2 className="text-sm font-semibold tracking-tight text-ink">
                      Buyer, Order &amp; Carrier Verification Graph
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowGraphTextSummary((v) => !v)}
                      aria-pressed={showGraphTextSummary}
                      className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-elevated px-2.5 py-1 text-xs font-medium text-ink-secondary shadow-2xs transition-colors hover:border-border-strong hover:text-ink cursor-pointer"
                    >
                      <Table className="h-3 w-3" />
                      {showGraphTextSummary ? "Show Diagram" : "Text Summary"}
                    </button>
                    <span className="rounded-pill border border-status-danger-border bg-status-danger-bg px-2.5 py-0.5 text-xs font-semibold text-status-danger-text tabular-nums">
                      Fraud Confidence: {Math.round(activeDispute.gnnRiskScore * 100)}%
                    </span>
                  </div>
                </div>

                {showGraphTextSummary ? (
                  <div
                    role="region"
                    aria-label="Accessible Text Summary of 3-Hop GNN Fraud Graph"
                    className="rounded-xl border border-hairline bg-elevated p-4 text-xs text-ink-secondary space-y-2 shadow-2xs"
                  >
                    <div>
                      • <strong className="text-ink">1. Verified Buyer Profile:</strong> Returning
                      customer linked to Order #{activeDispute.orderId}
                    </div>
                    <div>
                      • <strong className="text-ink">2. Carrier Delivery Proof:</strong>{" "}
                      {formatCarrierName(activeDispute.carrierCode)} tracking #
                      {activeDispute.trackingNumber} is{" "}
                      <span className="text-status-success-text font-semibold">
                        {activeDispute.trackingStatus === "DELIVERED"
                          ? "Delivered & Signed"
                          : "In Transit"}
                      </span>
                    </div>
                    <div>
                      • <strong className="text-ink">3. Cross-Merchant Claim History:</strong>{" "}
                      Shared device fingerprint detected across 3 non-receipt claims in the past 90
                      days.
                    </div>
                  </div>
                ) : (
                  /* Interactive SVG 3-Hop Graph Topology — Preserves exact aria-label for Playwright E2E */
                  <svg
                    viewBox="0 0 680 120"
                    className="w-full h-28 rounded-xl bg-elevated border border-hairline shadow-2xs"
                    role="img"
                    aria-label="3-Hop Buyer Device Carrier Fraud Graph"
                  >
                    {/* Edges */}
                    <line
                      x1="135"
                      y1="60"
                      x2="270"
                      y2="60"
                      stroke="#64748B"
                      strokeWidth="1.75"
                      strokeDasharray="4 2"
                    />
                    <line x1="405" y1="60" x2="515" y2="33" stroke="#10B981" strokeWidth="1.75" />
                    <line x1="405" y1="60" x2="515" y2="87" stroke="#EF4444" strokeWidth="1.75" />

                    {/* Hop 1: Buyer Profile */}
                    <g
                      role="button"
                      tabIndex={0}
                      aria-label="Inspect Hop 1 Buyer Identity node"
                      onClick={() => setSelectedHopId("HOP_1_BUYER")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedHopId("HOP_1_BUYER");
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <rect
                        x="15"
                        y="34"
                        width="120"
                        height="52"
                        rx="8"
                        fill="#F8FAFC"
                        stroke={selectedHopId === "HOP_1_BUYER" ? "#0F172A" : "#CBD5E1"}
                        strokeWidth={selectedHopId === "HOP_1_BUYER" ? "2.5" : "1.2"}
                      />
                      <text
                        x="75"
                        y="55"
                        textAnchor="middle"
                        fill="#0F172A"
                        fontSize="10.5"
                        fontFamily="var(--font-sans), sans-serif"
                        fontWeight="600"
                      >
                        Buyer Profile
                      </text>
                      <text
                        x="75"
                        y="72"
                        textAnchor="middle"
                        fill="#475569"
                        fontSize="9.5"
                        fontFamily="var(--font-sans), sans-serif"
                      >
                        Verified Account
                      </text>
                    </g>

                    {/* Hop 2: Order & Checkout Device */}
                    <g
                      role="button"
                      tabIndex={0}
                      aria-label="Inspect Hop 2 PayPal Order and Device Fingerprint node"
                      onClick={() => setSelectedHopId("HOP_2_ORDER")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedHopId("HOP_2_ORDER");
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <rect
                        x="270"
                        y="34"
                        width="135"
                        height="52"
                        rx="8"
                        fill="#EFF6FF"
                        stroke={selectedHopId === "HOP_2_ORDER" ? "#1E40AF" : "#BFDBFE"}
                        strokeWidth={selectedHopId === "HOP_2_ORDER" ? "2.5" : "1.2"}
                      />
                      <text
                        x="337"
                        y="55"
                        textAnchor="middle"
                        fill="#0F172A"
                        fontSize="10.5"
                        fontFamily="var(--font-sans), sans-serif"
                        fontWeight="600"
                      >
                        Order #{activeDispute.orderId}
                      </text>
                      <text
                        x="337"
                        y="72"
                        textAnchor="middle"
                        fill="#1E40AF"
                        fontSize="9.5"
                        fontFamily="var(--font-sans), sans-serif"
                        fontWeight="500"
                      >
                        ${activeDispute.disputedAmountValue} {activeDispute.currencyCode}
                      </text>
                    </g>

                    {/* Hop 3A: Carrier Signed POD */}
                    <g
                      role="button"
                      tabIndex={0}
                      aria-label="Inspect Hop 3A Carrier Signed Proof of Delivery node"
                      onClick={() => setSelectedHopId("HOP_3A_CARRIER")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedHopId("HOP_3A_CARRIER");
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <rect
                        x="515"
                        y="12"
                        width="150"
                        height="42"
                        rx="6"
                        fill="#ECFDF5"
                        stroke={selectedHopId === "HOP_3A_CARRIER" ? "#065F46" : "#A7F3D0"}
                        strokeWidth={selectedHopId === "HOP_3A_CARRIER" ? "2.5" : "1.2"}
                      />
                      <text
                        x="590"
                        y="30"
                        textAnchor="middle"
                        fill="#065F46"
                        fontSize="10"
                        fontFamily="var(--font-sans), sans-serif"
                        fontWeight="600"
                      >
                        {formatCarrierName(activeDispute.carrierCode)}: Delivered
                      </text>
                      <text
                        x="590"
                        y="44"
                        textAnchor="middle"
                        fill="#047857"
                        fontSize="9"
                        fontFamily="var(--font-sans), sans-serif"
                      >
                        Signed Receipt Verified
                      </text>
                    </g>

                    {/* Hop 3B: Cross-Merchant Ring */}
                    <g
                      role="button"
                      tabIndex={0}
                      aria-label="Inspect Hop 3B Cross-Merchant Collusion Ring node"
                      onClick={() => setSelectedHopId("HOP_3B_RING")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedHopId("HOP_3B_RING");
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <rect
                        x="515"
                        y="66"
                        width="150"
                        height="42"
                        rx="6"
                        fill="#FEF2F2"
                        stroke={selectedHopId === "HOP_3B_RING" ? "#991B1B" : "#FECACA"}
                        strokeWidth={selectedHopId === "HOP_3B_RING" ? "2.5" : "1.2"}
                      />
                      <text
                        x="590"
                        y="84"
                        textAnchor="middle"
                        fill="#991B1B"
                        fontSize="10"
                        fontFamily="var(--font-sans), sans-serif"
                        fontWeight="600"
                      >
                        Repeat Claim Pattern
                      </text>
                      <text
                        x="590"
                        y="98"
                        textAnchor="middle"
                        fill="#B91C1C"
                        fontSize="9"
                        fontFamily="var(--font-sans), sans-serif"
                      >
                        3 Claims in 90 Days
                      </text>
                    </g>
                  </svg>
                )}

                {/* Hop Node Inspector Selector & Readable Summary Card */}
                {hopTelemetryMap && activeHopTelemetry && (
                  <div
                    key={selectedHopId}
                    className="animate-tab-switch rounded-xl border border-hairline bg-elevated p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(
                          [
                            ["HOP_1_BUYER", "1. Buyer Profile"],
                            ["HOP_2_ORDER", "2. Order & Device"],
                            ["HOP_3A_CARRIER", "3A. Carrier Delivery"],
                            ["HOP_3B_RING", "3B. Claim History"],
                          ] as Array<[M04GraphNodeId, string]>
                        ).map(([nodeId, label]) => (
                          <button
                            key={nodeId}
                            type="button"
                            onClick={() => setSelectedHopId(nodeId)}
                            className={`rounded-lg border px-3 py-1 text-xs transition-all duration-150 cursor-pointer ${
                              selectedHopId === nodeId
                                ? "border-accent-dark bg-accent-dark text-accent-dark-ink font-semibold shadow-2xs"
                                : "border-hairline bg-surface text-ink-secondary hover:border-border-strong hover:text-ink"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-ink-secondary">
                        <Sparkles className="h-3.5 w-3.5" />
                        Signal Impact:{" "}
                        <strong className="font-semibold text-ink">
                          {activeHopTelemetry.shapDelta}
                        </strong>
                      </span>
                    </div>

                    <div className="border-t border-border-subtle pt-3 text-xs space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-ink">
                          {activeHopTelemetry.title.replace("_", " ")}
                        </span>
                        <span className="rounded-pill border border-status-success-border bg-status-success-bg px-2.5 py-0.5 text-xs font-medium text-status-success-text">
                          {formatHopBadge(activeHopTelemetry.verdictBadge)}
                        </span>
                      </div>
                      <ul className="space-y-1 text-ink-secondary text-xs pt-0.5">
                        {activeHopTelemetry.telemetryBullets.map((bullet) => (
                          <li key={bullet}>• {bullet}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Readable Risk Factor Cards */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-ink">
                    Key Evidence &amp; Risk Signals
                  </div>
                  {activeDispute.treeShapReasons.map((reason) => {
                    const formatted = formatShapReason(reason);
                    return (
                      <div
                        key={reason}
                        className="surface-card flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl px-4 py-3 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-ink">{formatted.title}</div>
                          <div className="text-[11px] text-ink-muted mt-0.5">
                            {formatted.description}
                          </div>
                        </div>
                        <span className="shrink-0 rounded-pill bg-surface px-2.5 py-1 text-xs font-medium text-ink border border-hairline">
                          {formatted.impact}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Compiled Defense Brief & Regional Carrier Receipt Translation */}
              <div className="surface-card rounded-xl p-5 space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
                  <span className="font-semibold text-ink flex items-center gap-1.5 text-sm">
                    <FileCheck className="h-4 w-4 text-status-success-bar" />
                    Seller Protection Defense Package (Ready to Submit)
                  </span>
                  <span className="rounded-pill border border-status-success-border bg-status-success-bg px-2.5 py-0.5 text-xs font-medium text-status-success-text">
                    Complete Proof Assembled
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border-subtle bg-surface/70 p-3 space-y-1">
                    <div className="text-[11px] text-ink-muted">Order &amp; Payment Receipt</div>
                    <div className="text-xs font-semibold text-ink">
                      Order #{activeDispute.orderId} ({activeDispute.disputedAmountValue}{" "}
                      {activeDispute.currencyCode})
                    </div>
                    <div className="text-[11px] text-ink-secondary">
                      Checkout address matches delivery destination
                    </div>
                  </div>

                  <div className="rounded-lg border border-border-subtle bg-surface/70 p-3 space-y-1">
                    <div className="text-[11px] text-ink-muted">Carrier Delivery Proof</div>
                    <div className="text-xs font-semibold text-ink">
                      {formatCarrierName(activeDispute.carrierCode)} #{activeDispute.trackingNumber}
                    </div>
                    <div className="text-[11px] text-status-success-text font-medium">
                      Delivered &amp; Signed by Recipient (96.4% Match)
                    </div>
                  </div>
                </div>

                {/* Regional Carrier Receipt Translation Card */}
                <div className="rounded-xl border border-hairline bg-surface p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                      <Languages className="h-4 w-4 text-ink-secondary" />
                      Regional Carrier Receipt Translation (Hindi &rarr; English)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowBhashiniOcrInspector((v) => !v)}
                      className="rounded-lg border border-hairline bg-elevated px-2.5 py-1 text-xs font-medium text-ink-secondary hover:text-ink cursor-pointer"
                    >
                      {showBhashiniOcrInspector ? "Hide Receipt" : "Show Receipt"}
                    </button>
                  </div>

                  {showBhashiniOcrInspector && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg border border-hairline bg-elevated p-3.5 text-ink-secondary shadow-2xs space-y-1">
                        <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted mb-1">
                          Original Regional Carrier Scan (Hindi)
                        </div>
                        <div>
                          वाहक: {formatCarrierName(activeDispute.carrierCode)} · ट्रैकिंग #
                          {activeDispute.trackingNumber}
                        </div>
                        <div>स्थिति: वितरित (सफल डिलीवरी · हस्ताक्षर सत्यापित)</div>
                        <div>पिन कोड: 560001 (बेंगलुरु) · दिनांक: 2026-11-08</div>
                      </div>

                      <div className="rounded-lg border border-status-success-border bg-status-success-bg/60 p-3.5 text-status-success-text shadow-2xs space-y-1">
                        <div className="text-[10.5px] font-semibold uppercase tracking-wide mb-1">
                          Translated &amp; Verified English Summary
                        </div>
                        <div>
                          <strong>Delivery Status:</strong> Delivered to Recipient
                        </div>
                        <div>
                          <strong>Signature Check:</strong> Verified Recipient Signature (96.4%)
                        </div>
                        <div>
                          <strong>Postal Code Match:</strong> 560001 Bengaluru (Matches Order)
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border-subtle">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleResolve("CONTEST_WITH_COMPELLING_EVIDENCE")}
                      className="btn-primary-mint h-9 rounded-xl px-4 text-xs font-semibold cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        {submitting ? "Submitting Defense..." : "Submit Evidence to PayPal"}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleResolve("AUTO_ACCEPT_LOW_VALUE_CLAIM")}
                      className="btn-outline-subtle h-9 rounded-xl px-3.5 text-xs cursor-pointer"
                    >
                      <span>Accept Low-Value Claim (&le;$25)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportEvidenceBundle}
                      className="btn-secondary-dark h-9 rounded-xl px-3.5 text-xs cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Evidence Brief</span>
                    </button>
                  </div>

                  {activeDispute.recommendedAction === "ROUTE_TO_HITL_PASSKEY" && (
                    <button
                      type="button"
                      onClick={() => openHitlApproval(executions[0] ?? null)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-status-warning-border bg-status-warning-bg px-3.5 text-xs font-semibold text-status-warning-text cursor-pointer"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Review Passkey Hold</span>
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
