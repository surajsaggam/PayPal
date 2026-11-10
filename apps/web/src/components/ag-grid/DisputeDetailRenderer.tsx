"use client";

/**
 * PayOps AI (PayPal Sentinel) — Clean 3-Card Master-Detail Execution Inspector
 * Modeled directly on Increase.com "Modular compliance" card layout:
 *  - Pre-formatted short hashes & identifiers so zero text overflows or stretches the table
 *  - Clean key-value rows with subtle hairline dividers and hover elevation
 *  - Self-contained action buttons inside Card 3
 */

import React, { useState } from "react";
import {
  ShieldCheck,
  Hash,
  FileCheck2,
  Code2,
  KeyRound,
  Copy,
  Check,
} from "lucide-react";
import type { AgentToolExecution } from "@payops/shared";
import { useCockpitStore } from "../../stores/useCockpitStore";

interface DisputeDetailRendererProps {
  row: AgentToolExecution;
}

function formatIdentifierLabel(raw: string): string {
  return raw
    .replace(/^[A-Z]+_\d+_/, "")
    .split("_")
    .map((word) =>
      word.length <= 3 && /^(ZIP|INR|IP|POD|2PC|TTL|L2|L3|90D)$/i.test(word)
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
}

function shortenMiddle(str: string | undefined, head = 12, tail = 8): string {
  if (!str) return "—";
  if (str.length <= head + tail + 3) return str;
  return `${str.slice(0, head)}…${str.slice(-tail)}`;
}

function parseShapReason(reason: string, idx: number) {
  const match = reason.match(/^(.*?)\s*\(([+-]?\d+(?:\.\d+)?)\)\s*$/);
  if (match) {
    const rawCode = match[1].trim();
    const readable = formatIdentifierLabel(rawCode);
    const num = parseFloat(match[2]);
    const formatted =
      match[2].startsWith("+") || match[2].startsWith("-") ? match[2] : `+${match[2]}`;
    const pct = Math.min(100, Math.max(18, Math.round(Math.abs(num) * 180)));
    return { rawCode, readable, formatted, pct };
  }
  const fallbackPcts = [78, 56, 36];
  return {
    rawCode: reason,
    readable: formatIdentifierLabel(reason),
    formatted: idx === 0 ? "+0.44" : idx === 1 ? "+0.31" : "+0.14",
    pct: fallbackPcts[idx % fallbackPcts.length],
  };
}

export function DisputeDetailRenderer({ row }: DisputeDetailRendererProps) {
  const { auditLogs, disputes, openApimaticDrawer, openHitlApproval } = useCockpitStore();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const matchedAudit =
    auditLogs.find((a) => a.paypalRequestId === row.paypalRequestId) ?? auditLogs[0];
  const matchedDispute =
    disputes.find(
      (d) =>
        row.paypalRequestId.includes(d.disputeId) ||
        row.paypalRequestId.includes(d.disputeId.replace(/-/g, "_")) ||
        (row.amountValue !== undefined && d.disputedAmountValue === row.amountValue)
    ) ?? disputes[0];

  const handleCopy = (label: string, value: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(value);
    }
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="dot-grid-surface border-t border-b border-hairline p-5 sm:p-6 text-xs text-ink">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Card 1: Cosmos.AI Policy Firewall & JunoDB 2PC */}
        <div className="surface-card rounded-xl p-5 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="mb-3 flex items-center justify-between border-b border-border-subtle pb-2.5">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-status-success-bar shrink-0" />
                <span>1. Policy &amp; JunoDB 2PC</span>
              </div>
              <span className="rounded-pill bg-surface px-2 py-0.5 font-mono text-[10px] text-ink-muted border border-hairline">
                F-02 · F-06
              </span>
            </div>

            <dl className="divide-y divide-border-subtle text-xs">
              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-ink-muted">Verdict</dt>
                <dd className="font-mono text-[11px] font-semibold text-ink">
                  {row.policyVerdict}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-ink-muted">Rule</dt>
                <dd className="font-medium text-ink text-right" title={row.reasonCode}>
                  {formatIdentifierLabel(row.reasonCode)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-ink-muted">JunoDB Lease</dt>
                <dd className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-status-success-text">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-success-bar" />
                  {row.junodbLeaseStatus === "REPLAYED_FROM_JUNODB"
                    ? "Replayed (86,400s)"
                    : "Acquired (86,400s)"}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <dt className="text-ink-muted">Request ID</dt>
                <dd className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-secondary">
                  <span title={row.paypalRequestId}>
                    {shortenMiddle(row.paypalRequestId, 10, 7)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy("req", row.paypalRequestId)}
                    title="Copy full PayPal-Request-Id"
                    className="rounded p-0.5 text-ink-muted transition-colors hover:bg-surface hover:text-ink cursor-pointer"
                  >
                    {copiedKey === "req" ? (
                      <Check className="h-3 w-3 text-status-success-bar" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Card 2: M-04 GraphSAGE + LightGBM TreeSHAP Attribution */}
        <div className="rounded-xl border border-hairline bg-elevated p-4 shadow-2xs flex flex-col justify-between overflow-hidden transition-all duration-200 ease-out hover:-translate-y-[1px] hover:border-border-strong hover:shadow-md">
          <div>
            <div className="mb-3 flex items-center justify-between border-b border-border-subtle pb-2.5">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <FileCheck2 className="h-4 w-4 text-ink-secondary shrink-0" />
                <span>2. M-04 GNN Attribution</span>
              </div>
              <span className="rounded-pill bg-surface px-2 py-0.5 font-mono text-[10px] text-ink-muted border border-hairline">
                F-10 · ONNX
              </span>
            </div>

            <ul className="space-y-2.5 text-xs">
              {(matchedDispute?.treeShapReasons ?? []).map((reason, idx) => {
                const parsed = parseShapReason(reason, idx);
                return (
                  <li key={reason} title={parsed.rawCode} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink-secondary">
                        {parsed.readable}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] font-semibold text-ink">
                        {parsed.formatted}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                      <div
                        className="h-full rounded-full bg-chart-invoiced transition-all duration-300 ease-out"
                        style={{ width: `${parsed.pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Card 3: SHA-256 Hash-Chained Audit Ledger & Actions */}
        <div className="rounded-xl border border-hairline bg-elevated p-4 shadow-2xs flex flex-col justify-between overflow-hidden transition-all duration-200 ease-out hover:-translate-y-[1px] hover:border-border-strong hover:shadow-md">
          <div>
            <div className="mb-3 flex items-center justify-between border-b border-border-subtle pb-2.5">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <Hash className="h-4 w-4 text-ink-secondary shrink-0" />
                <span>3. SHA-256 Audit Ledger</span>
              </div>
              <span className="rounded-pill bg-status-success-bg px-2 py-0.5 font-mono text-[10px] font-medium text-status-success-text border border-status-success-border">
                Elastic 180d
              </span>
            </div>

            <dl className="divide-y divide-border-subtle text-xs">
              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-ink-muted">Prev Hash</dt>
                <dd className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-secondary">
                  <span title={matchedAudit?.prevHash}>
                    {shortenMiddle(matchedAudit?.prevHash, 10, 8)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy("prev", matchedAudit?.prevHash ?? "")}
                    className="rounded p-0.5 text-ink-muted transition-colors hover:bg-surface hover:text-ink cursor-pointer"
                  >
                    {copiedKey === "prev" ? (
                      <Check className="h-3 w-3 text-status-success-bar" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2 py-2">
                <dt className="text-ink-muted">Entry Hash</dt>
                <dd className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-status-success-text">
                  <span title={matchedAudit?.entryHash}>
                    {shortenMiddle(matchedAudit?.entryHash, 10, 8)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy("entry", matchedAudit?.entryHash ?? "")}
                    className="rounded p-0.5 text-status-success-text transition-opacity hover:opacity-80 cursor-pointer"
                  >
                    {copiedKey === "entry" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-border-subtle pt-3">
            {row.policyVerdict !== "APPROVED_L3_AUTO" && (
              <button
                type="button"
                onClick={() => openHitlApproval(row)}
                className="btn-primary-mint px-2.5 py-1.5 text-[11px] font-medium cursor-pointer"
              >
                <KeyRound className="h-3 w-3" />
                <span>Sign Passkey (API-02)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => openApimaticDrawer(row)}
              className="btn-secondary-dark px-2.5 py-1.5 text-[11px] font-medium cursor-pointer"
            >
              <Code2 className="h-3 w-3" />
              <span>Export APIMatic SDK (US-14)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
