"use client";

/**
 * PayOps AI (PayPal Sentinel) — Real-Time MCP Tool Execution Trace Drawer
 * Maps to: F-01, E-03 (AgentSession 6-hop & $0.25 circuit breaker R-10), F-02, F-06, F-09
 * Write Owner: Dev 2 (100%)
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
      className="fixed bottom-16 right-4 z-40 w-full max-w-xl rounded-lg border border-slate-700 bg-slate-900/98 shadow-2xl backdrop-blur-md text-slate-100 overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-sky-400" />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-100">
              Dual-Layer PayPal MCP Control Plane Trace (F-01 · ADR-0003)
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              W3C traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01 · {totalLatencyMs}ms
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setTraceDrawerOpen(false)}
          aria-label="Close MCP Trace Drawer"
          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Session Circuit Breaker Telemetry (E-03, R-10) */}
      <div className="grid grid-cols-3 gap-2 border-b border-slate-800 bg-slate-900/70 px-4 py-2 text-[11px] font-mono">
        <div>
          <span className="text-slate-400">Session Hop Cap (R-10):</span>{" "}
          <span className="text-emerald-400 font-semibold">Step 2 of 6 Max</span>
        </div>
        <div>
          <span className="text-slate-400">Token Cost Cap:</span>{" "}
          <span className="text-emerald-400 font-semibold">$0.042 / $0.25</span>
        </div>
        <div>
          <span className="text-slate-400">OAuth2 Enclave:</span>{" "}
          <span className="text-sky-400 font-semibold">Zero-PAN (ADR-0005)</span>
        </div>
      </div>

      {/* 6 Deterministic Pipeline Gates */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80 p-3 space-y-2">
        {activeTraceSteps.map((step) => {
          const badgeColor =
            step.status === "PASS"
              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
              : step.status === "HOLD"
                ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                : "bg-red-500/15 text-red-300 border-red-500/40";

          return (
            <div key={step.stepIndex} className="pt-2 first:pt-0 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {step.status === "PASS" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : step.status === "HOLD" ? (
                  <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertOctagon className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-100">{step.label}</span>
                    <span className={`rounded border px-1.5 py-0.2 font-mono text-[10px] ${badgeColor}`}>
                      {step.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{step.detail}</p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-slate-400 shrink-0 financial-figure">
                {step.latencyMs}ms
              </span>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      {latest && (
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
            <Activity className="h-3.5 w-3.5 text-sky-400" />
            <span>{latest.toolName}</span>
            <span>·</span>
            <span className="text-slate-400">{latest.paypalRequestId.slice(0, 28)}...</span>
          </div>
          <div className="flex items-center gap-2">
            {latest.policyVerdict !== "APPROVED_L3_AUTO" && (
              <button
                type="button"
                onClick={() => openHitlApproval(latest)}
                className="rounded bg-amber-500/20 border border-amber-500/50 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/30"
              >
                Inspect & Sign Passkey (API-02)
              </button>
            )}
            <button
              type="button"
              onClick={() => openApimaticDrawer(latest)}
              className="inline-flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-mono text-emerald-300 hover:border-emerald-500"
            >
              <Code2 className="h-3.5 w-3.5" />
              Export APIMatic SDK
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
