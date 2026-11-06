# Deployment Runbook, Migrations & Zero-Downtime Rollouts (`DEPLOYMENT.md`)
> Project: PayOps AI (PayPal Sentinel) · Owner: Release & Platform Engineering Lead · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [PRD](../01-product/PRD.md) · [Architecture](../03-engineering/ARCHITECTURE.md) · [CI/CD](./CICD.md) · [Infrastructure](./INFRASTRUCTURE.md) · [Runbook](./RUNBOOK.md)

## 1. Step-by-Step MVP Deployment on Render (`infra/render.yaml`)

Judges or developers can deploy the complete **PayOps AI (`PayPal Sentinel`)** stack to Render in under 6 minutes using our declarative Blueprint (`infra/render.yaml`):

### Step 1: Connect Repository & Blueprint
1. Sign in to [Render Dashboard](https://dashboard.render.com/) and click **New + → Blueprint**.
2. Select the public GitHub repository containing `infra/render.yaml`.
3. Render automatically detects the 5 declared resources:
   - `payops-web` (Next.js 15 web application)
   - `payops-api` (Fastify API & PayPal MCP orchestrator)
   - `payops-policy-worker` (Background webhook & dunning worker)
   - `payops-postgres` (Managed PostgreSQL 16 database)
   - `payops-junodb-redis` (Managed Redis 7.4 idempotency store)

### Step 2: Populate Environment Group (`payops-sandbox-secrets`)
Enter the following credentials from `.env.example` into the Render Blueprint prompt:
- `PAYPAL_CLIENT_ID` & `PAYPAL_CLIENT_SECRET` (from [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/sandbox))
- `PAYPAL_WEBHOOK_ID` (configured in Step 3 below)
- `ANTHROPIC_API_KEY` (`M-01`), `OPENAI_API_KEY` (`M-02`, `M-05`), `GEMINI_API_KEY` (`M-03`)
- `ELASTIC_CLOUD_ID` & `ELASTIC_API_KEY` (`F-12`)

### Step 3: Register PayPal Sandbox Webhook (`API-13`)
1. In the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/sandbox), open your Sandbox App and scroll to **Webhooks → Add Webhook**.
2. Set **Webhook URL** to: `https://<your-payops-api>.onrender.com/api/v1/webhooks/paypal`
3. Subscribe to these exact event families:
   - `INVOICING.INVOICE.CREATED`, `INVOICING.INVOICE.PAID`, `INVOICING.INVOICE.CANCELLED`, `INVOICING.INVOICE.UPDATED`
   - `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.REFUNDED`
   - `CUSTOMER.DISPUTE.CREATED`, `CUSTOMER.DISPUTE.RESOLVED`, `CUSTOMER.DISPUTE.UPDATED`
   - `BILLING.SUBSCRIPTION.CREATED`, `BILLING.SUBSCRIPTION.CANCELLED`
4. Copy the generated **Webhook ID** (`WH-...`) into `PAYPAL_WEBHOOK_ID` on Render.

### Step 4: Seed Synthetic Sandbox Data (`scripts/seed-sandbox.ts`)
Run the one-command idempotent seed script from the Render Shell or local terminal to populate catalog products, sample invoices, orders, and dispute fixtures:
```bash
pnpm run seed:sandbox
```

---

## 2. Local Docker & Developer Deployment (`MVP (hackathon)`)

For offline judging or local verification on Windows, macOS, or Linux:
```bash
# 1. Clone and install dependencies
git clone https://github.com/payops-ai/paypal-sentinel.git
cd paypal-sentinel
pnpm install

# 2. Configure environment variables
cp .env.example .env

# 3. Start local PostgreSQL 16, Redis 7.4 (JunoDB cache), and Elasticsearch 8.15
docker compose up -d

# 4. Run database migrations and seed PayPal Sandbox fixtures
pnpm --filter @payops/api db:migrate
pnpm run seed:sandbox

# 5. Launch full-stack dev servers (Web on :3000, API on :4000)
pnpm run dev
```

---

## 3. Zero-Downtime Database Migrations (`Expand-and-Contract`)

All schema changes to `E-01`..`E-10` (`DATA_MODEL.md`) follow the **Expand-and-Contract** pattern executed in `payops-api`'s pre-deploy hook (`pnpm --filter @payops/api db:migrate:deploy`):
1. **Phase 1 (Expand)**: Add nullable columns, new tables, or `CONCURRENTLY` created indexes. Never drop or rename columns in the same release as application code changes.
2. **Phase 2 (Dual-Write / Backfill)**: Deploy new application instances while old instances are still draining traffic.
3. **Phase 3 (Contract)**: Remove deprecated columns only after 100% of containers run the new version.
4. **Immutable Audit Table Protection (`E-10`)**: A PostgreSQL trigger `prevent_audit_log_mutation()` rejects any `UPDATE`, `DELETE`, or `TRUNCATE` statement on `immutable_audit_logs` even from migration scripts.

---

## 4. Feature Flags & Runtime Kill-Switches (`FEATURES.md`)

All high-impact capabilities can be toggled at runtime via `MerchantWorkspace.feature_flags` or environment variables without redeploying:

| Flag Key | Default (`MVP`) | Linked Feature | Emergency Kill-Switch Behavior |
|---|---|---|---|
| `FF_AUTONOMOUS_REFUNDS_ENABLED` | `true` (`<= $250`) | `F-01`, `F-02`, `F-05` | Setting to `false` forces 100% of `create_refund` calls into `L2` human passkey approval (`API-02`). |
| `FF_AUTONOMOUS_DISPUTE_EVIDENCE` | `true` | `F-04`, `F-10` | Setting to `false` stages compiled evidence bundles as drafts in AG Grid (`F-07`) without auto-submitting. |
| `FF_PYUSD_SOLANA_SETTLEMENT` | `true` (Devnet/Sandbox) | `F-11` | Disables cross-border PYUSD settlement bridge and defaults all invoices to fiat PayPal Checkout. |
| `FF_DEMO_OFFLINE_REPLAY_FALLBACK` | `auto` | `R-06` | Automatically activates deterministic recorded PayPal Sandbox responses if `api-m.sandbox.paypal.com` returns `HTTP 429`/`503` during live judging. |

---

## 5. Rollback Verification Procedure

If `/api/v1/health` or post-deploy Playwright smoke tests fail:
1. `.github/workflows/deploy.yml` automatically invokes the Render Rollback API (`POST /v1/services/{serviceId}/rollback`) to restore the previous green container image in `<25 seconds`.
2. Operators verify rollback health via:
   ```bash
   curl -fsSL https://payops-api.onrender.com/api/v1/health | jq .
   # Expected: { "status": "ok", "paypal_sandbox": "connected", "junodb_cache": "connected", "policy_engine": "ready" }
   ```
