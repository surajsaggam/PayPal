# Team Structure, RACI Matrix & Decision Protocol (`TEAM.md`)
> Project: PayOps AI (PayPal Sentinel) · Owner: Engineering & Product Operations Lead (Keith Rabois "Barrels" Lens) · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [Hackathon Plan](../00-overview/HACKATHON_PLAN.md) · [Backlog](./BACKLOG.md)

## 1. Team Composition: Four Autonomous "Barrels" (Keith Rabois Principle)

Per **Keith Rabois's** operational law (*"Hire barrels who can take an idea from conception to live production independently, not ammunition"*), **PayOps AI (`PayPal Sentinel`)** is structured for a 4-person high-velocity hackathon squad where each builder owns a cleanly decoupled vertical slice with zero file-lock contention:

| Seat | Role Title | Primary Domain Ownership | Owned Workstreams & Tickets (`BACKLOG.md`) |
|---|---|---|---|
| **Member 1 (`Lead Architect & Backend / PayPal Integration`)** | **Team Representative & Backend/PayPal Lead** | PayPal REST v2 (`Orders`, `Invoicing`, `Disputes`, `Tracking`, `Subscriptions`, `Webhooks`), `JunoDB`/Redis idempotency (`F-06`), PostgreSQL (`E-01`..`E-10`), `PYUSD` Solana Token-2022 bridge (`F-11`). | `TKT-001`..`TKT-004`, `TKT-006`, `TKT-008`, `TKT-012`, `TKT-018`..`TKT-022`, `TKT-027`. |
| **Member 2 (`AI, MCP Orchestration & Risk Graph Lead`)** | **AI / ML & Security Lead** | `@paypal/agent-toolkit` (35 tools), PayPal MCP Server (`F-01`), `Cosmos.AI` DSL Policy Firewall (`F-02`), `APIMatic` Schema Validator (`F-09`), `M-01`..`M-05` models, `GraphSAGE + LightGBM` ONNX (`F-10`), `AI_EVALS.md`. | `TKT-005`, `TKT-007`, `TKT-009`..`TKT-011`, `TKT-013`, `TKT-016`..`TKT-017`, `TKT-023`..`TKT-026`, `TKT-034`. |
| **Member 3 (`Frontend, Design System & Sponsor UI Lead`)** | **Principal Product Designer & Frontend Lead** | Next.js 15 App Router (`apps/web`), **AG Grid Enterprise Command Center (`F-07`)**, **Bryntum Timeline Scheduler (`F-08`)**, WebAuthn Passkey UI (`API-02`), WCAG 2.2 AA & multi-currency localization. | `TKT-015`, `TKT-028`..`TKT-031`, `TKT-035`. |
| **Member 4 (`DevOps, E2E QA, Compliance & Pitch Lead`)** | **SRE, QA & Product Storyteller** | **Render Cloud Blueprint (`infra/render.yaml`)**, GitHub Actions (`.github/workflows/ci.yml`, `deploy.yml`), Elastic Observability (`F-12`), Playwright E2E suite (`tests/e2e/`), `<3:00` YouTube video & Devpost submission (`PITCH.md`). | `TKT-014`, `TKT-032`..`TKT-033`, `TKT-036`. |

---

## 2. Workstream RACI Matrix

*Legend: **R** = Responsible (builds it) · **A** = Accountable (final sign-off) · **C** = Consulted · **I** = Informed*

| Deliverable / Workstream | Member 1 (`Backend / PayPal`) | Member 2 (`AI / MCP / Risk`) | Member 3 (`Frontend / AG Grid / Bryntum`) | Member 4 (`DevOps / QA / Pitch`) |
|---|---|---|---|---|
| **1. Core Database (`E-01`..`E-10`) & `JunoDB` Idempotency (`F-06`)** | **R / A** | C | I | C |
| **2. `@paypal/agent-toolkit` (35 Tools) & PayPal MCP Server (`F-01`)** | C | **R / A** | I | I |
| **3. `Cosmos.AI` DSL Policy Firewall (`F-02`) & `APIMatic` Validator (`F-09`)** | C | **R / A** | C | C |
| **4. Smart Invoicing (`F-03`), Checkout (`F-05`) & `PYUSD` Bridge (`F-11`)** | **R / A** | C | C | I |
| **5. Dispute Defense (`F-04`), OCR (`M-03`) & `GraphSAGE` ONNX (`F-10`)** | C | **R / A** | I | C |
| **6. Executive Command Center (`AG Grid` `F-07` + `Bryntum` `F-08`)** | C | I | **R / A** | C |
| **7. Render Cloud Deployment (`render.yaml`), CI/CD & Elastic (`F-12`)** | C | C | I | **R / A** |
| **8. E2E Playwright Tests, AI Evals & `<3:00` YouTube Pitch (`PITCH.md`)** | C | C | C | **R / A** |

---

## 3. Communication Cadence & Conflict / Decision Protocol

1. **6-Hour Synchronized Checkpoints (`H06, H12, H18, H24, H30, H36, H42, H48`)**:
   - 10-minute standup verifying against the `HACKATHON_PLAN.md` critical path: (1) What passed E2E tests in the last 6 hours, (2) Any API contract blockers against `api/openapi.yaml`, and (3) Whether to trigger the pre-agreed **Cut List** if behind schedule by `> 90 minutes`.
2. **Contract-First Parallelism (`api/openapi.yaml` + `packages/shared`)**:
   - Frontend (`Member 3`) and Backend (`Member 1` & `Member 2`) never block on each other because all 14 REST endpoints (`API-01`..`API-14`) and Zod schemas (`E-01`..`E-10`) are locked in `H01–H03`.
3. **15-Minute Disagreement Rule**:
   - Any architectural or scope disagreement lasting longer than 15 minutes is decided by the **Accountable (`A`)** owner for that workstream, subject to two non-negotiable vetoes:
     1. **Security/Idempotency Veto (`Member 1` / `Member 2`)**: No code merges if it weakens `F-02` policy enforcement or `F-06` idempotency.
     2. **Demo Reliability Veto (`Member 4`)**: From `H36` onward, feature freeze is enforced—only bug fixes, E2E polish, and pitch recording improvements are allowed.
