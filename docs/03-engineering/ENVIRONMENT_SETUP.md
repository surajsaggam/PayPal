# Local Environment Setup & Developer Onboarding — PayOps AI (PayPal Sentinel)
> Project: PayOps AI (PayPal Sentinel) · Owner: Developer Experience (DX) Lead · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [Tech Stack](./TECH_STACK.md) · [Integrations](./INTEGRATIONS.md) · [Testing](./TESTING.md)

---

## 1. System Prerequisites

To build and run `PayOps AI (PayPal Sentinel)` locally on **Windows 11 (PowerShell)**, **macOS**, or **Linux**, ensure the following tools are installed:

| Tool | Required Version | Verification Command | Installation Note |
| :--- | :---: | :--- | :--- |
| **Node.js** | `>= 22.11.0 LTS` | `node --version` | Required for `@paypal/agent-toolkit`, Fastify 5, and Next.js 15. |
| **pnpm** | `>= 9.12.0` | `pnpm --version` | Enable via `corepack enable && corepack prepare pnpm@9.12.3 --activate`. |
| **Python** | `>= 3.12.0` | `python --version` | Powers `services/risk-dsl` (`Cosmos.AI` DSL + `M-04` GNN scorer). |
| **Docker & Compose**| `>= 27.0` | `docker compose version`| Runs local PostgreSQL 16 (`pgvector`) and Redis 7.4 (`JunoDB` state store). |
| **Git** | `>= 2.40` | `git --version` | Version control & commit hooks. |

---

## 2. Step-by-Step Local Setup (`< 3 Minutes` from Clone to Running Cockpit)

### 2.1 Step 1 — Clone Repository & Configure Environment Variables
```powershell
git clone https://github.com/payops-ai/paypal-sentinel.git
cd paypal-sentinel
cp .env.example .env
```

Open `.env` and populate your **PayPal Developer Sandbox** credentials (obtainable in 60 seconds at `https://developer.paypal.com/dashboard/applications/sandbox`):
```dotenv
# PayPal Developer Sandbox & MCP Server Configuration
PAYPAL_ENVIRONMENT=SANDBOX
PAYPAL_CLIENT_ID=your_sandbox_client_id_here
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret_here
PAYPAL_WEBHOOK_ID=your_sandbox_webhook_id_here
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id_here

# Database & JunoDB/Redis Idempotent State Store
DATABASE_URL=postgresql://payops:payops_local_dev@localhost:5432/payops_sentinel
REDIS_URL=redis://localhost:6379/0

# AI Gateway & Sponsor Integrations
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here
ELASTICSEARCH_URL=http://localhost:9200
CHANNEL3_API_KEY=sandbox_channel3_demo_key
FF_DEMO_REPLAY_FALLBACK=auto
```
*(Note: If you evaluate the repo before adding live API keys, `FF_DEMO_REPLAY_FALLBACK=auto` automatically serves deterministic recorded PayPal Sandbox responses so the entire UI works out of the box.)*

### 2.2 Step 2 — Start Local Infrastructure (`PostgreSQL 16 + pgvector` & `Redis 7.4`)
```powershell
docker compose -f infra/docker-compose.local.yml up -d
```

### 2.3 Step 3 — Install Dependencies, Run SQL Migrations & Seed Realistic SMB Data
```powershell
# Install Node.js workspace packages and Python virtual environment
pnpm install
python -m venv services/risk-dsl/.venv
# On Windows PowerShell:
.\services\risk-dsl\.venv\Scripts\ pip install -r services/risk-dsl/requirements.txt
# On macOS / Linux:
# source services/risk-dsl/.venv/bin/activate && pip install -r services/risk-dsl/requirements.txt

# Apply PostgreSQL 16 DDL (E-01..E-10) and seed realistic multi-currency merchant data
pnpm db:migrate
pnpm db:seed
```

### 2.4 Step 4 — Launch All Services (`Web`, `Fastify API`, `Python Risk/GNN Engine`, `PayPal MCP`)
```powershell
pnpm dev
```
- **Executive Web Cockpit (`Next.js 15`):** `http://localhost:3000`
- **Fastify API & OpenAPI Swagger UI (`API-01`..`API-14`):** `http://localhost:4000/docs`
- **Python `Cosmos.AI` DSL & `M-04` GNN Service:** `http://localhost:8000/health`

---

## 3. Seed Data Overview (`pnpm db:seed`)

Running `pnpm db:seed` populates a deterministic, PII-free dataset so judges and developers can test all 5 screens immediately:
- **2 Merchant Workspaces (`E-01`):** `Lumina Botanicals ($ USD)` (`P-01`) and `Vortex Cloud & AI Studio (₹ INR / $ USD)` (`P-02`).
- **4 Operator Users (`E-02`):** `OWNER`, `FINANCE_ADMIN`, `AUDITOR`, and `AGENT_SERVICE` with test Ed25519 signing keys.
- **4 Active `Cosmos.AI` Policy Rules (`E-05`):** Covering autonomous invoicing (`POL-01`), `$500` refund/injection hold gates (`POL-02`), delivered dispute auto-defense (`POL-03`), and `$1,000` procurement caps (`POL-04`).
- **25 Historical Invoices (`E-07`), 40 Orders (`E-06`), 6 Disputes (`E-08`), and 50 Hash-Chained Audit Logs (`E-10`).**

---

## 4. Common Troubleshooting Guide

| Symptom / Error | Root Cause | Exact Resolution Command / Fix |
| :--- | :--- | :--- |
| **`HTTP 401 invalid_client` from PayPal Sandbox** | `PAYPAL_CLIENT_ID` or `PAYPAL_CLIENT_SECRET` copied from Live tab instead of Sandbox tab on `developer.paypal.com`. | Ensure `PAYPAL_ENVIRONMENT=SANDBOX` and copy credentials from **Dashboard → Sandbox → Apps & Credentials**. |
| **`EADDRINUSE: address already in use :::5432` or `:::6379`** | Local native PostgreSQL or Redis service already bound to default ports. | Stop local service or override `POSTGRES_PORT=5433` in `.env` and `docker-compose.local.yml`. |
| **PowerShell `Activate.ps1 cannot be loaded because running scripts is disabled`** | Default Windows PowerShell execution policy blocks venv activation scripts. | Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` or invoke `.\services\risk-dsl\.venv\Scripts\python.exe` directly. |
| **PayPal Webhook `verification_status: FAILURE` on `localhost`** | `PAYPAL_WEBHOOK_ID` does not match the ngrok/Cloudflare tunnel URL registered in PayPal Sandbox. | Use the built-in **1-Click Signed Webhook Simulator Toolbar** in the UI (which signs payloads with the test keypair) or update `PAYPAL_WEBHOOK_ID`. |
