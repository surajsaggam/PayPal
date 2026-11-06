# PayPal, FinTech, Agentic AI & Regulatory Glossary (`GLOSSARY.md`)
> Project: PayOps AI (PayPal Sentinel) · Owner: Principal Technical Writer & Domain Architect · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [PRD](../01-product/PRD.md) · [Architecture](../03-engineering/ARCHITECTURE.md) · [Compliance](../06-security-compliance/COMPLIANCE.md)

## 1. PayPal Platform & Engineering Stack Terms

| Term / Acronym | Full Name | Definition & Role in PayOps AI (`PayPal Sentinel`) |
|---|---|---|
| **`@paypal/agent-toolkit`** | PayPal Agent Toolkit | Official open-source TypeScript/Python SDK (`github.com/paypal/agent-toolkit`) exposing **35 structured payment, invoicing, dispute, tracking, catalog, subscription, and insight tools** for AI agents (`F-01`). |
| **PayPal MCP Server** | PayPal Model Context Protocol Server | Standard stdio/SSE (`npx -y @paypal/mcp --tools=all`) and remote (`https://mcp.paypal.com`) MCP server allowing LLM hosts to invoke PayPal Sandbox/Live APIs with isolated OAuth2 credentials (`F-01`). |
| **`Cosmos.AI`** | PayPal Cosmos.AI Platform | PayPal's internal enterprise MLOps, Envoy-based LLM Gateway, and **Decision Platform DSL Rule Engine** (documented on the PayPal Technology Blog). Inspired our deterministic Spend & Risk Policy Firewall (`F-02`, `E-05`). |
| **`JunoDB`** | PayPal JunoDB (`paypal/junodb`) | PayPal's open-source distributed key-value store written in Golang with RocksDB storage (serving 350B+ req/day at `99.9999%` availability). Patterns our idempotent execution state lock (`F-06`). |
| **`Raptor`** | PayPal Raptor Framework | PayPal's standardized Java/Spring Boot enterprise microservices framework powering core settlement, risk, and ledger services. |
| **`Kraken.js` & `Zoid`** | PayPal Kraken.js & Zoid | Open-source Node.js application security framework (`krakenjs/kraken-js`) and cross-domain iframe component library (`krakenjs/zoid`) powering isolated PayPal Smart Payment Buttons. |
| **`Fastlane`** | Fastlane by PayPal | Accelerated 1-tap guest checkout experience recognizing 430M+ accounts via email/OTP, boosting guest conversion to ~80% (`F-05`). |
| **`PPCP`** | PayPal Complete Payments | PayPal's flagship global SMB and marketplace commerce stack unifying branded checkout, Fastlane, Venmo, Pay Later, cards, and APMs. |
| **`PYUSD`** | PayPal USD Stablecoin | 1:1 USD-backed stablecoin issued by NYDFS-regulated Paxos Trust Company on Ethereum (`ERC-20`) and **Solana (`SPL Token-2022` with `Memo Required` and `Confidential Transfers`)** (`F-11`). |
| **`Simility` & Real-Time Graph** | PayPal Simility & Mirror Graph Engine | PayPal's adaptive fraud engine and real-time multi-hop graph database using pre-aggregated **Mirror Graphs** and **Graph Neural Networks (GNNs)**. Patterns our `M-04` (`GraphSAGE + LightGBM`) scorer (`F-10`). |
| **`PayPal-Request-Id`** | PayPal Idempotency Header | Standard HTTP header on PayPal REST v2 POST endpoints guaranteeing that retried network requests never double-charge or double-refund (`F-06`, `R-02`). |

---

## 2. FinTech, Payments & Accounting Terms

| Term / Acronym | Full Name | Definition & Context |
|---|---|---|
| **TPV** | Total Payment Volume | Gross value of payments successfully processed across the platform (`$1.36T+` on PayPal globally). |
| **Transaction Margin Dollars** | Net Transaction Margin (`$`) | `Gross Take Rate - Funding Mix Cost - Fraud/Dispute Loss (bps) - Processing Cost`. Core metric championed by CEO **Alex Chriss** and former CFO **Roelof Botha**. |
| **BPS (`bps`)** | Basis Points | `1 bps = 0.01%` (`100 bps = 1.00%`). Standard unit for measuring payment take rates and fraud loss rates. |
| **DSO** | Days Sales Outstanding | Average number of days it takes a business to collect payment after issuing an invoice (`F-03` reduces DSO from 42 days to 18 days). |
| **INR / SNAD** | Item Not Received / Significantly Not As Described | The two primary PayPal buyer dispute reason codes (`MERCHANDISE_OR_SERVICE_NOT_RECEIVED`, `SIGNIFICANTLY_NOT_AS_DESCRIBED`) handled by `F-04`. |
| **Friendly Fraud (First-Party Fraud)** | Post-Delivery Chargeback Abuse | When a legitimate buyer receives goods (verified by carrier tracking) but files an INR or unauthorized dispute to obtain free merchandise (`M-04`, `F-10`). |
| **Compelling Evidence (CE 3.0)** | Dispute Rebuttal Evidence Package | Verifiable carrier delivery proof (`get_shipment_tracking` + `M-03` signed POD), invoice (`E-07`), and prior undisputed buyer transaction history submitted via `API-11`. |
| **PAN / SAD** | Primary Account Number / Sensitive Authentication Data | Raw 16-digit payment card number and CVV/PIN. Strictly excluded from PayOps AI under our **Zero-PAN PCI SAQ-A** architecture (`SECURITY_ARCHITECTURE.md`). |
| **3DS2 / SCA** | 3-D Secure 2.0 / Strong Customer Authentication | Cryptographic step-up authentication required under EU PSD2 and RBI card mandates, handled natively inside PayPal Checkout. |

---

## 3. AI, Machine Learning & Ecosystem Sponsor Terms

| Term / Acronym | Full Name | Definition & Context |
|---|---|---|
| **MCP** | Model Context Protocol | Open standard enabling AI agents (`M-01`) to discover and invoke external tools (`@paypal/mcp`) via structured JSON-RPC schemas. |
| **APIMatic Context Plugins** | Deterministic SDK Context for AI | Sponsor technology (**APIMatic**) providing verified OpenAPI/SDK definitions via MCP to eliminate LLM parameter hallucinations (`F-09`, `R-03`). |
| **AG Grid / AG Studio** | Enterprise Data Grid & Charting | Sponsor technology (**AG Grid**) powering our high-frequency Executive Financial Command Center (`F-07`). |
| **Bryntum Scheduler / Gantt** | Interactive Timeline UI | Sponsor technology (**Bryntum**) powering our Receivables, Subscription & Dunning Timeline (`F-08`). |
| **GraphSAGE** | Graph Sample and Aggregate | Inductive Graph Neural Network architecture (`PyTorch Geometric`) used in `M-04` to compute 2-hop buyer-merchant-tracking embeddings (`FINE_TUNING.md`). |
| **TreeSHAP** | SHapley Additive exPlanations for Trees | Game-theoretic explainability algorithm used in `M-04` to output deterministic human-readable risk reason codes (`RC_01`..`RC_12`). |
| **RRF** | Reciprocal Rank Fusion | Hybrid retrieval algorithm in **Elasticsearch (`F-12`)** combining lexical `BM25` and dense `M-05` vector similarity scores (`DATA_PIPELINE.md`). |
| **Karpathy Autonomy Slider** | `L0` to `L4` Agent Autonomy Spectrum | Governance control allowing merchants to tune agent execution from `L0` (Read-Only) and `L2` (Passkey HITL) to `L3`/`L4` (Policy-Bounded Autonomous) (`RESPONSIBLE_AI.md`). |

---

## 4. Indian & Global Legal / Regulatory Acronyms

| Term / Acronym | Full Name | Definition & Context (`COMPLIANCE.md`, `PRIVACY.md`) |
|---|---|---|
| **DPDP Act 2023 & Rules 2025** | Digital Personal Data Protection Act, 2023 (India) | India's comprehensive privacy law governing Data Fiduciaries, Data Processors, Data Principals, Consent Managers, and the Data Protection Board of India (**DPBI**). |
| **CERT-In** | Indian Computer Emergency Response Team | Statutory authority under MeitY enforcing **6-hour cyber incident reporting** and **180-day Indian log retention** (`OBSERVABILITY.md`, `RUNBOOK.md`). |
| **RBI PA / PA-CB** | Reserve Bank of India Payment Aggregator / Cross-Border | RBI regulatory framework governing domestic and cross-border online payment settlement in India (`<= ₹2,00,000` per unit for PA-CB). |
| **FEMA** | Foreign Exchange Management Act, 1999 (India) | Statutory framework governing cross-border trade settlements and export purpose codes (`P0102` / `P0802`) on Indian export invoices. |
| **GSTIN / HSN / SAC** | Goods and Services Tax Identification Number (India) | Mandatory tax identifiers extracted by `M-03` on Indian commercial invoices. |
| **GeM / DPIIT** | Government e-Marketplace / Dept. for Promotion of Industry and Internal Trade | Indian public procurement portal and startup recognition body (`PROCUREMENT.md`). |
| **FinCEN / MSB / MTL** | Financial Crimes Enforcement Network / Money Services Business / Money Transmitter License | US federal and state payment licensing regime (satisfied by executing on PayPal's licensed rails under the non-custodial software exemption). |
| **PCI-DSS v4.0 SAQ-A** | Payment Card Industry Data Security Standard — Self-Assessment Questionnaire A | Compliance tier for merchants/platforms that outsource 100% of cardholder data functions to a PCI-DSS Level 1 provider (PayPal). |
