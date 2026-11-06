# AI Coding Agent Instructions (`CLAUDE.md`)

> **Unified Agent & Builder Guide**: This file (`CLAUDE.md`) and [`MAP.md`](./MAP.md) serve as the authoritative operational instructions for all AI coding assistants (Claude Code, Cursor, Windsurf, GitHub Copilot, Antigravity, Codex) working in `s:\PayPal`. *(Note: Do NOT create files named `AGENTS.md` or `GEMINI.md` anywhere in the workspace, as those filenames are reserved by the agent runtime.)*

---

## 1. Project Summary

**PayOps AI (`PayPal Sentinel`)** (`PS-01`, Council #1 Pick) is an autonomous, policy-guarded financial operations, smart invoicing, and dispute-defense control plane built on the **PayPal Developer Platform (`@paypal/agent-toolkit`, PayPal MCP Server, REST APIs v2)**, **AG Grid**, **Bryntum**, **APIMatic**, **Elastic**, and **Render**.

---

## 2. Exact Commands (`Install / Dev / Test / Lint / Build / Evals`)

```bash
# Install all workspace dependencies (Node 20.18+ / pnpm 9.12+)
pnpm install

# Start full-stack development servers (Next.js Web on :3000, Fastify API on :4000)
pnpm run dev

# Run workspace-wide TypeScript static type checking
pnpm -r run typecheck

# Run ESLint & Prettier across all packages
pnpm run lint

# Seed deterministic PayPal Sandbox catalog, invoice, order, and dispute fixtures
npx tsx scripts/seed-sandbox.ts

# Run unit & End-to-End tests (Idempotency F-06, Policy Firewall F-02, Dispute Defense F-04)
npx vitest run tests/e2e/checkout-dispute.spec.ts

# Validate OpenAPI 3.1 specification (API-01..API-14)
npx --yes @redocly/cli@latest lint api/openapi.yaml

# Run AI Evaluation & Prompt Injection Regression Gate (M-01..M-05)
pnpm --filter @payops/api run eval:ci

# Render PDF deliverables from Markdown (biblehackathon.pdf & ideas.pdf)
python "C:\Users\suraj\.gemini\config\skills\war-room-council\scripts\md2pdf.py" "s:\PayPal\biblehackathon.md" "s:\PayPal\biblehackathon.pdf" --subtitle "PayPal AI Hackathon · 2026"
python "C:\Users\suraj\.gemini\config\skills\war-room-council\scripts\md2pdf.py" "s:\PayPal\ideas.md" "s:\PayPal\ideas.pdf" --subtitle "PayPal AI Hackathon · Top Ideas by Domain"
```

---

## 3. Architecture in 10 Lines

1. **Frontend (`apps/web`)**: Next.js 15 App Router + React 19 hosting the **AG Grid Enterprise Command Center (`F-07`)**, **Bryntum Timeline Scheduler (`F-08`)**, and FIDO2 WebAuthn Passkey approval drawer (`API-02`).
2. **Backend API (`services/api`)**: Fastify 5 + TypeScript exposing `API-01`..`API-14` (`api/openapi.yaml`) and hosting the isolated **PayPal MCP Server & `@paypal/agent-toolkit` Enclave (`F-01`, 35 tools)**.
3. **Intent Router (`M-02`)**: Sub-150ms classifier (`GPT-4o-mini` / `Llama-3.1-8B`) that screens untrusted text for prompt injection (`R-01`) and narrows the active tool list from 35 tools to `<= 8` domain tools.
4. **Multimodal & RAG Context (`M-03`, `M-05`)**: `Gemini 1.5 Pro` extracts carrier proof-of-delivery PDFs (`M-03`), while `text-embedding-3-small` / `BGE-M3` retrieves policy chunks from **Elasticsearch (`F-12`)**.
5. **Primary Orchestrator (`M-01`)**: `Claude 3.5 Sonnet` (with `GPT-4o` fallback) generates structured JSON tool plans with zero access to raw OAuth secrets (`R-07`).
6. **Multi-Hop Risk Graph (`M-04`, `F-10`)**: In-process ONNX `PyTorch Geometric GraphSAGE + LightGBM` model scores 2-hop buyer-seller-carrier Mirror Graph features in `<10ms` (`R-05`).
7. **Deterministic Policy Firewall (`F-02`, `packages/shared`)**: `Cosmos.AI`-style DSL engine + **`APIMatic` Schema Validator (`F-09`)** validates every tool call against `PolicyRule` (`E-05`) before execution.
8. **Idempotent Execution Ledger (`F-06`)**: `JunoDB`/Redis atomic lock (`SET NX EX 86400`) + mandatory `PayPal-Request-Id` header + PostgreSQL 16 unique constraint (`E-04`) prevent double-charges/refunds (`R-02`).
9. **Immutable Compliance Ledger (`E-10`)**: SHA-256 hash-chained `ImmutableAuditLog` in PostgreSQL 16 + Elastic 180-day hot index (`CERT-In` & `PCI-DSS v4.0` compliant).
10. **Cloud Deployment (`infra/render.yaml`)**: Declarative 5-service **Render Blueprint** (`web`, `api`, `policy-worker`, `postgres`, `junodb-redis`) with deterministic offline demo replay fallback (`R-06`).

---

## 4. Folder Ownership & Code Conventions

- **`apps/web/`**: Next.js 15 frontend components, AG Grid/Bryntum views, and client-side `@paypal/react-paypal-js` / Fastlane checkout integration. Never import server secrets here.
- **`services/api/`**: Fastify routes (`API-01`..`API-14`), PayPal MCP enclave, webhook signature verifier (`API-13`), ONNX `M-04` runner, and background workers.
- **`packages/shared/`**: Isomorphic Zod schemas for `E-01`..`E-10`, `API-01`..`API-14`, `APIMatic` payload validators (`F-09`), and the `Cosmos.AI` Policy DSL AST engine (`F-02`).
- **`ai/agents/paypal-mcp-config.json`**: Declarative registry of all 35 `@paypal/agent-toolkit` tools, model mappings (`M-01`..`M-05`), and default policy guardrails.
- **`docs/00-overview/` through `docs/08-project/`**: Company-grade `/bible` specifications. Every doc MUST start with `# <Title>` + `> Project: PayOps AI (PayPal Sentinel) ...` + `> Related: ...` and use exact IDs from `PROJECT_BRIEF.md`.

---

## 5. Non-Negotiable Do / Don't & Security Rules

### ✅ DO:
1. **Always enforce `PayPal-Request-Id` (`F-06`, `R-02`)**: Every state-mutating PayPal call (`create_order`, `pay_order`, `create_refund`, `create_invoice`, `send_invoice`, `accept_dispute_claim`) must pass a deterministic idempotency key derived via `computeDeterministicIdempotencyKey()`.
2. **Always format currency amounts as 2-decimal strings (`F-09`, `R-03`)**: Pass `"250.00"` (string) and uppercase ISO-4217 `"USD"` / `"INR"` / `"EUR"` / `"GBP"`—never raw JavaScript floats.
3. **Always isolate untrusted text (`R-01`)**: Wrap buyer dispute comments, invoice memos, and OCR text in `<untrusted_external_data>` tags and screen with `M-02` before calling `M-01`.
4. **Always verify webhook signatures (`R-04`)**: Reject any request to `POST /api/v1/webhooks/paypal` (`API-13`) that fails RSA-SHA256 verification or exceeds the 300-second replay window.

### ❌ DON'T:
1. **NEVER log or store raw PANs, CVVs, or `PAYPAL_CLIENT_SECRET` (`R-07`)**: Maintain our Zero-PAN PCI-DSS v4.0 SAQ-A boundary at all times.
2. **NEVER allow an LLM to bypass `F-02` (`Cosmos.AI` Policy Firewall)**: All tool calls from `M-01` must be evaluated by `evaluateCosmosPolicyFirewall()` before invoking `@paypal/agent-toolkit`.
3. **NEVER execute `UPDATE`, `DELETE`, or `TRUNCATE` on `immutable_audit_logs` (`E-10`)**: The audit table is append-only and cryptographically hash-chained.

---

## 6. Key Documentation Links

- **Navigation Map**: [`MAP.md`](./MAP.md)
- **2-Member Zero-Conflict Implementation Plan**: [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md)
- **Single Source of Truth**: [`docs/00-overview/PROJECT_BRIEF.md`](./docs/00-overview/PROJECT_BRIEF.md)
- **Architecture & Data Model**: [`docs/03-engineering/ARCHITECTURE.md`](./docs/03-engineering/ARCHITECTURE.md) · [`docs/03-engineering/DATA_MODEL.md`](./docs/03-engineering/DATA_MODEL.md)
- **API & OpenAPI 3.1**: [`docs/03-engineering/API_SPEC.md`](./docs/03-engineering/API_SPEC.md) · [`api/openapi.yaml`](./api/openapi.yaml)
- **AI Models, Prompts & Evals**: [`docs/04-ai/MODELS.md`](./docs/04-ai/MODELS.md) · [`docs/04-ai/PROMPTS.md`](./docs/04-ai/PROMPTS.md) · [`docs/04-ai/AI_EVALS.md`](./docs/04-ai/AI_EVALS.md)
- **Security, Compliance & Risk**: [`docs/06-security-compliance/SECURITY_ARCHITECTURE.md`](./docs/06-security-compliance/SECURITY_ARCHITECTURE.md) · [`docs/06-security-compliance/COMPLIANCE.md`](./docs/06-security-compliance/COMPLIANCE.md) · [`docs/06-security-compliance/RISK_REGISTER.md`](./docs/06-security-compliance/RISK_REGISTER.md)
