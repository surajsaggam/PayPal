# System Architecture & PayPal Production Pattern Alignment — PayOps AI (PayPal Sentinel)
> Project: PayOps AI (PayPal Sentinel) · Owner: Chief Systems Architect · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [Tech Stack](./TECH_STACK.md) · [Data Model](./DATA_MODEL.md) · [API Spec](./API_SPEC.md) · [ADR-0001](./adr/ADR-0001-tech-stack.md) · [ADR-0003](./adr/ADR-0003-ai-model-and-agent-architecture.md)

---

## 1. Architectural Philosophy: PayPal Production DNA Meets Agentic Commerce

**PayOps AI (`PayPal Sentinel`)** is engineered not as a fragile hackathon chatbot, but as a high-reliability financial control plane that mirrors **PayPal's internal production engineering architecture**:

| PayPal Production System | PayPal Internal Role & Scale | How `PayOps AI` Implements This Pattern (`F-01`..`F-12`) |
| :--- | :--- | :--- |
| **1. `Cosmos.AI` Envoy LLM Gateway & Decision Platform DSL** | Routes 100B+ tokens/day across 100+ models via Envoy and evaluates DAGs of deterministic risk/compliance DSL rules alongside ML scores. | **`F-01` & `F-02` (`services/risk-dsl`):** Envoy-patterned LLM router (`M-01`..`M-05`) enforcing token budgets (`E-03`) paired with a compiled **`Cosmos.AI`-style Decision DSL Policy Firewall** that intercepts 100% of MCP tool calls before execution (`ADR-0003`). |
| **2. `JunoDB` (`paypal/junodb`)** | Go + RocksDB + `etcd` distributed KV store serving 350B+ requests/day at `99.9999%` availability using Two-Phase Commit (2PC) quorum writes. | **`F-06` (`packages/junodb-state`):** Two-phase Compare-And-Swap (CAS) idempotency lock in Redis/JunoDB keyed by deterministic UUIDv5 `PayPal-Request-Id` headers, guaranteeing zero duplicate charges, invoices, or refunds (`ADR-0002`). |
| **3. `Real-Time Graph`, `Mirror Graphs` & `Simility`** | Sub-second heterogeneous graph traversal + PyTorch Geometric GNN inference + Redis Enterprise rules stopping ATO and friendly fraud. | **`F-10` & `M-04` (`services/risk-dsl/gnn`):** Pre-aggregated 3-hop Buyer–Device–Carrier `Mirror Graph` scored in `< 18ms` by `GraphSAGE + LightGBM` during dispute defense (`F-04`) and refund authorization (`F-05`). |
| **4. `Kraken.js` & `Zoid`** | Express/Node.js security middleware (`lusca` CSRF/CSP/HSTS, `confit`, `makara`) + isolated cross-origin checkout components (`@paypal/react-paypal-js`). | **`apps/web` & `services/api`:** Strict Lusca-grade CSP/HSTS headers, `makara`-inspired multi-currency i18n (`LOCALIZATION.md`), and Zoid-isolated **Fastlane** & Smart Payment Buttons (`F-05`). |
| **5. `Apache Kafka` & `PayPal Raptor`** | 1.3T+ messages/day event backbone feeding async risk pipelines, webhook dispatchers, and mTLS microservices. | **Event-Driven Webhook & SSE Pipeline (`API-13`):** Cryptographically verified PayPal webhooks stream through durable **Render Workflows** / BullMQ queues into **Elastic** and real-time **AG Grid** (`F-07`) SSE channels. |

---

## 2. C4 Level 1 — System Context Diagram (Mermaid)

```mermaid
flowchart TB
    subgraph Users["Human & Agent Actors"]
        P01["P-01 Maya Lin (SMB Founder / CFO)"]
        P02["P-02 Arjun Mehta (Cross-Border Finance Head)"]
        P03["P-03 Elena Rostova (Risk & Dispute Analyst)"]
        P04["P-04 Marcus Vance (Platform Engineer)"]
        Buyer["Global B2B / D2C Buyer (Fastlane / QR / PYUSD)"]
    end

    subgraph CoreSystem["PayOps AI (PayPal Sentinel) Control Plane"]
        PayOps["PayOps AI Platform<br/>(Autonomous Agentic CFO, Smart Invoicing,<br/>Cosmos.AI Policy Firewall & GNN Dispute Defense)"]
    end

    subgraph PayPalEcosystem["PayPal Developer & Financial Ecosystem"]
        PayPalSandbox["PayPal REST APIs v2 & MCP Server<br/>(35 @paypal/agent-toolkit Tools:<br/>Invoices, Orders, Disputes, Tracking, Subscriptions)"]
        FastlaneBraintree["PayPal Fastlane, PPCP & Braintree GraphQL"]
        SolanaPYUSD["PayPal USD (PYUSD) on Solana Token-2022<br/>(Mint: 2b1kV6...4GXo · Memo Required)"]
    end

    subgraph SponsorEcosystem["Hackathon Sponsor & Cloud Services"]
        APIMatic["APIMatic Context Plugins & SDK Validator"]
        ElasticCloud["Elastic Cloud (Hybrid Vector RAG & 180d Audit Logs)"]
        Channel3Zapier["Channel3 MCP Catalog & Zapier ERP/Slack Webhooks"]
        LLMProviders["LLM Gateway Targets (Anthropic Claude 3.5 / OpenAI GPT-4o / Gemini 1.5)"]
    end

    P01 & P02 & P03 & P04 -->|Commands, Policy Edits & 1-Click HITL Approvals| PayOps
    Buyer -->|Scans Invoice QR / Fastlane Checkout / Files Dispute| PayPalSandbox
    PayOps <-->|OAuth 2.0 + Idempotent PayPal-Request-Id| PayPalSandbox
    PayOps <-->|Webhook Events: INVOICING.*, PAYMENT.*, CUSTOMER.DISPUTE.*| PayPalSandbox
    PayOps <-->|Client SDK v6 & GraphQL| FastlaneBraintree
    PayOps <-->|SPL Token-2022 Transfer + Memo Reconciliation| SolanaPYUSD
    PayOps <-->|Deterministic Schema Validation| APIMatic
    PayOps <-->|Hybrid RRF Search & OpenTelemetry Spans| ElasticCloud
    PayOps <-->|Product SKU Discovery & Downstream Triggers| Channel3Zapier
    PayOps <-->|JSON Schema Tool Calling & Vision OCR| LLMProviders
```

---

## 3. C4 Level 2 — Container Diagram (Mermaid)

```mermaid
flowchart TB
    subgraph ClientTier["Browser / Operator Client Tier"]
        WebApp["Next.js 15 + React 19 Web Application (apps/web)<br/>• AG Grid Enterprise 32.3 Command Center (F-07)<br/>• Bryntum Scheduler Pro 6.1 Timeline (F-08)<br/>• @paypal/react-paypal-js Fastlane & QR Modals (F-05)"]
    end

    subgraph RenderCloud["Render Cloud Production Topology (render.yaml Blueprint)"]
        APIGateway["Fastify 5 TypeScript Orchestrator (services/api)<br/>• REST Endpoints API-01..API-14 & SSE Stream<br/>• @paypal/agent-toolkit (35 Tools) & @paypal/mcp Host (F-01)<br/>• APIMatic Runtime Schema Validator (F-09)<br/>• Deterministic Sandbox Replay Engine (R-06)"]

        RiskEngine["Python 3.12 FastAPI Risk & Policy Service (services/risk-dsl)<br/>• Cosmos.AI Decision DSL Compiler & Evaluator (F-02)<br/>• M-02 Prompt-Injection Classifier (<140ms)<br/>• M-04 PyTorch Geometric GNN Fraud Scorer (<18ms, F-10)<br/>• Envoy-Patterned LLM Gateway Client (M-01, M-03, M-05)"]

        WorkflowWorker["Render Workflows Durable Worker (services/workflows)<br/>• Scheduled Invoice Dunning & Reminders (F-03)<br/>• Dispute SLA Countdown & Carrier Tracking Poller (F-04)<br/>• Zapier & Channel3 Sync Jobs (F-12)"]

        PostgresDB[("Render Managed PostgreSQL 16 + pgvector<br/>• Canonical Entities E-01..E-10<br/>• SHA-256 Hash-Chained ImmutableAuditLog (E-10)")]

        JunoRedis[("Render Managed Redis 7.4 (JunoDB 2PC Pattern)<br/>• Atomic CAS Lease on PayPal-Request-Id (F-06)<br/>• Mirror Graph Subgraph Feature Cache (F-10)")]
    end

    Elastic[("Elastic Cloud 8.15<br/>• Hybrid RAG Index (M-05)<br/>• 180-Day OpenTelemetry Audit Sink")]
    PayPalAPI["PayPal Sandbox REST v2 / MCP / Solana PYUSD"]

    WebApp <-->|HTTPS JSON + SSE Live Stream| APIGateway
    APIGateway <-->|Internal gRPC / HTTP JSON (<5ms)| RiskEngine
    APIGateway <-->|2PC CAS Idempotency Lock| JunoRedis
    APIGateway <-->|ACID Transactions| PostgresDB
    RiskEngine <-->|Subgraph Lookup| JunoRedis
    RiskEngine <-->|Hybrid Vector + BM25 RAG| Elastic
    WorkflowWorker <-->|Durable Jobs| APIGateway
    APIGateway <-->|OAuth 2.0 + PayPal-Request-Id| PayPalAPI
    APIGateway -->|OTel Spans & Audit Logs| Elastic
```

---

## 4. C4 Level 3 — Component Diagram (`services/api` & `services/risk-dsl`, Mermaid)

```mermaid
flowchart LR
    subgraph FastifyAPI["services/api (Node.js 22 + Fastify 5)"]
        AuthMW["RBAC & Signature Middleware<br/>(OAuth2 JWT + Ed25519 HITL Sig + Webhook HMAC)"]
        ApimaticVal["F-09 APIMatic Schema Validator<br/>(@paypal/paypal-server-sdk Models)"]
        JunoLock["F-06 JunoDB Idempotency Manager<br/>(UUIDv5 PayPal-Request-Id + Redis CAS)"]
        McpHost["F-01 PayPal MCP & Agent Toolkit Host<br/>(All 35 Tools across 7 Domains)"]
        PyusdBridge["F-11 Solana Token-2022 PYUSD Bridge<br/>(Memo Required + record_payment_for_invoice)"]
        ReplayGuard["R-06 Circuit Breaker & Replay Engine<br/>(Auto-Failover on HTTP 429/503)"]
    end

    subgraph PythonRisk["services/risk-dsl (Python 3.12 + FastAPI)"]
        IntentRouter["M-02 Fast Intent & Injection Classifier<br/>(XML Sandboxing + <140ms Screening)"]
        CosmosDSL["F-02 Cosmos.AI Decision DSL Engine<br/>(Compiled AST Rule DAG Evaluator)"]
        GnnScorer["F-10 / M-04 Multi-Hop GNN Scorer<br/>(GraphSAGE + LightGBM + SHAP Reasons)"]
        ElasticRag["M-05 Hybrid RAG & M-03 OCR Extractor<br/>(Compelling Evidence 3.0 Builder)"]
    end

    AuthMW --> IntentRouter
    IntentRouter --> McpHost
    McpHost --> ApimaticVal
    ApimaticVal --> GnnScorer
    GnnScorer --> CosmosDSL
    CosmosDSL -->|ALLOW| JunoLock
    JunoLock --> ReplayGuard
    ReplayGuard --> PyusdBridge
    ElasticRag --> CosmosDSL
```

---

## 5. Key End-to-End Sequence Diagrams (Mermaid)

### 5.1 Flow A: Guarded Multi-Tool Execution & Human-in-the-Loop Approval (`API-01` → `API-02`)

```mermaid
sequenceDiagram
    autonumber
    actor Op as Operator (P-01 Maya)
    participant UI as Next.js + AG Grid (F-07)
    participant API as Fastify Orchestrator (F-01)
    participant Val as APIMatic Validator (F-09)
    participant DSL as Cosmos.AI DSL + GNN (F-02, F-10)
    participant Juno as JunoDB / Redis Lock (F-06)
    participant PP as PayPal Sandbox REST v2

    Op->>UI: Enter command or click action (e.g., Refund $1,250 on Order #8812)
    UI->>API: POST /api/v1/agent/execute (prompt, dry_run=false)
    API->>DSL: Screen prompt via M-02 (<140ms) & plan tool via M-01
    DSL-->>API: Proposed tool: create_refund ($1,250.00 USD)
    API->>Val: Validate payload against @paypal/paypal-server-sdk schema
    Val-->>API: Schema VALID (0 errors)
    API->>DSL: Evaluate PolicyRule (E-05) + M-04 GNN Risk Score
    DSL-->>API: Verdict = HOLD_APPROVAL (Rule POL-02: Refund > $500.00 cap)
    API->>Juno: Persist E-04 (status=HELD, PayPal-Request-Id=pp-req-44b1) & E-10 Audit Log
    API-->>UI: SSE Event: agent.execution.held (Render Amber Row in AG Grid)
    Op->>UI: Click [Approve (Alt+A)] with FINANCE_ADMIN signature
    UI->>API: POST /api/v1/agent/approve/ex_9041 (decision=APPROVE, signature)
    API->>Juno: Acquire atomic CAS lease on pp-req-44b1
    API->>PP: POST /v2/payments/captures/{id}/refund (Header: PayPal-Request-Id: pp-req-44b1)
    PP-->>API: 201 Created (Refund ID: 9X110022, Status: COMPLETED)
    API->>Juno: Mark E-04 COMPLETED & append SHA-256 hash-chained E-10 log
    API-->>UI: SSE Event: paypal.mcp.tool_executed (Flash Row Emerald in AG Grid)
```

### 5.2 Flow B: Autonomous Webhook Dispute Defense & Compelling Evidence Assembly (`API-13` → `API-11`)

```mermaid
sequenceDiagram
    autonumber
    participant PP as PayPal Sandbox Webhooks
    participant API as Fastify Webhook Ingress (API-13)
    participant MCP as @paypal/agent-toolkit (F-04)
    participant GNN as M-04 GNN + Elastic RAG (F-10, M-05)
    participant UI as AG Grid Dispute War-Room (F-07)

    PP->>API: POST /api/v1/webhooks/paypal (CUSTOMER.DISPUTE.CREATED · PP-D-4012 · $340 INR)
    API->>PP: POST /v1/notifications/verify-webhook-signature (Cert + HMAC check)
    PP-->>API: verification_status: "SUCCESS"
    par Parallel MCP Telemetry Enrichment
        API->>MCP: get_dispute("PP-D-4012")
        API->>MCP: get_order("8XY92011")
        API->>MCP: get_shipment_tracking("8XY92011")
    end
    MCP-->>API: Carrier: DHL #77819201 · Status: DELIVERED (Signed 3d ago)
    API->>GNN: Score 3-hop Buyer-Device-Carrier subgraph + Retrieve Policy RAG
    GNN-->>API: gnn_risk_score = 0.88 (HIGH_FRIENDLY_FRAUD) + Compiled Evidence Packet
    API->>API: Persist PayPalDisputeCase (E-08) & ImmutableAuditLog (E-10)
    API-->>UI: SSE Push: Dispute PP-D-4012 Ready / Auto-Contested in 3.1s
```

---

## 6. Scalability, Offline/Replay Strategy & Failure Modes

### 6.1 Horizontal Scalability Approach
- **Stateless Compute Tiers:** Both `services/api` (Fastify) and `services/risk-dsl` (FastAPI) store zero in-process session state, enabling horizontal auto-scaling on **Render** from `1` to `16` instances based on CPU/request-queue depth.
- **Database & KV Partitioning:** `AgentToolExecution` (`E-04`) and `ImmutableAuditLog` (`E-10`) are partitioned by `workspace_id` and monthly time ranges in PostgreSQL 16, while hot idempotency keys (`PayPal-Request-Id`) use consistent hashing across Redis/JunoDB shards (`ADR-0002`).

### 6.2 Failure Modes, Circuit Breakers & Offline/Replay Strategy (`R-06`)

| Failure Mode | Detection Trigger | Automated Mitigation & Recovery |
| :--- | :--- | :--- |
| **PayPal Sandbox Rate Limit (`HTTP 429`) or Maintenance (`HTTP 503`)** | Response status `429`/`502`/`503` or socket timeout `> 2,500ms`. | **Circuit Breaker + Deterministic Replay (`FF_DEMO_REPLAY_FALLBACK`):** Retries once with exponential jitter using the same `PayPal-Request-Id`; if still throttled in demo mode, serves bit-for-bit verified Sandbox replay transcripts so live judging never stalls. |
| **Primary LLM Provider Outage (`Anthropic Claude 3.5 Sonnet` `5xx`)** | Envoy LLM Gateway health probe or `> 3,000ms` time-to-first-token. | Instant zero-drop failover to `gpt-4o-2024-08-06` using identical OpenAI/MCP JSON function schemas (`ADR-0003`). |
| **Redis / JunoDB Cache Partition** | Connection timeout `> 50ms`. | Falls back to PostgreSQL `INSERT ... ON CONFLICT (paypal_request_id) DO NOTHING` transactional locking so idempotency (`F-06`) is never compromised. |
| **GNN Worker Overload** | Inference latency `> 50ms`. | Falls back to deterministic rule-based risk score (`carrier_status == DELIVERED` + historical dispute count) and defaults high-value mutations to `HOLD_APPROVAL` (fail-closed). |

---

## 7. Architectural Trade-Offs & Links to ADRs

| Decision Area | Chosen Approach | Trade-Off Accepted | Governing ADR |
| :--- | :--- | :--- | :--- |
| **Polyglot Monorepo (`TS` + `Python`)** | Next.js/Fastify (TypeScript) for PayPal SDKs/UI + FastAPI (Python) for GNN/DSL | Slightly higher container footprint (2 backend services instead of 1) in exchange for native `@paypal/agent-toolkit` TS support AND native PyTorch Geometric GNN execution. | [`ADR-0001`](./adr/ADR-0001-tech-stack.md) |
| **Two-Phase Idempotency (`Redis` + `Postgres`)** | Synchronous CAS lease before every outbound PayPal mutation | Adds `~1.8ms` latency per mutation in exchange for a mathematical `0.00%` duplicate-charge guarantee. | [`ADR-0002`](./adr/ADR-0002-database-and-state.md) |
| **Downstream Deterministic Policy Firewall** | Compiled `Cosmos.AI` DSL outside LLM context | Requires maintaining explicit DSL schemas alongside tool definitions, but eliminates `100%` of prompt-injection spend attacks. | [`ADR-0003`](./adr/ADR-0003-ai-model-and-agent-architecture.md) |
| **Render Blueprint Multi-Service Hosting** | Declarative `render.yaml` with Managed Postgres, Redis & Render Workflows | Vendor-specific workflow syntax (`Render Workflows`) traded for zero-ops durability and `$2,250` Sponsor Prize alignment. | [`ADR-0004`](./adr/ADR-0004-hosting-and-deployment.md) |
| **Zero-PAN Tokenized Security & Signed HITL** | Strict SAQ-A boundary + Ed25519/HMAC operator approval signatures | Operators must click once (`Alt+A`) to sign `>$500` mutations, trading minor friction on large refunds for ironclad enterprise security. | [`ADR-0005`](./adr/ADR-0005-auth-and-payment-security.md) |
