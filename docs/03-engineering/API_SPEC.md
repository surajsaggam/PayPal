# API Specification (`API-01` to `API-14`) — PayOps AI (PayPal Sentinel)
> Project: PayOps AI (PayPal Sentinel) · Owner: Lead API & Integration Architect · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [Architecture](./ARCHITECTURE.md) · [Data Model](./DATA_MODEL.md) · [OpenAPI 3.1 Spec](../../api/openapi.yaml) · [ADR-0005](./adr/ADR-0005-auth-and-payment-security.md)

---

## 1. Architectural Conventions, Idempotency & Error Contract

Every endpoint in `PayOps AI` (`API-01` through `API-14`) is formally specified in [`api/openapi.yaml`](../../api/openapi.yaml) (OpenAPI 3.1.0) and adheres to PayPal REST API v2 and enterprise FinTech standards:

- **Base URLs:**
  - Production / Render Live Demo: `https://payops-ai-sentinel.onrender.com/api/v1`
  - Local Development: `http://localhost:4000/api/v1`
- **Authentication & RBAC Scopes (`E-02` `OperatorUser`):**
  - `Authorization: Bearer <OAuth2_JWT>` containing claims `sub` (`operator_id`), `workspace_id` (`E-01`), and `role` (`OWNER` | `FINANCE_ADMIN` | `AUDITOR` | `AGENT_SERVICE`).
  - Human-in-the-loop approvals (`API-02`) additionally require header `X-PayOps-Signature: <Ed25519_or_HMAC_SHA256_Hex>`.
- **Mandatory Idempotency Header (`F-06` `JunoDB` Pattern):**
  - Every state-mutating `POST` or `PUT` request accepts `PayPal-Request-Id: <UUIDv5>`. If omitted by the client, the server deterministically computes `UUIDv5(NAMESPACE_PAYOPS, workspace_id + path + canonical_json_hash)`, acquires a 2PC CAS lease in Redis/JunoDB, and echoes `PayPal-Request-Id` and `X-Idempotent-Replayed: true|false` in the response headers.
- **RFC 7807 Problem Details Error Format (`application/problem+json`):**
  ```json
  {
    "type": "https://payops.ai/errors/policy-hold-required",
    "title": "Execution Held by Cosmos.AI Policy Firewall",
    "status": 409,
    "detail": "Rule POL-02 requires FINANCE_ADMIN approval for create_refund exceeding $500.00 USD.",
    "instance": "/api/v1/agent/execute",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "execution_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "paypal_request_id": "pp-req-88f1a209-4c11"
  }
  ```

---

## 2. Master Endpoint Catalog (`API-01` to `API-14`)

| API ID | Method & Path | Auth Role Required | Rate Limit | Mapped Features & Entities |
| :--- | :--- | :---: | :---: | :--- |
| **`API-01`** | `POST /api/v1/agent/execute` | `FINANCE_ADMIN`, `OWNER`, `AGENT_SERVICE` | `60 req/min` | `F-01`, `F-02`, `F-06`, `F-09` · `E-03`, `E-04`, `E-10` |
| **`API-02`** | `POST /api/v1/agent/approve/{executionId}` | `FINANCE_ADMIN`, `OWNER` | `120 req/min` | `F-02`, `F-06` (`US-03`) · `E-02`, `E-04`, `E-10` |
| **`API-03`** | `GET /api/v1/policies` & `PUT /api/v1/policies/{policyId}` | `GET`: All · `PUT`: `OWNER`, `FINANCE_ADMIN` | `120 req/min` | `F-02` · `E-05`, `E-10` |
| **`API-04`** | `POST /api/v1/invoices/autonomous` | `FINANCE_ADMIN`, `OWNER`, `AGENT_SERVICE` | `60 req/min` | `F-03`, `F-06`, `F-09` (`US-04`, `US-05`) · `E-07` |
| **`API-05`** | `GET /api/v1/invoices` | `AUDITOR`, `FINANCE_ADMIN`, `OWNER` | `300 req/min` | `F-03`, `F-07`, `F-08` · `E-07` |
| **`API-06`** | `POST /api/v1/invoices/{invoiceId}/remind` | `FINANCE_ADMIN`, `OWNER`, `AGENT_SERVICE` | `120 req/min` | `F-03`, `F-08`, `F-11` (`US-06`, `US-13`, `US-15`) · `E-07` |
| **`API-07`** | `POST /api/v1/orders` | `FINANCE_ADMIN`, `OWNER`, `AGENT_SERVICE` | `120 req/min` | `F-05`, `F-06`, `F-09` (`US-10`) · `E-06` |
| **`API-08`** | `POST /api/v1/orders/{orderId}/capture` | `FINANCE_ADMIN`, `OWNER`, `AGENT_SERVICE` | `120 req/min` | `F-05`, `F-06` (`US-10`, `US-11`) · `E-06` |
| **`API-09`** | `POST /api/v1/orders/{orderId}/refund` | `FINANCE_ADMIN`, `OWNER` | `60 req/min` | `F-02`, `F-05`, `F-10` (`US-11`) · `E-04`, `E-06` |
| **`API-10`** | `GET /api/v1/disputes` | `AUDITOR`, `FINANCE_ADMIN`, `OWNER` | `300 req/min` | `F-04`, `F-07`, `F-10` (`US-07`, `US-08`) · `E-08` |
| **`API-11`** | `POST /api/v1/disputes/{disputeId}/resolve` | `FINANCE_ADMIN`, `OWNER`, `AGENT_SERVICE` | `60 req/min` | `F-04`, `F-10` (`US-09`) · `E-08`, `E-10` |
| **`API-12`** | `POST /api/v1/subscriptions/plans` | `FINANCE_ADMIN`, `OWNER` | `60 req/min` | `F-01`, `F-08` (`US-13`) · `E-09` |
| **`API-13`** | `POST /api/v1/webhooks/paypal` | PayPal Cryptographic Webhook Signature | `1,000 req/min` | `F-04`, `F-06` (`US-07`, `R-04`) · `E-06`..`E-10` |
| **`API-14`** | `GET /api/v1/analytics/insights` | `AUDITOR`, `FINANCE_ADMIN`, `OWNER` | `300 req/min` | `F-01`, `F-07`, `F-12` (`US-12`, `US-16`) · `E-01`..`E-10` |

---

## 3. Detailed Endpoint Specifications & JSON Payloads

### `API-01` — `POST /api/v1/agent/execute`
Executes a natural-language or structured financial task through the `M-02` injection filter, `M-01` PayPal MCP Orchestrator (all 35 `@paypal/agent-toolkit` tools), `F-09` APIMatic schema validator, `F-02` `Cosmos.AI` DSL Policy Firewall, and `F-06` `JunoDB` idempotency ledger.
- **Headers:** `Authorization: Bearer <token>`, `PayPal-Request-Id: pp-req-9041-a8c2`
- **Request Body (`application/json`):**
  ```json
  {
    "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
    "prompt": "Generate and send a $1,850.00 USD wholesale invoice to accounts@acmerobotics.io with a 2% Net-10 early payment discount and QR code.",
    "dry_run": false,
    "stream_sse": false
  }
  ```
- **Response `200 OK` (or `202 Accepted` when `policy_verdict == "HOLD_APPROVAL"`):**
  ```json
  {
    "execution_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "session_id": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
    "paypal_request_id": "pp-req-9041-a8c2",
    "intent_class": "INVOICE_CREATE_AND_SEND",
    "injection_score": 0.012,
    "gnn_risk_score": 0.040,
    "apimatic_schema_valid": true,
    "policy_verdict": "ALLOW",
    "matched_rule_code": "POL-01",
    "tool_calls": [
      { "mcp_tool_name": "generate_invoice_number", "status": 200, "output": { "invoice_number": "INV-2026-8841" } },
      { "mcp_tool_name": "create_invoice", "status": 201, "output": { "id": "INV2-X892-K110-M442-9012" } },
      { "mcp_tool_name": "create_conditional_rules_for_invoice", "status": 200, "output": { "early_discount_pct": 2.0 } },
      { "mcp_tool_name": "generate_invoice_qr_code", "status": 200, "output": { "qr_code_uri": "data:image/svg+xml;base64,PHN2Zy..." } },
      { "mcp_tool_name": "send_invoice", "status": 202, "output": { "status": "SENT" } }
    ],
    "audit_entry_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "latency_ms": 1840
  }
  ```

---

### `API-02` — `POST /api/v1/agent/approve/{executionId}`
Cryptographically approves or rejects a policy-held (`HOLD_APPROVAL`) tool execution (`US-03`).
- **Headers:** `Authorization: Bearer <token>`, `X-PayOps-Signature: 8f91c2...`
- **Request Body:**
  ```json
  {
    "decision": "APPROVE",
    "operator_reason": "Verified RMA return receipt with warehouse manager; authorizing $1,250.00 refund.",
    "expected_version": 1
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "execution_id": "ex_9041_f8a1",
    "paypal_request_id": "pp-req-7712-b901",
    "policy_verdict": "COMPLETED",
    "approved_by_operator_id": "op_maya_lin_01",
    "paypal_http_status": 201,
    "paypal_response": {
      "id": "9X110022NY881021K",
      "status": "COMPLETED",
      "amount": { "currency_code": "USD", "value": "1250.00" }
    },
    "audit_entry_hash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
  }
  ```

---

### `API-03` — `GET /api/v1/policies` & `PUT /api/v1/policies/{policyId}`
Lists and updates deterministic `Cosmos.AI`-style DSL spend and risk guardrail rules (`E-05`).
- **`PUT /api/v1/policies/pol_02` Request Body:**
  ```json
  {
    "rule_code": "POL-02",
    "rule_name": "High-Value Refund & Prompt-Injection Hold Gate",
    "dsl_expression": "tool IN ('create_refund', 'accept_dispute_claim') AND (amount_usd > 500.00 OR injection_score >= 0.50 OR gnn_risk_score >= 0.70)",
    "max_single_tx_minor": 50000,
    "daily_velocity_cap_minor": 500000,
    "required_approval_role": "FINANCE_ADMIN",
    "risk_threshold": 0.700,
    "is_enabled": true
  }
  ```
- **Response `200 OK`:** Returns the updated `PolicyRule` (`E-05`) with `ast_compiled: true` and `compile_time_ms: 1.4`.

---

### `API-04` — `POST /api/v1/invoices/autonomous`
Generates, APIMatic-validates, attaches conditional discount/late-fee rules, generates a scannable Fastlane QR code, and dispatches a PayPal Invoice v2 (`F-03`, `E-07`).
- **Request Body:**
  ```json
  {
    "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
    "recipient_email": "accounts@acmerobotics.io",
    "currency_code": "USD",
    "due_date": "2026-12-05",
    "items": [
      { "name": "Industrial Sensor Array Model X", "quantity": 10, "unit_amount_minor": 18500 }
    ],
    "conditional_rules": {
      "early_payment_discount_pct": 2.0,
      "early_payment_cutoff_days": 10,
      "late_fee_pct": 1.5
    },
    "generate_qr_code": true,
    "recurring_cadence": null
  }
  ```
- **Response `201 Created`:** Returns the persisted `PayPalInvoiceRecord` (`E-07`) including `paypal_invoice_id: "INV2-X892-K110-M442-9012"`, `qr_code_uri`, and `dunning_state: "SENT"`.

---

### `API-05` — `GET /api/v1/invoices`
Retrieves paginated `PayPalInvoiceRecord` (`E-07`) rows enriched with aging bucket, conditional rule cutoffs, and **Bryntum Scheduler** task coordinates (`F-07`, `F-08`).
- **Query Parameters:** `?workspace_id=...&dunning_state=SENT,REMINDER_1_SENT&currency=USD&cursor=...&limit=100`
- **Response `200 OK`:**
  ```json
  {
    "data": [
      {
        "invoice_record_id": "c4a760a8-dbcf-4e14-9f39-612219e8f110",
        "paypal_invoice_id": "INV2-X892-K110-M442-9012",
        "invoice_number": "INV-2026-8841",
        "amount_minor": 185000,
        "currency_code": "USD",
        "due_date": "2026-12-05",
        "days_past_due": 0,
        "dunning_state": "SENT",
        "conditional_rules_json": { "early_payment_discount_pct": 2.0, "cutoff_date": "2026-11-15" },
        "bryntum_schedule": { "start_date": "2026-11-05", "discount_milestone": "2026-11-15", "next_reminder": "2026-11-22" }
      }
    ],
    "next_cursor": null,
    "total_count": 1
  }
  ```

---

### `API-06` — `POST /api/v1/invoices/{invoiceId}/remind`
Triggers a policy-checked PayPal invoice reminder (`send_invoice_reminder`), updates the **Bryntum** dunning schedule (`US-13`), or records an external/`PYUSD` Solana Token-2022 settlement (`record_payment_for_invoice`, `US-15`).
- **Request Body:**
  ```json
  {
    "action": "RECORD_PYUSD_SETTLEMENT",
    "scheduled_reminder_at": "2026-11-20T09:00:00Z",
    "pyusd_settlement": {
      "solana_tx_signature": "5UfDuX7h9K1mP2qR8vL3nW6yZ4cE9aB1dF2gH3jK4mN5pQ6rS7tU8vW9xY1zA2bC",
      "mint_address": "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
      "memo_verified": "PAYOPS:INV2-7704:pp-req-77c2",
      "amount_minor": 65000
    }
  }
  ```
- **Response `200 OK`:** Returns updated `PayPalInvoiceRecord` (`E-07`) with `dunning_state: "PAID"` and `pyusd_tx_signature`.

---

### `API-07` — `POST /api/v1/orders`
Creates an idempotent PayPal Order v2 (`create_order`) with **Fastlane** guest checkout metadata and **APIMatic** schema validation (`F-05`, `F-06`, `E-06`).
- **Headers:** `PayPal-Request-Id: pp-req-ord-3901`
- **Request Body:**
  ```json
  {
    "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
    "intent": "CAPTURE",
    "currency_code": "USD",
    "amount_minor": 39000,
    "fastlane_accelerated": true,
    "buyer_email": "maya@lumina.io",
    "items": [
      { "sku": "C3-88210", "name": "Kraft Eco-Mailer 12x9 (500-Pack)", "quantity": 1, "unit_amount_minor": 39000 }
    ]
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "order_record_id": "7d444840-9dc0-11d1-b245-5ffdce74fad2",
    "paypal_order_id": "5O190127TN364715T",
    "status": "CREATED",
    "amount_minor": 39000,
    "currency_code": "USD",
    "fastlane_accelerated": true,
    "paypal_request_id": "pp-req-ord-3901",
    "approve_link": "https://www.sandbox.paypal.com/checkoutnow?token=5O190127TN364715T"
  }
  ```

---

### `API-08` — `POST /api/v1/orders/{orderId}/capture`
Captures an authorized PayPal Order v2 (`pay_order`) and atomically attaches carrier shipment tracking (`create_shipment_tracking`, `US-10`, `US-11`).
- **Request Body:**
  ```json
  {
    "carrier_code": "DHL",
    "tracking_number": "77819201",
    "shipment_status": "SHIPPED"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "paypal_order_id": "5O190127TN364715T",
    "paypal_capture_id": "2GG90311X4419201L",
    "order_status": "COMPLETED",
    "shipment_tracking_status": "SHIPPED",
    "carrier_code": "DHL",
    "tracking_number": "77819201"
  }
  ```

---

### `API-09` — `POST /api/v1/orders/{orderId}/refund`
Executes a `Cosmos.AI` policy-guarded and `M-04` GNN risk-verified full or partial refund (`create_refund`, `F-02`, `F-05`, `F-10`).
- **Request Body:**
  ```json
  {
    "amount_minor": 19500,
    "currency_code": "USD",
    "reason_note": "Partial refund for damaged outer carton; verified carrier photo."
  }
  ```
- **Response `200 OK` (if `<= $500` and low risk) or `202 Accepted` (`HOLD_APPROVAL` if `> $500`):** Returns `AgentToolExecution` (`E-04`) receipt and PayPal refund status.

---

### `API-10` — `GET /api/v1/disputes`
Lists active `PayPalDisputeCase` (`E-08`) records enriched with carrier shipment tracking (`get_shipment_tracking`) and `M-04` Multi-Hop GNN friendly-fraud scores (`F-04`, `F-07`, `F-10`).
- **Response `200 OK`:**
  ```json
  {
    "data": [
      {
        "dispute_case_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
        "paypal_dispute_id": "PP-D-4012",
        "paypal_order_id": "8XY92011",
        "reason_code": "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
        "disputed_amount_minor": 34000,
        "currency_code": "USD",
        "response_deadline": "2026-11-12T08:00:00Z",
        "shipment_tracking_proof_json": { "carrier": "DHL", "tracking_number": "77819201", "status": "DELIVERED", "signed_by": "R. SMITH" },
        "gnn_risk_score": 0.880,
        "gnn_reason_codes_json": ["CARRIER_DELIVERED_GEO_MATCH", "SHARED_DEVICE_WITH_3_PRIOR_INR_CLAIMS"],
        "agent_action": "CONTESTED_WITH_EVIDENCE"
      }
    ]
  }
  ```

---

### `API-11` — `POST /api/v1/disputes/{disputeId}/resolve`
Autonomously resolves a PayPal dispute (`F-04`, `US-09`): either calls `accept_dispute_claim` (for valid low-value claims `<= $25`) or compiles and submits a Compelling Evidence 3.0 defense package (`M-03` OCR + `M-05` Elastic RAG + `get_shipment_tracking`).
- **Request Body:**
  ```json
  {
    "resolution_strategy": "AUTO_POLICY_DECIDE",
    "additional_merchant_note": "Carrier DHL #77819201 confirms signed delivery to buyer billing ZIP."
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "paypal_dispute_id": "PP-D-4012",
    "executed_strategy": "CONTESTED_WITH_EVIDENCE",
    "evidence_bundle": {
      "paypal_order_capture_id": "8XY92011",
      "carrier_tracking": "DHL #77819201 (DELIVERED)",
      "elastic_policy_citation": "Terms Clause 4.2: Signed Carrier Proof of Delivery",
      "compiled_in_ms": 3120
    },
    "audit_entry_hash": "9c1185a5c5e9fc54612808977ee8f548b2258d31"
  }
  ```

---

### `API-12` — `POST /api/v1/subscriptions/plans`
Creates and manages PayPal Catalog Products (`create_product`), Subscription Plans (`create_subscription_plan`), and active Subscriptions (`create_subscription`, `update_subscription`) synchronized with **Bryntum Scheduler (`F-08`, `E-09`)**.
- **Request Body:**
  ```json
  {
    "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
    "product_name": "Vortex Cloud AI Managed Retainer",
    "plan_name": "Enterprise Monthly Retainer",
    "billing_cycle_cadence": "MONTHLY",
    "recurring_amount_minor": 250000,
    "currency_code": "USD"
  }
  ```
- **Response `201 Created`:** Returns `SubscriptionPlanRecord` (`E-09`) with `paypal_product_id: "PROD-8X19"`, `paypal_plan_id: "P-5ML4271244454362WXNWU5NQ"`, and `subscriber_status: "ACTIVE"`.

---

### `API-13` — `POST /api/v1/webhooks/paypal`
Receives asynchronous PayPal Sandbox/Live webhook events (`INVOICING.INVOICE.PAID`, `PAYMENT.CAPTURE.COMPLETED`, `CUSTOMER.DISPUTE.CREATED`, `BILLING.SUBSCRIPTION.RENEWED`) and enforces cryptographic verification via `/v1/notifications/verify-webhook-signature` (`R-04`).
- **Required PayPal Headers:**
  - `PAYPAL-TRANSMISSION-ID`
  - `PAYPAL-TRANSMISSION-TIME` (rejected if `|now - transmission_time| > 300s`)
  - `PAYPAL-TRANSMISSION-SIG`
  - `PAYPAL-CERT-URL`
  - `PAYPAL-AUTH-ALGO`
- **Response `202 Accepted`:**
  ```json
  {
    "webhook_event_id": "WH-2WR32451HC0233532-67976317FL4543714",
    "signature_verified": true,
    "event_type": "CUSTOMER.DISPUTE.CREATED",
    "triggered_workflow": "F04_AUTONOMOUS_DISPUTE_DEFENSE",
    "idempotent_replayed": false
  }
  ```

---

### `API-14` — `GET /api/v1/analytics/insights`
Aggregates live merchant TPV, North-Star **Autonomous Net Margin Protected & Recovered (`ANMPR`)**, DSO reduction, dispute win rate, and `@paypal/agent-toolkit`'s `get_merchant_insights` + `list_transactions` for the **AG Grid / AG Charts** Command Center (`F-07`).
- **Response `200 OK`:**
  ```json
  {
    "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
    "period": "LAST_30_DAYS",
    "north_star_anmpr_usd": 4470.00,
    "north_star_anmpr_inr": 375480.00,
    "dso_days_current": 16.0,
    "dso_days_baseline": 28.0,
    "dispute_win_rate_pct": 84.0,
    "policy_firewall_compliance_pct": 100.0,
    "duplicate_mutation_rate_pct": 0.0,
    "total_mcp_tool_executions": 1420,
    "cash_flow_aging_buckets": [
      { "bucket": "CURRENT", "amount_usd": 48200.00 },
      { "bucket": "COLLECTED_EARLY_2PCT_DISC", "amount_usd": 31400.00 },
      { "bucket": "OVERDUE_1_15_DAYS", "amount_usd": 6400.00 }
    ]
  }
  ```
