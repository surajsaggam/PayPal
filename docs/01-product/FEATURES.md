# Feature Matrix, MoSCoW Prioritization & Feature Flags (`F-01` to `F-12`) — PayOps AI (PayPal Sentinel)
> Project: PayOps AI (PayPal Sentinel) · Owner: Product Management & Architecture Lead · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [PRD](./PRD.md) · [User Stories](./USER_STORIES.md) · [Integrations](../03-engineering/INTEGRATIONS.md)

---

## 1. Master Feature Matrix (`F-01` to `F-12`)

Every feature ID (`F-01`..`F-12`) is strictly synchronized with [`PROJECT_BRIEF.md`](../00-overview/PROJECT_BRIEF.md), [`PRD.md`](./PRD.md), [`USER_STORIES.md`](./USER_STORIES.md), and [`BACKLOG.md`](../08-project/BACKLOG.md).

| Feature ID | Canonical Feature Name | Description & Technical Scope | Primary Persona(s) | MoSCoW | In `MVP (hackathon)`? | Dependencies | Owner Role | Mapped Stories & APIs |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **`F-01`** | **PayPal MCP & `@paypal/agent-toolkit` Unified Agent Orchestrator** | Multi-step AI agent orchestrator invoking all **35 tools across 7 domains** of `@paypal/agent-toolkit` (`0.3.2`) and `@paypal/mcp` via `M-01` (`Claude 3.5 Sonnet` / `GPT-4o`) and `M-02` (`GPT-4o-mini`). | `P-01`, `P-04` | **Must** | **Yes (100% Live Sandbox)** | PayPal OAuth2, `M-01`, `M-02` | `ENG-1` | `US-01`, `US-02` · `API-01`, `API-12`, `API-14` |
| **`F-02`** | **Deterministic Spend & Risk Policy Firewall (`Cosmos.AI` DSL Pattern)** | Pre-execution compiled rule DAG validating single-tx caps, 24h velocity limits, merchant allowlists, prompt-injection scores, and human-in-the-loop approval gates (`ALLOW` / `HOLD_APPROVAL` / `DENY`). | `P-01`, `P-03`, `P-04` | **Must** | **Yes (100% Live)** | `E-05`, `M-02`, `F-10` | `ENG-2` | `US-01`, `US-02`, `US-03` · `API-01`, `API-02`, `API-03` |
| **`F-03`** | **Autonomous Smart Invoicing & Accounts Receivable Collections Agent** | Orchestrates all 20 Invoicing v2 & Recurring Series tools (`create_invoice`, `send_invoice`, `send_invoice_reminder`, `generate_invoice_qr_code`, `create_conditional_rules_for_invoice`, `record_payment_for_invoice`). | `P-01`, `P-02` | **Must** | **Yes (100% Live Sandbox)** | `F-01`, `F-02`, `F-06`, `E-07` | `ENG-1` | `US-04`, `US-05`, `US-06` · `API-04`, `API-05`, `API-06` |
| **`F-04`** | **Autonomous Dispute & Chargeback Defense Agent** | Webhook-triggered agent (`CUSTOMER.DISPUTE.CREATED`) correlating `list_disputes`, `get_dispute`, `get_shipment_tracking`, `get_order`, and `accept_dispute_claim` with automated Compelling Evidence 3.0 assembly. | `P-03` | **Must** | **Yes (100% Live Sandbox)** | `F-01`, `F-02`, `F-10`, `M-03`, `M-05`, `E-08` | `ENG-2` | `US-07`, `US-08`, `US-09` · `API-10`, `API-11`, `API-13` |
| **`F-05`** | **Agentic B2B Procurement, Catalog & Order Checkout Flow** | End-to-end catalog and order workflow (`create_product`, `list_products`, `create_order`, `get_order`, `pay_order`, `create_refund`, `create_shipment_tracking`) paired with client-side **Fastlane** guest checkout. | `P-01`, `P-02`, `P-03` | **Must** | **Yes (100% Live Sandbox)** | `F-01`, `F-02`, `F-06`, `E-06` | `ENG-1` | `US-10`, `US-11` · `API-07`, `API-08`, `API-09` |
| **`F-06`** | **Idempotent Financial State Ledger (`JunoDB` + `PayPal-Request-Id` Pattern)** | Two-phase Compare-And-Swap (CAS) key-value state lock in Redis/JunoDB enforcing deterministic UUIDv5 `PayPal-Request-Id` headers plus SHA-256 hash-chained `ImmutableAuditLog` (`E-10`). | `P-04`, `P-01` | **Must** | **Yes (100% Live)** | PostgreSQL 16, Redis 7.4, `E-04`, `E-10` | `ENG-1`, `ENG-4` | `US-10`, `US-11` · All Mutation APIs |
| **`F-07`** | **Executive Financial Command Center with `AG Grid`** | High-frequency ledger, live MCP tool trace stream, dispute SLA heatmap, master-detail evidence drawer, and **AG Charts** cash-flow waterfall built with **AG Grid Enterprise `32.3.2`**. | `P-01`, `P-03` | **Must** | **Yes (100% Live)** | `API-05`, `API-10`, `API-14`, SSE | `ENG-3` | `US-12` · `API-05`, `API-10`, `API-14` |
| **`F-08`** | **Receivables, Subscription & Settlement Timeline Scheduler with `Bryntum`** | Interactive Gantt/Scheduler canvas built with **Bryntum Scheduler Pro `6.1.2`** for dragging/resizing invoice dunning sequences, recurring series, and settlement windows. | `P-01`, `P-02` | **Must** | **Yes (100% Live)** | `API-05`, `API-06`, `API-12` | `ENG-3` | `US-13` · `API-05`, `API-06`, `API-12` |
| **`F-09`** | **Deterministic `APIMatic` Context Plugin & SDK Validator** | Build-time MCP context grounding and runtime schema validator against `@paypal/paypal-server-sdk` models with 1-click verified TypeScript/Python SDK code export. | `P-04` | **Should** | **Yes (100% Live)** | `F-01`, `@paypal/paypal-server-sdk` | `ENG-1` | `US-14` · `API-01`, `API-04`, `API-07` |
| **`F-10`** | **Real-Time Multi-Hop Buyer-Merchant Risk Graph Scorer (`GNN` / `Simility` Pattern)** | Sub-20ms `PyTorch Geometric GraphSAGE + LightGBM` (`M-04`) scorer evaluating 3-hop buyer-device-carrier neighborhoods and outputting explainable fraud reason codes. | `P-03` | **Should** | **Yes (100% Live)** | `M-04`, `E-06`, `E-08` | `ENG-2` | `US-07`, `US-08`, `US-09` · `API-09`, `API-10`, `API-11` |
| **`F-11`** | **Programmable Cross-Border Supplier Payouts & `PYUSD` Solana Token-2022 Settlement Bridge** | Instant cross-border B2B invoice settlement using `PYUSD` on Solana (`2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo`) with `Memo Required` (`invoice_id`) + `record_payment_for_invoice`. | `P-02` | **Could** | **Yes (Solana Devnet + PayPal Sandbox)** | `F-03`, `F-06`, Solana Web3.js | `ENG-1` | `US-15` · `API-04`, `API-06` |
| **`F-12`** | **Multi-Channel Commerce Discovery & Automated Fulfillment Triggers (`Channel3` + `Zapier` + `Elastic`)** | Retail SKU discovery via **Channel3** MCP, 180-day compliance & contract RAG indexing in **Elastic**, and outbound ERP/Slack workflow automation via **Zapier**. | `P-02`, `P-04` | **Could** | **Yes (Live Sandbox Demo)** | `F-01`, `F-05`, `M-05`, `E-10` | `ENG-2`, `ENG-4` | `US-16` · `API-01`, `API-14` |

---

## 2. Complete Mapping of All 35 `@paypal/agent-toolkit` Tools to Canonical Features

To demonstrate exhaustive mastery of PayPal's Agentic Commerce stack (**Best Use of Agentic Commerce** & **Best Use of PayPal + AI** prizes), every single tool in `@paypal/agent-toolkit` (`0.3.2`) is mapped to a feature and endpoint in `PayOps AI`:

| `@paypal/agent-toolkit` Domain | Count | Exact Tool Identifiers | Owning Feature(s) |
| :--- | :---: | :--- | :---: |
| **1. Invoices & Recurring Series** | **20** | `create_invoice`, `list_invoices`, `get_invoice`, `send_invoice`, `send_invoice_reminder`, `cancel_sent_invoice`, `generate_invoice_qr_code`, `delete_invoice`, `generate_invoice_number`, `search_invoicing`, `update_invoicing`, `cancel_invoice_auto_reminder`, `record_payment_for_invoice`, `record_refund_for_invoice`, `create_conditional_rules_for_invoice`, `create_recurring_series`, `activate_recurring_series`, `get_recurring_series`, `cancel_recurring_series`, `delete_recurring_series` | `F-01`, `F-03`, `F-08`, `F-11` |
| **2. Orders & Payments** | **5** | `create_order`, `get_order`, `pay_order`, `create_refund`, `get_refund` | `F-01`, `F-05`, `F-06` |
| **3. Dispute Management** | **3** | `list_disputes`, `get_dispute`, `accept_dispute_claim` | `F-01`, `F-04`, `F-10` |
| **4. Shipment Tracking** | **3** | `create_shipment_tracking`, `get_shipment_tracking`, `update_shipment_tracking` | `F-01`, `F-04`, `F-05` |
| **5. Catalog Management** | **3** | `create_product`, `list_products`, `show_product_details` | `F-01`, `F-05`, `F-12` |
| **6. Subscription Management** | **7** | `create_subscription_plan`, `list_subscription_plans`, `show_subscription_plan_details`, `create_subscription`, `show_subscription_details`, `update_subscription`, `cancel_subscription` | `F-01`, `F-08` |
| **7. Reporting & Insights** | **2** | `list_transactions`, `get_merchant_insights` | `F-01`, `F-07`, `F-12` |

*(Note: `create_product` and `list_products` are shared between Catalog and Subscription bootstrapping in `@paypal/agent-toolkit`, yielding 35 unique tool bindings across the 7 action groups.)*

---

## 3. Feature Flags & Runtime Governance Strategy

All features are controlled via environment-initialized, database-overridable runtime feature flags stored in `MerchantWorkspace.settings_json` (`E-01`) and cached in Redis/JunoDB with a 30-second TTL. This allows instant kill-switch activation or graceful degradation during live demos (`RUNBOOK.md`).

| Feature Flag Key | Mapped Feature | Default (`MVP`) | Default (`v1 Prod`) | Kill-Switch / Fallback Behavior When Disabled (`false`) |
| :--- | :---: | :---: | :---: | :--- |
| **`FF_COSMOS_POLICY_STRICT`** | `F-02` | `true` | `true` | **Fail-Closed Safety Invariant:** Disabling dynamic DSL evaluation forces *all* state-mutating MCP tools (`create_refund`, `pay_order`, `accept_dispute_claim`) into mandatory `HOLD_APPROVAL` human review. |
| **`FF_APIMATIC_SCHEMA_ENFORCE`** | `F-09` | `true` | `true` | Falls back to standard Zod schema validation without auto-repairing minor ISO-4217 decimal drift. |
| **`FF_GNN_DISPUTE_SCORER`** | `F-10` | `true` | `true` | Falls back from `M-04` PyTorch Geometric `GraphSAGE` to deterministic heuristic rule scoring (carrier status + order value). |
| **`FF_PYUSD_SOLANA_BRIDGE`** | `F-11` | `true` (Devnet) | `Opt-In` (Mainnet) | Hides the Solana Token-2022 `PYUSD` settlement option and routes cross-border settlements through standard PayPal Invoicing v2 / Orders v2 fiat rails. |
| **`FF_CHANNEL3_PROCUREMENT`** | `F-12` | `true` | `true` | Queries local merchant `Catalog` (`list_products`) only instead of external Channel3 retail catalog discovery. |
| **`FF_DEMO_REPLAY_FALLBACK`** | `R-06` | `auto` | `false` | In `auto` mode (`MVP`), automatically serves signed recorded PayPal Sandbox transcripts if `api-m.sandbox.paypal.com` returns `HTTP 429/503` or exceeds `2,500ms`. |
