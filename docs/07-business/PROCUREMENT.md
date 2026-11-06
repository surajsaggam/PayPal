# Enterprise & Public-Sector Procurement Security Packet (`PROCUREMENT.md`)
> Project: PayOps AI (PayPal Sentinel) · Owner: VP Enterprise Sales, Security & Procurement · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [Security Architecture](../06-security-compliance/SECURITY_ARCHITECTURE.md) · [Compliance](../06-security-compliance/COMPLIANCE.md) · [Privacy](../06-security-compliance/PRIVACY.md) · [SLA](../05-ops/SLA.md)

## 1. Purpose of This Procurement Packet

Mid-market CFOs (`Persona P3`), enterprise procurement teams, and public-sector / MSME trade portals (including India's **Government e-Marketplace [GeM]** and export promotion councils) require standardized vendor risk management (VRM) documentation before authorizing OAuth 2.0 connection to a corporate PayPal account. This document provides a turnkey **SIG-Lite / CSA CAIQ v4.0 Questionnaire Summary**, **Authorized Subprocessor Inventory**, **Data Processing Addendum (DPA) Terms**, and **GeM / Startup India Procurement Readiness**.

---

## 2. Standardized Vendor Security Questionnaire Summary (`CSA CAIQ v4.0` / `SIG-Lite`)

| Control Domain | Question / Requirement | PayOps AI Verified Implementation & Evidence Reference |
|---|---|---|
| **1. Payment Card & Financial Data Custody (`PCI-DSS`)** | Does the vendor store, process, or transmit raw Primary Account Numbers (PAN), CVV, or bank credentials? | **No (`Zero-PAN SAQ-A`)**. All payment entry occurs inside PayPal Smart Buttons / Fastlane (`Zoid` cross-domain iframes). PayOps AI stores only opaque PayPal Order IDs (`E-06`), Invoice IDs (`E-07`), and salted `HMAC-SHA256` buyer hashes (`SECURITY_ARCHITECTURE.md`). |
| **2. AI Autonomy & Unauthorized Spend Controls (`AI Governance`)** | Can an AI model autonomously transfer funds, issue large refunds, or alter policies without deterministic human/rule controls? | **No**. Every tool call proposed by `M-01` is intercepted by the deterministic **`Cosmos.AI` DSL Policy Firewall (`F-02`)**, **`APIMatic` Schema Validator (`F-09`)**, and **`JunoDB` Velocity Lock (`F-06`)**. Actions above workspace limits (`E-05`) require FIDO2 WebAuthn Passkey approval (`API-02`). |
| **3. LLM Data Privacy & Training Opt-Out (`Zero Data Retention`)** | Is customer or merchant data ever used to train foundation models (`Anthropic`, `OpenAI`, `Google`)? | **No**. PayOps AI uses commercial Enterprise/API endpoints with **Zero Data Retention (ZDR)** and zero training rights, plus a mandatory pre-LLM PII/PAN Luhn scrubber (`DATA_PIPELINE.md`). |
| **4. Encryption in Transit & At Rest (`Cryptography`)** | What cryptographic standards protect data in transit and at rest? | **TLS 1.3** (`TLS_AES_256_GCM_SHA384`) in transit; **AES-256-GCM** envelope encryption at rest with per-workspace DEKs wrapped by Cloud KMS (`SECURITY_ARCHITECTURE.md`). |
| **5. Multi-Tenant Isolation (`Data Segregation`)** | How are customer workspaces isolated from one another? | Enforced via PostgreSQL **Row-Level Security (RLS)** keyed on verified `Ed25519` JWT `workspace_id` claims and mandatory Elasticsearch tenant pre-filters (`THREAT_MODEL.md`). |
| **6. Audit Logging & Tamper Evidence (`Forensics`)** | Are security and financial logs immutable and retained per statutory standards? | **Yes**. Every state transition writes a SHA-256 hash-chained record to `ImmutableAuditLog` (`E-10`), protected by database mutation-blocking triggers and retained **180 days hot** (CERT-In / PCI-DSS v4.0) + **7 years WORM archive** (`OBSERVABILITY.md`). |
| **7. Business Continuity & Disaster Recovery (`BCDR`)** | What are the committed RPO, RTO, and uptime SLAs? | **`99.99%` Enterprise Uptime SLA**, **`RPO <= 5 minutes`**, **`RTO <= 15 minutes`**, tested monthly (`SLA.md`, `RUNBOOK.md`). |
| **8. Vulnerability Management & Pen-Testing (`AppSec`)** | How are dependencies and containers scanned for vulnerabilities? | Automated `Gitleaks`, `pnpm audit`, and `Trivy` scans on every commit in `.github/workflows/ci.yml` (`CICD.md`), plus annual CREST penetration testing. |

---

## 3. Authorized Subprocessor List (`GDPR Art. 28` & `India DPDP Act 2023`)

| Subprocessor Name | Corporate Entity & HQ | Purpose of Processing | Data Categories Processed | Security Certifications & Residency |
|---|---|---|---|---|
| **PayPal Inc.** | PayPal, Inc. (San Jose, CA, USA & global regulated subsidiaries) | Licensed payment processing, invoicing v2, dispute resolution, and webhook dispatch. | Merchant OAuth scope, Orders (`E-06`), Invoices (`E-07`), Disputes (`E-08`). | PCI-DSS Level 1, SOC 1/2, ISO 27001, Global MTL/EMI Licenses. |
| **Render Services, Inc.** | Render Services, Inc. (San Francisco, CA, USA) | Cloud application hosting (`payops-web`, `payops-api`), managed PostgreSQL 16, and managed Redis 7.4 (`MVP` / US & EU regions). | Encrypted application state (`E-01`..`E-10`). | SOC 2 Type II, ISO 27001, GDPR DPA & SCCs. |
| **Google Cloud Platform (GCP)** | Google LLC | `v1 (production)` multi-region GKE hosting & **Mumbai (`asia-south1`)** India data residency. | Regional workspace state (`IN`, `US`, `EU`). | SOC 1/2/3, ISO 27001/27701, PCI-DSS, MeitY Empaneled Cloud. |
| **Anthropic, PBC** | Anthropic, PBC (San Francisco, CA, USA) | `M-01` (`Claude 3.5 Sonnet`) financial reasoning & MCP tool planning via ZDR commercial API. | Scrubbed, pseudonymized transaction & policy context (`zero raw PAN/PII`). | SOC 2 Type II, ISO 27001, Zero Data Retention API. |
| **OpenAI, L.L.C.** | OpenAI, L.L.C. (San Francisco, CA, USA) | `M-02` (`GPT-4o-mini` intent router), `M-05` (`text-embedding-3-small`), and `M-01` fallback (`GPT-4o`). | Scrubbed intent strings & contract policy chunks. | SOC 2 Type II, Zero Training Commercial API. |
| **Elasticsearch B.V.** | Elasticsearch B.V. (`Elastic Cloud`) | Hybrid RAG vector search (`M-05`) and 180-day OpenTelemetry audit observability (`F-12`). | Policy embeddings & PII-redacted ECS audit logs (`E-10`). | SOC 2 Type II, ISO 27001, FedRAMP, PCI-DSS. |

---

## 4. Public-Sector, Export Council & GeM Procurement Readiness (India & Global)

For Indian public-sector enterprises, state MSME export corporations, and **Government e-Marketplace (GeM)** SaaS tenders:
1. **DPIIT Startup India Relaxation Eligibility**: Under **Rule 170(i) of General Financial Rules (GFR) 2017** and Ministry of Finance Procurement Policy guidelines, DPIIT-recognized startups are eligible for **exemption from Earnest Money Deposit (EMD)** and **relaxation of prior turnover and prior experience criteria** in public/export-body tenders subject to meeting technical specifications.
2. **MeitY Cloud & Data Localization Compliance**: Production Indian deployments run on **MeitY-empaneled GCP Mumbai (`asia-south1`)** infrastructure with 100% domestic retention of `E-01`..`E-10` and 180-day CERT-In NTP-synced logs.
3. **Turnkey Contract Vehicle**: Standard Master SaaS Agreement (MSA) + GDPR/DPDP Data Processing Addendum (DPA) + `SLA.md` schedule available for 1-click counter-signature during enterprise onboarding.
