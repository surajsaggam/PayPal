# Backend Engineering Specification (`services/api` & `services/risk-dsl`) — PayOps AI (PayPal Sentinel)
> Project: PayOps AI (PayPal Sentinel) · Owner: Principal Backend & Distributed Systems Lead · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [Architecture](./ARCHITECTURE.md) · [Data Model](./DATA_MODEL.md) · [API Spec](./API_SPEC.md) · [ADR-0002](./adr/ADR-0002-database-and-state.md)

---

## 1. Service Topology & Module Structure

The backend is split into two focused, stateless services mirroring PayPal's **Kraken.js/Node.js** edge orchestration tier and **Cosmos.AI/Python** risk & decisioning tier:

```text
services/
├── api/                                      # Node.js 22.11 LTS + Fastify 5.1 (TypeScript 5.6)
│   └── src/
│       ├── server.ts                         # Fastify bootstrap, Lusca/Helmet security, OpenTelemetry
│       ├── modules/
│       │   ├── agent-orchestrator/           # F-01: @paypal/agent-toolkit (35 tools) & @paypal/mcp host
│       │   ├── apimatic-validator/           # F-09: Runtime SDK schema check & TS/Python code generator
│       │   ├── junodb-idempotency/           # F-06: UUIDv5 PayPal-Request-Id & Redis 2PC CAS lock
│       │   ├── invoicing/                    # F-03: API-04, API-05, API-06 smart invoicing & dunning
│       │   ├── orders-checkout/              # F-05: API-07, API-08, API-09 orders, tracking & refunds
│       │   ├── disputes/                     # F-04: API-10, API-11 webhook dispute defense
│       │   ├── subscriptions/                # F-08: API-12 catalog & subscription plans
│       │   ├── pyusd-bridge/                 # F-11: Solana Token-2022 Memo-Required settlement
│       │   └── webhooks/                     # API-13: Cryptographic PayPal webhook verification
└── risk-dsl/                                 # Python 3.12.7 + FastAPI 0.115
    └── app/
        ├── main.py                           # FastAPI ingress & Envoy-patterned LLM Gateway client
        ├── cosmos_dsl/                       # F-02: Deterministic AST compiler & DAG evaluator (<5ms)
        ├── injection_guard/                  # M-02: XML sandboxing & prompt-injection classifier (<140ms)
        ├── gnn_scorer/                       # F-10 / M-04: PyTorch Geometric GraphSAGE + LightGBM (<18ms)
        └── rag_evidence/                     # M-03 Vision OCR + M-05 Elastic Hybrid RAG evidence builder
```

---

## 2. Two-Phase Idempotency Engine (`JunoDB` + `PayPal-Request-Id` Pattern, `F-06`)

To guarantee `0.00%` duplicate charges, invoice dispatches, or refunds during network timeouts or LLM retry loops (`R-02`), every state-mutating tool invocation executes our **Two-Phase Compare-And-Swap (CAS)** protocol modeled on PayPal's open-source **`paypal/junodb`**:

```typescript
// services/api/src/modules/junodb-idempotency/idempotencyGuard.ts
import { v5 as uuidv5 } from 'uuid';
import type { Redis } from 'ioredis';

const PAYOPS_IDEMPOTENCY_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export async function acquireIdempotentLease(
  redis: Redis,
  workspaceId: string,
  toolName: string,
  canonicalPayload: string,
  explicitRequestId?: string
): Promise<{ paypalRequestId: string; status: 'ACQUIRED' | 'IN_FLIGHT' | 'COMPLETED'; cachedResponse?: unknown }> {
  const paypalRequestId =
    explicitRequestId ?? uuidv5(`${workspaceId}:${toolName}:${canonicalPayload}`, PAYOPS_IDEMPOTENCY_NAMESPACE);
  const key = `junodb:lease:${paypalRequestId}`;

  // Atomic Compare-And-Swap (SET NX EX 300)
  const acquired = await redis.set(key, JSON.stringify({ state: 'IN_FLIGHT', ts: Date.now() }), 'EX', 300, 'NX');
  if (acquired === 'OK') {
    return { paypalRequestId, status: 'ACQUIRED' };
  }

  const existing = JSON.parse((await redis.get(key)) || '{}');
  if (existing.state === 'COMPLETED') {
    return { paypalRequestId, status: 'COMPLETED', cachedResponse: existing.response };
  }
  return { paypalRequestId, status: 'IN_FLIGHT' };
}
```

The generated `paypalRequestId` is passed verbatim in the `PayPal-Request-Id` HTTP header to `https://api-m.sandbox.paypal.com`, providing end-to-end idempotency across both our control plane and PayPal's core ledger.

---

## 3. Deterministic `Cosmos.AI` DSL Policy Firewall (`F-02`)

Before `acquireIdempotentLease` invokes `@paypal/agent-toolkit`, `services/risk-dsl` compiles and evaluates the workspace's active `PolicyRule` (`E-05`) expressions into a restricted, Turing-incomplete Abstract Syntax Tree (AST) using Python's `ast` module (zero `eval()` calls):
1. **Inputs:** `tool_name`, `amount_usd_equiv`, `daily_velocity_usd`, `m02_injection_score`, `m04_gnn_risk_score`, `carrier_status`, `operator_role`.
2. **Precedence Invariant:** `DENY` overrides `HOLD_APPROVAL`, which overrides `ALLOW`.
3. **Fail-Closed Guarantee:** Any parser error, missing attribute, or timeout automatically returns `HOLD_APPROVAL`, ensuring no unverified mutation ever reaches PayPal.

---

## 4. RBAC / ABAC Authorization & Cryptographic HITL Signing (`E-02`, `API-02`)

| Role (`E-02`) | Permitted Operations | Cryptographic Requirement |
| :--- | :--- | :--- |
| **`OWNER`** | All operations + editing `PolicyRule` (`API-03`) + approving any held execution (`API-02`). | OAuth2 JWT + WebAuthn Passkey / Ed25519 signature on `API-02` & `API-03`. |
| **`FINANCE_ADMIN`** | Executing MCP workflows (`API-01`), managing invoices/disputes/orders, approving held executions up to workspace limit (`API-02`). | OAuth2 JWT + `X-PayOps-Signature` on `API-02`. |
| **`AUDITOR`** | Read-only access to `API-03 (GET)`, `API-05`, `API-10`, `API-14`, and Elastic `ImmutableAuditLog` (`E-10`). | OAuth2 JWT (zero mutation privileges). |
| **`AGENT_SERVICE`** | Internal service identity used by **Render Workflows** for scheduled reminders (`API-06`) and webhook triage (`API-11`). | mTLS / HMAC service token; strictly subject to `F-02` Policy Firewall. |

---

## 5. Background Jobs, Queues & Webhook Verification (`Render Workflows` + `BullMQ`)

1. **Webhook Ingress (`API-13`):** Validates `PAYPAL-TRANSMISSION-SIG` against `/v1/notifications/verify-webhook-signature` within `150ms`, acks PayPal with `202 Accepted`, and enqueues the event onto the `dispute-defense` or `invoice-reconcile` queue.
2. **Durable Dunning & SLA Timers:** Powered by **Render Workflows** (`services/workflows`), executing age-tiered invoice reminders (`send_invoice_reminder`) and alerting `P-03` in Slack/AG Grid `24 hours` before any `PayPalDisputeCase.response_deadline` (`E-08`).
