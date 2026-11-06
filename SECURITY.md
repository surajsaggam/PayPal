# Security Policy (`SECURITY.md`)

**PayOps AI (`PayPal Sentinel`)** treats financial security, payment idempotency, and AI guardrail integrity as foundational architecture. For our full technical security specifications, please read:
- [Security Architecture (`docs/06-security-compliance/SECURITY_ARCHITECTURE.md`)](docs/06-security-compliance/SECURITY_ARCHITECTURE.md)
- [Threat Model & STRIDE Analysis (`docs/06-security-compliance/THREAT_MODEL.md`)](docs/06-security-compliance/THREAT_MODEL.md)
- [Data Privacy & DPDP / GDPR Compliance (`docs/06-security-compliance/PRIVACY.md`)](docs/06-security-compliance/PRIVACY.md)
- [Regulatory Compliance Matrix (`docs/06-security-compliance/COMPLIANCE.md`)](docs/06-security-compliance/COMPLIANCE.md)
- [Enterprise Risk Register (`docs/06-security-compliance/RISK_REGISTER.md`)](docs/06-security-compliance/RISK_REGISTER.md)

---

## 1. Supported Versions

| Version | Release Channel | Security Patch Support Status |
|---|---|---|
| **`1.0.x` (`v1.0.0`)** | Active Production & PayPal AI Hackathon Release | ✅ **Actively Supported (Immediate Security Patches)** |
| **`0.1.x` (`v0.1.0`)** | Initial Hackathon MVP Baseline | ✅ **Supported via upgrade to `1.0.x`** |
| **`< 0.1.0`** | Pre-release prototypes | ❌ Unsupported |

---

## 2. Core Security Guarantees

1. **Zero-PAN PCI-DSS v4.0 SAQ-A Boundary**: PayOps AI never ingests, processes, logs, or stores raw payment card numbers (PANs), CVVs, or bank login credentials. All checkout and payment instrument interactions occur inside PayPal's cross-domain isolated `Zoid` components (**PayPal Smart Payment Buttons**, **Fastlane**, **Braintree Hosted Fields**).
2. **Enclave-Isolated PayPal Credentials (`R-07`)**: `PAYPAL_CLIENT_SECRET` and OAuth 2.0 Bearer tokens never enter LLM context windows or browser bundles.
3. **Deterministic Spend & Risk Firewall (`F-02`, `R-01`)**: All 35 `@paypal/agent-toolkit` and PayPal MCP tool calls are gated by our deterministic `Cosmos.AI`-style DSL Policy Firewall, `APIMatic` schema validator (`F-09`), and FIDO2 WebAuthn Passkey co-signing (`API-02`).

---

## 3. Reporting a Vulnerability & Response SLAs

> **Please do NOT report security vulnerabilities through public GitHub issues.**

If you discover a potential security vulnerability—including prompt-injection bypasses (`R-01`), webhook verification flaws (`R-04`), cross-tenant data exposure, or dependency CVEs—please report it privately:

- **Primary Security Contact Email**: `security@payops.ai`
- **GitHub Private Vulnerability Reporting**: Use the **Security → Report a vulnerability** tab on our GitHub repository.
- **PGP Fingerprint**: `4F9A 82C1 E01B 7734 99D2  11A8 C402 88E1 9041 2B7C`

### Vulnerability Response SLAs

| Severity Tier | Examples | Acknowledgment SLA | Triage & Reproduction SLA | Patch & Disclosure Target |
|---|---|---|---|---|
| **Critical (`CVSS 9.0–10.0`)** | Policy Firewall (`F-02`) bypass, webhook signature forgery (`R-04`), cross-tenant RLS bypass, secret exposure (`R-07`). | **< 2 hours** | **< 6 hours** | **< 24 hours** |
| **High (`CVSS 7.0–8.9`)** | Indirect prompt injection bypassing `M-02`, idempotency lock race condition (`R-02`), privilege escalation on `API-02`. | **< 6 hours** | **< 24 hours** | **< 72 hours** |
| **Medium (`CVSS 4.0–6.9`)** | Rate-limit evasion (`R-10`), non-sensitive log redaction miss. | **< 24 hours** | **< 3 business days** | **< 14 days** |
| **Low (`CVSS 0.1–3.9`)** | Minor security header hardening or documentation improvements. | **< 48 hours** | **< 5 business days** | Next scheduled release |
