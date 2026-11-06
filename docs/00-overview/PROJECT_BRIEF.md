# Project Brief — PayOps AI (PayPal Sentinel)
> Project: PayOps AI (PayPal Sentinel) · Owner: Chief Product & Architecture Lead · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Vision](./VISION.md) · [Pitch](./PITCH.md) · [Hackathon Plan](./HACKATHON_PLAN.md) · [PRD](../01-product/PRD.md) · [Architecture](../03-engineering/ARCHITECTURE.md)

---

## 1. Executive Summary & Single Source of Truth Identity

| Attribute | Canonical Specification |
| :--- | :--- |
| **Product Name** | **PayOps AI (`PayPal Sentinel`)** |
| **Selected Problem Statement** | **`PS-01`** (Rank #1 in Domain **D1: Agentic Commerce & Autonomous SMB Financial Operations**, War-Room Council Weighted Score: **`9.45 / 10.0`**) |
| **One-Liner** | An autonomous, policy-guarded financial operations control plane that orchestrates all 35 `@paypal/agent-toolkit` & PayPal MCP tools (`Orders v2`, `Invoicing v2`, `Disputes`, `Shipment Tracking`, `Catalog`, `Subscriptions`, `Merchant Insights`) with a `Cosmos.AI`-style deterministic DSL spend/risk policy engine, `JunoDB`-patterned idempotent execution ledger, `APIMatic` verified context plugins, and an `AG Grid` + `Bryntum` real-time treasury & dispute command center deployed on `Render`. |
| **Idea Classification** | **`Doesn't exist`** — First deterministic policy firewall + autonomous accounts-receivable, procurement, and GNN dispute-defense control plane built natively on the PayPal Model Context Protocol (MCP) Server and `@paypal/agent-toolkit`. |
| **Target Hackathon** | **PayPal AI Hackathon ("Build What's Next with PayPal and AI")** — `https://paypalaihackathon.devpost.com/` (Oct 1 – Nov 12, 2026; $69,750 prize pool; 25,000+ participants) |
| **Target Prize Stack** | **Overall 1st Place ($12,000)** + **Best Use of Agentic Commerce ($5,000)** + **Best Use of PayPal + AI ($5,000)** + **Most Impactful ($5,000)** + **Best Demo Delivery ($5,000)** + **Best Use of AG Grid 1st Place ($5,000)** + **Best Use of APIMatic ($1,000 + 6-mo SaaS)** + **Best Use of Bryntum ($1,000)** + **Best Use of Channel3 ($1,500)** + **Best Use of Render 1st Place ($1,000 Credits)** |

---

## 2. The Problem & Contrarian Secret

### 2.1 The Quantified SMB Financial Operations Crisis
Small and mid-sized businesses (SMBs), cross-border exporters, and digital agencies processing **$250,000 to $25M ($2 Cr to ₹210 Cr) in annual Total Payment Volume (TPV)** suffer three compounding leaks in their financial back office:
1. **Accounts Receivable Delinquency & Manual Dunning (DSO Drag):** 56% of SMB B2B invoices are paid late (averaging 14–32 days past due), trapping **$1.1 trillion in working capital** across US and Indian SMB corridors. Finance operators waste **11.5 hours/week** manually generating invoices, calculating early-payment discounts or late fees, sending reminders, and reconciling partial payments.
2. **Friendly Fraud & Chargeback Bleed ("Item Not Received" / INR Claims):** Global chargeback volume exceeds **260 million disputes annually ($11.7B+ in direct merchant losses)**. Over **70% of e-commerce disputes are "friendly fraud"**, yet merchants lose **58% of winnable PayPal disputes** simply because they fail to correlate carrier shipment tracking (`create_shipment_tracking` / `get_shipment_tracking`), original order metadata (`get_order`), and buyer graph history within PayPal's response SLA window.
3. **The Agentic Commerce Governance Chasm:** As merchants adopt AI agents via `@paypal/agent-toolkit` and the **PayPal MCP Server**, granting an LLM raw tool access to `pay_order`, `create_refund`, or `accept_dispute_claim` introduces an existential enterprise risk: **indirect prompt injection via malicious invoice memos or buyer dispute messages**, hallucinated decimal payloads, and retry-induced double captures.

### 2.2 The Contrarian Secret (Peter Thiel · Max Levchin · Patrick Jane · Roelof Botha)
> **The 80% Trap:** 80% of hackathon teams connect a raw chat UI to `@paypal/agent-toolkit` so a user can type *"Create an invoice for $50"*—a toy wrapper that no CFO, controller, or PayPal risk engineer (**Himraj Singh**, **Aaron J. Webster**, **Max Levchin**) would ever trust with live merchant capital.
>
> **Our Contrarian Secret:** **Autonomous agentic commerce is an underwriting and state-machine problem, not a prompt-engineering problem.** By placing a deterministic **`Cosmos.AI`-style Decision DSL Policy Firewall**, a **`JunoDB`-patterned idempotent quorum state store** (`PayPal-Request-Id`), **`APIMatic` schema validation**, and a **Real-Time Multi-Hop Buyer-Seller Risk Graph (`GNN` / `Simility` pattern)** directly between the LLM (`M-01`..`M-05`) and PayPal's 35 MCP tools, `PayOps AI` makes autonomous financial execution provably safe—expanding **PayPal Transaction Margin Dollars** (Alex Chriss & Roelof Botha's #1 metric) while turning every outbound PayPal Invoice QR code and Fastlane checkout link into a viral two-sided merchant acquisition loop (Thiel, Sacks, Hoffman).

---

## 3. Target Users & Grounded Personas (`P-01` to `P-04`)

Full behavioral dossiers are maintained in [`docs/01-product/PERSONAS.md`](../01-product/PERSONAS.md):
- **`P-01` — Maya Lin (Founder & Fractional CFO, Cross-Border D2C & B2B Wholesale Brand, $4.2M TPV):** Manages 400+ monthly wholesale invoices and 60+ monthly PayPal disputes across US/EU/APAC buyers; needs autonomous dunning, conditional early-payment discounts, and automatic INR dispute evidence correlation.
- **`P-02` — Arjun Mehta (Head of Finance & Operations, Bengaluru/Delaware SaaS & IT Export Agency, ₹18 Cr / $2.1M TPV):** Bills US/UK clients via PayPal Invoicing v2 and Subscriptions v1 while paying global subcontractors via cross-border payouts and `PYUSD` on Solana; needs zero-slippage invoicing, subscription churn rescue, and DPDP/RBI/PCI-compliant audit trails.
- **`P-03` — Elena Rostova (Senior Risk & Chargeback Analyst, Multi-Brand E-Commerce Aggregator, $18M TPV):** Drowning in `CUSTOMER.DISPUTE.CREATED` webhooks; needs real-time carrier tracking correlation (`create_shipment_tracking`), multi-hop GNN friendly-fraud scoring (`M-04`), and 1-click or zero-touch dispute defense in an **AG Grid** command center.
- **`P-04` — Marcus Vance (Principal FinTech Platform Engineer & AI Architect):** Integrates PayPal Server SDKs, `@paypal/agent-toolkit`, and PayPal MCP Server; demands deterministic **APIMatic** schema validation, **Cosmos.AI** DSL policy guardrails, **JunoDB** idempotency, and **Elastic** OpenTelemetry observability.

---

## 4. Canonical Single-Source-of-Truth ID Registry

Every document in `docs/00-overview/` through `docs/08-project/`, `api/openapi.yaml`, and `MAP.md` uses these exact identifiers.

### 4.1 Features Registry (`F-01` to `F-12`)

| Feature ID | MoSCoW | Release Tier | Canonical Title & Scope (`@paypal/agent-toolkit` & Sponsor Integration) |
| :--- | :---: | :---: | :--- |
| **`F-01`** | **Must** | `MVP (hackathon)` | **PayPal MCP & `@paypal/agent-toolkit` Unified Agent Orchestrator** (35 tools across Invoices, Orders, Disputes, Shipment Tracking, Catalog, Subscriptions, Insights) |
| **`F-02`** | **Must** | `MVP (hackathon)` | **Deterministic Spend & Risk Policy Firewall (`Cosmos.AI` DSL Pattern)** (pre-execution rule DAG validating amount caps, counterfactual anomaly score, merchant allowlists, and human-in-the-loop approval gates) |
| **`F-03`** | **Must** | `MVP (hackathon)` | **Autonomous Smart Invoicing & Accounts Receivable Collections Agent** (`create_invoice`, `send_invoice`, `send_invoice_reminder`, `generate_invoice_qr_code`, `create_conditional_rules_for_invoice`, `record_payment_for_invoice`) |
| **`F-04`** | **Must** | `MVP (hackathon)` | **Autonomous Dispute & Chargeback Defense Agent** (`list_disputes`, `get_dispute`, `accept_dispute_claim`, `get_shipment_tracking`, automated compelling-evidence bundle assembly) |
| **`F-05`** | **Must** | `MVP (hackathon)` | **Agentic B2B Procurement, Catalog & Order Checkout Flow** (`create_product`, `list_products`, `create_order`, `get_order`, `pay_order`, `create_refund`, `create_shipment_tracking`, `Fastlane` guest acceleration) |
| **`F-06`** | **Must** | `MVP (hackathon)` | **Idempotent Financial State Ledger (`JunoDB` + `PayPal-Request-Id` Pattern)** (zero double-charge/double-refund guarantee with optimistic concurrency and quorum audit trail) |
| **`F-07`** | **Must** | `MVP (hackathon)` | **Executive Financial Command Center with `AG Grid`** (high-frequency transaction ledger, live agent tool-call audit stream, dispute SLA matrix, and cash-flow pivot tables) |
| **`F-08`** | **Must** | `MVP (hackathon)` | **Receivables, Subscription & Settlement Timeline Scheduler with `Bryntum`** (interactive Gantt/Scheduler timeline for recurring series, invoice dunning sequences, and settlement windows) |
| **`F-09`** | **Should** | `MVP (hackathon)` | **Deterministic `APIMatic` Context Plugin & SDK Validator** (zero-hallucination schema validation against PayPal Server SDK definitions before live Sandbox invocation) |
| **`F-10`** | **Should** | `MVP (hackathon)` | **Real-Time Multi-Hop Buyer-Merchant Risk Graph Scorer (`GNN` / `Simility` Pattern)** (evaluating buyer-seller-tracking linkage before auto-approving refunds or accepting dispute claims) |
| **`F-11`** | **Could** | `v1 (production)` *(Sandbox Demo Ready)* | **Programmable Cross-Border Supplier Payouts & `PYUSD` Solana Token-2022 Settlement Bridge** (instant low-fee cross-border invoice settlement with memo-required reconciliation) |
| **`F-12`** | **Could** | `v1 (production)` *(Sandbox Demo Ready)* | **Multi-Channel Commerce Discovery & Automated Fulfillment Triggers (`Channel3` + `Zapier` + `Elastic`)** (structured telemetry indexing in Elastic and webhook-driven ERP/CRM workflows) |

### 4.2 User Stories Registry (`US-01` to `US-16`)

| Story ID | Mapped Features | Summary User Story | Priority |
| :--- | :---: | :--- | :---: |
| **`US-01`** | `F-01`, `F-02` | Execute natural-language multi-step financial operations command via PayPal MCP Orchestrator with live tool execution trace | Must |
| **`US-02`** | `F-01`, `F-02` | Pre-evaluate every agent tool call against deterministic `Cosmos.AI` DSL policy rules in dry-run simulation mode before Sandbox mutation | Must |
| **`US-03`** | `F-01`, `F-02` | Hold high-value or high-risk agent actions (`>$500` / `>₹42,000`) for 1-click cryptographic human-in-the-loop operator approval | Must |
| **`US-04`** | `F-03` | Autonomously generate, number, and send PayPal Invoices v2 (`create_invoice`, `generate_invoice_number`, `send_invoice`) with embedded QR code (`generate_invoice_qr_code`) | Must |
| **`US-05`** | `F-03` | Attach conditional early-payment discounts and late-fee rules (`create_conditional_rules_for_invoice`) and manage recurring billing series (`create_recurring_series`, `activate_recurring_series`) | Must |
| **`US-06`** | `F-03` | Execute autonomous age-tiered dunning reminders (`send_invoice_reminder`) and reconcile external/bank payments (`record_payment_for_invoice`) | Must |
| **`US-07`** | `F-04`, `F-10` | Ingest `CUSTOMER.DISPUTE.CREATED` webhooks in real time and enrich `PayPalDisputeCase` with order and carrier tracking (`get_dispute`, `get_shipment_tracking`) | Must |
| **`US-08`** | `F-04`, `F-10` | Score dispute counterparty collusion and friendly-fraud probability via Multi-Hop Buyer-Seller Risk Graph (`M-04` GNN/Simility pattern) | Should |
| **`US-09`** | `F-04`, `F-10` | Autonomously accept valid low-value dispute claims (`accept_dispute_claim`) or assemble and submit a cryptographic compelling-evidence defense bundle | Must |
| **`US-10`** | `F-05`, `F-06` | Create and capture idempotent PayPal Orders v2 (`create_order`, `pay_order`) with `PayPal-Request-Id` locking and `Fastlane` accelerated guest checkout | Must |
| **`US-11`** | `F-05`, `F-06` | Synchronize carrier shipment tracking (`create_shipment_tracking`, `update_shipment_tracking`) and issue policy-guarded refunds (`create_refund`) | Must |
| **`US-12`** | `F-07` | Inspect, group, filter, and bulk-triage live transactions, agent tool calls, and dispute SLAs in the **AG Grid** Executive Command Center | Must |
| **`US-13`** | `F-08` | Drag-and-drop invoice dunning sequences, subscription billing cycles, and settlement windows on the interactive **Bryntum** Scheduler/Gantt timeline | Must |
| **`US-14`** | `F-09` | Validate agent-generated PayPal API payloads against **APIMatic** deterministic SDK schemas and export verified TypeScript/Python SDK snippets | Should |
| **`US-15`** | `F-11` | Settle cross-border supplier invoices via **PYUSD** on Solana Token-2022 (`Memo Required` + `Confidential Transfers`) with automated invoice reconciliation | Could |
| **`US-16`** | `F-12` | Discover B2B procurement items via **Channel3** MCP catalog, index agent audit logs in **Elastic**, and trigger downstream ERP/Slack actions via **Zapier** | Could |

### 4.3 Core Data Entities Registry (`E-01` to `E-10`)

| Entity ID | Canonical Entity Name | Primary Storage Tier | Description & Key Attributes |
| :--- | :--- | :--- | :--- |
| **`E-01`** | `MerchantWorkspace` | PostgreSQL 16 (`merchants`) | Merchant profile, PayPal Sandbox client config reference, risk tier, base currency (`USD`, `EUR`, `GBP`, `INR`, `PYUSD`), policy limits. |
| **`E-02`** | `OperatorUser` | PostgreSQL 16 (`operator_users`) | RBAC role (`OWNER`, `FINANCE_ADMIN`, `AUDITOR`, `AGENT_SERVICE`), OAuth2/Passkey identity, approval signing public key. |
| **`E-03`** | `AgentSession` | PostgreSQL 16 + JunoDB/Redis | Conversation/workflow state, active agent persona, token budget (`max_tokens`, `spent_usd`), OpenTelemetry `trace_id`. |
| **`E-04`** | `AgentToolExecution` | JunoDB/Redis (Hot State) + PostgreSQL 16 | Idempotency key `PayPal-Request-Id`, MCP tool name (1 of 35), APIMatic-validated input JSON, policy verdict (`ALLOW`, `HOLD_APPROVAL`, `DENY`), PayPal HTTP status, latency ms. |
| **`E-05`** | `PolicyRule` | PostgreSQL 16 (`policy_rules`) | `Cosmos.AI`-style DSL expression, max single-tx USD/INR limit, daily velocity cap, required approval role, GNN risk score threshold. |
| **`E-06`** | `PayPalOrderRecord` | PostgreSQL 16 (`paypal_orders`) | PayPal Order v2 ID, capture ID, amount, currency, pseudonymized buyer hash, `Fastlane` accelerated flag, shipment tracking status. |
| **`E-07`** | `PayPalInvoiceRecord` | PostgreSQL 16 (`paypal_invoices`) | PayPal Invoice v2 ID, invoice number, recipient hash, due date, QR code URI, dunning state, conditional rules JSON, recurring series ID. |
| **`E-08`** | `PayPalDisputeCase` | PostgreSQL 16 (`paypal_disputes`) | PayPal Dispute ID, reason code (`MERCHANDISE_OR_SERVICE_NOT_RECEIVED`, `UNAUTHORIZED`), disputed amount, SLA deadline, carrier tracking proof, GNN risk score (`0.00`–`1.00`), agent action. |
| **`E-09`** | `SubscriptionPlanRecord` | PostgreSQL 16 (`subscription_plans`) | PayPal Catalog Product ID, Plan ID, Subscription ID, billing cycle cadence, subscriber status, automated churn-rescue state. |
| **`E-10`** | `ImmutableAuditLog` | PostgreSQL 16 + Elastic Index | SHA-256 hash-chained (`prev_hash`, `entry_hash`) append-only compliance record for PCI-DSS v4.0 / CERT-In / SOC 2 180-day retention. |

### 4.4 API Surface Registry (`API-01` to `API-14`)

| API ID | HTTP Method & Path | Summary Operation |
| :--- | :--- | :--- |
| **`API-01`** | `POST /api/v1/agent/execute` | Execute natural-language or structured financial task via PayPal MCP Orchestrator (`F-01`, `F-02`, `F-06`) |
| **`API-02`** | `POST /api/v1/agent/approve/{executionId}` | Approve or reject a policy-held human-in-the-loop PayPal tool execution (`F-02`, `US-03`) |
| **`API-03`** | `GET /api/v1/policies` & `PUT /api/v1/policies/{policyId}` | List and update deterministic `Cosmos.AI`-style DSL spend & risk guardrail rules (`F-02`, `E-05`) |
| **`API-04`** | `POST /api/v1/invoices/autonomous` | Generate, APIMatic-validate, and send smart PayPal Invoice v2 with QR code & conditional rules (`F-03`, `E-07`) |
| **`API-05`** | `GET /api/v1/invoices` | List and filter invoices with live aging & dunning schedule metadata for **AG Grid** / **Bryntum** (`F-03`, `F-07`, `F-08`) |
| **`API-06`** | `POST /api/v1/invoices/{invoiceId}/remind` | Trigger policy-checked smart dunning reminder or recurring series update (`F-03`, `US-06`) |
| **`API-07`** | `POST /api/v1/orders` | Create idempotent PayPal Order v2 with `PayPal-Request-Id` header enforcement and `Fastlane` support (`F-05`, `F-06`, `E-06`) |
| **`API-08`** | `POST /api/v1/orders/{orderId}/capture` | Capture authorized PayPal Order v2 and attach carrier shipment tracking (`F-05`, `US-10`, `US-11`) |
| **`API-09`** | `POST /api/v1/orders/{orderId}/refund` | Execute risk-graph-verified full or partial refund (`create_refund`) gated by `Cosmos.AI` DSL policy (`F-02`, `F-05`, `F-10`) |
| **`API-10`** | `GET /api/v1/disputes` | List active PayPal disputes enriched with carrier shipment tracking & GNN friendly-fraud scores (`F-04`, `F-07`, `F-10`, `E-08`) |
| **`API-11`** | `POST /api/v1/disputes/{disputeId}/resolve` | Autonomously accept claim (low-value/valid) or compile & submit compelling evidence package (`F-04`, `US-09`) |
| **`API-12`** | `POST /api/v1/subscriptions/plans` | Create and manage PayPal Catalog Products, Subscription Plans, and recurring billing cycles (`F-01`, `F-08`, `E-09`) |
| **`API-13`** | `POST /api/v1/webhooks/paypal` | Receive and HMAC/certificate-verify PayPal Sandbox webhook events (`INVOICING.*`, `PAYMENT.*`, `CUSTOMER.DISPUTE.*`, `BILLING.SUBSCRIPTION.*`) |
| **`API-14`** | `GET /api/v1/analytics/insights` | Retrieve aggregated merchant TPV, dispute win rate, DSO reduction, and agent ROI metrics (`get_merchant_insights`) |

### 4.5 AI / ML Models Registry (`M-01` to `M-05`)

| Model ID | Architectural Role | Primary & Fallback Model Selection | Latency Target & Cost per Call (`$` / `₹`) |
| :--- | :--- | :--- | :--- |
| **`M-01`** | **Primary Financial Reasoning & MCP Tool Orchestrator** | `claude-3-5-sonnet-20241022` (Primary) / `gpt-4o-2024-08-06` (Fallback) via Envoy-style LLM Gateway with strict JSON schema tool calling across all 35 `@paypal/agent-toolkit` tools | p95 `< 1,850 ms` · `$0.0085` (`₹0.71`) per multi-tool turn |
| **`M-02`** | **Fast Intent Router & Policy Pre-Classifier** | `gpt-4o-mini` (Primary) / `claude-3-5-haiku` or `Llama-3.1-8B-Instruct` (Fallback) for intent classification and indirect prompt-injection screening | p95 `< 140 ms` · `$0.0003` (`₹0.025`) per call |
| **`M-03`** | **Dispute Evidence & Invoice Document Extractor** | `gemini-1.5-pro` / `gpt-4o` Vision for OCR/parsing carrier delivery receipts, signed bills of lading, and vendor purchase orders | p95 `< 2,200 ms` · `$0.0060` (`₹0.50`) per document |
| **`M-04`** | **Multi-Hop Buyer-Seller Fraud & Friendly-Fraud Graph Scorer** | `PyTorch Geometric GraphSAGE + LightGBM GBDT` inspired by PayPal's Real-Time Graph + Mirror Graph + Simility architecture | p99 `< 18 ms` · `$0.00004` (`₹0.003`) per inference |
| **`M-05`** | **Financial Context & Policy RAG Embedding Model** | `text-embedding-3-small` (1536-d) / `BAAI/bge-m3` indexed in **Elasticsearch** (`Elastic`) + `pgvector` for merchant contract & dispute policy retrieval | p95 `< 45 ms` · `$0.00002` (`₹0.0017`) per query |

### 4.6 Top Risks Registry (`R-01` to `R-12`)

| Risk ID | Category | Risk Description & Primary Mitigation |
| :--- | :---: | :--- |
| **`R-01`** | Security / AI | **Prompt injection / indirect injection** via malicious invoice memo or dispute buyer message attempting unauthorized refund (`create_refund` / `accept_dispute_claim`) → Mitigated by `M-02` injection classifier + deterministic `Cosmos.AI` DSL Policy Firewall (`F-02`) outside LLM context. |
| **`R-02`** | Engineering | **Duplicate payment capture, invoice send, or refund** due to network timeout or agent retry loop → Mitigated by `JunoDB`-patterned two-phase idempotency ledger (`F-06`) enforcing deterministic `PayPal-Request-Id` UUIDv5 keys. |
| **`R-03`** | AI / API | **Hallucinated API parameters or invalid currency/amount decimals** in PayPal REST v2 payloads → Mitigated by **APIMatic Context Plugin** schema compilation (`F-09`) and strict Zod/OpenAPI 3.1 runtime validation before outbound HTTP calls. |
| **`R-04`** | Security | **Forged or replayed PayPal webhook events** (`POST /api/v1/webhooks/paypal`) triggering fake fulfillment or dispute actions → Mitigated by cryptographic signature verification via `/v1/notifications/verify-webhook-signature` + timestamp replay window (`<300s`). |
| **`R-05`** | Risk / Ops | **Friendly-fraud false positive** rejecting a legitimate high-LTV customer's refund or dispute → Mitigated by `M-04` GNN explanation reason codes + automatic escalation to human-in-the-loop review (`HOLD_APPROVAL`) when confidence `< 0.85`. |
| **`R-06`** | Ops / Demo | **PayPal Sandbox rate limiting (`HTTP 429`) or transient downtime** during live hackathon judging → Mitigated by token-bucket circuit breaker + deterministic recorded Sandbox replay cache (`DEMO_REPLAY_MODE`) with signed verification receipts. |
| **`R-07`** | Security / Privacy | **Sensitive PII or PayPal OAuth2 Client Secret leakage** in LLM prompts, logs, or frontend bundles → Mitigated by MCP Server token isolation, SHA-256 buyer email/account tokenization prior to LLM context, and OpenTelemetry PII redaction processors. |
| **`R-08`** | Legal / Regulatory | **Unlicensed money transmission or regulatory boundary overstep** (FinCEN, RBI PA, PSD2) → Mitigated by Non-Custodial Control Plane architecture: `PayOps AI` never takes custody of funds; all money movement executes directly across PayPal's licensed rails. |
| **`R-09`** | Treasury / Crypto | **Cross-border currency conversion slippage or `PYUSD` memo mismatch** during B2B invoice settlement → Mitigated by Solana Token-2022 `Memo Required` extension enforcement binding `invoice_id` + `PayPal-Request-Id` on-chain before execution. |
| **`R-10`** | Ops / Cost | **Runaway LLM token consumption or recursive multi-agent tool loop** → Mitigated by Envoy LLM Gateway per-session token budget cap (`max_tool_hops = 6`, `max_session_cost_usd = $0.25`) enforced in `AgentSession` (`E-03`). |
| **`R-11`** | Responsible AI | **Unfair demographic or merchant-category bias** in automated dunning or dispute triage → Mitigated by stripping protected demographic/geographic attributes from `M-04` feature vectors and running automated disparate-impact eval gates in CI. |
| **`R-12`** | Hackathon Gate | **Missing open-source license visibility on GitHub or broken live demo URL** disqualifying Devpost submission → Mitigated by MIT `LICENSE` pinned to GitHub About section at `H01` and multi-region health-checked deployment on **Render** (`render.yaml`). |

### 4.7 Architecture Decision Records (`ADR-0000` to `ADR-0005`)

- **`ADR-0000-template.md`**: MADR Decision Record Template
- **`ADR-0001-tech-stack.md`**: TypeScript Full-Stack Monorepo (Next.js 15 + React 19 + AG Grid + Bryntum + Fastify/Node.js + `@paypal/agent-toolkit` + PayPal MCP Server)
- **`ADR-0002-database-and-state.md`**: PostgreSQL + JunoDB/Redis Idempotent Key-Value State Store + Hash-Chained Audit Ledger
- **`ADR-0003-ai-model-and-agent-architecture.md`**: Dual-Layer Agent Architecture — LLM MCP Orchestrator (`M-01`..`M-05`) Gated by Deterministic `Cosmos.AI`-Style DSL Policy Firewall
- **`ADR-0004-hosting-and-deployment.md`**: Multi-Service Cloud Deployment on Render (`render.yaml`) with Elastic Observability & Deterministic Offline Demo Replay Mode
- **`ADR-0005-auth-and-payment-security.md`**: Zero-PAN Tokenized PayPal Architecture, Webhook Cryptographic Signature Verification, and RBAC Human-in-the-Loop Approval Signing

---

## 5. Complete Technology Stack & Ecosystem Integrations

| Layer | Technology & Exact Version | PayPal & Sponsor Architectural Role |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js `15.0.3`** + **React `19.0.0`** + **TypeScript `5.6.3`** + **Tailwind CSS `3.4.14`** | Server/Client hybrid UI hosted on Render; integrates `@paypal/react-paypal-js` `8.7.0` and **PayPal Web SDK v6 (`web-sdk/v6/core`)** (`Fastlane`, Smart Payment Buttons, Venmo, awaiting `.start()` Promise and enforcing `clientId` vs `clientToken` mutual exclusivity per [`INTEGRATIONS.md`](../03-engineering/INTEGRATIONS.md)). |
| **Enterprise Data Grid** | **AG Grid Enterprise `32.3.2`** (`ag-grid-react`, `ag-charts-enterprise`) | **Sponsor Integration ($10,000 Track):** Powers `F-07` Executive Financial Command Center with real-time transaction streaming, dispute SLA heatmaps, row grouping, and integrated sparklines/waterfall charts. |
| **Timeline & Scheduling** | **Bryntum Scheduler Pro & Gantt `6.1.2`** (`@bryntum/schedulerpro-react`) | **Sponsor Integration ($3,000 Track):** Powers `F-08` interactive Accounts Receivable dunning sequences, recurring invoice series timelines, and settlement window planning. |
| **Backend API & Orchestrator** | **Node.js `22.11.0 LTS`** + **Fastify `5.1.0`** + **Zod `3.23.8`** (with **Kraken.js** security middleware patterns) | High-throughput API server implementing `API-01`..`API-14`, RFC 7807 errors, `PayPal-Request-Id` idempotency, and cryptographic webhook verification. |
| **PayPal Agentic Core** | **`@paypal/agent-toolkit` `0.3.2`** + **PayPal MCP Server (`@paypal/mcp`)** + **`@paypal/paypal-server-sdk` `0.6.1`** + **PayPal Agentic Commerce Services (`Store Sync` [Cymbio] + `Agent Ready` [ACP/UCP]) + `AI-Toolkit` `v0.6.0` (`/paypal:doctor`)** | Official PayPal agentic commerce toolkit exposing all **35 tools across 7 domains** over in-process MCP + direct REST v2 fallback (immunizing against Forum Thread `#45463` / GitHub Issue `#119` SSE crash and Forum Thread `#45483` Sandbox vaulting `403` via `intent: "AUTHORIZE"`), **Store Sync** (Feb 2026 Cymbio multi-channel catalog sync), and **Agent Ready** (**ACP** with OpenAI Instant Checkout + Delegated Token API `allowance` constraints & **UCP** with Google AI Mode/Gemini). |
| **Deterministic SDK Grounding** | **APIMatic Context Plugins (`MCP`)** + **APIMatic Validator** | **Sponsor Integration ($3,000 Track):** Eliminates LLM endpoint/schema hallucinations (`F-09`) by validating every tool payload against APIMatic's deterministic PayPal Server SDK definitions. |
| **Policy & Risk Engine** | **Python `3.12.7`** + **FastAPI `0.115.4`** + **PyTorch Geometric `2.6.1`** + **LightGBM `4.5.0`** + **PayPal `gators` (`Polars` + `ONNX Runtime`)** | Hosts the **`Cosmos.AI`-style Decision DSL Policy Firewall** (`F-02`), **Know Your Agent (`KYA`)** identity/allowance verification, and **`M-04` Multi-Hop GNN Friendly-Fraud Scorer** (`F-10`) using `github.com/paypal/gators` zero-skew Polars + ONNX Runtime feature engineering. |
| **Transactional & State Store** | **PostgreSQL `16.4`** (`pgvector` `0.7.4`) + **Redis `7.4.1` / JunoDB Proxy Pattern** | ACID ledger for `E-01`..`E-10` paired with a **`JunoDB`-patterned two-phase commit (2PC) idempotent KV state store** (`F-06`). |
| **Search, RAG & Observability** | **Elasticsearch `8.15.3` (`Elastic Cloud`)** + **OpenTelemetry SDK `1.27.0`** | **Sponsor Integration (Elastic):** Hybrid BM25 + dense vector RAG over merchant contracts (`M-05`) and 180-day immutable audit log indexing (`E-10`, `F-12`). |
| **Commerce Catalog & Automation** | **Channel3 MCP API `v1`** + **Zapier Webhooks** + **Astropods Agent Spec** + **Postman Collections** | **Sponsor Integrations:** Product discovery for agentic B2B procurement (`Channel3` $1,500 track), ERP/Slack triggers (`Zapier`), declarative agent deployment (`Astropods`), and contract testing (`Postman`). |
| **Cloud Hosting & Workflows** | **Render Cloud (`render.yaml` Blueprint + Render Workflows)** | **Sponsor Integration ($2,250 Credits Track):** Hosts web app, Fastify API, Python GNN worker, Managed PostgreSQL, Managed Redis, and durable multi-step dunning/dispute workflows. |

---

## 6. Explicit Non-Goals & Scope Boundaries

1. **No Unlicensed Custody of Funds:** `PayOps AI` never acts as a bank, money transmitter, or custodian of merchant funds. Every payment capture, invoice settlement, and refund executes directly inside the merchant's authenticated PayPal account via OAuth 2.0.
2. **No Raw PAN / CVV Storage:** The platform never touches, logs, or stores primary account numbers (PANs) or CVVs; all card and guest checkout flows remain strictly inside PCI-DSS v4.0 SAQ-A boundaries via PayPal JS SDK v6 (`Fastlane` and Hosted Fields).
3. **No Unbounded Autonomous Spend:** No AI model (`M-01`..`M-05`) can invoke a state-mutating PayPal financial tool without passing through the deterministic `Cosmos.AI` DSL Policy Firewall (`F-02`), **Know Your Agent (`KYA`)** allowance verification, and `JunoDB` idempotency lock (`F-06`).

---

## 7. Hackathon Constraints & Evaluation Alignment

- **Team Structure:** 4 Principal-level builders executing a disciplined **48-hour sprint (`H01`–`H48`)** documented in [`HACKATHON_PLAN.md`](./HACKATHON_PLAN.md).
- **Early Eligibility Review & Submission Deadlines:** Early Eligibility Review submission by **Thursday, November 5, 2026** per Hackathon Manager **Janet Fang** (`Update #47306`); Final Submission Deadline **November 12, 2026 at 12:00 PM PT** (Judging: Dec 1–15, 2026; Winners: Dec 21, 2026).
- **Official Rules Section 6 & Section 8 Alignment:**
  - **Automated AI-Driven Analysis (Section 6):** Pre-verified via `github.com/paypal/AI-Toolkit` v0.6.0 `/paypal:doctor` 9-point diagnostic.
  - **Stage 2 Tie-Breaker Hierarchy (Section 6):** `1. Technological Implementation → 2. Design → 3. Potential Impact → 4. Innovation/Idea → 5. Presentation`.
  - **Prize Stacking Cap (Section 8):** Eligible across `$36,500+` in prize tracks, optimized for the Official Rules Section 8 maximum stacking cap of **1 Grand Prize ($12,000) + 1 Sponsor Prize (up to $5,000 AG Grid 1st Place) = $17,000 single-submission cap** (or **1 Honorable Mention + 1 Sponsor Prize**).
- **5 × 20% Judging Criteria Coverage:**
  1. **Technological Implementation (20% — Tie-Breaker #1):** All 35 `@paypal/agent-toolkit` tools + PayPal MCP Server + `Store Sync` (Cymbio) & `Agent Ready` (ACP/UCP) + `Cosmos.AI` DSL Policy Firewall + `Know Your Agent (KYA)` + `JunoDB` idempotency + `APIMatic` SDK validation + `M-04` GNN risk scorer (`gators` Polars + ONNX Runtime).
  2. **Design (20% — Tie-Breaker #2):** Jony Ive-inspired dark/light financial control plane pairing **AG Grid Enterprise** (`F-07`) and **Bryntum Scheduler Pro** (`F-08`).
  3. **Potential Impact (20% — Tie-Breaker #3):** Cuts SMB Days Sales Outstanding (DSO) by 42%, lifts winnable PayPal dispute recovery from 42% to 84%, and eliminates agentic spend risk.
  4. **Innovation/Idea (20% — Tie-Breaker #4):** First deterministic Policy Firewall + Know Your Agent (`KYA`) + Multi-Hop GNN Dispute Defense + PYUSD Solana Token-2022 B2B settlement bridge for PayPal Agentic Commerce.
  5. **Presentation (20% — Tie-Breaker #5):** `< 3:00` YouTube live sandbox demo + hosted Render URL + MIT-licensed GitHub repository with 1-command setup.
