# Global & Indian Financial Regulatory Compliance Matrix (`COMPLIANCE.md`)
> Project: PayOps AI (PayPal Sentinel) · Owner: Chief Legal & Regulatory Officer (Harvey Specter & Dr. R.S. Sharma Lens) · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [PRD](../01-product/PRD.md) · [Security Architecture](./SECURITY_ARCHITECTURE.md) · [Privacy](./PRIVACY.md) · [Risk Register](./RISK_REGISTER.md) · [Regulatory Sandbox](./REGULATORY_SANDBOX.md)

## 1. The Core Legal Architecture: Why PayOps AI Never Triggers Unlicensed Money Transmission (`R-08`)

As **Harvey Specter** and **Dr. R.S. Sharma** enforce via their standing Council Veto: *any hackathon or startup project that touches customer funds in its own bank/escrow account without a Money Transmitter License (US FinCEN / 50-state MTLs), RBI Payment Aggregator (PA) Authorization, or EU PSD2 Payment Institution license is DOA.*

**PayOps AI (`PayPal Sentinel`) is 100% non-custodial software (Technical Service Provider / Agentic Orchestration Plane)**:
1. **Zero Custody of Funds**: PayOps AI never holds, pools, escrows, or settles fiat currency or `PYUSD` in a PayOps AI account.
2. **100% Execution on Licensed Regulated Rails**:
   - **Fiat Payments (`F-01`, `F-03`, `F-05`)**: Settled directly between Buyer and Merchant inside **PayPal Inc.** (licensed US Money Transmitter in 50 states/territories, UK FCA authorized electronic money institution, EU Luxembourg CSSF licensed credit institution, and RBI PA-Cross Border / authorized partner).
   - **Programmable Stablecoin Settlement (`F-11`)**: Uses **PayPal USD (`PYUSD`)**, issued and custodied 1:1 in US Dollar deposits and US Treasuries by **Paxos Trust Company, LLC** under the supervision of the **New York State Department of Financial Services (NYDFS)**.
3. **OAuth2 Delegated Merchant Authority**: PayOps AI acts strictly as an authorized software agent invoking `@paypal/agent-toolkit` and PayPal REST v2 APIs using the merchant's own scoped OAuth2 credentials (`ADR-0005`).

---

## 2. Comprehensive Regulatory Compliance Matrix (US, EU/UK, India)

| Law / Regulation / Standard | Applies? | Core Legal Requirement | How We Comply in `MVP (hackathon)` | What Is Required for `v1 (production)` | Owner |
|---|---|---|---|---|---|
| **PCI-DSS v4.0** *(Payment Card Industry Data Security Standard)* | **Yes (SAQ-A)** | Protect cardholder data (PAN/CVV/SAD); enforce strong access control, TLS 1.3, and tamper-evident audit logs (Req. 10). | **Zero-PAN SAQ-A architecture**: all card inputs stay inside PayPal Smart Buttons / Fastlane (`Zoid` cross-domain iframe); Luhn regex scrubber blocks accidental PAN entry in memos (`R-07`). | Annual PCI-DSS v4.0 SAQ-A Attestation of Compliance (AoC) + quarterly ASV external vulnerability scans. | CISO |
| **US FinCEN Bank Secrecy Act (BSA) & State Money Transmitter Laws (MTLs)** | **Yes (Exempt as Non-Custodial Software)** | Entities accepting and transmitting currency/value must register as an MSB with FinCEN and hold state MTLs (`31 CFR § 1010.100(ff)(5)`). | Non-custodial software provider exemption (`31 CFR § 1010.100(ff)(5)(ii)(A)`): PayPal Inc. & Paxos Trust Company perform all KYC/AML/OFAC screening and fund movement. | Formal legal opinion letter on non-custodial TSP status; automated OFAC jurisdiction blocklist matching Devpost rules (`Brazil`, `Quebec`, `Russia`, `Crimea`, `Cuba`, `Iran`, `North Korea`). | Chief Legal Officer |
| **US Gramm-Leach-Bliley Act (GLBA) Safeguards Rule & FTC Act Section 5** | **Yes** | Safeguard nonpublic personal financial information; avoid unfair or deceptive claims regarding AI autonomy. | Envelope `AES-256-GCM` encryption, RBAC + Passkeys (`E-02`), and transparent Karpathy Autonomy Slider (`L0`–`L4`) with exact audit logs (`E-10`). | Written Information Security Program (WISP) audit and annual board report. | CISO & Legal |
| **US Fair Debt Collection Practices Act (FDCPA) & Regulation F** | **Yes (Dunning Guardrails)** | Prohibit harassing, deceptive, or excessive debt collection communications (`7-in-7` call rule, time-of-day restrictions). | First-party B2B invoicing (`F-03`); `F-02` policy firewall caps `send_invoice_reminder` at max 1 polite reminder per 72 hours during recipient business hours (`R-11`). | Per-state commercial/consumer invoice reminder cadence templates verified by counsel. | Product & Legal Lead |
| **India RBI Payment Aggregator (PA) & PA-Cross Border (PA-CB) Directions (2020 / Oct 2023)** | **Yes (Partner Rail)** | Only RBI-authorized PAs/PA-CBs may pool or settle merchant payments in India; maximum `₹2,00,000` per unit for PA-CB import/export transactions. | PayOps AI never touches nodal/escrow accounts; invokes PayPal's licensed cross-border invoice & checkout APIs and enforces `<= ₹2,00,000` (`~$2,380`) per-invoice validation rule on Indian cross-border export invoices (`F-02`). | Integration with RBI-licensed PA-CB partner portal + automated FEMA export purpose-code tagging (`P0102` / `P0802`) on Indian merchant invoices (`E-07`). | India Compliance Lead |
| **India Digital Personal Data Protection (DPDP) Act 2023 & Rules 2025** | **Yes** | Itemized bilingual notice + verifiable consent (`s.5–6`), Data Fiduciary obligations (`s.8`), breach notification to DPBI, Data Principal erasure/grievance rights (`s.11–14`). | Built-in bilingual consent banner, pre-LLM PII scrubber, 24-hour self-service erasure endpoint, and Grievance Officer workflow (`PRIVACY.md`). | Registration as Consent-Manager-integrated Data Processor; Mumbai (`asia-south1`) data residency deployment. | DPO |
| **India CERT-In Cyber Security Directions (April 28, 2022)** | **Yes** | Mandatory 6-hour cyber incident reporting, NTP clock sync, and 180-day retention of ICT logs within India. | Hash-chained `ImmutableAuditLog` (`E-10`) retained 180 days in Elastic/Postgres with NTP synchronization (`OBSERVABILITY.md`) and 6-hour incident playbook (`RUNBOOK.md`). | Dedicated `asia-south1` Mumbai log vault synced to `samay1.nic.in`. | SRE Lead |
| **EU GDPR (Reg. 2016/679), PSD2 (Strong Customer Authentication) & EU AI Act (Reg. 2024/1689)** | **Yes** | GDPR data protection; PSD2 SCA on electronic payments; EU AI Act transparency and human oversight obligations. | PayPal Checkout/Fastlane natively handles PSD2 3DS2 SCA; PayOps AI enforces `L2` WebAuthn Passkey approval (`API-02`) + Limited-Risk AI transparency badges (`RESPONSIBLE_AI.md`). | EU Frankfurt (`europe-west3`) tenant isolation, EU SCCs, and ISO/IEC 42001 AI Management System certification. | EU DPO & AI Lead |

---

## 3. Licensing Strategy & Regulated Partner Matrix

| Financial / Regulatory Activity | License Required by Law | Who Holds the License | How PayOps AI Interfaces |
|---|---|---|---|
| **Card, Bank & Wallet Checkout Processing (`F-05`)** | US 50-State MTLs · EU Banking/EMI License · UK FCA EMI · PCI-DSS Level 1 | **PayPal Inc. / Braintree** | OAuth 2.0 REST v2 (`Orders v2`, `PPCP`, `Fastlane`, `@paypal/agent-toolkit`). |
| **USD Stablecoin Issuance & Custody (`F-11`)** | NYDFS Limited Purpose Trust Charter | **Paxos Trust Company, LLC** (Issuer of `PYUSD`) | Non-custodial Solana Token-2022 / Ethereum ERC-20 transfer instruction with mandatory invoice memo reconciliation (`R-09`). |
| **Dispute Adjudication & Chargeback Network Routing (`F-04`)** | Visa / Mastercard / Amex Acquiring & PayPal Buyer/Seller Protection | **PayPal Inc.** | Compiles and submits merchant fulfillment & carrier tracking evidence via PayPal Disputes API v1 (`API-10`, `API-11`). |

---

## 4. Enterprise Security & Compliance Certifications Roadmap

| Milestone | Target Certification / Attestation | Scope & Auditor |
|---|---|---|
| **M0 (`Hackathon MVP` — Nov 2026)** | **PCI-DSS v4.0 SAQ-A Self-Assessment + OWASP Top 10 / LLM Top 10 Gate** | Automated CI security verification (`Gitleaks`, `Trivy`, `EVAL-DS-03`) + Zero-PAN architecture. |
| **M1 (`Day 60` Post-Hackathon Pilot)** | **SOC 2 Type I + HIPAA/GLBA Readiness Packet (`PROCUREMENT.md`)** | Trust Services Criteria: Security, Availability, Processing Integrity, Confidentiality (Vanta/Drata continuous monitoring). |
| **M2 (`Month 6` Commercial Launch)** | **SOC 2 Type II + ISO/IEC 27001:2022** | 6-month observation window across Render Pro / GKE + `ImmutableAuditLog` (`E-10`). |
| **M3 (`Month 12` Global Enterprise Scale)** | **ISO/IEC 42001:2023 (AI Management System) + PCI-DSS v4.0 AoC** | Full audit of `M-01`..`M-05` governance, `Cosmos.AI` DSL policy firewall (`F-02`), and fairness parity (`RESPONSIBLE_AI.md`). |
