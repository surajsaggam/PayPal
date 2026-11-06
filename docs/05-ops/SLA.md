# Service Level Agreement & Enterprise Reliability Commitments (`SLA.md`)
> Project: PayOps AI (PayPal Sentinel) · Owner: COO & Enterprise Operations Lead (Tim Cook Lens) · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [PRD](../01-product/PRD.md) · [Performance](../03-engineering/PERFORMANCE.md) · [Observability](./OBSERVABILITY.md) · [Runbook](./RUNBOOK.md) · [Business Model](../07-business/BUSINESS_MODEL.md)

## 1. Service Tier Overview

Designed around **Tim Cook's** operational excellence standard and **PayPal's six-nines (`99.9999%`) `JunoDB` reliability culture**, this Service Level Agreement (`SLA`) defines binding availability, latency, and incident response commitments for **PayOps AI (`PayPal Sentinel`)** across our three commercial tiers (`BUSINESS_MODEL.md`):

| Metric / Commitment | **SMB Growth Tier** (`$49/mo` · `₹4,100/mo`) | **Mid-Market Pro Tier** (`$199/mo` · `₹16,700/mo`) | **Enterprise Custom Tier** (`$999+/mo` · `₹83,900+/mo`) |
|---|---|---|---|
| **Monthly Platform Availability SLA** | **`99.90%`** (`<= 43.8m` downtime/mo) | **`99.95%`** (`<= 21.9m` downtime/mo) | **`99.99%`** (`<= 4.38m` downtime/mo) |
| **Idempotent Ledger Integrity (`F-06`)** | **`100.00%`** (Zero duplicate charge/refund guarantee) | **`100.00%`** | **`100.00%`** |
| **Webhook Ingestion Latency (`API-13`, `p95`)** | `< 500 ms` | `< 350 ms` | `< 200 ms` (Dedicated worker queue) |
| **Autonomous Dispute Evidence Compilation (`F-04`, `p95`)** | `< 15 seconds` from `CUSTOMER.DISPUTE.CREATED` | `< 8 seconds` | `< 4.5 seconds` |
| **Policy Firewall & Graph Risk Evaluation (`F-02` + `M-04`, `p99`)** | `< 35 ms` | `< 25 ms` | `< 15 ms` |
| **Audit Log Retention (`E-10`, CERT-In / PCI-DSS)** | **180 Days Hot** + 1 Year Cold | **180 Days Hot** + 3 Years Cold | **180 Days Hot** + **7 Years WORM Archive** |
| **SEV-1 Incident Initial Response Time** | `< 30 minutes` | `< 15 minutes` | **`< 5 minutes` (24/7/365 Dedicated Slack/PagerDuty)** |

---

## 2. Service Level Objectives (SLOs) & Service Level Indicators (SLIs)

| SLI Identifier | Measurement Query (OpenTelemetry / Elastic APM) | Target SLO | Error Budget (30-Day Rolling) |
|---|---|---|---|
| **SLI-01: API Availability** | `sum(http_requests_total{status!~"5.."}) / sum(http_requests_total)` on `payops-api` | `>= 99.99%` (Enterprise) | `0.01%` (`4.38 minutes`) |
| **SLI-02: Webhook Ingestion Durability** | `sum(paypal_webhooks_persisted_total) / sum(paypal_webhooks_valid_signature_total)` | `== 100.00%` | `0` dropped webhooks |
| **SLI-03: Agent Planning Latency (`API-01`)** | `histogram_quantile(0.95, agent_execute_duration_ms_bucket)` | `<= 2,500 ms` | `5%` of calls may exceed `2.5s` |
| **SLI-04: Dashboard Grid Render (`F-07`)** | `histogram_quantile(0.95, ag_grid_10k_rows_tti_ms)` | `<= 800 ms` | `5%` of loads |
| **SLI-05: Recovery Point / Recovery Time** | Verified via monthly automated backup restoration drill (`RUNBOOK.md`) | **`RPO <= 5 min` · `RTO <= 15 min`** | Zero failed monthly drills |

---

## 3. Financial Service Credit Remedies

If Monthly Platform Availability falls below the committed threshold for a billing month (excluding scheduled maintenance with 72-hour notice or upstream force majeure outages verified on `paypal-status.com`), merchants receive automatic invoice credits applied via PayPal Subscriptions (`F-01`, `E-09`):

| Monthly Uptime Percentage Achieved | Service Credit (% of Monthly Subscription Fee in `$` or `₹`) |
|---|---|
| `< 99.99%` down to `99.90%` *(Enterprise Tier)* | **10% Service Credit** |
| `< 99.90%` down to `99.50%` *(All Paid Tiers)* | **25% Service Credit** |
| `< 99.50%` down to `99.00%` *(All Paid Tiers)* | **50% Service Credit** |
| `< 99.00%` *(All Paid Tiers)* | **100% Service Credit** |

### Zero Double-Charge / Idempotency Indemnification (`F-06`)
Because every state-mutating PayPal call is protected by our `JunoDB`-patterned idempotency lock (`PayPal-Request-Id`) and PostgreSQL unique constraint (`E-04`), PayOps AI provides a **100% platform fee refund + direct fee reimbursement guarantee** if a software defect in PayOps AI ever causes a duplicate invoice payment capture or duplicate refund.
