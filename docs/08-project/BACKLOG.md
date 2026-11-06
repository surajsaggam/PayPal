# Engineering Backlog & GitHub Issues Mapped to `H01`–`H48` (`BACKLOG.md`)
> Project: PayOps AI (PayPal Sentinel) · Owner: Technical Program Manager & Engineering Lead · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [Hackathon Plan](../00-overview/HACKATHON_PLAN.md) · [Features](../01-product/FEATURES.md) · [User Stories](../01-product/USER_STORIES.md) · [Team](./TEAM.md)

## 1. Backlog Organization & Traceability Matrix

Every ticket in this backlog is formatted ready to paste directly into **GitHub Issues / GitHub Projects** and maps 1-to-1 to our canonical Single-Source-of-Truth IDs (`F-01`, `F-02`, `F-03`, `F-04`, `F-05`, `F-06`, `F-07`, `F-08`, `F-09`, `F-10`, `F-11`, `F-12`; `US-01`, `US-02`, `US-03`, `US-04`, `US-05`, `US-06`, `US-07`, `US-08`, `US-09`, `US-10`, `US-11`, `US-12`, `US-13`, `US-14`, `US-15`, `US-16`; `E-01`, `E-02`, `E-03`, `E-04`, `E-05`, `E-06`, `E-07`, `E-08`, `E-09`, `E-10`; `API-01`, `API-02`, `API-03`, `API-04`, `API-05`, `API-06`, `API-07`, `API-08`, `API-09`, `API-10`, `API-11`, `API-12`, `API-13`, `API-14`; `M-01`, `M-02`, `M-03`, `M-04`, `M-05`; `R-01`, `R-02`, `R-03`, `R-04`, `R-05`, `R-06`, `R-07`, `R-08`, `R-09`, `R-10`, `R-11`, `R-12`; `ADR-0000`, `ADR-0001`, `ADR-0002`, `ADR-0003`, `ADR-0004`, `ADR-0005`) and our 48-hour hackathon execution blocks (`H01`–`H48` in `HACKATHON_PLAN.md`).

### Summary by Epic
- **EPIC-01**: Monorepo Foundation, Database Schema (`E-01`..`E-10`) & `JunoDB` Idempotent Ledger (`F-06`) — *Tickets `TKT-001` to `TKT-006`*
- **EPIC-02**: PayPal MCP Server, `@paypal/agent-toolkit` (35 Tools) & `APIMatic` Schema Validator (`F-01`, `F-09`) — *Tickets `TKT-007` to `TKT-012`*
- **EPIC-03**: Deterministic `Cosmos.AI` DSL Policy Firewall (`F-02`), `M-02` Router & WebAuthn Approval (`API-02`) — *Tickets `TKT-013` to `TKT-017`*
- **EPIC-04**: Autonomous Smart Invoicing v2, Conditional Rules, QR & Procurement (`F-03`, `F-05`, `F-11`) — *Tickets `TKT-018` to `TKT-022`*
- **EPIC-05**: Autonomous Dispute Defense (`F-04`), Multimodal OCR (`M-03`) & `GraphSAGE` Scorer (`F-10`, `M-04`) — *Tickets `TKT-023` to `TKT-027`*
- **EPIC-06**: Executive Command Center (`AG Grid` `F-07` + `Bryntum` `F-08` + `Elastic` `F-12`) — *Tickets `TKT-028` to `TKT-031`*
- **EPIC-07**: Render Cloud Deployment, AI Eval Gates, E2E Playwright Suite & Devpost Pitch (`R-06`, `R-12`) — *Tickets `TKT-032` to `TKT-036`*

---

## 2. Granular Ticket Registry (`TKT-001` to `TKT-036`)

### EPIC-01: Monorepo Foundation, Database Schema (`E-01`..`E-10`) & `JunoDB` Idempotent Ledger (`F-06`)

| Ticket ID | Title | Mapped IDs | Hour Block | Est. | Owner Role | Description & Verifiable Acceptance Criteria |
|---|---|---|---|---|---|---|
| **`TKT-001`** | Initialize pnpm TypeScript Monorepo (`apps/web`, `services/api`, `packages/shared`) | `ADR-0000`, `ADR-0001` | `H01–H02` | `2h` | Lead Full-Stack | **Desc**: Scaffold workspace with Node 22.11.0 LTS, strict `tsconfig.json`, ESLint 9, and MIT `LICENSE` visible in GitHub About (`R-12`).<br>**AC**: `pnpm -r run typecheck` and `pnpm lint` exit `0`. |
| **`TKT-002`** | Implement PostgreSQL 16 + `pgvector` Schema for Entities `E-01` to `E-09` | `E-01`, `E-02`, `E-03`, `E-04`, `E-05`, `E-06`, `E-07`, `E-08`, `E-09`, `ADR-0002` | `H02–H04` | `2h` | Backend Lead | **Desc**: Create migrations for `MerchantWorkspace` (`E-01`), `OperatorUser` (`E-02`), `AgentSession` (`E-03`), `AgentToolExecution` (`E-04`), `PolicyRule` (`E-05`), `PayPalOrderRecord` (`E-06`), `PayPalInvoiceRecord` (`E-07`), `PayPalDisputeCase` (`E-08`), `SubscriptionPlanRecord` (`E-09`) with RLS.<br>**AC**: All tables migrate cleanly; RLS prevents cross-workspace reads. |
| **`TKT-003`** | Implement Hash-Chained `ImmutableAuditLog` (`E-10`) with Mutation-Blocking Trigger | `E-10`, `R-01`, `R-07`, `ADR-0005` | `H04–H06` | `2h` | Backend / Security | **Desc**: Create `immutable_audit_logs` table with `prev_hash` + `record_hash` (`SHA-256`) and PostgreSQL trigger rejecting `UPDATE`/`DELETE`/`TRUNCATE`.<br>**AC**: Attempting `DELETE FROM immutable_audit_logs` throws SQL exception `23514`. |
| **`TKT-004`** | Build `JunoDB`-Patterned Idempotent State Store & `PayPal-Request-Id` Middleware | `F-06`, `US-10`, `R-02` | `H05–H08` | `3h` | Backend Lead | **Desc**: Implement atomic `SET NX EX 86400` lock in Redis 7.4 + Postgres `UNIQUE (workspace_id, idempotency_key)` fallback (`E-04`).<br>**AC**: Firing 10 concurrent identical `POST /api/v1/orders` requests executes exactly 1 PayPal Sandbox call and returns 10 identical responses. |
| **`TKT-005`** | Implement Pre-Ingestion Luhn PAN Scrubber & Buyer HMAC-SHA256 Hasher | `R-07`, `E-06`, `E-08` | `H06–H08` | `2h` | AI / Data Lead | **Desc**: Strip any 13–19 digit Luhn-valid numbers and hash buyer emails/addresses before DB persistence or LLM context assembly.<br>**AC**: 100% of test card numbers replaced with `[REDACTED_PAYMENT_IDENTIFIER]`. |
| **`TKT-006`** | Write PayPal Sandbox Seed Script (`scripts/seed-sandbox.ts`) | `F-03`, `F-04`, `F-05` | `H07–H10` | `3h` | Backend Lead | **Desc**: Create deterministic seed script populating catalog products, invoices, orders, and dispute fixtures in Sandbox & local DB.<br>**AC**: `pnpm run seed:sandbox` exits `0` and populates 50+ fixtures idempotently. |

---

### EPIC-02: PayPal MCP Server, `@paypal/agent-toolkit` (35 Tools) & `APIMatic` Schema Validator (`F-01`, `F-09`)

| Ticket ID | Title | Mapped IDs | Hour Block | Est. | Owner Role | Description & Verifiable Acceptance Criteria |
|---|---|---|---|---|---|---|
| **`TKT-007`** | Configure Declarative 35-Tool PayPal MCP Manifest (`ai/agents/paypal-mcp-config.json`) | `F-01`, `US-01` | `H08–H11` | `3h` | AI Lead | **Desc**: Register all 35 tools across Invoices (20), Orders (5), Disputes (3), Shipment Tracking (3), Catalog (3), Subscriptions (7), and Insights (2) with autonomy levels.<br>**AC**: Manifest validates all 35 verbatim tool names against `@paypal/agent-toolkit`. |
| **`TKT-008`** | Integrate `@paypal/agent-toolkit` & `@paypal/paypal-server-sdk` OAuth2 Enclave | `F-01`, `R-06`, `R-07` | `H10–H13` | `3h` | Backend Lead | **Desc**: Build isolated MCP execution enclave with 6-hour Redis OAuth2 token caching and exponential backoff.<br>**AC**: Secrets never enter LLM context; OAuth token reused across 100 consecutive calls. |
| **`TKT-009`** | Build `APIMatic` Context Plugin & Deterministic Payload Schema Validator | `F-09`, `US-14`, `R-03` | `H11–H14` | `3h` | AI / API Lead | **Desc**: Validate all LLM-generated tool arguments against APIMatic/PayPal Server SDK Zod schemas (ISO-4217 currency precision, required fields).<br>**AC**: Rejects float `250` and auto-normalizes/validates `"250.00"` with `100%` schema compliance on `EVAL-DS-01`. |
| **`TKT-010`** | Implement `M-01` (`Claude 3.5 Sonnet` / `GPT-4o`) Envoy-Patterned LLM Gateway | `M-01`, `F-01`, `API-01` | `H12–H15` | `3h` | AI Lead | **Desc**: Implement `POST /api/v1/agent/execute` (`API-01`) with Anthropic Prompt Caching and automatic failover to `GPT-4o`.<br>**AC**: `p95` planning latency `<= 2,500ms`; seamless failover when primary provider simulated down. |
| **`TKT-011`** | Implement `M-02` (`GPT-4o-mini`) Sub-150ms Intent Router & Tool Pruner | `M-02`, `F-01`, `R-10` | `H14–H16` | `2h` | AI Lead | **Desc**: Route incoming requests to the relevant 1 of 7 tool domains, pruning prompt schemas from 35 tools to `<= 8` tools.<br>**AC**: `p95 < 150ms`; reduces `M-01` input tokens by `>= 65%`. |
| **`TKT-012`** | Implement `POST /api/v1/webhooks/paypal` (`API-13`) with RSA-SHA256 Verification | `API-13`, `R-04` | `H14–H17` | `3h` | Backend Lead | **Desc**: Verify `PAYPAL-TRANSMISSION-SIG`, pin `*.paypal.com` cert URLs, enforce 300s replay window, and enqueue to `payops-policy-worker`.<br>**AC**: Forged signatures return `HTTP 401`; valid webhooks persist in `< 200ms`. |

---

### EPIC-03: Deterministic `Cosmos.AI` DSL Policy Firewall (`F-02`) & Human-in-the-Loop Approval (`API-02`)

| Ticket ID | Title | Mapped IDs | Hour Block | Est. | Owner Role | Description & Verifiable Acceptance Criteria |
|---|---|---|---|---|---|---|
| **`TKT-013`** | Build `Cosmos.AI`-Style Deterministic DSL Policy Engine (`packages/shared/policy-dsl`) | `F-02`, `E-05`, `US-02`, `ADR-0003` | `H16–H19` | `3h` | Backend / AI Lead | **Desc**: Implement AST evaluator checking single-tx caps, 24h velocity counters in `JunoDB`, merchant allowlists, and `gnn_risk_score` thresholds.<br>**AC**: `0.0%` policy bypass rate across 200 adversarial test cases (`EVAL-DS-03`). |
| **`TKT-014`** | Implement Karpathy Autonomy Slider (`L0`–`L4`) & Policy Management API (`API-03`) | `F-02`, `API-03`, `US-03` | `H18–H20` | `2h` | Backend Lead | **Desc**: Expose `GET /api/v1/policies` and `PUT /api/v1/policies/{policyId}` with instant RAG re-indexing.<br>**AC**: Changing slider to `L2` immediately holds all mutations for human approval. |
| **`TKT-015`** | Implement `POST /api/v1/agent/approve/{executionId}` (`API-02`) with WebAuthn Passkey | `API-02`, `US-03`, `E-02`, `ADR-0005` | `H19–H22` | `3h` | Full-Stack Lead | **Desc**: Require FIDO2 WebAuthn passkey signature from `FINANCE_ADMIN` or `OWNER` to release held `AgentToolExecution` (`E-04`) records.<br>**AC**: Unauthenticated or `OPS_ANALYST` approval attempts return `HTTP 403`. |
| **`TKT-016`** | Implement 4-Layer Indirect Prompt-Injection Firewall (`<untrusted_external_data>`) | `R-01`, `M-02` | `H20–H22` | `2h` | AI Security Lead | **Desc**: Escape XML tags in external webhook/memo fields and block imperative refund/dispute commands in `M-02`.<br>**AC**: Blocks `>= 99.0%` of red-team payloads in `EVAL-DS-03`. |
| **`TKT-017`** | Build Token Budget & Step-Limit Circuit Breaker (`max_tool_hops = 6`) | `R-10`, `E-03` | `H21–H23` | `2h` | AI Lead | **Desc**: Enforce per-turn tool step caps (`max_tool_hops = 6`) and hourly workspace token spend circuit breakers (`ALT-05`).<br>**AC**: Recursive loop test halts cleanly on step 6 with audit record. |

---

### EPIC-04: Autonomous Smart Invoicing v2, Orders, Fastlane & `PYUSD` Settlement (`F-03`, `F-05`, `F-11`)

| Ticket ID | Title | Mapped IDs | Hour Block | Est. | Owner Role | Description & Verifiable Acceptance Criteria |
|---|---|---|---|---|---|---|
| **`TKT-018`** | Implement Autonomous Smart Invoicing API (`API-04`, `API-05`, `API-06`) | `F-03`, `US-04`, `US-05`, `US-06`, `API-04`, `API-05`, `API-06`, `E-07` | `H22–H25` | `3h` | Backend Lead | **Desc**: Orchestrate `create_invoice`, `send_invoice`, `generate_invoice_qr_code`, `create_conditional_rules_for_invoice`, and `send_invoice_reminder`.<br>**AC**: Creates live PayPal Sandbox Invoice v2 with QR code and 2% early-pay discount rule. |
| **`TKT-019`** | Implement Recurring Invoice Series & Dunning Velocity Guard (`<= 1 reminder / 72h`) | `F-03`, `US-06`, `R-11` | `H24–H26` | `2h` | Backend Lead | **Desc**: Wire `create_recurring_series` and `activate_recurring_series` with FDCPA/RBI-compliant 72-hour reminder cooldowns.<br>**AC**: Second reminder within 72h is blocked by `F-02`. |
| **`TKT-020`** | Implement Idempotent Order Checkout, Capture, Refund & Tracking APIs (`API-07`, `API-08`, `API-09`) | `F-05`, `US-10`, `US-11`, `API-07`, `API-08`, `API-09`, `E-06` | `H25–H28` | `3h` | Full-Stack Lead | **Desc**: Implement `create_order`, `pay_order`, `create_refund`, and `create_shipment_tracking` plus **Fastlane** guest checkout component.<br>**AC**: Complete order-to-capture-to-tracking flow passes E2E test. |
| **`TKT-021`** | Implement Subscription Plan & Billing Lifecycle API (`API-12`) | `F-01`, `API-12`, `E-09` | `H27–H29` | `2h` | Backend Lead | **Desc**: Orchestrate `create_subscription_plan`, `create_subscription`, and `update_subscription` for recurring SaaS billing.<br>**AC**: Creates active Sandbox subscription plan and stores `E-09` record. |
| **`TKT-022`** | Build Cross-Border `PYUSD` Solana Token-2022 Settlement Bridge (`F-11`) | `F-11`, `US-15`, `R-08`, `R-09` | `H28–H31` | `3h` | Payments Lead | **Desc**: Generate Solana Token-2022 `PYUSD` transfer request (`2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo`) enforcing `Memo Required` matching `invoice_id` (`E-07`) and non-custodial compliance (`R-08`).<br>**AC**: Rejects settlement without matching `invoice_id` memo; reconciles valid transfer in `< 3s`. |

---

### EPIC-05: Autonomous Dispute Defense (`F-04`), Multimodal OCR (`M-03`) & `GraphSAGE` Scorer (`F-10`, `M-04`)

| Ticket ID | Title | Mapped IDs | Hour Block | Est. | Owner Role | Description & Verifiable Acceptance Criteria |
|---|---|---|---|---|---|---|
| **`TKT-023`** | Train & Export `M-04` (`GraphSAGE + LightGBM`) ONNX Friendly-Fraud Scorer | `M-04`, `F-10`, `US-08`, `R-05` | `H18–H22` | `4h` | ML Lead | **Desc**: Train 2-hop Mirror Graph model on `EVAL-DS-04`, calibrate via isotonic regression, and export `payops-graphsage-lgbm-v1.2.onnx` with TreeSHAP reason codes.<br>**AC**: `ROC-AUC >= 0.920`, VIP buyer `FPR <= 2.0%`, inference latency `< 10ms`. |
| **`TKT-024`** | Implement `M-03` (`Gemini 1.5 Pro`) Multimodal Carrier POD & Invoice OCR Extractor | `M-03`, `F-04`, `US-07` | `H22–H25` | `3h` | AI Lead | **Desc**: Extract carrier name, tracking number, delivery timestamp, postal code, and signature boolean from PDF/image proofs.<br>**AC**: Achieves `>= 95.0%` field F1 on `EVAL-DS-02`. |
| **`TKT-025`** | Build `M-05` Hybrid Vector + BM25 Dispute Policy RAG in Elasticsearch (`F-12`) | `M-05`, `F-12`, `US-16` | `H24–H27` | `3h` | AI / Data Lead | **Desc**: Index PayPal Compelling Evidence rules and merchant contracts into Elasticsearch with RRF hybrid retrieval.<br>**AC**: Retrieves top-5 policy chunks in `< 65ms p95` with strict tenant isolation. |
| **`TKT-026`** | Implement Autonomous Dispute Triage & Compelling Evidence API (`API-10`, `API-11`) | `F-04`, `US-07`, `US-08`, `US-09`, `API-10`, `API-11`, `E-08` | `H27–H31` | `4h` | Backend / AI Lead | **Desc**: Correlate `get_dispute` + `get_shipment_tracking` + `M-03` OCR + `M-04` risk score to auto-accept valid low-value claims (`<= $25.00` standard / `<= $50.00` configurable) or assemble compelling evidence for friendly fraud.<br>**AC**: End-to-end webhook-to-evidence assembly completes in `< 4.5s`. |
| **`TKT-027`** | Implement Merchant ROI & Dispute Win-Rate Analytics Endpoint (`API-14`) | `API-14`, `F-01` | `H30–H32` | `2h` | Backend Lead | **Desc**: Aggregate `get_merchant_insights`, dispute win-rate lift, DSO reduction, and saved dollars in `$` and `₹`.<br>**AC**: Returns real-time metrics for AG Grid KPI header cards. |

---

### EPIC-06: Executive Command Center (`AG Grid` `F-07` + `Bryntum` `F-08` + `Elastic` `F-12`)

| Ticket ID | Title | Mapped IDs | Hour Block | Est. | Owner Role | Description & Verifiable Acceptance Criteria |
|---|---|---|---|---|---|---|
| **`TKT-028`** | Build Executive Financial Command Center with **AG Grid Enterprise / AG Studio** (`F-07`) | `F-07`, `US-12` | `H24–H30` | `6h` | Frontend / UI Lead | **Desc**: Implement real-time transaction, invoice aging, and dispute SLA matrix in AG Grid with integrated financial charts, row grouping, custom TreeSHAP reason badges, and 1-click Passkey approval drawer.<br>**AC**: Renders 10,000 rows in `< 800ms`; live WebSocket/SSE stream updates rows without flicker (targeting **$10,000 AG Grid Prize**). |
| **`TKT-029`** | Build Receivables, Subscription & Settlement Scheduler with **Bryntum** (`F-08`) | `F-08`, `US-13` | `H28–H34` | `6h` | Frontend / UI Lead | **Desc**: Integrate **Bryntum Scheduler / Gantt** displaying recurring invoice series, conditional discount windows, dunning cadences, and dispute SLA deadlines with drag-to-reschedule PayPal API sync.<br>**AC**: Dragging an invoice bar in Bryntum triggers `update_invoicing` / `create_conditional_rules_for_invoice` (targeting **$3,000 Bryntum Prize**). |
| **`TKT-030`** | Build Natural-Language Command Bar & Policy Dry-Run Inspector | `F-01`, `F-02`, `US-01` | `H32–H35` | `3h` | Frontend Lead | **Desc**: Build `Cmd+K` agent command bar showing live `M-02` routing, `F-02` policy dry-run preview, and `APIMatic` SDK code export tab (`US-14`).<br>**AC**: Supports keyboard-only WCAG 2.2 AA navigation and 5 UI states (`empty`/`loading`/`error`/`offline`/`success`). |
| **`TKT-031`** | Implement Multi-Currency (`$`/`€`/`£`/`₹`/`PYUSD`) & Bilingual (`en`/`hi`/`es`) Switcher | `LOCALIZATION.md` | `H34–H36` | `2h` | Frontend Lead | **Desc**: Format all ledger and chart amounts using `Intl.NumberFormat` (`en-US`, `en-IN` lakh/crore, `de-DE`) and localized labels.<br>**AC**: Zero layout truncation across English, Hindi, and Spanish locales. |

---

### EPIC-07: Render Cloud Deployment, AI Eval Gates, E2E Playwright Suite & Devpost Pitch (`H36`–`H48`)

| Ticket ID | Title | Mapped IDs | Hour Block | Est. | Owner Role | Description & Verifiable Acceptance Criteria |
|---|---|---|---|---|---|---|
| **`TKT-032`** | Author `infra/render.yaml` Blueprint & Deploy Live Staging/Production on **Render** | `ADR-0004`, `R-06`, `R-12` | `H36–H39` | `3h` | DevOps / SRE Lead | **Desc**: Deploy `payops-web`, `payops-api`, `payops-policy-worker`, `payops-postgres`, and `payops-junodb-redis` on Render with live PayPal Sandbox webhooks.<br>**AC**: Public Render URL returns `HTTP 200` on `/api/v1/health` (targeting **$2,250 Render Prize**). |
| **`TKT-033`** | Write E2E Playwright / Vitest Verification Suite (`tests/e2e/checkout-dispute.spec.ts`) | `F-03`, `F-04`, `F-05`, `F-06` | `H38–H41` | `3h` | QA / E2E Lead | **Desc**: Automate end-to-end verification of idempotent Order v2 capture, smart Invoice v2 creation with QR/rules, and webhook-triggered dispute defense.<br>**AC**: All E2E specs pass in CI and against live Render staging. |
| **`TKT-034`** | Execute Full 200-Case Red-Team & 350-Case MCP Tool Eval Suite (`AI_EVALS.md`) | `M-01`, `M-02`, `M-03`, `M-04`, `M-05`, `R-01`, `R-03` | `H40–H42` | `2h` | AI Lead | **Desc**: Run `.github/workflows/ci.yml` Stage 5 gate and verify all 9 benchmark metrics exceed threshold.<br>**AC**: `100%` schema validity, `>= 99%` injection block rate, `0%` policy bypass. |
| **`TKT-035`** | Verify Demo-Day Offline Replay Fallback (`FF_DEMO_OFFLINE_REPLAY_FALLBACK`) | `R-06`, `RUNBOOK.md` | `H42–H44` | `2h` | Full-Stack Lead | **Desc**: Test instant failover to signed Sandbox fixtures when upstream network is disconnected.<br>**AC**: Demo flow completes in `< 45s` even with simulated PayPal Sandbox `HTTP 429`. |
| **`TKT-036`** | Record `<2:55` 4K YouTube Demo Video, Verify GitHub License & Submit on Devpost | `R-12`, `PITCH.md` | `H44–H48` | `4h` | All Team Members | **Desc**: Record crisp `< 3:00` live demo following Steve Jobs script (`PITCH.md`), verify MIT license in GitHub `About` section, and submit on `paypalaihackathon.devpost.com` before Nov 12, 2026 12:00 PM PT.<br>**AC**: All 6 Devpost baseline compliance checks verified green. |
