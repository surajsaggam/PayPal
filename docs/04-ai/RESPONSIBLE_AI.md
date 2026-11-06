# Responsible AI, Autonomy Governance & Regulatory Alignment (`RESPONSIBLE_AI.md`)
> Project: PayOps AI (PayPal Sentinel) · Owner: Chief Risk & Responsible AI Officer · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [PRD](../01-product/PRD.md) · [Architecture](../03-engineering/ARCHITECTURE.md) · [Models](./MODELS.md) · [Compliance](../06-security-compliance/COMPLIANCE.md) · [Risk Register](../06-security-compliance/RISK_REGISTER.md)

## 1. Core Philosophy: Autonomy Gated by Deterministic Policy

In financial operations, an ungoverned AI agent with access to payment execution tools is an existential liability (the **Levchin–Webster–Karim Law of Adversarial Risk**). **PayOps AI (`PayPal Sentinel`)** is architected around Andrej Karpathy's **Autonomy Slider** and PayPal's **`Cosmos.AI` Decision Platform**, ensuring that AI autonomy scales dynamically with transaction risk, dollar/rupee exposure, and counterparty trust.

---

## 2. The Karpathy 5-Level Autonomy Slider (`L0` to `L4`)

Merchant owners (`E-02: OWNER` / `FINANCE_ADMIN`) can adjust their workspace's autonomy level globally or per tool domain via `PUT /api/v1/policies/{policyId}` (`API-03`):

| Autonomy Level | Name | Permitted `@paypal/agent-toolkit` Actions | Mandatory Guardrails (`F-02`, `F-06`, `F-10`) | Default Use Case |
|---|---|---|---|---|
| **`L0`** | **Manual / Copilot Read-Only** | `list_invoices`, `get_invoice`, `get_order`, `list_disputes`, `get_dispute`, `get_shipment_tracking`, `list_transactions`, `get_merchant_insights` | Read-only OAuth scope; zero state mutation permitted. | Initial onboarding audit & shadow-mode evaluation. |
| **`L1`** | **Draft & Recommend Only** | All `L0` tools + `create_invoice` (draft only, no `send_invoice`), `generate_invoice_number`, evidence bundle drafting (`E-08` draft). | Drafts saved in PayPal Sandbox / Postgres; requires 1-click human execution for all sends. | Conservative enterprise finance teams during Week 1 pilot. |
| **`L2`** | **Human-in-the-Loop (HITL) Co-Signing** | All tools staged via `AgentToolExecution` (`E-04`); any fund movement (`pay_order`, `create_refund`, `accept_dispute_claim`, `send_invoice > $5,000`) pauses in `PENDING_APPROVAL`. | Requires cryptographic WebAuthn/Passkey or RBAC approval via `POST /api/v1/agent/approve/{executionId}` (`API-02`). | High-value refunds (`> $250` / `₹21,000`), high-risk disputes, or cross-border PYUSD payouts (`F-11`). |
| **`L3`** | **Policy-Bounded Autonomous Execution (Default MVP)** | Autonomous execution of `send_invoice`, `send_invoice_reminder`, `generate_invoice_qr_code`, `create_conditional_rules_for_invoice`, `create_shipment_tracking`, low-value refunds (`<= $250`), and compelling-evidence submission when `gnn_risk_score` & `PolicyRule` (`E-05`) pass. | Deterministic `Cosmos.AI` DSL Firewall (`F-02`) + `JunoDB` idempotency (`F-06`) + `APIMatic` schema validation (`F-09`). Automatically downgrades to `L2` if any threshold is exceeded. | Standard operating mode for SMBs (`Persona P1`, `Persona P2`) and hackathon live demo. |
| **`L4`** | **Full Autonomous Micro-Operations** | Zero-touch execution of read queries, carrier tracking updates, QR generation, and pre-approved recurring billing series (`activate_recurring_series`) within strict daily velocity caps. | Circuit breaker trips to `L2` if 1-hour anomaly rate exceeds `2.0σ` or token burn exceeds budget (`R-10`). | High-frequency e-commerce tracking sync & automated dunning reminders. |

---

## 3. Bias, Fairness & Non-Discrimination Auditing (`R-11`)

Automated financial dunning (`F-03`) and dispute/fraud scoring (`F-04`, `F-10`, `M-04`) carry a known risk of demographic, geographic, or merchant-size bias (`R-11`). We enforce four technical safeguards:

### 3.1 Blinded Feature Engineering in `M-04` (`GraphSAGE + LightGBM`)
- **Strict Exclusion of Protected Attributes**: `M-04` never ingests buyer/merchant name, gender, ethnicity, religion, caste, age, or neighborhood census/redlining zip-code demographics.
- **Behavioral & Cryptographic Signal Grounding**: Scoring relies strictly on objective transactional and fulfillment signals: carrier delivery confirmation (`get_shipment_tracking`), cryptographic signature presence (`M-03`), order-to-delivery timestamp delta, and verified multi-account collision hashes.

### 3.2 Subgroup Parity & Equalized Odds Benchmarks (`EVAL-DS-04`)
Before any `M-04` model weight update or `M-01` prompt update is promoted, we measure **False Positive Rate (FPR)** (legitimate buyers wrongly flagged as friendly-fraud) across geographic corridors and merchant sizes:

| Subgroup Dimension | Segment A | Segment B | Segment C | Disparate Impact Ratio (`Min / Max Pass Rate`) | Required Fairness Gate (Four-Fifths / 80% Rule) |
|---|---|---|---|---|---|
| **Geography / Corridor** | US Domestic (`1.0%` FPR) | India Cross-Border (`1.2%` FPR) | EU / UK / LATAM (`1.1%` FPR) | **`0.988`** | **`>= 0.850`** (Pass) |
| **Merchant TPV Tier** | Micro-SMB `<$50k/yr` (`1.2%` FPR) | Mid-Market `$50k–$2M/yr` (`1.1%` FPR) | Enterprise `>$2M/yr` (`1.0%` FPR) | **`0.985`** | **`>= 0.850`** (Pass) |
| **Buyer Language** | English (`1.0%` FPR) | Hindi / Spanish / Non-English (`1.2%` FPR) | — | **`0.982`** | **`>= 0.850`** (Pass) |

---

## 4. Explainability & Right to Contest (`M-04` + `M-01`)

1. **Deterministic Reason Codes (`RC_01`..`RC_12`)**: Every risk score produced by `M-04` and every policy block emitted by `F-02` outputs human-readable reason codes (e.g., `RC_01_CARRIER_DELIVERED_SIGNED`, `RC_02_EXCEEDS_SINGLE_REFUND_CAP_250_USD`, `RC_04_BUYER_REPEAT_INR_CLAIM_CLUSTER`).
2. **AG Grid Explainability Drawer (`F-07`)**: Clicking any row in the AG Grid Command Center opens a side-by-side audit trace displaying:
   - Exact input fields evaluated
   - Top-3 SHAP feature contributions from `M-04`
   - The triggered `PolicyRule` (`E-05`) DSL clause
   - A 1-click **"Override with Operator Passkey"** button (`API-02`).
3. **Consumer & Buyer Recourse**: PayOps AI never unilaterally blocks a buyer's statutory right to file a dispute on PayPal; instead, it assembles verifiable merchant fulfillment evidence (`F-04`) submitted to PayPal's neutral dispute resolution adjudicators via PayPal's official Disputes API.

---

## 5. Misuse Scenarios & Technical Mitigations

| Misuse / Abuse Scenario | Risk ID | Preventive Technical Control |
|---|---|---|
| **Aggressive / Harassing Dunning Messages** | `R-11` | `send_invoice_reminder` uses pre-approved, polite, FDCPA/RBI-compliant templates (`PROMPTS.md`) and caps reminders at max 1 per 72 hours per invoice (`F-02` velocity rule). |
| **Merchant Attempting Fake Tracking Upload to Win Disputes** | `R-05` | `M-03` + `F-04` cross-verify uploaded tracking numbers against live PayPal Tracking API (`get_shipment_tracking`) and carrier status (`DELIVERED` + matching postal code). |
| **Prompt Injection Tricking Agent into Draining Refund Balance** | `R-01` | Multi-layer defense: `<untrusted_external_data>` XML isolation + `M-02` classifier + `F-02` deterministic policy firewall + `JunoDB` daily velocity caps. |

---

## 6. Alignment with Global & Indian AI Governance Frameworks

| Framework | Classification / Tier | How PayOps AI Complies |
|---|---|---|
| **NIST AI Risk Management Framework (AI RMF 1.0)** | **GOVERN, MAP, MEASURE, MANAGE** | **GOVERN**: RBAC roles (`E-02`) + Autonomy Slider (`L0`–`L4`). **MAP**: Complete model cards (`MODELS.md`) & threat model (`THREAT_MODEL.md`). **MEASURE**: Automated CI eval gates (`AI_EVALS.md`). **MANAGE**: Real-time circuit breakers & `RUNBOOK.md`. |
| **EU AI Act (Regulation (EU) 2024/1689)** | **Limited Risk / Transparency System** (Back-office B2B invoicing & merchant dispute evidence assistant; does *not* perform consumer creditworthiness scoring under Annex III(5)(b)) | Explicit AI disclosure in merchant UI and buyer-facing automated invoice memos (`"Generated with PayOps AI Assistant"`); full technical documentation (`MODELS.md`, `DATA_PIPELINE.md`); mandatory human oversight (`API-02`). |
| **MeitY / IndiaAI Governance Guidelines & Advisories (2024–2026)** | **Enterprise Financial Automation AI** | Zero training on unconsented Indian personal data (`PRIVACY.md`); subgroup fairness validation across Indic languages (`hi-IN`, `ta-IN`); 180-day immutable audit trails (`E-10`); explicit human grievance & override loop. |
| **ISO/IEC 42001:2023 (AI Management System)** | **AIMS Ready** | Versioned prompts (`PROMPTS.md`), reproducible synthetic datasets (`DATA_PIPELINE.md`), continuous drift monitoring (`OBSERVABILITY.md`), and formal risk register (`RISK_REGISTER.md`). |
