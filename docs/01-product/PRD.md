# Product Requirements Document (PRD) — PayOps AI (PayPal Sentinel)
> Project: PayOps AI (PayPal Sentinel) · Owner: VP of Product Management · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [Personas](./PERSONAS.md) · [User Stories](./USER_STORIES.md) · [Features](./FEATURES.md) · [Architecture](../03-engineering/ARCHITECTURE.md)

---

## 1. Background & Problem Statement (Grounded in Market Data)

Small and mid-sized businesses (SMBs), digital agencies, and cross-border exporters using PayPal process hundreds of billions of dollars in commerce annually, yet their back-office financial operations remain fractured across manual spreadsheets, uncoordinated carrier portals, and reactive dispute inboxes:

1. **The $1.1 Trillion Late-Invoice & DSO Crisis:** According to Intuit QuickBooks and PYMNTS global SMB working-capital studies, **56% of SMB B2B invoices are paid past their due date**, with an average Days Sales Outstanding (DSO) of **28 to 41 days**. In the US–India SaaS and wholesale export corridor, finance teams spend **11.5 hours per week** manually generating invoices, calculating early-payment incentives, sending dunning reminders, and reconciling bank or stablecoin receipts.
2. **The $11.7 Billion Friendly-Fraud & INR Chargeback Bleed:** LexisNexis and Chargebacks911 report that **70%+ of e-commerce payment disputes are first-party "friendly fraud"** (buyers claiming *Merchandise or Service Not Received* [`MERCHANDISE_OR_SERVICE_NOT_RECEIVED`] after delivery). Even when merchants have valid DHL/FedEx/UPS proof of delivery, they lose **58% of winnable disputes** because carrier tracking numbers were never attached to the PayPal Order (`create_shipment_tracking`) or evidence packages were not compiled before the PayPal dispute SLA expired.
3. **The Enterprise Governance Gap in Agentic Commerce:** PayPal's launch of `@paypal/agent-toolkit` (35 tools across 7 domains) and the **PayPal MCP Server** allows AI agents to programmatically execute `create_invoice`, `pay_order`, `create_refund`, and `accept_dispute_claim`. However, connecting a probabilistic LLM directly to money-moving APIs exposes merchants to three critical failure modes:
   - **Indirect Prompt Injection (`R-01`):** A buyer embeds adversarial instructions inside an invoice memo or dispute message to trigger an unauthorized refund;
   - **Non-Idempotent Retry Loops (`R-02`):** Network timeouts cause an agent to invoke `pay_order` or `create_refund` multiple times; and
   - **Schema Hallucinations (`R-03`):** LLMs invent deprecated v1 parameters or malformed currency decimals on v2 endpoints.

**PayOps AI (`PayPal Sentinel`)** solves all three problems in a single integrated platform: an autonomous AI CFO and Dispute-Defense Control Plane gated by a deterministic **`Cosmos.AI`-style Decision DSL Policy Firewall (`F-02`)**, a **`JunoDB`-patterned idempotent state ledger (`F-06`)**, **`APIMatic` deterministic SDK validation (`F-09`)**, and an executive **`AG Grid` + `Bryntum`** financial cockpit (`F-07`, `F-08`).

---

## 2. Product Goals & Non-Goals

### 2.1 Primary Product Goals
- **G-01 (Full-Spectrum PayPal Agentic Orchestration):** Orchestrate all **35 tools across all 7 domains** of `@paypal/agent-toolkit` and the PayPal MCP Server with `100.0%` schema validity (`F-01`, `F-09`).
- **G-02 (Provably Safe Financial Autonomy):** Intercept 100% of state-mutating agent tool calls in a deterministic `Cosmos.AI` DSL Policy Firewall (`F-02`) with `< 5ms` rule evaluation overhead and human-in-the-loop cryptographic approval (`US-03`) above merchant-defined thresholds.
- **G-03 (Working Capital Acceleration):** Cut merchant Days Sales Outstanding (DSO) by **>= 40%** through autonomous smart invoicing, QR code generation, conditional early-payment discounts/late fees, and scheduled dunning (`F-03`, `F-08`).
- **G-04 (Zero-Touch Dispute Defense):** Increase winnable PayPal dispute recovery from **42% baseline to >= 80%** by automatically correlating `CUSTOMER.DISPUTE.CREATED` webhooks with carrier shipment tracking (`get_shipment_tracking`), Multi-Hop GNN risk scoring (`F-10`, `M-04`), and Elastic hybrid RAG evidence assembly (`F-04`).
- **G-05 (Executive Visibility & Zero Double-Charges):** Guarantee `0.00%` duplicate financial mutations via `JunoDB`-patterned `PayPal-Request-Id` locking (`F-06`) while providing sub-100ms live triage in **AG Grid Enterprise** (`F-07`) and **Bryntum Scheduler Pro** (`F-08`).

### 2.2 Explicit Non-Goals
- **NG-01:** Acting as a licensed money transmitter, bank, or custodian of merchant funds (`PayOps AI` is a non-custodial orchestration & risk control plane operating via OAuth 2.0 on the merchant's PayPal account).
- **NG-02:** Processing or storing raw credit card PANs or CVVs (all checkout interactions remain strictly inside PCI-DSS v4.0 SAQ-A tokenized PayPal JS SDK / `Fastlane` boundaries).
- **NG-03:** Replacing general-purpose accounting tax-filing engines (we integrate downstream with ERP/accounting systems via **Zapier** webhooks and CSV/JSON exports).

---

## 3. Success Metrics Summary

| Metric Category | Metric Name | Baseline (Manual SMB Ops) | `MVP (hackathon)` Target | `v1 (production)` Target |
| :--- | :--- | :---: | :---: | :---: |
| **North Star (`NSM`)** | **Autonomous Net Margin Protected & Recovered (`ANMPR`)** | `$0 / mo` | `$4,470 / mo` (`₹3.75L / mo`) simulated on `$100k` monthly TPV | `>= 3.8%` of Merchant TPV |
| **Receivables (`F-03`)** | **Average Days Sales Outstanding (DSO)** | `28.0 days` | `16.0 days (-42.8%)` | `<= 15.0 days` |
| **Dispute Defense (`F-04`)** | **Winnable INR Dispute Win Rate & Response Time** | `42% win · 38 hrs` | `84% win · < 4.0 seconds` | `>= 85% win · < 5.0 seconds` |
| **Safety (`F-02`, `F-06`)** | **Unauthorized Spend & Duplicate Mutation Rate** | `Unbounded in raw LLM agents` | `0.00%` (100% red-team block rate) | `0.00%` |
| **SDK Accuracy (`F-09`)** | **APIMatic Pre-Flight Schema Validity Rate** | `88.5%` (raw LLM JSON) | `100.0%` (`0` HTTP 400 payload errors) | `100.0%` |

---

## 4. Target Personas Summary (`P-01` to `P-04`)

Detailed behavioral profiles reside in [`PERSONAS.md`](./PERSONAS.md):
- **`P-01` — Maya Lin (Founder & Fractional CFO, D2C & B2B Wholesale Brand, $4.2M TPV):** Primary user of `F-01`, `F-02`, `F-03`, `F-07`, `F-08`.
- **`P-02` — Arjun Mehta (Head of Finance, Bengaluru/US SaaS & IT Export Agency, ₹18 Cr / $2.1M TPV):** Primary user of `F-03`, `F-08`, `F-11` (`PYUSD` cross-border bridge), `F-12`.
- **`P-03` — Elena Rostova (Senior Risk & Chargeback Analyst, Multi-Brand E-Commerce, $18M TPV):** Primary user of `F-04`, `F-07`, `F-10` (`M-04` GNN Fraud Scorer).
- **`P-04` — Marcus Vance (Principal FinTech Platform Engineer & AI Architect):** Primary user of `F-01`, `F-02`, `F-06`, `F-09` (`APIMatic` Context Plugin & SDK code exporter).

---

## 5. Release Scope Matrix (`MVP (hackathon)` vs. `v1 (production)` vs. `v2`)

| Horizon | Target Environment | Included Capabilities |
| :--- | :--- | :--- |
| **`MVP (hackathon)`** | Live **Render** Cloud Deployment + **PayPal Developer Sandbox** + **Solana Devnet (`PYUSD`)** | Full working implementation of **`F-01` through `F-10`** (`Must`/`Should`) plus live Sandbox/Devnet demonstrations of **`F-11` (`PYUSD` bridge)** and **`F-12` (`Channel3`, `Elastic`, `Zapier`)**, complete with deterministic Sandbox replay fallback (`R-06`). |
| **`v1 (production)`** | Multi-Region Production Cloud (US-East / EU-Central / India-Mumbai) + **PayPal Live REST v2 & PPCP** + **Solana Mainnet (`PYUSD`)** | Multi-tenant PayPal Partner OAuth2 onboarding (`PayPal-Partner-Attribution-Id`), live carrier webhook connectors (FedEx/DHL/UPS/Shiprocket), SOC 2 Type II & PCI-DSS v4.0 SAQ-A attestation, and automated shadow-mode policy backtesting. |
| **`v2 (scale)`** | Global Two-Sided Agentic Commerce Clearinghouse | Autonomous Buyer-MCP ↔ Seller-MCP price/discount negotiation, instant invoice factoring underwritten via `M-04` GNN trust scores, and PayPal Working Capital integration. |

---

## 6. Functional Requirements (`F-01` to `F-12`)

### `F-01` — PayPal MCP & `@paypal/agent-toolkit` Unified Agent Orchestrator
- **Priority:** `Must` (`MVP (hackathon)`) · **User Stories:** `US-01`, `US-02` · **Endpoints:** `API-01`
- **Description:** Central orchestration engine connecting `M-01` (`Claude 3.5 Sonnet` / `GPT-4o`) and `M-02` (`GPT-4o-mini`) to all **35 tools across 7 domains** of `@paypal/agent-toolkit` (`0.3.2`) and the **PayPal MCP Server** (`@paypal/mcp`).
- **Acceptance Criteria:**
  1. Initializes `PayPalAgentToolkit` with Sandbox OAuth 2.0 credentials and exposes all 35 tools (20 Invoicing/Recurring, 5 Orders/Refunds, 3 Disputes, 3 Shipment Tracking, 3 Catalog, 7 Subscriptions, 2 Insights).
  2. Streams real-time step-by-step reasoning and tool execution telemetry over Server-Sent Events (SSE) to the UI within `50ms` of each state transition.
  3. Enforces a hard session ceiling of `max_tool_hops = 6` and `max_session_cost_usd = $0.25` (`R-10`).

### `F-02` — Deterministic Spend & Risk Policy Firewall (`Cosmos.AI` DSL Pattern)
- **Priority:** `Must` (`MVP (hackathon)`) · **User Stories:** `US-01`, `US-02`, `US-03` · **Endpoints:** `API-01`, `API-02`, `API-03`
- **Description:** Compiled Domain-Specific Language (DSL) rule engine inspired by PayPal's **Cosmos.AI Decision Platform** that evaluates every proposed MCP tool call against merchant-configured `PolicyRule` (`E-05`) DAGs outside the LLM context window.
- **Acceptance Criteria:**
  1. Evaluates single-transaction amount limits (in `USD`, `EUR`, `GBP`, `INR`, `PYUSD`), 24-hour rolling velocity caps, recipient allowlists, `M-02` prompt-injection scores, and `M-04` GNN risk scores in `< 5ms`.
  2. Returns one of three deterministic verdicts: `ALLOW` (proceed to Sandbox), `HOLD_APPROVAL` (persist in `E-04` as `HELD` and notify `FINANCE_ADMIN` / `OWNER`), or `DENY` (abort and log to `E-10`).
  3. Supports `dry_run: true` simulation mode (`US-02`) returning the full rule evaluation trace without mutating PayPal Sandbox state.

### `F-03` — Autonomous Smart Invoicing & Accounts Receivable Collections Agent
- **Priority:** `Must` (`MVP (hackathon)`) · **User Stories:** `US-04`, `US-05`, `US-06` · **Endpoints:** `API-04`, `API-05`, `API-06`
- **Description:** End-to-end B2B billing and collections agent orchestrating all 20 invoicing and recurring-series tools in `@paypal/agent-toolkit`.
- **Acceptance Criteria:**
  1. Autonomously calls `generate_invoice_number`, `create_invoice`, `create_conditional_rules_for_invoice` (early-payment discount & late fee rules), `generate_invoice_qr_code`, and `send_invoice` from a single natural-language command or PO upload (`M-03`).
  2. Manages recurring billing schedules via `create_recurring_series` and `activate_recurring_series`.
  3. Executes age-tiered smart dunning reminders (`send_invoice_reminder`) and records external/PYUSD settlements via `record_payment_for_invoice`.

### `F-04` — Autonomous Dispute & Chargeback Defense Agent
- **Priority:** `Must` (`MVP (hackathon)`) · **User Stories:** `US-07`, `US-08`, `US-09` · **Endpoints:** `API-10`, `API-11`, `API-13`
- **Description:** Real-time webhook-triggered agent that intercepts `CUSTOMER.DISPUTE.CREATED` events, correlates shipment tracking and order telemetry, scores friendly-fraud probability, and autonomously resolves or contests claims.
- **Acceptance Criteria:**
  1. Upon receiving a verified dispute webhook (`API-13`), automatically invokes `get_dispute`, `get_order`, and `get_shipment_tracking` within `1,500ms`.
  2. If the dispute is below the merchant's auto-accept threshold (`<= $25.00`) and carrier tracking confirms non-shipment, invokes `accept_dispute_claim` automatically to preserve merchant seller rating and avoid dispute fees.
  3. If carrier tracking shows `DELIVERED` or `M-04` GNN flags friendly fraud (`> 0.70`), queries **Elastic** hybrid RAG (`M-05`) and `M-03` OCR to assemble a timestamped Compelling Evidence 3.0 defense bundle in `< 4.0 seconds`.

### `F-05` — Agentic B2B Procurement, Catalog & Order Checkout Flow
- **Priority:** `Must` (`MVP (hackathon)`) · **User Stories:** `US-10`, `US-11` · **Endpoints:** `API-07`, `API-08`, `API-09`
- **Description:** Autonomous catalog management, order creation, payment capture, carrier tracking attachment, and policy-guarded refund workflow powered by PayPal Orders v2 and **Fastlane**.
- **Acceptance Criteria:**
  1. Orchestrates `create_product`, `list_products`, `show_product_details`, `create_order`, `get_order`, and `pay_order` with client-side **Fastlane** accelerated guest checkout integration.
  2. Automatically attaches carrier tracking numbers via `create_shipment_tracking` and `update_shipment_tracking` upon order capture.
  3. Gates all `create_refund` and `get_refund` executions through `F-02` (`Cosmos.AI` DSL) and `F-10` (`M-04` GNN risk scorer).

### `F-06` — Idempotent Financial State Ledger (`JunoDB` + `PayPal-Request-Id` Pattern)
- **Priority:** `Must` (`MVP (hackathon)`) · **User Stories:** `US-10`, `US-11` · **Endpoints:** `API-01`, `API-04`, `API-07`, `API-08`, `API-09`, `API-11`
- **Description:** Distributed key-value state lock modeled on PayPal's open-source **JunoDB** (`paypal/junodb`) paired with an append-only SHA-256 hash-chained audit ledger (`E-10`).
- **Acceptance Criteria:**
  1. Computes a deterministic UUIDv5 `PayPal-Request-Id` for every state-mutating tool invocation and acquires an atomic Compare-And-Swap (CAS) lease in Redis/JunoDB before calling PayPal REST v2.
  2. Guarantees `0` duplicate payment captures, invoice sends, or refunds across 100 concurrent retry threads.
  3. Appends every execution verdict and operator signature to `ImmutableAuditLog` (`E-10`) with verifiable `SHA-256(prev_hash || payload)` linkage.

### `F-07` — Executive Financial Command Center with `AG Grid`
- **Priority:** `Must` (`MVP (hackathon)`) · **User Stories:** `US-12` · **Endpoints:** `API-05`, `API-10`, `API-14`
- **Description:** High-density real-time financial control plane built with **AG Grid Enterprise `32.3.2`** and **AG Charts Enterprise** (**$10,000 Sponsor Track**).
- **Acceptance Criteria:**
  1. Streams live transactions, MCP tool executions (`E-04`), invoices (`E-07`), and disputes (`E-08`) via `applyTransactionAsync()` with zero full-table re-renders.
  2. Provides Master-Detail row expansion for dispute evidence inspection, multi-column grouping/pivoting by currency and risk tier, inline velocity sparklines, and integrated AG Charts cash-flow waterfalls.
  3. Supports natural-language-to-grid filtering and inline 1-click cryptographic `Approve / Reject` buttons for held agent executions (`API-02`).

### `F-08` — Receivables, Subscription & Settlement Timeline Scheduler with `Bryntum`
- **Priority:** `Must` (`MVP (hackathon)`) · **User Stories:** `US-13` · **Endpoints:** `API-05`, `API-06`, `API-12`
- **Description:** Interactive temporal cash-flow, dunning, and recurring subscription orchestrator built with **Bryntum Scheduler Pro & Gantt `6.1.2`** (**$3,000 Sponsor Track**).
- **Acceptance Criteria:**
  1. Visualizes every `PayPalInvoiceRecord` (`E-07`) dunning chain (*Sent → Early Discount Cutoff → Reminder 1 → Reminder 2 → Due Date → Late Fee*) and `SubscriptionPlanRecord` (`E-09`) billing cycle on an interactive Gantt/Scheduler canvas.
  2. Dragging or resizing a timeline bar invokes `API-06` or `API-12` to update the live PayPal Sandbox invoice reminder schedule or subscription billing cycle.
  3. Displays a synchronized lower resource histogram projecting daily net working capital inflows vs scheduled payouts.

### `F-09` — Deterministic `APIMatic` Context Plugin & SDK Validator
- **Priority:** `Should` (`MVP (hackathon)`) · **User Stories:** `US-14` · **Endpoints:** `API-01`, `API-04`, `API-07`
- **Description:** Pre-flight payload validator and deterministic code generator powered by **APIMatic Context Plugins** and `@paypal/paypal-server-sdk` (**$3,000 Sponsor Track**).
- **Acceptance Criteria:**
  1. Validates 100% of LLM-generated tool arguments against compiled APIMatic PayPal Server SDK schemas before execution, auto-repairing minor formatting drift or rejecting hallucinated fields.
  2. Provides a 1-click **`[Export Verified APIMatic SDK Code]`** drawer in the UI that generates runnable TypeScript and Python `@paypal/paypal-server-sdk` snippets for any executed workflow.

### `F-10` — Real-Time Multi-Hop Buyer-Merchant Risk Graph Scorer (`GNN` / `Simility` Pattern)
- **Priority:** `Should` (`MVP (hackathon)`) · **User Stories:** `US-07`, `US-08`, `US-09` · **Endpoints:** `API-09`, `API-10`, `API-11`
- **Description:** Sub-20ms heterogeneous graph fraud engine (`M-04` PyTorch Geometric `GraphSAGE` + LightGBM) modeled on PayPal's **Real-Time Graph**, **Mirror Graphs**, and **Simility** platform.
- **Acceptance Criteria:**
  1. Evaluates 3-hop neighborhood structures connecting `Buyer Hash ↔ Device/IP Fingerprint ↔ Carrier Tracking Corridor ↔ Historical Dispute Ratio`.
  2. Emits a calibrated risk score (`0.00` to `1.00`) plus top-3 human-readable SHAP/graph reason codes (e.g., `SHARED_DEVICE_WITH_3_PRIOR_INR_CLAIMS`, `CARRIER_DELIVERED_GEO_MATCH`) consumed directly by `F-02` and `F-04`.

### `F-11` — Programmable Cross-Border Supplier Payouts & `PYUSD` Solana Token-2022 Settlement Bridge
- **Priority:** `Could` (`v1 (production)` / Live Sandbox+Devnet Demo in MVP) · **User Stories:** `US-15` · **Endpoints:** `API-04`, `API-06`
- **Description:** Instant, near-zero-fee cross-border B2B invoice settlement bridge using **PayPal USD (`PYUSD`)** on Solana (`2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo`) with **Token-2022 Extensions**.
- **Acceptance Criteria:**
  1. Constructs a Solana SPL Token-2022 transfer instruction enforcing the `Memo Required` extension populated with `PAYOPS:<invoice_id>:<PayPal-Request-Id>`.
  2. Upon on-chain confirmation (`< 1.5s`), automatically invokes `@paypal/agent-toolkit`'s `record_payment_for_invoice` to mark the PayPal Invoice v2 as `PAID` with the immutable transaction signature.

### `F-12` — Multi-Channel Commerce Discovery & Automated Fulfillment Triggers (`Channel3` + `Zapier` + `Elastic`)
- **Priority:** `Could` (`v1 (production)` / Live Sandbox Demo in MVP) · **User Stories:** `US-16` · **Endpoints:** `API-01`, `API-14`
- **Description:** Ecosystem integration layer combining **Channel3** retail SKU discovery (**$1,500 Sponsor Track**), **Elastic** audit & RAG indexing, and **Zapier** downstream ERP/Slack automation.
- **Acceptance Criteria:**
  1. Queries Channel3 MCP/REST API during `F-05` procurement requests to fetch normalized product prices and merchant metadata.
  2. Indexes all `ImmutableAuditLog` (`E-10`) records into Elasticsearch with sub-second full-text and vector search.
  3. Emits structured JSON webhook payloads to Zapier upon `HOLD_APPROVAL` creation or dispute resolution.

---

## 7. Non-Functional Requirements (NFRs)

| Category | Requirement Specification | Target Metric / Standard |
| :--- | :--- | :--- |
| **Performance & Latency** | Synchronous Policy Firewall (`F-02`) + Idempotency Lock (`F-06`) + GNN Risk Score (`F-10`); End-to-End Agent Tool Turn (`M-01` + PayPal Sandbox) | Policy + GNN p99 `< 35 ms` · Full Agent Turn p95 `< 2,400 ms` · UI Grid Filter p95 `< 20 ms` |
| **Availability & Offline Resilience** | Multi-service deployment on **Render** with health probes and automatic **Deterministic Sandbox Replay Fallback (`R-06`)** | `99.95%` uptime (`v1`) · `100%` demo survivability even if PayPal Sandbox returns `HTTP 429/503` |
| **Scalability** | Stateless Fastify & FastAPI horizontally scaled workers backed by connection-pooled PostgreSQL 16 and Redis/JunoDB sharding | `100 RPS` sustained in MVP load tests · `10,000+ RPS` in `v1` production topology |
| **Accessibility** | Full keyboard navigation, screen-reader ARIA grid announcements, focus management, and high-contrast themes (`docs/02-design/ACCESSIBILITY.md`) | **WCAG 2.2 Level AA** (`100%` `axe-core` automated pass) + ADA / EAA / India GIGW & RPwD alignment |
| **Localization & Multi-Currency** | Native formatting and decimal validation across `USD ($)`, `EUR (€)`, `GBP (£)`, `INR (₹)`, and `PYUSD` across `en-US`, `en-GB`, `en-IN`, `hi-IN`, and `es-ES` (`LOCALIZATION.md`) | Zero floating-point rounding errors (strict integer minor-unit math + ISO-4217 rules) |
| **Security & Payment Compliance** | Zero-PAN architecture, OAuth 2.0 token isolation inside MCP server, cryptographic webhook verification, OWASP Top 10 + OWASP LLM Top 10 controls (`SECURITY_ARCHITECTURE.md`) | **PCI-DSS v4.0 SAQ-A**, SOC 2 Type II controls, SHA-256 hash-chained audit logs (`E-10`) |
| **Privacy & Data Governance** | Salted SHA-256 pseudonymization of buyer PII before LLM context ingestion, explicit data retention schedules, and 180-day compliance logs (`PRIVACY.md`) | **India DPDP Act 2023 & Rules 2025**, **EU GDPR**, **US CCPA/GLBA**, **CERT-In** 180-day log retention |

---

## 8. Assumptions, Dependencies & Resolved Architectural Decisions

1. **PayPal Developer Sandbox Availability:** Assumes standard OAuth 2.0 Sandbox access (`https://api-m.sandbox.paypal.com`); mitigated against transient Sandbox throttling via `R-06` deterministic replay cache.
2. **Resolved Architecture Decisions (`ADR-0001`..`ADR-0005`):**
   - **Monorepo Stack (`ADR-0001`):** TypeScript (`Next.js 15` + `Fastify 5`) + Python (`FastAPI` for GNN/DSL) chosen to maximize native compatibility with `@paypal/agent-toolkit`, `AG Grid`, `Bryntum`, and `PyTorch Geometric`.
   - **State & Idempotency (`ADR-0002`):** PostgreSQL 16 + Redis/JunoDB two-phase CAS lease chosen to eliminate duplicate payment mutations.
   - **Agent Safety (`ADR-0003`):** Deterministic `Cosmos.AI` DSL Policy Firewall placed downstream of the LLM so prompt injections cannot bypass spend limits.
   - **Cloud Hosting (`ADR-0004`):** Deployed via declarative `render.yaml` Blueprint + **Render Workflows** on Render Cloud.
   - **Security (`ADR-0005`):** Zero-PAN tokenization + Ed25519/HMAC human-in-the-loop approval signing.

---

## 9. Release & Acceptance Criteria Gate

The `MVP (hackathon)` release is approved for submission only when:
1. All **12 features (`F-01`..`F-12`)** and **14 API endpoints (`API-01`..`API-14`)** pass automated contract and integration tests (`pnpm test`).
2. All **35 tools** in `@paypal/agent-toolkit` are registered, schema-validated by **APIMatic (`F-09`)**, and gated by the **`Cosmos.AI` DSL Policy Firewall (`F-02`)**.
3. The **AG Grid Enterprise Command Center (`F-07`)** and **Bryntum Scheduler Pro (`F-08`)** render live PayPal Sandbox mutations with `< 100ms` SSE latency.
4. Red-team adversarial prompt-injection evaluation (`50/50` test cases in `AI_EVALS.md`) achieves a **`100.0%` block rate** with zero unauthorized `create_refund` or `accept_dispute_claim` calls.
