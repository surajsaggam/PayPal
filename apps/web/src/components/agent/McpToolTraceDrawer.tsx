"use client";

/**
 * PayOps AI (PayPal Sentinel) — Real-Time MCP Tool Execution Trace Drawer
 * Increase.com Light-First Editorial Floating Inspector
 */

import React from "react";
import { X, CheckCircle2, AlertOctagon, ShieldAlert, Cpu, Activity, Code2 } from "lucide-react";
import { useCockpitStore } from "../../stores/useCockpitStore";

export function McpToolTraceDrawer() {
  const {
    traceDrawerOpen,
    setTraceDrawerOpen,
    activeTraceSteps,
    executions,
    openApimaticDrawer,
    openHitlApproval,
  } = useCockpitStore();

  if (!traceDrawerOpen) return null;

  const latest = executions[0];
  const totalLatencyMs = activeTraceSteps.reduce((acc, s) => acc + s.latencyMs, 0);

  return (
    <aside
      aria-label="Live PayPal MCP Tool Execution Trace Drawer"
      className="fixed bottom-6 right-6 z-40 w-full max-w-xl rounded-2xl border border-hairline bg-elevated shadow-lg text-ink overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-hairline bg-surface px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-ink-secondary" />
          <div>
            <h3 className="text-xs font-semibold text-ink">
              Dual-Layer PayPal MCP Control Plane Trace (F-01 · ADR-0003)
            </h3>
            <p className="text-[10.5px] font-mono text-ink-muted">
              W3C traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01 ·{" "}
              {totalLatencyMs}ms
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setTraceDrawerOpen(false)}
          aria-label="Close MCP Trace Drawer"
          className="rounded-lg p-1 text-ink-muted hover:bg-subtle hover:text-ink cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Session Circuit Breaker Telemetry (E-03, R-10) */}
      <div className="grid grid-cols-3 gap-2 border-b border-hairline bg-surface/60 px-4 py-2 text-[11px] font-mono">
        <div>
          <span className="text-ink-muted">Hop Cap (R-10):</span>{" "}
          <span className="text-status-success-text font-semibold">Step 2/6</span>
        </div>
        <div>
          <span className="text-ink-muted">Cost Cap:</span>{" "}
          <span className="text-status-success-text font-semibold">$0.042 / $0.25</span>
        </div>
        <div>
          <span className="text-ink-muted">Enclave:</span>{" "}
          <span className="text-ink font-semibold">Zero-PAN (ADR-0005)</span>
        </div>
      </div>

      {/* 6 Deterministic Pipeline Gates */}
      <div className="max-h-80 overflow-y-auto divide-y divide-border-subtle p-4 space-y-2.5">
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
              className="pt-2.5 first:pt-0 flex items-start justify-between gap-3"
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
                      className={`rounded-pill border px-2 py-0.2 font-mono text-[10px] font-medium ${badgeColor}`}
                    >
                      {step.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink-secondary mt-0.5">{step.detail}</p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-ink-muted shrink-0 tabular-nums">
                {step.latencyMs}ms
              </span>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      {latest && (
        <div className="flex items-center justify-between border-t border-hairline bg-surface px-4 py-3 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink">
            <Activity className="h-3.5 w-3.5 text-ink-secondary" />
            <span className="font-semibold">{latest.toolName}</span>
            <span className="text-ink-muted">·</span>
            <span className="text-ink-muted">{latest.paypalRequestId.slice(0, 24)}...</span>
          </div>
          <div className="flex items-center gap-2">
            {latest.policyVerdict !== "APPROVED_L3_AUTO" && (
              <button
                type="button"
                onClick={() => openHitlApproval(latest)}
                className="btn-primary-mint px-2.5 py-1 text-[11px] font-semibold cursor-pointer"
              >
                Sign Passkey (API-02)
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
