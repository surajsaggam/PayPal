# Operational Runbook, Incident Playbooks & Demo-Day Fallback (`RUNBOOK.md`)
> Project: PayOps AI (PayPal Sentinel) · Owner: Site Reliability & Incident Response Lead · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [PRD](../01-product/PRD.md) · [Architecture](../03-engineering/ARCHITECTURE.md) · [Observability](./OBSERVABILITY.md) · [Security Architecture](../06-security-compliance/SECURITY_ARCHITECTURE.md)

## 1. Incident Severity Levels & Response SLAs

| Severity | Definition | Initial Response SLA | Mitigation Target | Escalation Path |
|---|---|---|---|---|
| **SEV-1 (Critical)** | Unauthorized financial execution, security/data breach, `ImmutableAuditLog` hash-chain break, or total outage of `payops-api` / `payops-web`. | **< 5 minutes** | **< 15 minutes** | Incident Commander + Security Lead + CTO (triggers CERT-In / DPDP / GDPR clock if breach confirmed). |
| **SEV-2 (High)** | PayPal Sandbox/Live API degradation (`HTTP 429`/`5xx`), LLM provider outage (`M-01`), or webhook queue lag `> 60 seconds`. | **< 15 minutes** | **< 30 minutes** | On-Call Backend Engineer + AI Lead (automated failover to standby model / replay cache). |
| **SEV-3 (Medium)** | Elevated `M-04` false-positive rate, Elastic search latency spike, or non-critical UI component error. | **< 1 hour** | **< 4 hours** | Component Owner during business hours. |
| **SEV-4 (Low)** | Minor cosmetic defect, documentation fix, or non-urgent analytics delay. | **< 24 hours** | Next scheduled release | Tracked in `BACKLOG.md`. |

---

## 2. Step-by-Step Playbooks for Top 10 Failure Modes

### Playbook `RB-01`: PayPal Sandbox Rate Limiting (`HTTP 429`) or Outage (`R-06`)
- **Symptoms**: Alert `ALT-03` fires; `paypal_debug_id` logs show `RATE_LIMIT_REACHED` or `INTERNAL_SERVICE_ERROR`.
- **Automated Mitigation**: `payops-api` exponential backoff (`200ms -> 500ms -> 1500ms` with jitter) + OAuth2 token caching in `JunoDB`/Redis (`F-06`) so `/v1/oauth2/token` is only called once every 6 hours.
- **Operator Action**:
  1. Verify status on `https://www.paypal-status.com/`.
  2. If occurring during a live demo or prolonged Sandbox outage, set `FF_DEMO_OFFLINE_REPLAY_FALLBACK=true` via `/api/v1/admin/flags`, seamlessly serving deterministic cryptographically signed Sandbox fixtures recorded from real runs.

### Playbook `RB-02`: Primary LLM Provider (`Anthropic Claude 3.5 Sonnet` `M-01`) Outage
- **Symptoms**: `M-01` latency `> 6,000ms` or `HTTP 529 Overloaded`.
- **Automated Mitigation**: Envoy-style LLM Gateway circuit breaker trips after 3 consecutive errors and routes traffic to hot-standby **`OpenAI GPT-4o` (`gpt-4o-2024-08-06`)** within `50ms`.
- **Operator Action**: Confirm failover in Elastic APM (`gen_ai.system == "openai"`) and verify tool-call schema validation remains `100%` via `F-09`.

### Playbook `RB-03`: Suspected Prompt Injection or Unauthorized Refund Attempt (`R-01`)
- **Symptoms**: Alert `ALT-01` fires (`detected_attack_vector != "NONE"`).
- **Automated Mitigation**: Request is blocked by `M-02` and `F-02`; workspace autonomy level automatically drops from `L3` to `L2` (requiring operator passkey approval for all mutations).
- **Operator Action**:
  1. Inspect offending payload in `ImmutableAuditLog` (`E-10`) via AG Grid Security view (`F-07`).
  2. Add attacker's `buyer_hash` to workspace blocklist in `PolicyRule` (`E-05`).
  3. Restore `L3` autonomy after confirming zero pending poisoned webhooks.

### Playbook `RB-04`: PayPal Webhook Signature Verification Failure (`R-04`)
- **Symptoms**: Alert `ALT-02` fires on `POST /api/v1/webhooks/paypal` (`API-13`).
- **Automated Mitigation**: Rejects payload with `HTTP 401 Unauthorized`; logs source IP and headers (`PAYPAL-TRANSMISSION-SIG`, `PAYPAL-CERT-URL`).
- **Operator Action**: Verify `PAYPAL_WEBHOOK_ID` matches the PayPal Developer Dashboard and confirm `PAYPAL-CERT-URL` resolves strictly to `*.paypal.com`.

### Playbook `RB-05`: Duplicate Webhook / Retry Storm (`R-02`)
- **Symptoms**: Alert `ALT-04` fires; burst of identical `webhook_event_id` or `PayPal-Request-Id` requests.
- **Automated Mitigation**: `JunoDB`/Redis atomic `SET NX EX 86400` lock (`F-06`) returns the cached initial response without re-invoking `@paypal/agent-toolkit` or charging/refunding twice.
- **Operator Action**: Verify Redis memory utilization (`<75%`) and confirm zero duplicate rows in `paypal_order_records` (`E-06`).

### Playbook `RB-06`: Runaway Agent Loop or Token Budget Exhaustion (`R-10`)
- **Symptoms**: Alert `ALT-05` fires; `AgentSession` (`E-03`) hits `max_tool_steps_per_turn = 5`.
- **Automated Mitigation**: Session terminated cleanly with `ERR_AGENT_STEP_LIMIT_EXCEEDED`; partial drafts preserved in `L1` state.
- **Operator Action**: Inspect trace in Elastic APM, refine prompt constraint, and add trace to `EVAL-DS-01`.

### Playbook `RB-07`: Friendly-Fraud False Positive Spike on Legitimate VIP Buyers (`R-05`)
- **Symptoms**: Alert `ALT-06` fires; merchant overrides `> 5%` of `M-04` recommendations via `API-02`.
- **Automated Mitigation**: Raise `PolicyRule.gnn_risk_threshold` from `0.65` to `0.80` via `API-03`.
- **Operator Action**: Export overridden cases to `EVAL-DS-04` and re-calibrate isotonic regression threshold (`FINE_TUNING.md`).

### Playbook `RB-08`: `JunoDB`/Redis Cache Node Failover
- **Symptoms**: Redis connection timeout in `payops-api`.
- **Automated Mitigation**: Fails over cleanly to PostgreSQL unique constraint enforcement (`UNIQUE (workspace_id, idempotency_key)` on `agent_tool_executions` `E-04`), preserving 100% idempotency at slightly higher latency (`+12ms`).
- **Operator Action**: Promote Render Redis replica or restart Redis service.

### Playbook `RB-09`: PostgreSQL Primary Database High CPU / Lock Contention
- **Symptoms**: Query `p95 > 150ms`.
- **Operator Action**: Check `pg_stat_activity` for long-running analytical queries; route `API-14` (`get_merchant_insights`) read queries to Elasticsearch (`F-12`) or read replica; terminate stuck connections via `pg_terminate_backend()`.

### Playbook `RB-10`: Cross-Border `PYUSD` Solana RPC Congestion (`F-11`, `R-09`)
- **Symptoms**: Solana Token-2022 confirmation latency `> 10 seconds`.
- **Automated Mitigation**: Switches RPC endpoint from primary Helius/Alchemy node to secondary RPC pool; verifies on-chain `Memo` instruction matches `invoice_id` (`E-07`) before marking invoice settled.

---

## 3. Statutory Cyber Incident & Breach Notification Procedures

| Regulatory Authority | Trigger Condition | Statutory Deadline | Reporting Procedure |
|---|---|---|---|
| **CERT-In (India)** *(Directions of April 28, 2022)* | Unauthorized access to payment/IT systems, data breach, or targeted injection/DoS attack affecting Indian systems. | **Within 6 hours** of noticing or being brought to notice. | Submit structured incident report (`incident@cert-in.org.in`) attaching exported 180-day NTP-synced ECS logs from `ImmutableAuditLog` (`E-10`). |
| **Data Protection Board of India (`DPDP Act 2023` & `Rules 2025`)** | Any personal data breach affecting Indian Data Principals. | **Immediate intimation** to DPBI + affected Data Principals; detailed report within **72 hours**. | Dispatch automated bilingual (`en`/`hi`) breach notice detailing nature of breach, consequences, mitigation steps, and Grievance Officer contact (`PRIVACY.md`). |
| **EU GDPR (`Article 33 & 34`) & UK GDPR** | Personal data breach posing risk to rights and freedoms of EU/UK individuals. | **Within 72 hours** to Supervisory Authority. | Submit DPO incident packet via national authority portal. |
| **PCI-DSS v4.0 & PayPal Partner Security** | Compromised OAuth2 client secret or webhook signing credential. | **Immediate (`< 1 hour`)** | Rotate `PAYPAL_CLIENT_SECRET` in PayPal Developer Dashboard, update Render secret group, and revoke active OAuth2 tokens. |

---

## 4. Demo-Day Emergency Plan (Zero-Failure Hackathon Judging Protocol)

During the 3-minute YouTube recording and live judging evaluations (`December 1–15, 2026`), we enforce a **3-Tier Resilience Protocol**:
1. **Tier 1 (Live PayPal Sandbox + Live Claude 3.5 Sonnet)**: Primary path executing real calls against `https://api-m.sandbox.paypal.com`.
2. **Tier 2 (Sub-50ms Deterministic Sandbox Replay Mode — `FF_DEMO_OFFLINE_REPLAY_FALLBACK`)**: If hotel/conference Wi-Fi drops or PayPal Sandbox experiences transient latency, pressing `Ctrl+Shift+D` in the AG Grid Command Center (or automatic `2,500ms` timeout failover) switches the transport adapter to pre-recorded, cryptographically signed PayPal Sandbox transactions (`scripts/seed-sandbox.ts`), preserving the exact UI, AG Grid live stream, and Bryntum timeline behavior without interruption.
3. **Tier 3 (Pre-Seeded Local Docker Bundle)**: Self-contained `docker compose up` profile that boots the entire stack offline in 20 seconds.
