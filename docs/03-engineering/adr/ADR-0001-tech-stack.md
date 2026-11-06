# ADR-0001: Polyglot TypeScript & Python Monorepo (`Next.js 15` + `Fastify 5` + `FastAPI` + `@paypal/agent-toolkit` + `AG Grid` + `Bryntum`)
> Project: PayOps AI (PayPal Sentinel) · Owner: Chief Systems Architect · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../../00-overview/PROJECT_BRIEF.md) · [Architecture](../ARCHITECTURE.md) · [Tech Stack](../TECH_STACK.md) · [ADR-0000](./ADR-0000-template.md)

---

## Status Matrix

- **Status:** `Accepted`
- **Deciders:** `ENG-1`, `ENG-2`, `ENG-3`, `ENG-4`
- **Date:** `2026-11-05`
- **Canonical Scope:** `F-01`..`F-12` · `API-01`..`API-14`

---

## 1. Context and Problem Statement

`PayOps AI (PayPal Sentinel)` must simultaneously:
1. Orchestrate all **35 tools in `@paypal/agent-toolkit` (`0.3.2`)** and the **PayPal MCP Server (`@paypal/mcp`)**, validate payloads with **APIMatic (`@paypal/paypal-server-sdk`)**, and render high-density enterprise UI components (**AG Grid Enterprise `32.3`** and **Bryntum Scheduler Pro `6.1`**) alongside **`@paypal/react-paypal-js` (`Fastlane`)**—all of which have first-class TypeScript/Node.js SDKs.
2. Execute a sub-20ms **Multi-Hop Graph Neural Network (`M-04` PyTorch Geometric `GraphSAGE` + LightGBM)** and a compiled **`Cosmos.AI`-style AST Decision DSL Engine (`F-02`)**—workloads where Python 3.12 is the undisputed industry and PayPal (`Cosmos.AI`) standard.

We must choose an application and repository architecture that unifies these capabilities without schema drift or slow inter-service serialization.

---

## 2. Decision Drivers

- **Native PayPal & Sponsor SDK Support:** `@paypal/agent-toolkit/ai-sdk`, `@paypal/paypal-server-sdk`, `ag-grid-react`, and `@bryntum/schedulerpro-react` are primary TypeScript packages.
- **Load-Bearing ML/GNN Execution:** `PyTorch Geometric` and `LightGBM` require a native Python 3.12 runtime (`services/risk-dsl`).
- **PayPal Production Heritage Alignment:** PayPal pioneered enterprise Node.js/TypeScript (`Kraken.js`, `Zoid`) for web/API tiers while running `Cosmos.AI` and GNN risk engines on Python/Kubernetes.
- **Single-Command Developer Experience:** Judges and contributors (**Eddie Jaoude**, **Marco Podien**) must be able to clone one repository and boot the entire stack with `pnpm dev`.

---

## 3. Considered Options

1. **Option 1 (Chosen): `pnpm` + Turborepo Polyglot Monorepo (`Next.js 15` + `Fastify 5` TypeScript Core + `FastAPI` Python 3.12 Risk/GNN Sidecar)** governed by a single OpenAPI 3.1 contract (`api/openapi.yaml`).
2. **Option 2 (Rejected): Pure Python Monolith (`FastAPI` + `Streamlit`/`Gradio` UI).** Rejected because Streamlit/Gradio cannot host enterprise **AG Grid Enterprise**, **Bryntum Scheduler Pro**, or `@paypal/react-paypal-js` (`Fastlane`), and Python lacks native Vercel AI SDK bindings for `@paypal/agent-toolkit`.
3. **Option 3 (Rejected): Pure TypeScript Monolith (No Python Service).** Rejected because running multi-hop GNN tensor inference (`M-04`) in Node.js lacks mature `PyTorch Geometric` graph kernels.

---

## 4. Decision Outcome

Chosen option: **Option 1 — Polyglot TypeScript & Python Monorepo (`apps/web`, `services/api`, `services/risk-dsl`, `packages/*`)**.

### 4.1 Positive Consequences
- **100% Native Sponsor & PayPal Ergonomics:** `apps/web` and `services/api` share strict TypeScript types (`packages/shared-types`) across `@paypal/agent-toolkit`, `@paypal/paypal-server-sdk` (APIMatic), AG Grid, and Bryntum.
- **Authentic `Cosmos.AI` + GNN Separation:** `services/risk-dsl` isolates the deterministic Policy Firewall (`F-02`) and PyTorch Geometric GNN scorer (`F-10`) in a dedicated, independently scalable Python FastAPI service (`< 18ms` p99).

### 4.2 Negative Consequences & Mitigations
- *Trade-Off:* Requires running both Node.js 22 and Python 3.12 processes.
- *Mitigation:* Orchestrated transparently via `turbo dev` locally and deployed as a single declarative multi-service blueprint via `render.yaml` on **Render** (`ADR-0004`).

---

## 5. Verification & Compliance Links

- **Implementation Paths:** `apps/web/`, `services/api/`, `services/risk-dsl/`, `packages/shared-types/`.
- **Verification Gate:** `pnpm typecheck && mypy --strict services/risk-dsl` in `.github/workflows/ci.yml`.
