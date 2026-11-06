# ADR-0005: Zero-PAN Tokenized PayPal Security, Cryptographic Webhook Verification & Signed HITL Approvals
> Project: PayOps AI (PayPal Sentinel) · Owner: Chief Information Security Officer (CISO) · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../../00-overview/PROJECT_BRIEF.md) · [Security Architecture](../../06-security-compliance/SECURITY_ARCHITECTURE.md) · [Threat Model](../../06-security-compliance/THREAT_MODEL.md) · [ADR-0000](./ADR-0000-template.md)

---

## Status Matrix

- **Status:** `Accepted`
- **Deciders:** `ENG-1`, `ENG-2`, `ENG-4`
- **Date:** `2026-11-05`
- **Canonical Scope:** `F-02`, `F-04`..`F-06` · `API-02`, `API-13` · `R-04`, `R-07`, `R-08`

---

## 1. Context and Problem Statement

A financial operations platform orchestrating PayPal orders, invoices, refunds, disputes, and `PYUSD` settlements faces four acute security and regulatory threats:
1. **PCI-DSS Scope Creep:** Touching raw cardholder data (PAN/CVV) triggers expensive PCI-DSS Level 1 / SAQ-D audits.
2. **Webhook Spoofing & Replay Attacks (`R-04`):** An attacker sending a forged `INVOICING.INVOICE.PAID` or `CUSTOMER.DISPUTE.CREATED` POST request to `API-13` could trick the agent into releasing goods or accepting fake disputes.
3. **Credential & PII Leakage in LLM Contexts (`R-07`):** Passing raw `PAYPAL_CLIENT_SECRET` or customer PII into third-party LLM prompts violates GDPR, India DPDP Act 2023, and GLBA.
4. **Unverified Human-in-the-Loop Approvals (`US-03`):** Simple unauthenticated boolean flags for `HOLD_APPROVAL` can be spoofed if not cryptographically bound to an authorized `FINANCE_ADMIN` or `OWNER` (`E-02`).

---

## 2. Decision Drivers

- **Strict PCI-DSS v4.0 SAQ-A Boundary:** Zero card data may ever pass through `PayOps AI` servers or logs.
- **Non-Custodial Regulatory Cleanliness (`Harvey Specter` & `Dr. R.S. Sharma` Standard, `R-08`):** `PayOps AI` must operate strictly as a technical orchestration and risk control plane over the merchant's own licensed PayPal account.
- **Cryptographic Non-Repudiation:** Both incoming PayPal webhooks (`API-13`) and operator HITL approvals (`API-02`) must be cryptographically verified before mutating state.

---

## 3. Considered Options

1. **Option 1 (Chosen): Zero-PAN Tokenized PayPal JS SDK v6 (`Zoid` Isolation) + Server-Side OAuth2 MCP Token Isolation + `/v1/notifications/verify-webhook-signature` Verification + Salted SHA-256 PII Pseudonymization (`buyer_hash`) + Ed25519/WebAuthn Signed HITL Approvals.**
2. **Option 2 (Rejected): Custom Server-Side Card Form Proxying to PayPal/Braintree.** Places backend in PCI-DSS SAQ-D scope and increases breach liability.
3. **Option 3 (Rejected): Trusting Incoming Webhook Payloads by IP Allowlist Alone.** Fragile in cloud environments and vulnerable to SSRF/replay attacks.

---

## 4. Decision Outcome

Chosen option: **Option 1 — Zero-PAN Tokenization, Cryptographic Webhook Verification, PII Pseudonymization & Signed HITL Approvals**.

### 4.1 Four Security Invariants Enforced in Code
1. **Zero-PAN Client Isolation:** All checkout and **Fastlane** flows execute inside `@paypal/react-paypal-js` **Zoid** cross-origin iframes; `PayOps AI` only ever receives opaque `paypal_order_id` (`5O190127TN364715T`) and `paypal_capture_id` tokens (`E-06`).
2. **Webhook Cryptographic Verification (`API-13`, `R-04`):** Every webhook request validates `PAYPAL-TRANSMISSION-ID`, `PAYPAL-TRANSMISSION-TIME` (`<= 300s` replay window), `PAYPAL-CERT-URL`, and `PAYPAL-TRANSMISSION-SIG` against PayPal's `/v1/notifications/verify-webhook-signature` endpoint before enqueueing.
3. **OAuth2 & PII Context Scrubbing (`R-07`):** `PAYPAL_CLIENT_SECRET` stays strictly inside the isolated MCP host process (`services/api`); buyer emails are salted and hashed (`buyer_hash`) prior to entering `M-01`..`M-05` LLM prompts or **Elastic** logs.
4. **Signed HITL Approvals (`API-02`, `US-03`):** Approving a `HOLD_APPROVAL` execution requires a valid `FINANCE_ADMIN` / `OWNER` JWT plus an `X-PayOps-Signature` over `(execution_id || paypal_request_id || decision)`, persisted into the SHA-256 hash-chained `ImmutableAuditLog` (`E-10`).

### 4.2 Positive Consequences
- Maintains lightweight **PCI-DSS v4.0 SAQ-A** eligibility and non-custodial compliance across US FinCEN, EU PSD2/GDPR, and India RBI PA / DPDP Act 2023.
- Complete cryptographic non-repudiation for enterprise SOC 2 auditors.

### 4.3 Negative Consequences & Mitigations
- *Trade-Off:* Calling `/v1/notifications/verify-webhook-signature` adds an outbound network check on webhook ingress.
- *Mitigation:* We cache PayPal's X.509 webhook signing certificates by `PAYPAL-CERT-URL` in Redis (`TTL: 24h`) to verify RSA-SHA256 signatures locally in `< 1.2ms` with fallback to the REST verification endpoint.

---

## 5. Verification & Compliance Links

- **Implementation Paths:** `services/api/src/modules/webhooks/verifySignature.ts`, `services/api/src/modules/agent-orchestrator/hitlApprove.ts`.
- **Verification Gate:** Integration tests in `TESTING.md` asserting `401 Unauthorized` on tampered webhook signatures and unsigned HITL approvals.
