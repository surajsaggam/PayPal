# Changelog

All notable changes to **PayOps AI (`PayPal Sentinel`)** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned for `v1.1.0` (Post-Hackathon 30-Day Production Pilot)
- Self-hosted 4-bit AWQ `Llama-3.1-8B-Instruct` QLoRA intent router (`M-02`) on Kubernetes (`docs/04-ai/FINE_TUNING.md`).
- Multi-region data residency deployment across GCP Mumbai (`asia-south1`) and Frankfurt (`europe-west3`) (`docs/05-ops/INFRASTRUCTURE.md`).
- Automated FEMA export purpose-code tagging (`P0102` / `P0802`) for Indian RBI PA-CB merchant cohorts (`docs/06-security-compliance/REGULATORY_SANDBOX.md`).

---

## [1.0.0] - 2026-11-05

### Added
- **Unified PayPal MCP & `@paypal/agent-toolkit` Orchestrator (`F-01`)**: Full support for all 35 official PayPal agent tools across Invoices (20), Orders (5), Disputes (3), Shipment Tracking (3), Catalog (3), Subscriptions (7), and Insights (2) (`ai/agents/paypal-mcp-config.json`).
- **Deterministic `Cosmos.AI` DSL Policy Firewall (`F-02`)**: Pre-execution rule DAG validating single-transaction caps, 24-hour `JunoDB` velocity counters, merchant allowlists, and `L0`–`L4` Karpathy Autonomy Slider gates (`API-02`, `API-03`).
- **Autonomous Smart Invoicing & AR Collections Agent (`F-03`)**: Natural-language and event-driven PayPal Invoice v2 creation (`API-04`), QR code generation, conditional early-payment discounts, and FDCPA/RBI-compliant smart reminders (`API-06`).
- **Autonomous Dispute & Chargeback Defense Agent (`F-04`, `F-10`)**: Real-time `CUSTOMER.DISPUTE.CREATED` webhook ingestion (`API-13`), carrier tracking correlation (`get_shipment_tracking`), `Gemini 1.5 Pro` multimodal POD extraction (`M-03`), `GraphSAGE + LightGBM` ONNX friendly-fraud scoring (`M-04`), and compelling-evidence compilation (`API-11`).
- **Idempotent Financial State Ledger (`F-06`)**: `JunoDB`/Redis atomic lock + `PayPal-Request-Id` enforcement guaranteeing zero duplicate captures or refunds (`R-02`).
- **Executive Financial Command Center (`F-07`, `F-08`)**: High-frequency transaction and dispute matrix built with **AG Grid Enterprise** paired with an interactive receivables and dunning scheduler built with **Bryntum Scheduler**.
- **Deterministic `APIMatic` Context Plugin Validator (`F-09`)**: Strict ISO-4217 currency precision and PayPal Server SDK schema validation (`R-03`).
- **Programmable Cross-Border `PYUSD` Settlement Bridge (`F-11`)**: Solana Token-2022 `PYUSD` invoice settlement with mandatory `Memo Required` reconciliation (`R-09`).
- **Elastic Hybrid RAG & 180-Day CERT-In/PCI Audit Observability (`F-12`)**: OpenTelemetry distributed tracing, `M-05` hybrid vector search, and SHA-256 hash-chained `ImmutableAuditLog` (`E-10`).
- **Complete `/bible` Company-Grade Documentation Suite & War-Room Intelligence**: 68+ specification files (`docs/00-overview` through `docs/08-project`), `api/openapi.yaml`, `.github/workflows/ci.yml` & `deploy.yml`, `infra/render.yaml`, `biblehackathon.md`/`.pdf`, `ideas.md`/`.pdf`, and `MAP.md`.

---

## [0.1.0] - 2026-10-06

### Added
- Initial hackathon repository structure, Devpost rules forensic survey (`research/01-facts.md`), PayPal engineering stack reconnaissance, and War-Room Council charter.
