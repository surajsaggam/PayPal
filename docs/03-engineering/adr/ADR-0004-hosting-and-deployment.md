# ADR-0004: Multi-Service Cloud Deployment on `Render` (`render.yaml`) with `Elastic` Observability & Deterministic Replay Mode
> Project: PayOps AI (PayPal Sentinel) · Owner: Principal DevSecOps & Cloud Architect · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../../00-overview/PROJECT_BRIEF.md) · [Architecture](../ARCHITECTURE.md) · [Deployment](../../05-ops/DEPLOYMENT.md) · [ADR-0000](./ADR-0000-template.md)

---

## Status Matrix

- **Status:** `Accepted`
- **Deciders:** `ENG-1`, `ENG-4`
- **Date:** `2026-11-05`
- **Canonical Scope:** `F-01`..`F-12` · `R-06`, `R-12`

---

## 1. Context and Problem Statement

Per Devpost rules (`https://paypalaihackathon.devpost.com/`), a functional live hosted demo is a strict baseline compliance requirement—static mockups or broken URLs result in immediate disqualification (`R-12`). Furthermore, **Render** is an official **$2,250 Sponsor Track** (judged by **Shifra Williams**), and **Elastic** is an official Ecosystem Sponsor (judged by **Carly Richmond**). At the same time, live judging against external sandboxes (`api-m.sandbox.paypal.com`) carries the operational risk of transient `HTTP 429` rate limits or sandbox maintenance windows (`R-06`).

We must select a cloud hosting, durable workflow, observability, and demo-resilience architecture that guarantees `100%` uptime during the December 1–15, 2026 judging window.

---

## 2. Decision Drivers

- **Zero-Ops Multi-Service Infrastructure-as-Code:** Must deploy Next.js 15, Fastify 5, Python 3.12 GNN/DSL, durable background workers, PostgreSQL 16 (`pgvector`), and Redis 7.4 from a single declarative `render.yaml` Blueprint.
- **Sponsor Prize Alignment (`Render` + `Elastic`):** Must meaningfully leverage **Render Workflows**, Render Managed Data Stores, and **Elastic Cloud** hybrid RAG + OpenTelemetry log indexing.
- **Bulletproof Demo Survivability (`R-06`):** Must never show a judge a broken screen even if PayPal Developer Sandbox throttles requests during peak judging.

---

## 3. Considered Options

1. **Option 1 (Chosen): Declarative `render.yaml` Multi-Service Blueprint on Render Cloud + Render Workflows + Elastic Cloud 8.15 Observability + Automatic Circuit-Breaker Sandbox Replay Engine (`FF_DEMO_REPLAY_FALLBACK`).**
2. **Option 2 (Rejected): Vercel Serverless Functions Only.** Rejected because Vercel serverless functions have strict cold-start and execution timeouts unsuitable for persistent PyTorch Geometric GNN memory graphs, SSE streams, and long-running durable dunning workflows.
3. **Option 3 (Rejected): Raw Self-Managed AWS EKS Kubernetes Cluster.** Excessive operational overhead during a 48-hour hackathon sprint and forfeits the **$2,250 Best Use of Render** prize track.

---

## 4. Decision Outcome

Chosen option: **Option 1 — Render Cloud Blueprint (`render.yaml`) + Render Workflows + Elastic Cloud + Deterministic Sandbox Replay Engine**.

### 4.1 Render Service Topology (`render.yaml`)
- `payops-web` (`web` service, Node.js 22): Next.js 15 Executive Cockpit with `/api/v1/health` readiness probe.
- `payops-api` (`web` service, Node.js 22): Fastify 5 MCP Orchestrator, APIMatic Validator, and Webhook Ingress.
- `payops-risk-dsl` (`pserv` private service, Python 3.12): Internal low-latency `Cosmos.AI` DSL & `M-04` GNN service connected over Render's private network.
- `payops-workflows` (`worker` service, **Render Workflows**): Durable execution of scheduled invoice dunning (`F-03`) and dispute SLA timers (`F-04`).
- `payops-postgres` (Render Managed PostgreSQL 16 with `pgvector`) & `payops-redis` (Render Managed Redis 7.4).

### 4.2 Deterministic Sandbox Replay Fallback (`R-06`)
When `FF_DEMO_REPLAY_FALLBACK=auto`, our Fastify HTTP client monitors every call to `api-m.sandbox.paypal.com`. If PayPal Sandbox returns `HTTP 429 / 502 / 503` or exceeds `2,500ms`, the circuit breaker transparently serves pre-recorded, cryptographically signed Sandbox HTTP transcripts and illuminates an honest `REPLAY_CACHE_FALLBACK` telemetry indicator in the UI footer.

### 4.3 Positive Consequences
- 1-click reproducible cloud deployment (`Render Blueprint`) with zero cold starts via pre-warmed health checks.
- Full end-to-end W3C `traceparent` spans and 180-day compliance logs searchable in **Elastic Kibana**.

### 4.4 Negative Consequences & Mitigations
- *Trade-Off:* Private service communication between `payops-api` and `payops-risk-dsl` relies on Render internal DNS (`http://payops-risk-dsl:8000`).
- *Mitigation:* Configurable via `RISK_ENGINE_URL` environment variable so `docker-compose.local.yml` and Render share identical code.

---

## 5. Verification & Compliance Links

- **Implementation Paths:** `render.yaml`, `infra/docker-compose.local.yml`, `docs/05-ops/DEPLOYMENT.md`.
- **Verification Gate:** Automated smoke test against `https://payops-ai-sentinel.onrender.com/api/v1/health` in `.github/workflows/deploy.yml`.
