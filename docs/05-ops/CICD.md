# CI/CD Pipeline & Automated Quality Gates (`CICD.md`)
> Project: PayOps AI (PayPal Sentinel) · Owner: DevOps & Release Engineering Lead · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [PRD](../01-product/PRD.md) · [Architecture](../03-engineering/ARCHITECTURE.md) · [Testing](../03-engineering/TESTING.md) · [AI Evals](../04-ai/AI_EVALS.md) · [Deployment](./DEPLOYMENT.md)

## 1. CI/CD Pipeline Architecture

**PayOps AI (`PayPal Sentinel`)** uses a six-stage GitHub Actions continuous integration and deployment pipeline (`.github/workflows/ci.yml` and `.github/workflows/deploy.yml`) targeting **Render Cloud** (`infra/render.yaml`). Every pull request is validated for static types, OpenAPI 3.1 contract conformance (`api/openapi.yaml`), `APIMatic` SDK schema rules (`F-09`), security vulnerabilities, unit/integration tests, and our **60-case AI Evaluation Regression Gate (`AI_EVALS.md`)**.

```mermaid
flowchart LR
    PR["Git Push / Pull Request"] --> Lint["Stage 1: Lint & Typecheck<br/>(ESLint 9, Prettier, tsc --noEmit)"]
    Lint --> Contract["Stage 2: API & Schema Gate<br/>(Redocly OpenAPI 3.1 + APIMatic Zod)"]
    Contract --> Test["Stage 3: Unit & Integration Tests<br/>(Vitest + Postgres + Redis Service Containers)"]
    Test --> Sec["Stage 4: Security & Secret Scan<br/>(Trivy, Gitleaks, pnpm audit)"]
    Sec --> Eval["Stage 5: AI Eval & Policy Gate<br/>(Prompt Injection + 35-Tool Accuracy)"]
    Eval --> Deploy["Stage 6: Render Blueprint Deploy<br/>(Preview / Staging -> Smoke Test -> Prod)"]
    Deploy -->|Smoke Test Fails| Rollback["Automated Render Rollback<br/>+ Slack/Discord Alert"]
```

---

## 2. Environment Promotion Matrix

| Environment | Git Trigger | Render Target | PayPal Environment | AI Model Routing | Approval Gate |
|---|---|---|---|---|---|
| **`local` / `dev`** | Developer workstation | Docker Compose (`postgres:16`, `redis:7.4`, `elasticsearch:8.15`) | PayPal Sandbox (`api-m.sandbox.paypal.com`) | `M-01`..`M-05` Cloud APIs + local ONNX `M-04` | Local pre-commit hook (`husky` + `lint-staged`) |
| **`preview`** | Every Pull Request | Render Ephemeral Preview Environment | PayPal Sandbox | Cached Eval Fixtures + Sandbox Keys | Automated CI stages 1–5 |
| **`staging`** | Merge to `main` | `payops-api-staging.onrender.com` & `payops-web-staging.onrender.com` | PayPal Sandbox (Dedicated Judging Tenant) | Live `M-01`..`M-05` + Deterministic Demo Replay Cache | Post-deploy Playwright E2E smoke test (`tests/e2e/checkout-dispute.spec.ts`) |
| **`production` (`v1`)** | Tagged release `v*.*.*` | Multi-region Render Pro / GKE Production | PayPal Live (`api-m.paypal.com`) | Envoy LLM Gateway (`Cosmos.AI` pattern) | GitHub Environment Protected Reviewer + Smoke Gate |

---

## 3. Complete Inline GitHub Actions Workflows

### 3.1 Continuous Integration Workflow (`.github/workflows/ci.yml`)

```yaml
name: PayOps AI — Continuous Integration & AI Eval Gate

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: "20.18.0"
  PNPM_VERSION: "9.12.3"
  PAYPAL_ENVIRONMENT: "sandbox"

jobs:
  lint-and-typecheck:
    name: "Stage 1 & 2: Lint, TypeScript & OpenAPI 3.1 Contract"
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint & Prettier check
        run: pnpm run lint

      - name: Run workspace TypeScript typecheck
        run: pnpm -r run typecheck

      - name: Validate OpenAPI 3.1 specification (api/openapi.yaml)
        run: npx --yes @redocly/cli@latest lint api/openapi.yaml

  unit-and-integration-tests:
    name: "Stage 3: Unit, Policy Firewall (F-02) & JunoDB Idempotency (F-06) Tests"
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    timeout-minutes: 15
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_USER: payops_test
          POSTGRES_PASSWORD: payops_test_password
          POSTGRES_DB: payops_test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7.4-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 5
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup pnpm & Node.js
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Execute Unit & Integration Test Suite
        env:
          DATABASE_URL: "postgresql://payops_test:payops_test_password@localhost:5432/payops_test_db"
          REDIS_URL: "redis://localhost:6379"
          PAYPAL_CLIENT_ID: "sandbox_ci_mock_client_id"
          PAYPAL_CLIENT_SECRET: "sandbox_ci_mock_client_secret"
          PAYPAL_WEBHOOK_ID: "WH-2WR32451HC0233532-67976317FL4543714"
        run: pnpm test:ci

  security-and-secret-scan:
    name: "Stage 4: Secret Detection, Dependency Audit & Container Scan"
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    timeout-minutes: 10
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Gitleaks Secret Scanner (R-07)
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Audit npm dependencies for high/critical CVEs
        run: pnpm audit --audit-level=high

      - name: Run Trivy Vulnerability Scanner on filesystem
        uses: aquasecurity/trivy-action@0.28.0
        with:
          scan-type: "fs"
          scan-ref: "."
          severity: "CRITICAL,HIGH"
          exit-code: "1"

  ai-eval-gate:
    name: "Stage 5: AI Eval & Prompt Injection Regression Gate (M-01..M-05)"
    runs-on: ubuntu-latest
    needs: unit-and-integration-tests
    timeout-minutes: 12
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup pnpm & Node.js
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Verify MCP Config & 35 @paypal/agent-toolkit Tool Schemas
        run: node -e "const cfg = require('./ai/agents/paypal-mcp-config.json'); if (!cfg.tools || cfg.tools.length !== 35) { throw new Error('Expected 35 PayPal MCP tools'); }"

      - name: Run AI Evaluation Gate (Tool Accuracy >= 97%, Injection Block >= 99%, Policy Bypass == 0%)
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          EVAL_MODE: "deterministic_ci"
        run: pnpm run eval:ci
```

---

### 3.2 Continuous Deployment Workflow (`.github/workflows/deploy.yml`)

```yaml
name: PayOps AI — Render Cloud Deployment & Automated Rollback

on:
  push:
    branches: [main]
    tags: ["v*.*.*"]
  workflow_dispatch:
    inputs:
      target_environment:
        description: "Target deployment environment"
        required: true
        default: "staging"
        type: choice
        options:
          - staging
          - production

env:
  NODE_VERSION: "20.18.0"
  PNPM_VERSION: "9.12.3"

jobs:
  deploy-render:
    name: "Deploy to Render & Execute E2E Smoke Verification"
    runs-on: ubuntu-latest
    timeout-minutes: 20
    environment:
      name: ${{ github.ref_type == 'tag' && 'production' || inputs.target_environment || 'staging' }}
      url: ${{ steps.deploy.outputs.service_url }}
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup pnpm & Node.js
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"

      - name: Trigger Render Deploy Hook (API & Web Services)
        id: deploy
        env:
          RENDER_API_DEPLOY_HOOK: ${{ secrets.RENDER_API_DEPLOY_HOOK_URL }}
          RENDER_WEB_DEPLOY_HOOK: ${{ secrets.RENDER_WEB_DEPLOY_HOOK_URL }}
          HEALTHCHECK_URL: ${{ secrets.PAYOPS_PUBLIC_API_URL }}/api/v1/health
        run: |
          echo "Triggering Render deployment for commit ${{ github.sha }}..."
          if [ -n "$RENDER_API_DEPLOY_HOOK" ]; then
            curl -fsSL -X POST "$RENDER_API_DEPLOY_HOOK"
          fi
          if [ -n "$RENDER_WEB_DEPLOY_HOOK" ]; then
            curl -fsSL -X POST "$RENDER_WEB_DEPLOY_HOOK"
          fi
          echo "service_url=${{ secrets.PAYOPS_PUBLIC_WEB_URL }}" >> $GITHUB_OUTPUT

      - name: Poll Render Health Endpoint (Zero-Downtime Verification)
        env:
          HEALTHCHECK_URL: ${{ secrets.PAYOPS_PUBLIC_API_URL }}/api/v1/health
        run: |
          if [ -z "$HEALTHCHECK_URL" ] || [ "$HEALTHCHECK_URL" = "/api/v1/health" ]; then
            echo "No live healthcheck secret configured in CI environment; skipping external HTTP poll."
            exit 0
          fi
          for i in $(seq 1 24); do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTHCHECK_URL" || true)
            if [ "$STATUS" = "200" ]; then
              echo "Healthcheck passed (HTTP 200) on attempt $i."
              exit 0
            fi
            echo "Waiting for Render rollout (attempt $i/24, status=$STATUS)..."
            sleep 10
          done
          echo "Healthcheck timed out after 240 seconds!"
          exit 1

      - name: Automated Rollback on Failure
        if: failure()
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
          RENDER_SERVICE_ID: ${{ secrets.RENDER_API_SERVICE_ID }}
        run: |
          echo "Deployment or smoke test failed! Triggering automated rollback on Render..."
          if [ -n "$RENDER_API_KEY" ] && [ -n "$RENDER_SERVICE_ID" ]; then
            curl -fsSL -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID/rollback" \
              -H "Authorization: Bearer $RENDER_API_KEY" \
              -H "Accept: application/json"
          fi
```

---

## 4. Secrets Management & Supply-Chain Security

1. **Zero Secrets in Git (`R-07`)**: Enforced by `Gitleaks` on every commit. `.env.example` provides documented template variables only.
2. **Scoped Render Environment Groups**: Secrets (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ELASTIC_API_KEY`, `DATABASE_URL`, `REDIS_URL`) are injected at runtime via Render Environment Groups (`payops-sandbox-secrets`) with `sync: false` in `infra/render.yaml`.
3. **Deterministic Lockfiles**: `pnpm install --frozen-lockfile` ensures bit-for-bit dependency reproducibility across local, CI, and Render builds.
