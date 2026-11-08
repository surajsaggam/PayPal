"use client";

/**
 * PayOps AI (PayPal Sentinel) — AG Grid Master-Detail Expandable Row Renderer
 * Displays SHA-256 ImmutableAuditLog Hash Chain (E-10), JunoDB 2PC Lease (F-06),
 * Cosmos.AI DSL Evaluation Tree (F-02), and TreeSHAP Attribution (M-04).
 * Write Owner: Dev 2 (100%)
 */

import React from "react";
import { ShieldCheck, Lock, Hash, FileCheck2, Code2, KeyRound } from "lucide-react";
import type { AgentToolExecution } from "@payops/shared";
import { useCockpitStore } from "../../stores/useCockpitStore";

interface DisputeDetailRendererProps {
  row: AgentToolExecution;
}

export function DisputeDetailRenderer({ row }: DisputeDetailRendererProps) {
  const { auditLogs, disputes, openApimaticDrawer, openHitlApproval } = useCockpitStore();

  const matchedAudit =
    auditLogs.find((a) => a.paypalRequestId === row.paypalRequestId) ?? auditLogs[0];
  const matchedDispute = disputes[0];

  return (
    <div className="border-t border-slate-800 bg-slate-950/95 px-6 py-4 text-xs text-slate-200 grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Column 1: Cosmos.AI Policy Firewall & JunoDB Idempotency */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3.5 space-y-2">
        <div className="font-semibold text-sky-300 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4" />
          1. Cosmos.AI Policy Firewall & JunoDB 2PC State (F-02 · F-06)
        </div>
        <div className="space-y-1 font-mono text-[11px] text-slate-300">
          <div>
            <span className="text-slate-400">Policy Verdict:</span>{" "}
            <span className="font-bold text-white">{row.policyVerdict}</span>
          </div>
          <div>
            <span className="text-slate-400">Reason Code:</span>{" "}
            <span className="text-amber-300">{row.reasonCode}</span>
          </div>
          <div>
            <span className="text-slate-400">JunoDB 2PC Lease:</span>{" "}
            <span className="text-emerald-400">{row.junodbLeaseStatus} (TTL 86,400s)</span>
          </div>
          <div className="break-all">
            <span className="text-slate-400">PayPal-Request-Id:</span> {row.paypalRequestId}
          </div>
        </div>
      </div>

      {/* Column 2: M-04 GNN TreeSHAP & Compelling Evidence Bundle */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3.5 space-y-2">
        <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
          <FileCheck2 className="h-4 w-4" />
          2. M-04 GraphSAGE + LightGBM TreeSHAP Attribution (F-10)
        </div>
        <ul className="space-y-1 font-mono text-[11px] text-slate-300">
          {(matchedDispute?.treeShapReasons ?? []).map((reason) => (
            <li key={reason} className="rounded bg-slate-950 px-2 py-1 border border-slate-800">
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* Column 3: Tamper-Evident SHA-256 ImmutableAuditLog (E-10) */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3.5 space-y-2 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="font-semibold text-purple-300 flex items-center gap-1.5">
            <Hash className="h-4 w-4" />
            3. SHA-256 Hash-Chained Audit Ledger (E-10 · Elastic 180d)
          </div>
          <div className="font-mono text-[10px] text-slate-400 space-y-1">
            <div className="truncate">
              <span className="text-slate-500">prev_hash:</span> {matchedAudit?.prevHash}
            </div>
            <div className="truncate text-emerald-300">
              <span className="text-slate-500">entry_hash:</span> {matchedAudit?.entryHash}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          {row.policyVerdict !== "APPROVED_L3_AUTO" && (
            <button
              type="button"
              onClick={() => openHitlApproval(row)}
              className="inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/50 px-2.5 py-1 text-[11px] font-semibold text-amber-200"
            >
              <KeyRound className="h-3 w-3" />
              Sign Passkey (API-02)
            </button>
          )}
          <button
            type="button"
            onClick={() => openApimaticDrawer(row)}
            className="inline-flex items-center gap-1 rounded bg-emerald-950/70 border border-emerald-600/50 px-2.5 py-1 text-[11px] font-mono text-emerald-300"
          >
            <Code2 className="h-3 w-3" />
            Export APIMatic SDK (US-14)
          </button>
        </div>
      </div>
    </div>
  );
}
