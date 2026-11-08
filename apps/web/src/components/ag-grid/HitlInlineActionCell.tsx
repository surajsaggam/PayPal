"use client";

/**
 * PayOps AI (PayPal Sentinel) — AG Grid Custom Cell Renderer: Inline HITL & SDK Actions
 * Maps to: API-02 (Passkey Approval), US-03, US-14 (APIMatic SDK Export), US-04 (QR Modal)
 * Write Owner: Dev 2 (100%)
 */

import React, { memo } from "react";
import { KeyRound, Code2, QrCode, RotateCcw } from "lucide-react";
import type { AgentToolExecution } from "@payops/shared";
import { refundOrder } from "../../lib/api-client";
import { useCockpitStore } from "../../stores/useCockpitStore";

interface HitlInlineActionCellProps {
  row: AgentToolExecution;
}

export const HitlInlineActionCell = memo(function HitlInlineActionCell({
  row,
}: HitlInlineActionCellProps) {
  const {
    openHitlApproval,
    openApimaticDrawer,
    openQrModal,
    invoices,
    prependExecution,
    setStatusBanner,
  } = useCockpitStore();

  const isHeld =
    row.policyVerdict === "HELD_FOR_L2_PASSKEY" ||
    row.policyVerdict === "BLOCKED_SECURITY_INJECTION";

  const isInvoiceTool =
    row.toolName.includes("invoice") || row.toolName === "generate_invoice_qr_code";

  const isOrderCaptureTool =
    row.toolName === "pay_order" ||
    row.toolName === "create_order" ||
    row.toolName === "create_shipment_tracking";

  const handleInlineRefund = async () => {
    const res = await refundOrder(
      row.executionId,
      row.workspaceId,
      row.amountValue ?? "200.00",
      row.currencyCode ?? "USD"
    );
    const refundExec: AgentToolExecution = {
      executionId: `ex_${Math.floor(9800 + Math.random() * 199)}`,
      sessionId: row.sessionId,
      workspaceId: row.workspaceId,
      toolName: "create_refund",
      paypalRequestId: res.paypalRequestId,
      junodbLeaseStatus: "ACQUIRED",
      policyVerdict: res.policyVerdict,
      reasonCode: res.reasonCode,
      gnnRiskScore: res.policyVerdict === "HELD_FOR_L2_PASSKEY" ? 0.78 : 0.08,
      amountValue: row.amountValue ?? "200.00",
      currencyCode: row.currencyCode ?? "USD",
      executedAt: new Date().toISOString(),
    };
    prependExecution(refundExec);
    if (res.policyVerdict === "HELD_FOR_L2_PASSKEY") {
      openHitlApproval(refundExec);
    } else {
      setStatusBanner(
        `API-09 Inline Refund (${refundExec.amountValue} ${refundExec.currencyCode}) executed via create_refund -> ${res.policyVerdict}`
      );
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {isHeld && (
        <button
          type="button"
          onClick={() => openHitlApproval(row)}
          className="inline-flex items-center gap-1 rounded bg-amber-500/25 border border-amber-500/60 hover:bg-amber-500/40 px-2 py-0.5 text-[11px] font-semibold text-amber-200 transition cursor-pointer"
        >
          <KeyRound className="h-3 w-3" />
          Approve / Reject
        </button>
      )}

      {isInvoiceTool && (
        <button
          type="button"
          onClick={() => openQrModal(invoices[0] ?? null)}
          className="inline-flex items-center gap-1 rounded border border-sky-600/50 bg-sky-950/60 hover:bg-sky-900/60 px-2 py-0.5 text-[11px] font-mono text-sky-300 transition cursor-pointer"
        >
          <QrCode className="h-3 w-3" />
          QR
        </button>
      )}

      {isOrderCaptureTool && (
        <button
          type="button"
          onClick={() => void handleInlineRefund()}
          className="inline-flex items-center gap-1 rounded border border-purple-600/50 bg-purple-950/60 hover:bg-purple-900/60 px-2 py-0.5 text-[11px] font-mono text-purple-200 transition cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          Refund
        </button>
      )}

      <button
        type="button"
        onClick={() => openApimaticDrawer(row)}
        className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800/90 hover:border-emerald-500/60 px-2 py-0.5 text-[11px] font-mono text-emerald-300 transition cursor-pointer"
      >
        <Code2 className="h-3 w-3" />
        APIMatic SDK
      </button>
    </div>
  );
});
