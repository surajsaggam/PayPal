"use client";

/**
 * PayOps AI (PayPal Sentinel) — Real-Time MCP Tool Execution Trace Drawer & Live Sandbox Receipt Inspector
 */

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  AlertOctagon,
  ShieldAlert,
  Cpu,
  Activity,
  Code2,
  Database,
  FileJson,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useCockpitStore } from "../../stores/useCockpitStore";

export function McpToolTraceDrawer() {
  const {
    traceDrawerOpen,
    setTraceDrawerOpen,
    activeTraceSteps,
    executions,
    apiMode,
    openApimaticDrawer,
    openHitlApproval,
  } = useCockpitStore();

  const [showRawJson, setShowRawJson] = useState(false);

  if (!traceDrawerOpen) return null;

  const latest = executions[0];
  const totalLatencyMs = activeTraceSteps.reduce((acc, s) => acc + s.latencyMs, 0);

  return (
    <aside
      aria-label="Live PayPal MCP Tool Execution Trace Drawer"
      className="fixed bottom-6 right-6 z-40 w-full max-w-xl rounded-2xl apple-glass-sheet text-ink overflow-hidden animate-pop-in"
    >
      <div className="flex items-center justify-between border-b border-hairline bg-surface/80 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Cpu className="h-4 w-4 text-ink-secondary" />
          <div>
            <h3 className="text-xs font-semibold tracking-tight text-ink">
              PayPal Agent Toolkit MCP Execution Trace
            </h3>
            <p className="text-[10.5px] font-mono text-ink-muted tabular-nums">
              Gemini 2.5 Flash · @paypal/agent-toolkit · {totalLatencyMs}ms total
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setTraceDrawerOpen(false)}
          aria-label="Close MCP Trace Drawer"
          className="rounded-lg p-1.5 text-ink-muted hover:bg-subtle hover:text-ink active:scale-[0.95] cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Live Infrastructure Verification Strip (A-1) */}
      <div className="grid grid-cols-3 gap-2 border-b border-hairline bg-surface/60 px-5 py-2.5 text-[11px] font-mono tabular-nums">
        <div className="truncate">
          <span className="text-ink-muted">PayPal:</span>{" "}
          <span className="text-status-success-text font-semibold">
            {apiMode === "live" ? "Sandbox Live" : "Sandbox Ready"}
          </span>
        </div>
        <div className="truncate">
          <span className="text-ink-muted">Model:</span>{" "}
          <span className="text-ink font-semibold">Gemini 2.5</span>
        </div>
        <div className="truncate flex items-center gap-1">
          <Database className="h-3 w-3 text-status-success-text shrink-0" />
          <span className="text-status-success-text font-semibold">Neon PG16</span>
        </div>
      </div>

      {/* 6 Deterministic Pipeline Gates */}
      <div className="max-h-72 overflow-y-auto divide-y divide-border-subtle p-5 space-y-3">
        {activeTraceSteps.map((step) => {
          const badgeColor =
            step.status === "PASS"
              ? "border-status-success-border bg-status-success-bg text-status-success-text"
              : step.status === "HOLD"
                ? "border-status-warning-border bg-status-warning-bg text-status-warning-text"
                : "border-status-danger-border bg-status-danger-bg text-status-danger-text";

          return (
            <div
              key={step.stepIndex}
              className="pt-3 first:pt-0 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                {step.status === "PASS" ? (
                  <CheckCircle2 className="h-4 w-4 text-status-success-bar shrink-0 mt-0.5" />
                ) : step.status === "HOLD" ? (
                  <ShieldAlert className="h-4 w-4 text-status-warning-bar shrink-0 mt-0.5" />
                ) : (
                  <AlertOctagon className="h-4 w-4 text-status-danger-bar shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink">{step.label}</span>
                    <span
                      className={`rounded-pill border px-2 py-0.5 font-mono text-[10px] font-medium ${badgeColor}`}
                    >
                      {step.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink-secondary mt-0.5 tabular-nums">{step.detail}</p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-ink-muted shrink-0 tabular-nums">
                {step.latencyMs}ms
              </span>
            </div>
          );
        })}

        {/* Collapsible Raw PayPal Sandbox Receipt JSON (A-1) */}
        {latest && (
          <div className="pt-3">
            <button
              type="button"
              onClick={() => setShowRawJson((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-hairline bg-surface px-3 py-2 text-[11px] font-medium text-ink-secondary hover:text-ink cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5">
                <FileJson className="h-3.5 w-3.5 text-ink-muted" />
                <span>Inspect Live PayPal Sandbox &amp; Audit Receipt JSON</span>
              </span>
              {showRawJson ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
            {showRawJson && (
              <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-hairline bg-elevated p-3 font-mono text-[10.5px] text-ink tabular-nums">
                {JSON.stringify(
                  {
                    paypalSandboxHost: "https://api-m.sandbox.paypal.com",
                    executionId: latest.executionId,
                    paypalRequestId: latest.paypalRequestId,
                    mcpTool: latest.toolName,
                    amount: `${latest.amountValue ?? "0.00"} ${latest.currencyCode ?? "USD"}`,
                    policyVerdict: latest.policyVerdict,
                    reasonCode: latest.reasonCode,
                    gnnRiskScore: latest.gnnRiskScore,
                    junodb2pcLease: latest.junodbLeaseStatus,
                    executedAtIso: latest.executedAt,
                  },
                  null,
                  2
                )}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      {latest && (
        <div className="flex items-center justify-between border-t border-hairline bg-surface px-5 py-3.5 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink tabular-nums">
            <Activity className="h-3.5 w-3.5 text-ink-secondary" />
            <span className="font-semibold">{latest.toolName}</span>
            <span className="text-ink-muted">·</span>
            <span className="text-ink-muted">{latest.paypalRequestId.slice(0, 22)}...</span>
          </div>
          <div className="flex items-center gap-2">
            {latest.policyVerdict !== "APPROVED_L3_AUTO" && (
              <button
                type="button"
                onClick={() => openHitlApproval(latest)}
                className="btn-primary-mint px-2.5 py-1 text-[11px] font-semibold cursor-pointer"
              >
                Sign Passkey
              </button>
            )}
            <button
              type="button"
              onClick={() => openApimaticDrawer(latest)}
              className="btn-secondary-dark px-2.5 py-1 text-[11px] font-mono cursor-pointer"
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Export SDK</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
