"use client";

/**
 * PayOps AI (PayPal Sentinel) — Screen 4: Autonomous Dispute Defense War-Room & Multi-Hop GNN Graph
 * Maps to: F-04 (Dispute Defense), F-10 (M-04 GraphSAGE + LightGBM ONNX), M-03 (Vision OCR),
 * M-05 (Elastic Hybrid RAG), US-07, US-08, US-09, API-10, API-11, API-13
 * Write Owner: Dev 2 (100%)
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
} from "lucide-react";
import { resolveDispute } from "../../../lib/api-client";
import {
  formatCurrencyAmount,
  formatDualCurrency,
  formatSlaCountdown,
} from "../../../lib/formatters";
import { useCockpitStore } from "../../../stores/useCockpitStore";

export default function DisputeWarRoomPage() {
  const {
    disputes,
    activeCurrency,
    simulateDisputeWebhook,
    resolveDisputeCase,
    openHitlApproval,
    executions,
  } = useCockpitStore();

  const [selectedDisputeId, setSelectedDisputeId] = useState<string>(
    disputes[0]?.disputeId ?? "PP-D-90412"
  );
  const [submitting, setSubmitting] = useState(false);
  const [submittedIds, setSubmittedIds] = useState<Record<string, boolean>>({});
  const [showGraphTextSummary, setShowGraphTextSummary] = useState(false);
  const [showBhashiniOcrInspector, setShowBhashiniOcrInspector] = useState(true);

  const activeDispute =
    disputes.find((d) => d.disputeId === selectedDisputeId) ?? disputes[0];

  const handleResolve = async (
    action: "CONTEST_WITH_COMPELLING_EVIDENCE" | "AUTO_ACCEPT_LOW_VALUE_CLAIM"
  ) => {
    if (!activeDispute) return;
    setSubmitting(true);
    try {
      await resolveDispute({
        disputeId: activeDispute.disputeId,
        action,
        carrierTrackingNumber: activeDispute.trackingNumber,
      });
      resolveDisputeCase(activeDispute.disputeId, action);
      setSubmittedIds((prev) => ({ ...prev, [activeDispute.disputeId]: true }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1750px] space-y-4">
      {/* Top War-Room Header & Webhook Simulator CTA */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/90 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Swords className="h-5 w-5 text-sky-400" />
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-white">
              Screen 4: Autonomous Dispute Defense War-Room &amp; Multi-Hop GNN Risk Graph (F-04 · F-10)
            </h1>
            <p className="text-[11px] font-mono text-slate-400">
              Correlates get_dispute + get_shipment_tracking + M-03 Gemini Vision OCR + M-04 GraphSAGE ONNX (&lt;18ms) + M-05 Elastic RAG
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const created = simulateDisputeWebhook("INR_340");
              setSelectedDisputeId(created.disputeId);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow cursor-pointer"
          >
            <Zap className="h-4 w-4" />
            Simulate INR Webhook ⚡ ($340 · DHL DELIVERED)
          </button>

          <button
            type="button"
            onClick={() => {
              const created = simulateDisputeWebhook("INJECTION_2400");
              setSelectedDisputeId(created.disputeId);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/60 bg-amber-950/60 hover:bg-amber-900/70 px-3.5 py-2 text-xs font-bold text-amber-200 cursor-pointer"
          >
            <ShieldAlert className="h-4 w-4" />
            Simulate Prompt-Injection Dispute ($2,400)
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 5 Columns: Active Dispute Queue (E-08) */}
        <section
          aria-label="Active PayPal Dispute Queue (E-08)"
          className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Active Dispute Queue (E-08 · API-10)
            </h2>
            <span className="font-mono text-[11px] text-sky-400">
              {disputes.length} Cases Loaded
            </span>
          </div>

          <div className="space-y-2.5">
            {disputes.map((d) => {
              const isSelected = d.disputeId === activeDispute?.disputeId;
              const isHighFraud = d.gnnRiskScore >= 0.7;
              const isSubmitted = Boolean(submittedIds[d.disputeId]);
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
                  className={`rounded-lg border p-3.5 cursor-pointer transition space-y-2 ${
                    isSelected
                      ? "border-sky-500 bg-sky-950/40"
                      : "border-slate-800 bg-slate-950/70 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-white">
                      [{d.disputeId}] · Order {d.orderId}
                    </span>
                    <div className="text-right financial-figure">
                      <div className="font-bold text-emerald-400">
                        {formatCurrencyAmount(d.disputedAmountValue, d.currencyCode, activeCurrency)}
                      </div>
                      <div className="text-[10px] text-slate-400">{dualAmt.secondary}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                    <span className="text-slate-300">{d.reasonCode}</span>
                    <span
                      title={`SLA Multi-Timezone Deadlines:\n• ${sla.tooltipTimezones.utc}\n• ${sla.tooltipTimezones.ist}\n• ${sla.tooltipTimezones.cst}\n• ${sla.tooltipTimezones.gmt}`}
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
                        sla.isUrgent
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      SLA: {sla.badgeText} ({d.responseDueIso.slice(0, 10)})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 font-mono text-[11px]">
                    <span className="inline-flex items-center gap-1 text-sky-300">
                      <Truck className="h-3.5 w-3.5" />
                      {d.carrierCode} #{d.trackingNumber} ({d.trackingStatus})
                    </span>

                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        isSubmitted
                          ? "bg-emerald-500/25 text-emerald-200"
                          : isHighFraud
                            ? "bg-red-500/20 text-red-300"
                            : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {isSubmitted
                        ? "EVIDENCE_SUBMITTED ✓"
                        : `GNN: ${d.gnnRiskScore.toFixed(2)} · ${d.recommendedAction}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right 7 Columns: 3-Hop GNN Graph + M-03 OCR + M-05 Elastic RAG + Compelling Evidence 3.0 */}
        {activeDispute && (
          <section
            aria-label="Multi-Hop GNN Fraud Graph and Compelling Evidence Bundle"
            className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4"
          >
            {/* 3-Hop Buyer-Seller-Carrier Network Graph Visualizer (M-04, US-08) */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-purple-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                    M-04 3-Hop Buyer–Device–Carrier Risk Graph (payops-graphsage-lgbm-v1.2.onnx · 9.2ms)
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGraphTextSummary((v) => !v)}
                    aria-pressed={showGraphTextSummary}
                    className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-200 hover:border-sky-500 cursor-pointer"
                  >
                    <Table className="h-3 w-3 text-sky-400" />
                    {showGraphTextSummary ? "Show SVG Topology" : "Accessible Summary (WCAG 1.1.1)"}
                  </button>
                  <span className="rounded border border-red-500/50 bg-red-500/20 px-2.5 py-0.5 font-mono text-xs font-bold text-red-300 financial-figure">
                    GNN Risk Score: {activeDispute.gnnRiskScore.toFixed(2)}
                  </span>
                </div>
              </div>

              {showGraphTextSummary ? (
                <div
                  role="region"
                  aria-label="Accessible Text Summary of 3-Hop GNN Fraud Graph"
                  className="rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-slate-200 space-y-1.5"
                >
                  <div>
                    • <strong>Hop 1 (Buyer Identity HMAC):</strong> 9f2a88c1..bc11 linked to Order #{activeDispute.orderId}
                  </div>
                  <div>
                    • <strong>Hop 2 (Carrier Verification):</strong> {activeDispute.carrierCode} #{activeDispute.trackingNumber} status is{" "}
                    <span className="text-emerald-300 font-bold">{activeDispute.trackingStatus}</span>
                  </div>
                  <div>
                    • <strong>Hop 3 (Cross-Merchant Ring):</strong> Shared Device/IP ASN correlated with 3 prior INR claims in 90 days (GNN Score: {activeDispute.gnnRiskScore.toFixed(2)})
                  </div>
                </div>
              ) : (
                /* SVG 3-Hop Graph Topology */
                <svg
                  viewBox="0 0 680 120"
                  className="w-full h-28 rounded-lg bg-slate-900/90 border border-slate-800/80"
                  role="img"
                  aria-label="3-Hop Buyer Device Carrier Fraud Graph"
                >
                  {/* Edges */}
                  <line x1="125" y1="60" x2="290" y2="60" stroke="#38BDF8" strokeWidth="2" strokeDasharray="4 2" />
                  <line x1="390" y1="60" x2="545" y2="35" stroke="#10B981" strokeWidth="2" />
                  <line x1="390" y1="60" x2="545" y2="88" stroke="#EF4444" strokeWidth="2" />

                  {/* Hop 1: Buyer Hash Node */}
                  <rect x="15" y="34" width="110" height="52" rx="8" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
                  <text x="70" y="55" textAnchor="middle" fill="#E2E8F0" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    Buyer HMAC
                  </text>
                  <text x="70" y="72" textAnchor="middle" fill="#38BDF8" fontSize="9" fontFamily="monospace">
                    9f2a88c1..bc11
                  </text>

                  {/* Hop 2: Order & Device Fingerprint */}
                  <rect x="275" y="34" width="125" height="52" rx="8" fill="#0F172A" stroke="#A855F7" strokeWidth="1.5" />
                  <text x="337" y="55" textAnchor="middle" fill="#E2E8F0" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    Order #{activeDispute.orderId}
                  </text>
                  <text x="337" y="72" textAnchor="middle" fill="#C084FC" fontSize="9" fontFamily="monospace">
                    ${activeDispute.disputedAmountValue} {activeDispute.currencyCode}
                  </text>

                  {/* Hop 3A: Carrier Signed POD */}
                  <rect x="520" y="12" width="145" height="42" rx="6" fill="#064E3B" stroke="#10B981" strokeWidth="1.5" />
                  <text x="592" y="30" textAnchor="middle" fill="#A7F3D0" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    {activeDispute.carrierCode}: {activeDispute.trackingStatus}
                  </text>
                  <text x="592" y="44" textAnchor="middle" fill="#6EE7B7" fontSize="8.5" fontFamily="monospace">
                    #{activeDispute.trackingNumber} (Signed)
                  </text>

                  {/* Hop 3B: Cross-Merchant Ring */}
                  <rect x="520" y="66" width="145" height="42" rx="6" fill="#450A0A" stroke="#EF4444" strokeWidth="1.5" />
                  <text x="592" y="84" textAnchor="middle" fill="#FECACA" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    Shared Device / IP Ring
                  </text>
                  <text x="592" y="98" textAnchor="middle" fill="#FCA5A5" fontSize="8.5" fontFamily="monospace">
                    3 Prior INR Claims (90d)
                  </text>
                </svg>
              )}

              {/* TreeSHAP Feature Attribution Bars */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono uppercase text-slate-400">
                  TreeSHAP Reason Code Attributions (US-08):
                </div>
                {activeDispute.treeShapReasons.map((reason) => (
                  <div
                    key={reason}
                    className="flex items-center justify-between rounded border border-slate-800 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-200"
                  >
                    <span>{reason}</span>
                    <span className="text-sky-400 text-[11px]">SHAP Verified</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compiled Compelling Evidence 3.0 Packet (M-03 OCR + M-05 Elastic RAG) */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4" />
                  Compiled Compelling Evidence 3.0 Defense Bundle (Assembled in 3.1s)
                </span>
                <span className="font-mono text-[11px] text-emerald-300">
                  M-03 Vision OCR + M-05 Elastic RRF
                </span>
              </div>

              <ul className="space-y-1.5 font-mono text-[11px] text-slate-200">
                <li>
                  • <strong>PayPal Order v2 Capture Receipt:</strong> Order{" "}
                  {activeDispute.orderId} ({activeDispute.disputedAmountValue}{" "}
                  {activeDispute.currencyCode})
                </li>
                <li>
                  • <strong>Carrier Tracking Sync (`get_shipment_tracking` #29):</strong>{" "}
                  {activeDispute.carrierCode} #{activeDispute.trackingNumber} — Status:{" "}
                  <span className="text-emerald-300 font-bold">{activeDispute.trackingStatus}</span>
                </li>
                <li>
                  • <strong>M-03 Gemini 1.5 Pro Vision OCR:</strong> Extracted buyer signature &amp;
                  matching delivery postal code (`F1 = 96.4%`).
                </li>
                <li>
                  • <strong>M-05 Elastic Hybrid RAG Policy Citation:</strong> PayPal Seller
                  Protection Compelling Evidence Clause 4.2 (Signed Carrier POD + IP Geo Match).
                </li>
              </ul>

              {/* M-03 Bhashini / IndicTrans2 Regional Carrier POD OCR Translation Inspector (LOCALIZATION.md Section 4.2) */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-sky-300">
                    <Languages className="h-3.5 w-3.5" />
                    M-03 Bhashini / IndicTrans2 Regional Carrier POD OCR Normalizer
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowBhashiniOcrInspector((v) => !v)}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300 hover:text-white cursor-pointer"
                  >
                    {showBhashiniOcrInspector ? "Hide Regional POD" : "Inspect Regional POD"}
                  </button>
                </div>

                {showBhashiniOcrInspector && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono text-[11px]">
                    <div className="rounded border border-slate-800 bg-slate-900/80 p-2.5 text-slate-300">
                      <div className="text-[10px] uppercase text-amber-300 mb-1">
                        Raw Carrier Receipt Scan (Hindi / Regional POD)
                      </div>
                      <div>वाहक: {activeDispute.carrierCode} · ट्रैकिंग #{activeDispute.trackingNumber}</div>
                      <div>स्थिति: वितरित (सफल डिलीवरी · हस्ताक्षर सत्यापित)</div>
                      <div>पिन कोड: 560001 (बेंगलुरु) · दिनांक: 2026-11-08</div>
                    </div>

                    <div className="rounded border border-emerald-500/30 bg-emerald-950/30 p-2.5 text-emerald-200">
                      <div className="text-[10px] uppercase text-emerald-400 mb-1">
                        Normalized PayPal Compelling Evidence 3.0 JSON
                      </div>
                      <div>tracking_status: &quot;{activeDispute.trackingStatus}&quot;</div>
                      <div>recipient_signature_verified: true (F1=96.4%)</div>
                      <div>delivery_postal_match: &quot;560001 == Order Shipping Address&quot;</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons (API-11) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleResolve("CONTEST_WITH_COMPELLING_EVIDENCE")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {submitting
                      ? "Submitting Evidence to PayPal Sandbox..."
                      : "Submit Compelling Evidence to PayPal Sandbox (API-11)"}
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleResolve("AUTO_ACCEPT_LOW_VALUE_CLAIM")}
                    className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-mono text-slate-200 cursor-pointer"
                  >
                    Auto-Accept Claim (&le;$25 VIP · accept_dispute_claim)
                  </button>
                </div>

                {activeDispute.recommendedAction === "ROUTE_TO_HITL_PASSKEY" && (
                  <button
                    type="button"
                    onClick={() => openHitlApproval(executions[0] ?? null)}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 border border-amber-500/50 px-3 py-2 text-xs font-semibold text-amber-200 cursor-pointer"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Inspect Held Passkey Gate
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
