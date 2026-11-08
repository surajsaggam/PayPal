/**
 * PayOps AI (PayPal Sentinel) — Hash-Chained Tamper-Evident Audit Ledger
 * @canonical E-10 (ImmutableAuditLog) · E-06
 * Implements SHA-256 hash chaining matching scripts/seed-sandbox.ts and SQLSTATE 23514 immutability.
 */

import crypto from "node:crypto";
import type { ImmutableAuditLog } from "@payops/shared";
import { scrubObjectPii } from "../lib/pii-scrubber.js";

export const GENESIS_AUDIT_HASH = "0".repeat(64);

export interface AuditLogExtendedEntry extends ImmutableAuditLog {
  audit_seq: number;
  log_id: string;
  workspace_id: string;
  execution_id?: string;
  event_type: string;
  actor_id: string;
  paypal_request_id: string;
  policy_verdict: string;
  redacted_payload_json: Record<string, unknown>;
  prev_hash: string;
  entry_hash: string;
  recorded_at: string;
  rawPayloadJson: string;
}

/**
 * Exact SHA-256 hash chain formula matching scripts/seed-sandbox.ts and tests/e2e/checkout-dispute.spec.ts.
 */
export function computeAuditChainHash(
  prevHash: string,
  timestampIso: string,
  actorId: string,
  toolName: string,
  payloadJson: string,
  policyVerdict: string
): string {
  const payloadSha = crypto.createHash("sha256").update(payloadJson).digest("hex");
  return crypto
    .createHash("sha256")
    .update(`${prevHash}|${timestampIso}|${actorId}|${toolName}|${payloadSha}|${policyVerdict}`)
    .digest("hex");
}

/**
 * Deterministic idempotency key generator matching scripts/seed-sandbox.ts (F-06, R-02).
 */
export function computeDeterministicIdempotencyKey(
  workspaceId: string,
  entityType: string,
  entityId: string,
  action: string
): string {
  const raw = `${workspaceId}:${entityType}:${entityId}:${action}`;
  const digest = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
  return `idem_${workspaceId}_${digest}`;
}

export class ImmutableAuditViolationError extends Error {
  public readonly code = "23514";
  public readonly sqlState = "23514";

  constructor(operation: "UPDATE" | "DELETE" = "UPDATE") {
    super(
      `SQLSTATE 23514: ImmutableAuditLog (E-10) is append-only. ${operation} operations are strictly prohibited by trg_immutable_audit_log_protect.`
    );
    this.name = "ImmutableAuditViolationError";
  }
}

/**
 * Throws PostgreSQL SQLSTATE 23514 check_violation whenever any caller attempts to mutate or delete an audit log row.
 */
export function guardImmutableAuditMutation(operation: "UPDATE" | "DELETE" = "UPDATE"): never {
  throw new ImmutableAuditViolationError(operation);
}

/**
 * Creates a frozen, Luhn-PAN-scrubbed, hash-chained audit entry.
 */
export function buildChainedAuditEntry(params: {
  seq: number;
  prevHash: string;
  workspaceId: string;
  actorId: string;
  toolName: string;
  paypalRequestId: string;
  policyVerdict: string;
  payload: unknown;
  executionId?: string;
  timestampIso?: string;
  exactPayloadJsonOverride?: string;
}): Readonly<AuditLogExtendedEntry> {
  const timestampIso = params.timestampIso ?? new Date().toISOString();
  const scrubbedPayload =
    params.payload !== null && typeof params.payload === "object"
      ? (scrubObjectPii(params.payload).value as Record<string, unknown>)
      : { raw: String(params.payload ?? "") };

  const rawPayloadJson =
    params.exactPayloadJsonOverride ?? JSON.stringify(scrubbedPayload);

  const entryHash = computeAuditChainHash(
    params.prevHash,
    timestampIso,
    params.actorId,
    params.toolName,
    rawPayloadJson,
    params.policyVerdict
  );

  const logId = `aud_${String(params.seq).padStart(5, "0")}_${entryHash.slice(0, 12)}`;

  const entry: AuditLogExtendedEntry = {
    logId,
    workspaceId: params.workspaceId,
    timestampIso,
    actorId: params.actorId,
    toolName: params.toolName,
    paypalRequestId: params.paypalRequestId,
    policyVerdict: params.policyVerdict,
    prevHash: params.prevHash,
    entryHash,
    audit_seq: params.seq,
    log_id: logId,
    workspace_id: params.workspaceId,
    execution_id: params.executionId,
    event_type: params.toolName,
    actor_id: params.actorId,
    paypal_request_id: params.paypalRequestId,
    policy_verdict: params.policyVerdict,
    redacted_payload_json: scrubbedPayload,
    prev_hash: params.prevHash,
    entry_hash: entryHash,
    recorded_at: timestampIso,
    rawPayloadJson,
  };

  return Object.freeze(entry);
}

/**
 * Verifies the cryptographic integrity of an ordered sequence of ImmutableAuditLog entries from genesis.
 */
export function verifyAuditChain(logs: ReadonlyArray<AuditLogExtendedEntry>): {
  valid: boolean;
  totalEntries: number;
  brokenAtIndex?: number;
  headHash: string;
} {
  let expectedPrevHash = GENESIS_AUDIT_HASH;
  for (let i = 0; i < logs.length; i += 1) {
    const entry = logs[i];
    if (entry.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        totalEntries: logs.length,
        brokenAtIndex: i,
        headHash: entry.entryHash,
      };
    }
    const recomputed = computeAuditChainHash(
      entry.prevHash,
      entry.timestampIso,
      entry.actorId,
      entry.toolName,
      entry.rawPayloadJson,
      entry.policyVerdict
    );
    if (recomputed !== entry.entryHash) {
      return {
        valid: false,
        totalEntries: logs.length,
        brokenAtIndex: i,
        headHash: entry.entryHash,
      };
    }
    expectedPrevHash = entry.entryHash;
  }
  return {
    valid: true,
    totalEntries: logs.length,
    headHash: expectedPrevHash,
  };
}
