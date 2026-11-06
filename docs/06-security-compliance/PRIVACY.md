# Data Privacy, Personal Data Inventory & DPDP / GDPR Compliance (`PRIVACY.md`)
> Project: PayOps AI (PayPal Sentinel) · Owner: Data Protection Officer (Dr. R.S. Sharma & Harvey Specter Lens) · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [PRD](../01-product/PRD.md) · [Data Model](../03-engineering/DATA_MODEL.md) · [Data Pipeline](../04-ai/DATA_PIPELINE.md) · [Compliance](./COMPLIANCE.md)

## 1. Privacy-by-Design Architecture

Grounded in **Dr. R.S. Sharma's** (Data Empowerment and Protection Architecture — DEPA) and **Harvey Specter's** regulatory structuring principles, **PayOps AI (`PayPal Sentinel`)** practices strict **Data Minimization and Purpose Limitation**:
1. **Zero Card / Bank Credential Storage**: Payment instruments remain 100% inside PayPal's regulated vault (`ADR-0005`).
2. **Pseudonymous Graph Analytics**: `M-04` (`GraphSAGE`) operates exclusively on salted `HMAC-SHA256` hashes (`buyer_hash`, `address_hash`), never raw names or emails.
3. **Zero Training on Personal Data**: We enforce zero-data-retention (ZDR) API agreements with cloud LLM providers (`M-01`..`M-03`) and scrub PII prior to prompt assembly (`R-07`).

---

## 2. Personal Data Inventory Table (`Entities E-01 to E-10`)

| Entity & Field (`DATA_MODEL.md`) | Data Category | Purpose of Processing | Legal Basis (`GDPR Art. 6` / `India DPDP Act 2023 s.4–7`) | Retention Period | Access Scope (`Who Sees It`) |
|---|---|---|---|---|---|
| `E-02 OperatorUser.email`, `full_name` | Merchant Employee Identity | Workspace authentication, RBAC (`OWNER`, `FINANCE_ADMIN`), and passkey approval attribution (`API-02`). | **Contractual Necessity** (`GDPR Art. 6(1)(b)`) / **Explicit Consent** (`DPDP s.6`). | Active employment + 180 days audit trail; erased within 24h of verified deletion request. | Workspace `OWNER` (`E-02`); never sent to external LLMs. |
| `E-06 PayPalOrderRecord.buyer_hash` | Pseudonymized Buyer Identifier (`HMAC-SHA256`) | Multi-hop friendly-fraud ring detection (`M-04`, `F-10`) and order correlation. | **Legitimate Interest / Fraud Prevention** (`GDPR Art. 6(1)(f)`) / **Certain Legitimate Uses** (`DPDP s.7`). | 90 days in `JunoDB`/Redis Mirror Graph; 180 days in `E-06`. | Internal `M-04` ONNX scorer only (irreversible hash). |
| `E-07 PayPalInvoiceRecord.recipient_email`, `business_name` | B2B Billing Contact | Creating, sending, and reminding on PayPal Invoices v2 (`F-03`, `API-04`..`API-06`). | **Contractual Necessity** (`B2B invoicing fulfillment`). | Duration of unpaid invoice + statutory tax/accounting retention (7 years). | Merchant `OWNER`/`FINANCE_ADMIN` + PayPal Invoicing v2 API (`@paypal/agent-toolkit`). |
| `E-08 PayPalDisputeCase.carrier_tracking_proof` | Fulfillment & Delivery Metadata (Postal Code, Carrier Tracking #) | Compiling compelling evidence (`F-04`, `API-11`) to resolve buyer disputes (`MERCHANDISE_OR_SERVICE_NOT_RECEIVED`). | **Legal Claim Defense & Fraud Prevention** (`GDPR Art. 6(1)(f)`, `DPDP s.7`). | 180 days active + statutory audit archive. | Merchant Operator + `M-03` OCR (postal code & signature status only) + PayPal Disputes API. |
| `E-10 ImmutableAuditLog.actor_id`, `ip_hash` | Security & Compliance Telemetry | Statutory cyber incident & payment audit logging (`CERT-In`, `PCI-DSS v4.0`). | **Legal Obligation** (`GDPR Art. 6(1)(c)`, `CERT-In Directions 2022`). | **180 days hot** in Elastic/Postgres + 7 years cold WORM archive. | `AUDITOR` & `OWNER` roles (`E-02`). |

---

## 3. India Digital Personal Data Protection (DPDP) Act 2023 & Rules 2025 Compliance

### 3.1 Role Classification (`Data Fiduciary` vs `Data Processor`)
- **Merchant Workspace (`E-01`) as Data Fiduciary**: When an Indian merchant uses PayOps AI to invoice customers or resolve disputes, the merchant is the primary **Data Fiduciary** (`DPDP Act s.2(i)`), and PayOps AI acts as a contractually bound **Data Processor** (`DPDP Act s.2(k)`) under a signed Data Processing Addendum (`PROCUREMENT.md`).
- **PayOps AI as Data Fiduciary (for `E-02` Operator Accounts)**: For merchant employees signing into PayOps AI, PayOps AI serves an itemized **DPDP Section 5 & 6 Bilingual Consent Notice** (available in English and all 22 Eighth Schedule Indian languages per `LOCALIZATION.md`).

### 3.2 Verbatim DPDP Consent Notice Text (Displayed at Onboarding)
> **Notice for Processing of Digital Personal Data (Under Section 5 of the DPDP Act, 2023)**
> 1. **What Personal Data We Collect**: Work email address, full name, role title, and WebAuthn passkey public key (`E-02`), plus pseudonymized transaction and invoice metadata synchronized from your authorized PayPal account (`E-06`, `E-07`, `E-08`).
> 2. **Purpose of Processing**: To execute policy-guarded PayPal invoicing, order management, and dispute-evidence compilation on your behalf, and to maintain statutory 180-day security audit logs required by CERT-In and PCI-DSS.
> 3. **Your Rights as a Data Principal (Sections 11–14)**: You have the right to access a summary of your personal data, request correction or erasure, nominate an individual in the event of death or incapacity, and withdraw consent at any time via **Settings → Privacy & DPDP Rights** (`DELETE /api/v1/privacy/erase`).
> 4. **Grievance Redressal & Data Protection Board**: Contact our Data Protection & Grievance Officer at `dpo-india@payops.ai` (SLA: acknowledgment within 24 hours; resolution within 7 business days). If unsatisfied, you may file a complaint directly with the **Data Protection Board of India (DPBI)**.

### 3.3 Children's Data Prohibition (`DPDP Act Section 9` & `US COPPA`)
PayOps AI is strictly a B2B/SMB financial operations platform for adults who have reached the legal age of majority (`>= 18 years`). We do not onboard minors, process children's personal data, or perform behavioral tracking/targeted advertising.

---

## 4. Data Principal / Data Subject Rights Automation (`GDPR`, `CCPA/CPRA`, `DPDP`)

| Statutory Right | Applicable Law | Automated Self-Service Mechanism in PayOps AI | Execution SLA |
|---|---|---|---|
| **Right to Access & Portability** | DPDP s.11 · GDPR Art. 15 & 20 · CCPA | 1-click JSON/CSV export of all `OperatorUser` (`E-02`) and workspace records in **Settings → Privacy Portal**. | Instant (`< 5 seconds`). |
| **Right to Correction & Updating** | DPDP s.12 · GDPR Art. 16 | Direct profile & invoice recipient editing with synchronized update to PayPal Invoicing v2 (`update_invoicing`). | Instant (`< 2 seconds`). |
| **Right to Erasure ("Right to be Forgotten")** | DPDP s.12(3) · GDPR Art. 17 · CCPA | Executes cryptographic erasure (shredding the workspace's KMS Data Encryption Key + purging `E-02`, `E-03`, and RAG vectors in Elastic `M-05`), while preserving anonymized statutory tax/audit hashes required by law (`DPDP s.12(3)` legal retention exception). | Completed within **24 hours** (statutory max: 30 days). |
| **Right to Grievance Redressal & Human Review** | DPDP s.13 · GDPR Art. 22 | Dedicated in-app Grievance Ticket flow + 1-click human override (`API-02`) on any automated `M-04` risk flag. | Acknowledged `< 24h`; resolved `< 7 days`. |

---

## 5. Data Protection Impact Assessment (DPIA) & Cross-Border Transfers

1. **DPIA Summary**: Conducted prior to v1 launch covering `M-01` (LLM orchestration) and `M-04` (`GraphSAGE` risk scoring). Residual risk rated **Low** due to pseudonymized hashing, zero consumer credit underwriting, and mandatory `L2`/`L3` human-in-the-loop thresholds.
2. **Cross-Border Data Transfers**:
   - **India (`DPDP Act s.16` & `RBI Storage of Payment System Data`)**: Indian merchant production workspaces are pinned to `asia-south1` (Mumbai) storage volumes (`INFRASTRUCTURE.md`), and never transferred to any territory restricted by the Central Government.
   - **EU/UK (`GDPR Chapter V`)**: Governed by EU Standard Contractual Clauses (SCCs, Module 2/3) and EU-US Data Privacy Framework (DPF) certified subprocessors.
