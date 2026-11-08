/**
 * PayOps AI (PayPal Sentinel) — JunoDB 2PC Idempotency Concurrency & Tamper-Evident Audit Chain Suite
 * Covers: F-06 (10-thread single-flight coalescing), E-10/E-06 hash chain, and SQLSTATE 23514 immutability.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../app.js";
import { repository } from "../db/repository.js";
import {
  computeAuditChainHash,
  computeDeterministicIdempotencyKey,
  ImmutableAuditViolationError,
  verifyAuditChain,
} from "../db/audit-chain.js";
import { junoIdempotencyStore } from "../modules/junodb-idempotency/idempotency-guard.js";
import {
  SEED_DISPUTES,
  SEED_INVOICES,
  computeAuditChainHash as seedComputeAuditChainHash,
  computeDeterministicIdempotencyKey as seedComputeIdempotencyKey,
} from "../../../../scripts/seed-sandbox.js";

describe("JunoDB 2PC Idempotency Lock (F-06) & Tamper-Evident Audit Ledger (E-10 / E-06)", () => {
  beforeEach(() => {
    repository.seedInMemoryLedger();
    junoIdempotencyStore.clearAll();
  });

  it("coalsesces 10 concurrent identical POST /api/v1/orders requests into 1 downstream execution and 9 replays (F-06, R-02)", async () => {
    const app = await buildApp({ logger: false });
    await app.ready();

    const sharedIdempotencyKey = "idem_ws_99102a_concurrent_10_thread_test_01";

    const concurrentRequests = Array.from({ length: 10 }, () =>
      app.inject({
        method: "POST",
        url: "/api/v1/orders",
        headers: {
          "PayPal-Request-Id": sharedIdempotencyKey,
        },
        payload: {
          workspaceId: "ws_99102a",
          skuId: "C3-88210",
          amountValue: "390.00",
          currencyCode: "USD",
          intent: "CAPTURE",
        },
      })
    );

    const responses = await Promise.all(concurrentRequests);
    expect(responses).toHaveLength(10);

    const statuses = responses.map((r) => r.statusCode);
    expect(statuses.every((s) => s === 201)).toBe(true);

    const bodies = responses.map((r) => r.json());
    const distinctOrderIds = new Set(bodies.map((b) => b.order.orderId));
    expect(distinctOrderIds.size).toBe(1);

    const acquiredCount = bodies.filter((b) => b.junodbLeaseStatus === "ACQUIRED").length;
    const replayedCount = bodies.filter(
      (b) => b.junodbLeaseStatus === "REPLAYED_FROM_JUNODB"
    ).length;

    expect(acquiredCount).toBe(1);
    expect(replayedCount).toBe(9);

    const replayedHeaderCount = responses.filter(
      (r) => r.headers["x-idempotent-replayed"] === "true"
    ).length;
    expect(replayedHeaderCount).toBe(9);

    await app.close();
  });

  it("maintains 100% parity with scripts/seed-sandbox.ts and verifies the E-10 SHA-256 hash chain", () => {
    const k1 = computeDeterministicIdempotencyKey("ws_99102a", "order", "8XL99102481", "capture");
    const k2 = seedComputeIdempotencyKey("ws_99102a", "order", "8XL99102481", "capture");
    expect(k1).toBe(k2);

    const h1 = computeAuditChainHash("0".repeat(64), "2026-11-05T08:00:00.000Z", "actor", "send_invoice", "{}", "ALLOW");
    const h2 = seedComputeAuditChainHash("0".repeat(64), "2026-11-05T08:00:00.000Z", "actor", "send_invoice", "{}", "ALLOW");
    expect(h1).toBe(h2);

    const invoices = repository.listInvoices({ workspaceId: "ws_99102a" });
    expect(invoices[0].invoiceId).toBe(SEED_INVOICES[0].invoiceId);

    const disputes = repository.listDisputes("ws_99102a");
    expect(disputes[0].disputeId).toBe(SEED_DISPUTES[0].disputeId);

    const chainCheck = repository.verifyAuditLedgerIntegrity();
    expect(chainCheck.valid).toBe(true);
    expect(chainCheck.totalEntries).toBeGreaterThanOrEqual(2);
  });

  it("detects tampering anywhere in the audit chain and blocks UPDATE/DELETE with SQLSTATE 23514", () => {
    repository.appendAuditLog({
      workspaceId: "ws_99102a",
      actorId: "usr_maya_lin_owner",
      toolName: "pay_order",
      paypalRequestId: "idem_test_audit_03",
      policyVerdict: "APPROVED_L3_AUTO",
      payload: { orderId: "8XL99102481", amountValue: "420.00" },
    });

    const validLogs = repository.listAuditLogs();
    expect(verifyAuditChain(validLogs).valid).toBe(true);

    // Simulate a tampered copy of entry #1
    const tamperedCopy = validLogs.map((entry, idx) =>
      idx === 0 ? { ...entry, rawPayloadJson: '{"tampered":true}' } : entry
    );
    const tamperedResult = verifyAuditChain(tamperedCopy);
    expect(tamperedResult.valid).toBe(false);
    expect(tamperedResult.brokenAtIndex).toBe(0);

    // Verify SQLSTATE 23514 immutability guard on UPDATE and DELETE
    expect(() => repository.updateAuditLog()).toThrowError(ImmutableAuditViolationError);
    try {
      repository.deleteAuditLog();
    } catch (err) {
      expect((err as ImmutableAuditViolationError).code).toBe("23514");
    }
  });
});
