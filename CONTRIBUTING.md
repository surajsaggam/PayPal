# Contributing to PayOps AI (`PayPal Sentinel`)

Thank you for contributing to **PayOps AI (`PayPal Sentinel`)** — the open-source autonomous financial operations, smart invoicing, and dispute-defense control plane built on the **PayPal Developer Platform (`@paypal/agent-toolkit`, PayPal MCP Server, REST APIs v2)**!

---

## 1. Local Development Setup

### Prerequisites
- **Node.js**: `v20.18.0+` (LTS)
- **Package Manager**: `pnpm v9.12.3+` (`corepack enable`)
- **Docker Desktop / Docker Engine**: `v26+` (for local PostgreSQL 16 + `pgvector`, Redis 7.4 `JunoDB` state cache, and Elasticsearch 8.15)
- **PayPal Developer Sandbox Account**: Free account at [developer.paypal.com](https://developer.paypal.com)

### 5-Step Quick Setup
```bash
# 1. Clone the repository
git clone https://github.com/payops-ai/paypal-sentinel.git
cd paypal-sentinel

# 2. Install workspace dependencies
pnpm install

# 3. Copy the environment template and add your PayPal Sandbox credentials
cp .env.example .env

# 4. Boot local infrastructure & seed deterministic PayPal Sandbox fixtures
docker compose up -d
pnpm run seed:sandbox

# 5. Start full-stack development servers (Web :3000, API :4000)
pnpm run dev
```

---

## 2. Branching Strategy & Naming Convention

We follow **Trunk-Based Development** with short-lived feature branches merged into `main` via Pull Requests (see [`docs/03-engineering/GIT_WORKFLOW.md`](docs/03-engineering/GIT_WORKFLOW.md)):

- `feat/<ticket-id>-<short-slug>` — e.g., `feat/TKT-018-smart-invoicing-qr`
- `fix/<ticket-id>-<short-slug>` — e.g., `fix/TKT-012-webhook-replay-window`
- `sec/<risk-id>-<short-slug>` — e.g., `sec/R-01-xml-tag-isolation`
- `docs/<scope>-<short-slug>` — e.g., `docs/m4-responsible-ai-matrix`
- `test/<scope>-<short-slug>` — e.g., `test/e2e-dispute-evidence-bundle`

---

## 3. Commit Message Convention (`Conventional Commits`)

Every commit message must follow the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/) specification and reference the canonical Feature (`F-xx`), Risk (`R-xx`), or Ticket (`TKT-xxx`) ID:

```text
<type>(<scope>): <concise imperative summary> [<ID>]

 Examples:
feat(invoicing): attach conditional early-pay discount rules via @paypal/agent-toolkit [F-03, TKT-018]
sec(policy-firewall): block indirect prompt injection in dispute buyer notes [F-02, R-01]
fix(idempotency): enforce deterministic PayPal-Request-Id header on order capture [F-06, R-02]
```

---

## 4. Pull Request Review Checklist & Definition of Done (DoD)

Before requesting review or merging a Pull Request, verify all items in our **Definition of Done**:

- [ ] **Canonical ID Traceability**: Code and docs reference exact IDs (`F-01`..`F-12`, `US-01`..`US-16`, `E-01`..`E-10`, `API-01`..`API-14`, `M-01`..`M-05`, `R-01`..`R-12`) from [`docs/00-overview/PROJECT_BRIEF.md`](docs/00-overview/PROJECT_BRIEF.md).
- [ ] **Zero-PAN & Zero-Secret Hygiene (`R-07`)**: No API keys, OAuth client secrets, or raw card numbers exist in code, tests, or logs (`Gitleaks` passes).
- [ ] **Mandatory Idempotency (`F-06`, `R-02`)**: Any new state-mutating PayPal API call includes a deterministic `PayPal-Request-Id` header and `JunoDB`/Redis lock.
- [ ] **Policy Firewall & Schema Validation (`F-02`, `F-09`)**: Any new AI agent tool action is registered in `ai/agents/paypal-mcp-config.json` and validated by `APIMatic` Zod schemas.
- [ ] **Automated CI & AI Eval Gates Green**: `pnpm lint`, `pnpm -r run typecheck`, `pnpm test:ci`, and `pnpm run eval:ci` pass with 0 errors.
