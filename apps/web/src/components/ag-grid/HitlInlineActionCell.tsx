"use client";

/**
 * PayOps AI (PayPal Sentinel) — AG Grid Custom Cell Renderer: Inline HITL & SDK Actions
 * Modern tactile action pills with smooth hover lift and color transitions.
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
    <div className="flex items-center justify-end gap-1.5">
      {isHeld && (
        <button
          type="button"
          title="Approve or Reject via L2 FIDO2 WebAuthn Passkey"
          onClick={(e) => {
            e.stopPropagation();
            openHitlApproval(row);
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-status-warning-border bg-status-warning-bg px-2.5 py-1 text-[11px] font-semibold text-status-warning-text shadow-2xs transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.96] cursor-pointer"
        >
          <KeyRound className="h-3 w-3 shrink-0" />
          <span>Approve / Reject</span>
        </button>
      )}

      {isInvoiceTool && (
        <button
          type="button"
          title="Open Fastlane Smart QR Modal"
          onClick={(e) => {
            e.stopPropagation();
            openQrModal(invoices[0] ?? null);
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-status-info-border bg-status-info-bg px-2.5 py-1 text-[11px] font-medium text-status-info-text shadow-2xs transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.96] cursor-pointer"
        >
          <QrCode className="h-3 w-3 shrink-0" />
          <span>QR</span>
        </button>
      )}

      {isOrderCaptureTool && (
        <button
          type="button"
          title="Trigger API-09 Refund via create_refund"
          onClick={(e) => {
            e.stopPropagation();
            void handleInlineRefund();
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-elevated px-2.5 py-1 text-[11px] font-medium text-ink-secondary shadow-2xs transition-all duration-200 hover:-translate-y-[1px] hover:border-border-strong hover:bg-surface hover:text-ink hover:shadow-sm active:scale-[0.96] cursor-pointer"
        >
          <RotateCcw className="h-3 w-3 shrink-0" />
          <span>Refund</span>
        </button>
      )}

      <button
        type="button"
        title="Inspect APIMatic TypeScript & Python SDK Code (US-14)"
        onClick={(e) => {
          e.stopPropagation();
          openApimaticDrawer(row);
        }}
        className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-elevated px-2.5 py-1 font-mono text-[11px] font-medium text-ink-secondary shadow-2xs transition-all duration-200 hover:-translate-y-[1px] hover:border-accent-dark hover:bg-accent-dark hover:text-accent-dark-ink hover:shadow-sm active:scale-[0.96] cursor-pointer"
      >
        <Code2 className="h-3 w-3 shrink-0" />
        <span>SDK</span>
      </button>
    </div>
  );
});
