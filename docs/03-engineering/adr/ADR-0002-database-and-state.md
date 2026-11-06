# ADR-0002: PostgreSQL 16 + `JunoDB`/Redis Two-Phase Idempotent State Store + Hash-Chained Audit Ledger
> Project: PayOps AI (PayPal Sentinel) · Owner: Principal Data & Ledger Architect · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../../00-overview/PROJECT_BRIEF.md) · [Architecture](../ARCHITECTURE.md) · [Data Model](../DATA_MODEL.md) · [ADR-0000](./ADR-0000-template.md)

---

## Status Matrix

- **Status:** `Accepted`
- **Deciders:** `ENG-1`, `ENG-2`, `ENG-4`
- **Date:** `2026-11-05`
- **Canonical Scope:** `F-06` · `E-01`..`E-10` · `R-02`

---

## 1. Context and Problem Statement

When an autonomous AI agent invokes money-moving tools (`pay_order`, `create_refund`, `send_invoice`, `accept_dispute_claim`) via `@paypal/agent-toolkit`, network packet loss, webhook redeliveries, or LLM tool-call retry loops can easily trigger duplicate executions (`R-02`). Furthermore, financial compliance (PCI-DSS v4.0 Req 10.5, SOC 2 Type II, India CERT-In 180-day mandate) requires a tamper-evident audit trail (`E-10`).

We need a storage and state-locking architecture that guarantees **zero duplicate financial mutations** at sub-2ms latency while preserving strict ACID relational integrity across `E-01`..`E-10`.

---

## 2. Decision Drivers

- **Mathematical Idempotency (`0.00%` Duplicate Rate):** Must prevent concurrent retry threads from double-capturing or double-refunding a PayPal order.
- **PayPal `JunoDB` Architectural Alignment:** PayPal open-sourced **JunoDB (`paypal/junodb`)**, a two-phase commit (2PC) distributed key-value store handling 350B+ daily requests for idempotency and session state.
- **Tamper-Evident Auditability:** Every state transition in `AgentToolExecution` (`E-04`) must produce an append-only, cryptographically verifiable log entry (`ImmutableAuditLog` `E-10`).

---

## 3. Considered Options

1. **Option 1 (Chosen): Hybrid `JunoDB`-Patterned Redis 7.4 Two-Phase CAS State Store + PostgreSQL 16 (`pgvector`) ACID Ledger + SHA-256 Hash-Chained `ImmutableAuditLog` replicated to `Elastic`.**
2. **Option 2 (Rejected): PostgreSQL-Only Locking (`SELECT ... FOR UPDATE`).** Adds unnecessary row-lock contention on the primary database during high-frequency webhook bursts or retry storms.
3. **Option 3 (Rejected): Eventual-Consistency NoSQL Document Store (MongoDB / Cassandra).** As PayPal's own Simility team documented when migrating from Cassandra to Redis Enterprise, eventual-consistency read lag causes race conditions in real-time fraud and payment decisioning.

---

## 4. Decision Outcome

Chosen option: **Option 1 — `JunoDB`-Patterned Redis 7.4 CAS Lease + PostgreSQL 16 ACID Ledger + Hash-Chained Audit Log**.

### 4.1 Two-Phase Idempotency Protocol (`F-06`)
1. **Deterministic Key Derivation:** Compute `PayPal-Request-Id = UUIDv5(NAMESPACE_PAYOPS, workspace_id + tool_name + canonical_json_hash)`.
2. **Phase 1 (Redis/JunoDB Atomic Lease):** Execute `SET junodb:lease:{PayPal-Request-Id} IN_FLIGHT EX 300 NX`. If the key already exists, return the in-flight status or cached response immediately (`X-Idempotent-Replayed: true`).
3. **Phase 2 (PayPal Sandbox + Postgres ACID Commit):** Pass `PayPal-Request-Id` in the outbound HTTP header to `api-m.sandbox.paypal.com`, commit `AgentToolExecution` (`E-04`) and `ImmutableAuditLog` (`E-10`, where `entry_hash = SHA256(prev_hash || payload)`) inside a single PostgreSQL transaction, and transition the Redis lease to `COMPLETED`.

### 4.2 Positive Consequences
- Sub-2ms (`0.8ms` p50) idempotency verification that survives 100-thread thundering-herd concurrency tests (`TESTING.md`).
- Database-enforced immutability via PostgreSQL trigger `trg_immutable_audit_log_protect` (`DATA_MODEL.md`).

### 4.3 Negative Consequences & Mitigations
- *Trade-Off:* Requires coordinating Redis and PostgreSQL state.
- *Mitigation:* PostgreSQL enforces a backup `UNIQUE (paypal_request_id)` constraint on `agent_tool_executions`, so even if Redis is completely flushed, zero duplicate mutations can commit.

---

## 5. Verification & Compliance Links

- **Implementation Paths:** `services/api/src/modules/junodb-idempotency/`, `infra/migrations/0001_init_payops_schema.sql`.
- **Verification Gate:** `k6` 100-VU concurrency stress test (`tests/load/idempotency_stress.js`).
