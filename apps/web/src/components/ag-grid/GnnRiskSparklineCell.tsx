"use client";

/**
 * PayOps AI (PayPal Sentinel) — AG Grid Custom Cell Renderer: M-04 GNN Risk Score & Sparkline
 * Single-line, non-wrapping risk pill with semantic status dot and animated progress bar.
 */

import React, { memo } from "react";
import type { AgentToolExecution } from "@payops/shared";

interface GnnRiskSparklineCellProps {
  row: AgentToolExecution;
}

export const GnnRiskSparklineCell = memo(function GnnRiskSparklineCell({
  row,
}: GnnRiskSparklineCellProps) {
  const score = row.gnnRiskScore;
  const isHigh = score >= 0.7;
  const isMedium = score >= 0.35 && score < 0.7;

  const badgeClass = isHigh
    ? "text-status-danger-text bg-status-danger-bg border-status-danger-border"
    : isMedium
      ? "text-status-warning-text bg-status-warning-bg border-status-warning-border"
      : "text-status-success-text bg-status-success-bg border-status-success-border";

  const dotClass = isHigh
    ? "bg-status-danger-bar"
    : isMedium
      ? "bg-status-warning-bar"
      : "bg-status-success-bar";

  const pct = Math.min(100, Math.max(8, Math.round(score * 100)));

  return (
    <div className="inline-flex items-center gap-2.5 whitespace-nowrap font-mono text-xs tabular-nums">
      <span
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-all duration-200 group-hover:shadow-2xs ${badgeClass}`}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
        <span>{score.toFixed(2)}</span>
      </span>
      <div
        className="hidden sm:block w-14 h-1.5 rounded-full bg-subtle overflow-hidden shrink-0"
        title={`M-04 GNN 2-Hop Collusion Risk: ${score.toFixed(2)}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out group-hover:brightness-110 ${dotClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
});
