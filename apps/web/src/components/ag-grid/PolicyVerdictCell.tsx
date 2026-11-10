"use client";

/**
 * PayOps AI (PayPal Sentinel) — AG Grid Custom Cell Renderer: Policy Verdict Badge
 * Crisp single-line semantic pill badge with subtle row-hover elevation.
 */

import React, { memo } from "react";
import { ShieldCheck, ShieldAlert, AlertOctagon } from "lucide-react";
import type { AgentToolExecution } from "@payops/shared";

interface PolicyVerdictCellProps {
  row: AgentToolExecution;
}

export const PolicyVerdictCell = memo(function PolicyVerdictCell({ row }: PolicyVerdictCellProps) {
  if (row.policyVerdict === "APPROVED_L3_AUTO") {
    return (
      <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border border-status-success-border bg-status-success-bg px-2.5 py-0.5 font-mono text-[11px] font-medium text-status-success-text transition-all duration-200 group-hover:shadow-2xs">
        <ShieldCheck className="h-3 w-3 shrink-0" />
        <span>Auto-Approved</span>
      </div>
    );
  }

  if (row.policyVerdict === "HELD_FOR_L2_PASSKEY") {
    return (
      <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border border-status-warning-border bg-status-warning-bg px-2.5 py-0.5 font-mono text-[11px] font-medium text-status-warning-text transition-all duration-200 group-hover:shadow-2xs">
        <ShieldAlert className="h-3 w-3 shrink-0" />
        <span>Passkey Hold</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border border-status-danger-border bg-status-danger-bg px-2.5 py-0.5 font-mono text-[11px] font-medium text-status-danger-text transition-all duration-200 group-hover:shadow-2xs">
      <AlertOctagon className="h-3 w-3 shrink-0" />
      <span>Blocked</span>
    </div>
  );
});

