# User Stories & Gherkin Acceptance Criteria (`US-01` to `US-16`) — PayOps AI (PayPal Sentinel)
> Project: PayOps AI (PayPal Sentinel) · Owner: Product Owner & QA Lead · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [PRD](./PRD.md) · [Features](./FEATURES.md) · [API Spec](../03-engineering/API_SPEC.md) · [Testing](../03-engineering/TESTING.md)

---

## 1. Epic-to-Story Traceability Matrix (`US-01` to `US-16`)

Every user story maps directly to the canonical features (`F-01`..`F-12`), personas (`P-01`..`P-04`), and API endpoints (`API-01`..`API-14`) defined in [`PROJECT_BRIEF.md`](../00-overview/PROJECT_BRIEF.md).

| Story ID | Epic | Mapped Feature(s) | Persona | Priority | Estimate | Primary API Endpoint(s) |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`US-01`** | `EP-01`: Agent Orchestration & Guardrails | `F-01`, `F-02` | `P-01`, `P-04` | **Must** | `M (4h)` | `API-01` (`POST /api/v1/agent/execute`) |
| **`US-02`** | `EP-01`: Agent Orchestration & Guardrails | `F-01`, `F-02` | `P-04`, `P-01` | **Must** | `S (2h)` | `API-01` (`dry_run: true`), `API-03` |
| **`US-03`** | `EP-01`: Agent Orchestration & Guardrails | `F-01`, `F-02` | `P-01`, `P-03` | **Must** | `M (4h)` | `API-02` (`POST /api/v1/agent/approve/{executionId}`) |
| **`US-04`** | `EP-02`: Autonomous Smart Invoicing | `F-03` | `P-01`, `P-02` | **Must** | `M (4h)` | `API-04` (`POST /api/v1/invoices/autonomous`) |
| **`US-05`** | `EP-02`: Autonomous Smart Invoicing | `F-03` | `P-01`, `P-02` | **Must** | `M (3h)` | `API-04`, `API-06` |
| **`US-06`** | `EP-02`: Autonomous Smart Invoicing | `F-03` | `P-01`, `P-02` | **Must** | `S (3h)` | `API-05`, `API-06` (`POST /api/v1/invoices/{invoiceId}/remind`) |
| **`US-07`** | `EP-03`: Autonomous Dispute Defense & GNN | `F-04`, `F-10` | `P-03` | **Must** | `M (4h)` | `API-13` (`POST /api/v1/webhooks/paypal`), `API-10` |
| **`US-08`** | `EP-03`: Autonomous Dispute Defense & GNN | `F-04`, `F-10` | `P-03` | **Should** | `M (4h)` | `API-10` (`GET /api/v1/disputes`) |
| **`US-09`** | `EP-03`: Autonomous Dispute Defense & GNN | `F-04`, `F-10` | `P-03` | **Must** | `M (4h)` | `API-11` (`POST /api/v1/disputes/{disputeId}/resolve`) |
| **`US-10`** | `EP-04`: Idempotent Orders & Fastlane | `F-05`, `F-06` | `P-01`, `P-04` | **Must** | `M (4h)` | `API-07` (`POST /api/v1/orders`), `API-08` |
| **`US-11`** | `EP-04`: Idempotent Orders & Fastlane | `F-05`, `F-06` | `P-03`, `P-01` | **Must** | `S (3h)` | `API-08` (`/capture`), `API-09` (`/refund`) |
| **`US-12`** | `EP-05`: Executive Cockpit (AG Grid & Bryntum) | `F-07` | `P-01`, `P-03` | **Must** | `L (6h)` | `API-05`, `API-10`, `API-14` |
| **`US-13`** | `EP-05`: Executive Cockpit (AG Grid & Bryntum) | `F-08` | `P-01`, `P-02` | **Must** | `L (6h)` | `API-05`, `API-06`, `API-12` |
| **`US-14`** | `EP-06`: Sponsor & Cross-Border Ecosystem | `F-09` | `P-04` | **Should** | `S (3h)` | `API-01`, `API-04`, `API-07` |
| **`US-15`** | `EP-06`: Sponsor & Cross-Border Ecosystem | `F-11` | `P-02` | **Could** | `M (4h)` | `API-04`, `API-06` |
| **`US-16`** | `EP-06`: Sponsor & Cross-Border Ecosystem | `F-12` | `P-02`, `P-04` | **Could** | `M (4h)` | `API-01`, `API-14` |

---

## 2. Detailed User Stories & Gherkin Acceptance Criteria

### Epic `EP-01`: Agent Orchestration & `Cosmos.AI` Policy Guardrails (`F-01`, `F-02`)

#### `US-01` — Natural-Language Multi-Tool Financial Execution via PayPal MCP
- **Mapped Features:** `F-01`, `F-02` · **Priority:** `Must` · **Estimate:** `M`
- **User Story:** *As **Maya Lin (`P-01`)**, I want to issue natural-language financial operations commands in the global Agent Command Bar so that `PayOps AI` orchestrates multi-step `@paypal/agent-toolkit` MCP tools on my behalf with full real-time visibility.*
- **Gherkin Acceptance Criteria:**
  ```gherkin
  Feature: Natural-Language Multi-Tool Execution via PayPal MCP Orchestrator (US-01)

    Scenario: Operator executes a compliant multi-step invoicing and insight command
      Given an authenticated operator in MerchantWorkspace "ws_lumina_01" with active PolicyRule "pol_default"
      When the operator POSTs to "/api/v1/agent/execute" with prompt "Create invoice for $420 to buyer@acme.io and fetch merchant insights"
      Then the M-02 intent router classifies the prompt as "INVOICE_AND_INSIGHTS" with injection_score < 0.05 within 140ms
      And the M-01 orchestrator selects "@paypal/agent-toolkit" tools "generate_invoice_number", "create_invoice", "send_invoice", and "get_merchant_insights"
      And the F-02 Cosmos.AI DSL Policy Firewall evaluates each tool call as "ALLOW"
      And the system executes the tools against PayPal Sandbox with deterministic "PayPal-Request-Id" headers
      And streams step-by-step AgentToolExecution (E-04) events over SSE to the UI
  ```

#### `US-02` — Deterministic Policy Dry-Run Simulation Mode
- **Mapped Features:** `F-01`, `F-02` · **Priority:** `Must` · **Estimate:** `S`
- **User Story:** *As **Marcus Vance (`P-04`)**, I want to execute any natural-language or structured financial task with `dry_run: true` so that I can inspect the exact `Cosmos.AI` DSL policy evaluation DAG and APIMatic-validated payload without mutating live PayPal Sandbox state.*
- **Gherkin Acceptance Criteria:**
  ```gherkin
  Feature: Policy Firewall Dry-Run Simulation (US-02)

    Scenario: Dry-run simulation evaluates policy DAG without invoking PayPal Sandbox
      Given a PolicyRule (E-05) with max_single_tx_usd = 500.00 and daily_velocity_cap_usd = 5000.00
      When the developer calls "POST /api/v1/agent/execute" with dry_run = true for a $480.00 order refund
      Then the F-09 APIMatic Validator verifies the "create_refund" payload schema
      And the F-02 Cosmos.AI DSL engine returns verdict "ALLOW" with full AST rule evaluation trace
      And zero outbound HTTP requests are sent to "api-m.sandbox.paypal.com"
      And the response includes "simulated: true" and the generated "PayPal-Request-Id"
  ```

#### `US-03` — Human-in-the-Loop Cryptographic Approval Gate Above Policy Threshold
- **Mapped Features:** `F-01`, `F-02` · **Priority:** `Must` · **Estimate:** `M`
- **User Story:** *As **Maya Lin (`P-01`)**, I want any agent tool execution that exceeds my `$500` (`₹42,000`) single-transaction limit or triggers an elevated prompt-injection/GNN risk score to be automatically held for my 1-click cryptographic approval so that no unauthorized funds ever leave my PayPal account.*
- **Gherkin Acceptance Criteria:**
  ```gherkin
  Feature: Human-in-the-Loop Policy Hold and Cryptographic Approval (US-03)

    Scenario: Agent refund above $500 threshold is held and subsequently approved by FINANCE_ADMIN
      Given an active PolicyRule (E-05) setting hold_threshold_usd = 500.00 for tool "create_refund"
      When the agent attempts to execute "create_refund" for $1,250.00 on PayPalOrderRecord "ord_8812"
      Then the F-02 Policy Firewall blocks immediate Sandbox execution and sets AgentToolExecution (E-04) status to "HOLD_APPROVAL"
      And when an OperatorUser (E-02) with role "FINANCE_ADMIN" calls "POST /api/v1/agent/approve/{executionId}" with decision "APPROVE" and valid signature
      Then the system verifies the operator RBAC role and signature, executes "create_refund" on PayPal Sandbox using the original "PayPal-Request-Id"
      And records both the hold and approval signature in ImmutableAuditLog (E-10)
  ```

---

### Epic `EP-02`: Autonomous Smart Invoicing & Accounts Receivable (`F-03`)

#### `US-04` — Autonomous PayPal Invoice v2 Creation & Fastlane QR Code Generation
- **Mapped Features:** `F-03` · **Priority:** `Must` · **Estimate:** `M`
- **User Story:** *As **Maya Lin (`P-01`)**, I want the agent to autonomously generate a sequential invoice number, create and send a PayPal Invoice v2, and generate a scannable payment QR code so that my wholesale buyers can pay in one tap.*
- **Gherkin Acceptance Criteria:**
  ```gherkin
  Feature: Autonomous Smart Invoicing and QR Code Generation (US-04)

    Scenario: Create and send smart invoice with QR code via @paypal/agent-toolkit
      Given a valid wholesale billing request for recipient "accounts@acmerobotics.com" for $1,850.00 USD
      When the operator calls "POST /api/v1/invoices/autonomous"
      Then the orchestrator invokes "@paypal/agent-toolkit" tools "generate_invoice_number", "create_invoice", "generate_invoice_qr_code", and "send_invoice"
      And persists PayPalInvoiceRecord (E-07) with the returned PayPal Sandbox invoice_id, qr_code_svg_uri, and status "SENT"
      And returns HTTP 201 Created with the live Sandbox invoice metadata within 2,500ms
  ```

#### `US-05` — Conditional Early-Payment Discounts, Late Fees & Recurring Invoice Series
- **Mapped Features:** `F-03` · **Priority:** `Must` · **Estimate:** `M`
- **User Story:** *As **Arjun Mehta (`P-02`)**, I want to attach conditional early-payment discounts (`2% if paid within 10 days`) and automated recurring billing schedules to my PayPal invoices so that clients are financially incentivized to settle before the due date.*
- **Gherkin Acceptance Criteria:**
  ```gherkin
  Feature: Conditional Invoice Rules and Recurring Series (US-05)

    Scenario: Attach conditional discount rules and activate recurring invoice series
      Given an existing or newly created PayPalInvoiceRecord (E-07) with due_date 30 days in the future
      When the operator specifies "early_discount_pct: 2.0, discount_days: 10, recurring_cadence: MONTHLY"
      Then the orchestrator invokes "create_conditional_rules_for_invoice", "create_recurring_series", and "activate_recurring_series"
      And updates PayPalInvoiceRecord.conditional_rules_json and recurring_series_id in PostgreSQL
  ```

#### `US-06` — Age-Tiered Smart Dunning Reminders & External Payment Reconciliation
- **Mapped Features:** `F-03` · **Priority:** `Must` · **Estimate:** `S`
- **User Story:** *As **Maya Lin (`P-01`)**, I want the agent to dispatch polite, context-aware PayPal invoice reminders for overdue receivables and automatically suppress reminders when an external bank or `PYUSD` payment is recorded so that I reduce DSO without annoying paid customers.*
- **Gherkin Acceptance Criteria:**
  ```gherkin
  Feature: Smart Dunning Reminders and Payment Recording (US-06)

    Scenario: Send policy-checked dunning reminder for overdue unpaid invoice
      Given PayPalInvoiceRecord "INV2-9921" has status "UNPAID" and is 7 days past due_date
      When "POST /api/v1/invoices/INV2-9921/remind" is triggered by the operator or Render Workflow scheduler
      Then the agent verifies via "get_invoice" that no payment has been recorded
      And invokes "send_invoice_reminder" with a personalized reminder note
      And updates PayPalInvoiceRecord.dunning_state to "REMINDER_1_SENT"
  ```

---

### Epic `EP-03`: Autonomous Dispute Defense & Multi-Hop GNN Fraud Scorer (`F-04`, `F-10`)

#### `US-07` — Real-Time Webhook Dispute Ingestion & Carrier Tracking Correlation
- **Mapped Features:** `F-04`, `F-10` · **Priority:** `Must` · **Estimate:** `M`
- **User Story:** *As **Elena Rostova (`P-03`)**, I want incoming PayPal `CUSTOMER.DISPUTE.CREATED` webhooks to be cryptographically verified and immediately enriched with the original PayPal Order v2 and carrier shipment tracking status so that I never miss a response SLA.*
- **Gherkin Acceptance Criteria:**
  ```gherkin
  Feature: Webhook Dispute Ingestion and Tracking Enrichment (US-07)

    Scenario: Verified PayPal dispute webhook triggers automated order and shipment lookup
      Given PayPal Sandbox dispatches a "CUSTOMER.DISPUTE.CREATED" webhook to "POST /api/v1/webhooks/paypal"
      When the backend verifies the transmission signature via "/v1/notifications/verify-webhook-signature"
      Then the Dispute Defense Agent invokes "get_dispute", "get_order", and "get_shipment_tracking" via "@paypal/agent-toolkit"
      And creates or updates PayPalDisputeCase (E-08) with reason_code, disputed_amount, response_deadline, and carrier_tracking_status
  ```

#### `US-08` — Multi-Hop Buyer-Seller Risk Graph Friendly-Fraud Scoring (`M-04`)
- **Mapped Features:** `F-04`, `F-10` · **Priority:** `Should` · **Estimate:** `M`
- **User Story:** *As **Elena Rostova (`P-03`)**, I want every dispute and refund request scored in `< 20ms` by a Multi-Hop Buyer-Seller Risk Graph (`M-04`) with clear reason codes so that I can distinguish repeat friendly-fraud rings from legitimate VIP customer issues.*
- **Gherkin Acceptance Criteria:**
  ```gherkin
  Feature: Multi-Hop GNN Friendly-Fraud Scoring (US-08)

    Scenario: GNN scores 3-hop buyer-device-carrier neighborhood and outputs reason codes
      Given an enriched PayPalDisputeCase (E-08) for a $340.00 "MERCHANDISE_OR_SERVICE_NOT_RECEIVED" claim
      When the F-10 Risk Graph service runs M-04 inference on the buyer_hash and carrier tracking subgraph
      Then M-04 returns a calibrated gnn_risk_score between 0.00 and 1.00 and top-3 explainable reason codes within 20ms
      And persists the score and reason codes on PayPalDisputeCase (E-08)
  ```

#### `US-09` — Autonomous Low-Value Dispute Acceptance vs. Compelling Evidence Compilation
- **Mapped Features:** `F-04`, `F-10` · **Priority:** `Must` · **Estimate:** `M`
- **User Story:** *As **Elena Rostova (`P-03`)**, I want the agent to automatically accept valid low-value claims (`<= $25`) via `accept_dispute_claim` while automatically assembling a signed carrier + contract Compelling Evidence 3.0 defense package for delivered orders so that our dispute win rate exceeds 80%.*
- **Gherkin Acceptance Criteria:**
  ```gherkin
  Feature: Autonomous Dispute Resolution and Compelling Evidence Assembly (US-09)

    Scenario: Delivered order with INR dispute compiles Compelling Evidence 3.0 defense bundle
      Given PayPalDisputeCase "PP-D-4012" has disputed_amount = $340.00, carrier_status = "DELIVERED", and gnn_risk_score = 0.88
      When "POST /api/v1/disputes/PP-D-4012/resolve" is invoked in autonomous mode
      Then the F-02 Policy Firewall blocks "accept_dispute_claim" and selects "CONTEST_WITH_EVIDENCE"
      And the agent retrieves merchant policy clauses via M-05 Elastic Hybrid RAG and carrier proof via M-03 OCR
      And compiles a structured Compelling Evidence 3.0 bundle attached to PayPalDisputeCase (E-08) within 4.0 seconds
  ```

---

### Epic `EP-04`: Idempotent Orders, Shipment Tracking & Fastlane Checkout (`F-05`, `F-06`)

#### `US-10` — Idempotent PayPal Order v2 Creation, Fastlane Checkout & Capture
- **Mapped Features:** `F-05`, `F-06` · **Priority:** `Must` · **Estimate:** `M`
- **User Story:** *As **Maya Lin (`P-01`)**, I want to create and capture PayPal Orders v2 with strict `PayPal-Request-Id` idempotency locking and **Fastlane** accelerated guest checkout so that shoppers convert in one tap with zero risk of double-charging.*
- **Gherkin Acceptance Criteria:**
  ```gherkin
  Feature: Idempotent Order Creation and Capture with JunoDB Pattern (US-10)

    Scenario: Concurrent duplicate order creation requests execute exactly once
      Given two concurrent "POST /api/v1/orders" requests with identical workspace_id, cart items, and idempotency key
      When the F-06 JunoDB state store processes both requests simultaneously
      Then exactly one request acquires the CAS lease and calls "@paypal/agent-toolkit" "create_order"
      And the second request awaits the lease resolution and returns the identical PayPalOrderRecord (E-06) with header "X-Idempotent-Replayed: true"
  ```

#### `US-11` — Automated Carrier Shipment Tracking Synchronization & Guarded Refunds
- **Mapped Features:** `F-05`, `F-06` · **Priority:** `Must` · **Estimate:** `S`
- **User Story:** *As **Elena Rostova (`P-03`)**, I want carrier tracking numbers automatically attached to captured PayPal orders (`create_shipment_tracking`) and all refund requests (`create_refund`) gated by the risk graph and policy firewall so that PayPal releases rolling reserves faster and prevents refund abuse.*
- **Gherkin Acceptance Criteria:**
  ```gherkin
  Feature: Automated Shipment Tracking Attachment and Guarded Refunds (US-11)

    Scenario: Capturing an order attaches shipment tracking via @paypal/agent-toolkit
      Given an authorized PayPalOrderRecord "5O190127TN364715T" with carrier "DHL" and tracking_number "77819201"
      When the operator calls "POST /api/v1/orders/5O190127TN364715T/capture"
      Then the orchestrator invokes "pay_order" followed by "create_shipment_tracking"
      And updates PayPalOrderRecord.shipment_tracking_status to "SHIPPED" in PostgreSQL
  ```

---

### Epic `EP-05`: Executive Financial Command Center (`AG Grid` & `Bryntum`, `F-07`, `F-08`)

#### `US-12` — Live Ledger Streaming, Grouping, Charting & Triage in `AG Grid Enterprise`
- **Mapped Features:** `F-07` · **Priority:** `Must` · **Estimate:** `L`
- **User Story:** *As **Elena Rostova (`P-03`)**, I want to inspect live transactions, MCP tool traces, invoices, and dispute SLAs in an **AG Grid Enterprise** command center with async streaming, master-detail evidence drawers, natural-language filtering, and integrated **AG Charts** waterfalls so that I can triage 10,000+ records effortlessly.*
- **Gherkin Acceptance Criteria:**
  ```gherkin
  Feature: AG Grid Enterprise Executive Financial Command Center (US-12)

    Scenario: Live webhook and agent events stream into AG Grid without full re-render
      Given the operator has Screen 1 (AG Grid Command Center) open with 500 active ledger rows
      When a new AgentToolExecution (E-04) or PayPalDisputeCase (E-08) event arrives over SSE
      Then AG Grid applies the delta via "applyTransactionAsync()" in < 50ms
      And expanding the master-detail row reveals the Cosmos.AI DSL evaluation tree and inlineApprove/Reject action buttons
  ```

#### `US-13` — Interactive Receivables Dunning & Subscription Scheduling in `Bryntum`
- **Mapped Features:** `F-08` · **Priority:** `Must` · **Estimate:** `L`
- **User Story:** *As **Arjun Mehta (`P-02`)**, I want to visualize and drag-and-drop invoice dunning milestones, recurring billing series, and subscription renewals on an interactive **Bryntum Scheduler Pro / Gantt** timeline so that adjusting a bar dynamically updates the live PayPal Sandbox schedule.*
- **Gherkin Acceptance Criteria:**
  ```gherkin
  Feature: Interactive Bryntum Scheduler Pro Receivables and Subscription Timeline (US-13)

    Scenario: Dragging an invoice dunning bar on the Bryntum canvas updates PayPal Sandbox
      Given PayPalInvoiceRecord "INV2-8841" is rendered as a multi-milestone task bar on the Bryntum Scheduler Pro timeline
      When the operator drags the "Reminder 1" milestone 3 days earlier on the Bryntum timeline
      Then the frontend dispatches "POST /api/v1/invoices/INV2-8841/remind" with the updated schedule timestamp
      And the backend updates the conditional reminder schedule via "@paypal/agent-toolkit" and refreshes the Bryntum resource histogram
  ```

---

### Epic `EP-06`: Deterministic SDK Grounding, `PYUSD` Bridge & Ecosystem Automation (`F-09`, `F-11`, `F-12`)

#### `US-14` — `APIMatic` Payload Validation & 1-Click Verified SDK Code Export
- **Mapped Features:** `F-09` · **Priority:** `Should` · **Estimate:** `S`
- **User Story:** *As **Marcus Vance (`P-04`)**, I want every agent tool payload validated against **APIMatic**'s deterministic `@paypal/paypal-server-sdk` definitions and be able to export runnable TypeScript or Python SDK code for any agent action in one click.*
- **Gherkin Acceptance Criteria:**
  ```gherkin
  Feature: APIMatic Context Plugin Schema Validation and SDK Code Export (US-14)

    Scenario: Operator exports verified TypeScript PayPal Server SDK snippet from an executed tool call
      Given a completed AgentToolExecution (E-04) for tool "create_invoice"
      When the developer clicks "Export Verified APIMatic SDK Code (TypeScript)" in the trace drawer
      Then the system renders a complete, syntax-checked "@paypal/paypal-server-sdk" TypeScript snippet pre-populated with the validated payload and "PayPal-Request-Id"
  ```

#### `US-15` — Cross-Border Vendor Invoice Settlement via `PYUSD` on Solana Token-2022
- **Mapped Features:** `F-11` · **Priority:** `Could` · **Estimate:** `M`
- **User Story:** *As **Arjun Mehta (`P-02`)**, I want to settle cross-border supplier invoices using **PYUSD on Solana Token-2022** with an enforced on-chain `Memo Required` field containing the PayPal `invoice_id` so that cross-border payouts settle in `< 2 seconds` and auto-reconcile on PayPal Invoicing v2.*
- **Gherkin Acceptance Criteria:**
  ```gherkin
  Feature: Cross-Border B2B Invoice Settlement via PYUSD Solana Token-2022 (US-15)

    Scenario: Settle supplier PayPal invoice via PYUSD with on-chain Memo reconciliation
      Given an approved cross-border supplier PayPalInvoiceRecord "INV2-7704" for 650.00 USD
      When the operator selects "Settle via PYUSD (Solana Token-2022)"
      Then the system constructs a Solana Token-2022 transfer for 650.00 PYUSD (mint "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo") with Memo "PAYOPS:INV2-7704:<PayPal-Request-Id>"
      And upon confirmation invokes "@paypal/agent-toolkit" "record_payment_for_invoice" to mark "INV2-7704" as "PAID"
  ```

#### `US-16` — `Channel3` Procurement Discovery, `Elastic` Audit Search & `Zapier` Automation
- **Mapped Features:** `F-12` · **Priority:** `Could` · **Estimate:** `M`
- **User Story:** *As **Arjun Mehta (`P-02`)**, I want the agent to discover B2B procurement products via the **Channel3** MCP catalog, index all hash-chained compliance logs in **Elastic**, and fire **Zapier** webhooks to Slack/ERP when high-value approvals occur.*
- **Gherkin Acceptance Criteria:**
  ```gherkin
  Feature: Channel3 Discovery, Elastic Observability, and Zapier Triggers (US-16)

    Scenario: Agent discovers SKU via Channel3, logs to Elastic, and triggers Zapier webhook
      Given the operator prompts "Procure 5 ergonomic studio chairs under $900 total and notify finance Slack"
      When the orchestrator queries the Channel3 MCP catalog and selects a matching SKU at $165/unit ($825 total)
      Then the system creates an idempotent PayPal Order v2 via "create_order", indexes the ImmutableAuditLog (E-10) in Elasticsearch, and dispatches a structured webhook event to Zapier
  ```
