"use client";

/**
 * PayOps AI (PayPal Sentinel) — AG Grid Custom Cell Renderer: M-04 GNN Risk Score & Sparkline
 * Maps to: F-07, F-10 (GraphSAGE + LightGBM ONNX Scorer), US-08, TKT-028
 * Write Owner: Dev 2 (100%)
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
    ? "text-red-300 bg-red-500/20 border-red-500/50"
    : isMedium
      ? "text-amber-300 bg-amber-500/20 border-amber-500/50"
      : "text-emerald-300 bg-emerald-500/15 border-emerald-500/40";

  const barColor = isHigh ? "#EF4444" : isMedium ? "#F59E0B" : "#10B981";
  const pct = Math.min(100, Math.max(6, Math.round(score * 100)));

  return (
    <div className="flex items-center gap-2 font-mono text-xs financial-figure">
      <span className={`rounded border px-1.5 py-0.5 text-[11px] font-bold ${badgeClass}`}>
        {score.toFixed(2)} {isHigh ? "🔴" : isMedium ? "🟡" : "🟢"}
      </span>
      <div
        className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden"
        title={`M-04 GNN 2-Hop Collusion Risk: ${score.toFixed(2)}`}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
});
