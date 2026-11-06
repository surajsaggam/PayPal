# Security Architecture, Zero-PAN Boundary & OWASP Mitigations (`SECURITY_ARCHITECTURE.md`)
> Project: PayOps AI (PayPal Sentinel) · Owner: Chief Information Security Officer (Himraj Singh & Max Levchin Lens) · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [PRD](../01-product/PRD.md) · [Architecture](../03-engineering/ARCHITECTURE.md) · [ADR-0005](../03-engineering/adr/ADR-0005-auth-and-payment-security.md) · [Threat Model](./THREAT_MODEL.md) · [Compliance](./COMPLIANCE.md)

## 1. Security Design Principles (Defense-in-Depth for Agentic Commerce)

Designed specifically to satisfy **Himraj Singh's** (Engineering Manager at PayPal for Enterprise AI, Trust & Security) and **Max Levchin's** (PayPal Co-Founder & CTO) adversarial engineering standards, **PayOps AI (`PayPal Sentinel`)** enforces five non-negotiable security invariants:
1. **Zero-PAN PCI-DSS v4.0 SAQ-A Boundary**: PayOps AI never touches, transmits, logs, or stores raw Primary Account Numbers (PANs), CVVs, or bank credentials. All checkout flows use **PayPal Smart Payment Buttons**, **Fastlane (`F-05`)**, and **Braintree Hosted Fields** (`Zoid` cross-domain isolated iframes), exchanging only opaque PayPal Order IDs (`E-06`) and Vault v3 tokens.
2. **Zero Secrets in LLM Context Windows (`R-07`)**: Raw `PAYPAL_CLIENT_SECRET` and OAuth 2.0 Bearer tokens (`POST /v1/oauth2/token`) reside exclusively inside the isolated **PayPal MCP Server / Tool Execution Enclave** in `payops-api`. The LLM (`M-01`) receives only declarative tool schemas and returns structured JSON intents.
3. **Deterministic `Cosmos.AI` DSL Policy Firewall (`F-02`)**: No LLM output can directly invoke a state-mutating PayPal API without passing our deterministic TypeScript/AST policy evaluator (`E-05`), `APIMatic` schema validator (`F-09`), and `JunoDB`/Redis velocity check (`F-06`).
4. **Cryptographic Webhook Verification (`API-13`, `R-04`)**: Every incoming PayPal webhook is cryptographically verified using PayPal's asymmetric RSA-SHA256 certificate chain and `POST /v1/notifications/verify-webhook-signature`.
5. **Passkey / WebAuthn Co-Signing for High-Risk Actions (`API-02`)**: Refunds above `$250.00` (`₹21,000`), high-risk dispute settlements, and policy modifications require FIDO2/WebAuthn hardware passkey signatures from an authorized `FINANCE_ADMIN` or `OWNER` (`E-02`).

---

## 2. Authentication, RBAC & Fine-Grained Authorization (`E-02`)

### 2.1 Operator Authentication (`OIDC` + `FIDO2 WebAuthn Passkeys`)
- **Primary Login**: OAuth 2.0 / OpenID Connect (`Auth.js v5` / NextAuth) with mandatory Phishing-Resistant **FIDO2 Passkey (WebAuthn)** step-up authentication for financial approvals (`API-02`) and policy edits (`API-03`).
- **Session Tokens**: Short-lived (`15-minute`) `EdDSA` (`Ed25519`) signed JWTs stored in `HttpOnly; Secure; SameSite=Strict` cookies, backed by instant revocation lists in `JunoDB`/Redis.

### 2.2 Role-Based & Attribute-Based Access Control Matrix (`E-02`)

| RBAC Role (`E-02`) | View AG Grid & Insights (`F-07`, `API-14`) | Trigger Agent Read/Draft (`API-01` `L0/L1`) | Approve Held Refunds / Disputes (`API-02` `L2`) | Modify Policy Rules (`API-03` `E-05`) | Manage PayPal Credentials & Rotate Keys |
|---|---|---|---|---|---|
| **`AUDITOR`** | ✅ Read-Only | ❌ | ❌ | ❌ | ❌ |
| **`OPS_ANALYST`** | ✅ Read/Filter | ✅ Draft Only (`L1`) | ❌ | ❌ | ❌ |
| **`FINANCE_ADMIN`** | ✅ Full Access | ✅ Execute (`L3`) | ✅ Up to `$10,000` (`₹8,40,000`) | ❌ | ❌ |
| **`OWNER`** | ✅ Full Access | ✅ Execute (`L3/L4`) | ✅ Unlimited (Passkey Required) | ✅ Passkey Required | ✅ Passkey Required |
| **`AGENT_SERVICE`** | ❌ | ✅ Scoped by `F-02` | ❌ (Cannot self-approve) | ❌ (Read-only `E-05`) | ❌ |

---

## 3. Encryption, Key Management & Cryptographic Webhook Verification

1. **Encryption in Transit**: Strict **TLS 1.3** (`TLS_AES_256_GCM_SHA384`) on all external ingress and outbound PayPal/LLM connections; HSTS (`max-age=63072000; includeSubDomains; preload`) and Kraken.js/Lusca-patterned CSP headers on `payops-web`.
2. **Encryption at Rest**:
   - PostgreSQL 16 volumes (`E-01`..`E-10`) and Redis AOF persistence encrypted via **AES-256-GCM**.
   - Application-level envelope encryption (`AES-256-GCM` with per-workspace DEKs wrapped by Cloud KMS KEK) for stored merchant PayPal Sandbox/Live `client_secret` values in `MerchantWorkspace` (`E-01`).
3. **PayPal Webhook Asymmetric Verification (`API-13`, `R-04`)**:
   - Validates `PAYPAL-TRANSMISSION-ID`, `PAYPAL-TRANSMISSION-TIME`, `PAYPAL-TRANSMISSION-SIG`, `PAYPAL-CERT-URL` (strictly pinned to `^https://api\.(sandbox\.)?paypal\.com/`), and `CRC32` of the raw request body, followed by a Replay Window Check (`|now - transmission_time| <= 300s`) and atomic `JunoDB` deduplication (`SET NX EX 86400`).

---

## 4. OWASP Web Top 10 (2021) & OWASP LLM Top 10 (2025) Mitigations

### 4.1 OWASP Top 10 for LLM Applications Mitigations

| OWASP LLM ID | Vulnerability | PayOps AI Technical Mitigation |
|---|---|---|
| **LLM01** | **Prompt Injection (Direct & Indirect)** | XML `<untrusted_external_data>` structural isolation + `M-02` sub-150ms injection classifier + deterministic `F-02` Policy Firewall (`R-01`). |
| **LLM02** | **Sensitive Information Disclosure** | Pre-LLM PII/PAN Luhn scrubber (`DATA_PIPELINE.md`) + OAuth secrets isolated in MCP execution enclave (`R-07`). |
| **LLM03** | **Supply Chain Vulnerabilities** | Pinned `@paypal/agent-toolkit` & `@paypal/paypal-server-sdk` versions, `pnpm --frozen-lockfile`, Trivy + Gitleaks CI gates (`CICD.md`). |
| **LLM04** | **Data and Model Poisoning** | RAG chunks (`M-05`) require `OWNER` passkey signature before indexing; buyer dispute text is never indexed into policy RAG. |
| **LLM05** | **Improper Output Handling** | Zero `eval()` or raw SQL generation; 100% of LLM outputs parsed via strict Zod + `APIMatic` JSON schemas (`F-09`, `R-03`). |
| **LLM06** | **Excessive Agency** | Karpathy Autonomy Slider (`L0`–`L4`), dynamic tool-list pruning by `M-02`, and hard dollar/rupee caps in `E-05`. |
| **LLM07** | **System Prompt Leakage** | System prompts contain zero credentials or proprietary keys; output filter blocks verbatim system instruction echoes. |
| **LLM08** | **Vector and Embedding Weaknesses** | Strict `workspace_id` tenant filter enforced at Elasticsearch query level before vector similarity scoring (`DATA_PIPELINE.md`). |
| **LLM09** | **Misinformation / Hallucination** | `M-01` cannot invent transaction state; must cite verified PayPal IDs fetched via `get_order` / `get_invoice` / `get_dispute` (`R-03`). |
| **LLM10** | **Unbounded Consumption** | Per-session step cap (`max_steps = 5`) and workspace hourly token circuit breaker (`ALT-05`, `R-10`). |

### 4.2 OWASP Web Application Top 10 Mitigations
- **A01 Broken Access Control**: Tenant-scoped Row-Level Security (RLS) in PostgreSQL (`WHERE workspace_id = current_setting('app.current_workspace_id')`).
- **A02 Cryptographic Failures**: Envelope `AES-256-GCM` encryption + `Ed25519` JWTs + `SHA-256` hash-chained audit logs (`E-10`).
- **A03 Injection**: Parameterized Prisma/Drizzle SQL queries + Zod input validation on all 14 endpoints (`API-01`..`API-14`).
- **A08 Software and Data Integrity Failures**: Cryptographic webhook verification (`API-13`) and immutable audit log triggers (`E-10`).

---

## 5. Secure SDLC & Penetration Testing Plan

1. **Automated Pre-Merge Checks**: Every PR runs `Gitleaks`, `pnpm audit`, `Trivy`, and the 200-case adversarial prompt-injection red-team suite (`EVAL-DS-03`).
2. **Pre-Production Penetration Testing (`v1`)**: Annual CREST-certified gray-box penetration test covering multi-tenant workspace isolation, WebAuthn approval bypass attempts (`API-02`), webhook replay/forgery (`API-13`), and adversarial LLM tool hijacking.
