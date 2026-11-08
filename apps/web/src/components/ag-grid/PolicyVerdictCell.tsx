"use client";

/**
 * PayOps AI (PayPal Sentinel) — AG Grid Custom Cell Renderer: Policy Verdict Badge
 * Maps to: F-02 (Cosmos.AI Policy Firewall), F-07 (AG Grid Enterprise), TKT-028
 * Write Owner: Dev 2 (100%)
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
      <div className="inline-flex items-center gap-1.5 rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-300">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        <span>ALLOW (L3)</span>
      </div>
    );
  }

  if (row.policyVerdict === "HELD_FOR_L2_PASSKEY") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded border border-amber-500/50 bg-amber-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-300">
        <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <span>HOLD_PASSKEY (L2)</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded border border-red-500/50 bg-red-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-red-300">
      <AlertOctagon className="h-3.5 w-3.5 text-red-400 shrink-0" />
      <span>BLOCKED_INJECTION</span>
    </div>
  );
});
