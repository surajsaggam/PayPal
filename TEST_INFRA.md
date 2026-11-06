# Test Infrastructure & 4-Tier E2E Verification Architecture (`TEST_INFRA.md`)

> Project: PayPal AI Hackathon War-Room Council & Complete `/bible` Specification Suite (`PS-01: PayOps AI`)
> Track: E2E Testing Track — Requirement-Driven Opaque-Box Verification Suite
> Test Runner: `s:\PayPal\tests\verify_deliverables.py`
> Authoritative Inputs: `s:\PayPal\.agents\teamwork\ORIGINAL_REQUEST.md`, `s:\PayPal\PROJECT.md`, `s:\PayPal\.agents\teamwork\teamwork_spec_miner_survey_3\analysis.md`

---

## 1. Architecture Overview

This document specifies the automated opaque-box End-to-End (E2E) verification infrastructure for the PayPal AI Hackathon deliverables in `s:\PayPal`. The test suite (`s:\PayPal\tests\verify_deliverables.py`) is built strictly against the user requirements (`R1`–`R4` and Acceptance Criteria `AC1`–`AC4` in `ORIGINAL_REQUEST.md`), the 24-feature inventory and interface contracts in `PROJECT.md`, and the skill specifications (`war-room-council` and `bible`).

The verification suite is organized into **4 progressive tiers**:

| Tier | Name | Scope & Purpose | Minimum Checks | Gate Criterion |
|------|------|-----------------|---------------:|----------------|
| **Tier 1** | **Feature Coverage** | Validates existence, substantive size, and domain-specific content across all **24 inventoried features** (`F1`–`F24` in `PROJECT.md`) and Requirements `R1`–`R4` (`>= 5` distinct checks per feature). | **120+ checks** (5 per feature × 24 features) | 100% pass |
| **Tier 2** | **Boundary, Format & Anti-Placeholder Gate** | Validates binary PDF headers (`%PDF-`), `%%EOF` trailers, and file size thresholds (`> 50 KB`), strict zero-placeholder enforcement (`\b(TODO|TBD)\b\|coming soon`), mandatory `/bible` document header blocks (`# <Title>` + `> Project:`), minimum substantive doc sizes (`> 800 bytes`), OpenAPI 3.1 structure (`api/openapi.yaml`), and GitHub Actions workflow syntax (`.github/workflows/*.yml`). | **15+ aggregate & per-file boundary gates** | 100% pass (0 placeholders) |
| **Tier 3** | **Cross-Feature & Cross-Document ID Consistency** | Validates that canonical Single-Source-of-Truth IDs (`F-01`..`F-12`, `US-01`..`US-16`, `E-01`..`E-10`, `API-01`..`API-14`, `M-01`..`M-05`, `R-01`..`R-12`, `ADR-0001`..`ADR-0005`) and Stage 1 ↔ Stage 2 contracts (`D1`..`D5` winnability scores, `PS-01` / `PayOps AI` top choice, `PS-06` / `ChargebackZero GNN` dark horse) match across all referencing documents. | **20+ cross-document matrix checks** | 100% ID parity |
| **Tier 4** | **Real-World Judge & Developer Walkthrough Scenarios** | Simulates four realistic stakeholder workflows: (1) New Developer/Judge navigating every relative link in `MAP.md`, (2) Devpost Jury evaluating `PITCH.md` across all 13 named judges, (3) Engineering Team executing the 48-hour build (`H01`..`H48`) across `HACKATHON_PLAN.md` and `BACKLOG.md`, and (4) AI/Payments Engineer integrating `@paypal/agent-toolkit` & PayPal MCP tools across `PROMPTS.md` and `INTEGRATIONS.md`. | **12+ end-to-end scenario checks** | 100% walkthrough completion |

---

## 2. Complete 24-Feature Inventory Mapping (`PROJECT.md` → `verify_deliverables.py`)

Every feature in `PROJECT.md` § Feature Inventory is mapped to a dedicated verification function in `s:\PayPal\tests\verify_deliverables.py` with **at least 5 independent assertions**:

| Feature # | Milestone | Feature Name | Requirement | Primary Target Files | Tier 1 Verification Checks (>=5 per feature) |
|----------:|-----------|--------------|-------------|----------------------|----------------------------------------------|
| **1** | `M1` | Devpost Hackathon Facts & Rules Extraction | `R1`, `AC1` | `research/01-facts.md`, `biblehackathon.md` (Part 1) | (1.1) `research/01-facts.md` exists & >500B; (1.2) `biblehackathon.md` exists & >10KB; (1.3) `# Part 1` heading & hackathon title present; (1.4) `$69,750` prize pool & 15 prize categories documented; (1.5) 5×20% judging criteria & Oct 1 – Nov 12, 2026 schedule documented. |
| **2** | `M1` | PayPal Engineering Tools, Frameworks & Infra Forensics | `R1`, `AC1` | `biblehackathon.md` (Part 1) | (2.1) Core service frameworks (`Raptor`, `Spring Boot`, `Kraken`); (2.2) Data & event backbone (`JunoDB`, `Kafka`, `RocksDB`/`Aerospike`); (2.3) AI & fraud engines (`Cosmos.AI`, `Simility`, `GNN`/`Real-Time Graph`); (2.4) Agentic stack (`@paypal/agent-toolkit`, `MCP`); (2.5) Commerce rails (`Orders v2`, `Fastlane`, `Braintree`, `Venmo`, `PYUSD`). |
| **3** | `M1` | Organisers, CEOs & Executive Leadership Profiles (`Track A`) | `R1`, `R2`, `AC1` | `research/A-organisers.md`, `biblehackathon.md` (Part 2) | (3.1) `research/A-organisers.md` exists & >500B; (3.2) `# Part 2` heading in `biblehackathon.md`; (3.3) CEOs `Alex Chriss` & `Dan Schulman` profiled; (3.4) Tech leaders `Srini Venkatesan`, `Archie Deskus`, `Prakhar Mehrotra` profiled; (3.5) Business leaders `Aaron J. Webster`, `Michelle Gill`, `Diego Scotti`, `Suzan Kereere`, `Jose Fernandez da Ponte` profiled. |
| **4** | `M1` | 10 Official Ecosystem Sponsors Analysis (`Track B`) | `R1`, `AC1` | `research/B-sponsors.md`, `biblehackathon.md` (Part 2) | (4.1) `research/B-sponsors.md` exists & >500B; (4.2) `AG Grid` & `APIMatic` analyzed; (4.3) `Astropods` & `Bryntum` analyzed; (4.4) `Channel3`, `Elastic`, & `KERNEL` analyzed; (4.5) `Postman`, `Render`, & `Zapier` analyzed. |
| **5** | `M1` | 13 Named Devpost Judges & Judge Heat-Map (`Track C`) | `R1`, `AC1` | `research/C-judges.md`, `biblehackathon.md` (Part 2) | (5.1) `research/C-judges.md` exists & >500B; (5.2) PayPal judges `Jo Franchetti`, `Eddie Jaoude`, `Marco Podien`; (5.3) PayPal judges `Karthik Ravi`, `Himraj Singh`, `Nathaniel Olson`; (5.4) Sponsor judges `Sylwia Vargas`, `Ameer Hassan`, `Mats Bryntse`, `Ignacio Valdez`; (5.5) Sponsor judges `Carly Richmond`, `Pooja Mistry`, `Shifra Williams` + Judge Heat-Map table. |
| **6** | `M1` | Why This Hackathon, Why Now & Geopolitical/Industry Triggers (`Track D`) | `R1`, `AC1` | `research/D-why-now.md`, `biblehackathon.md` (Part 3) | (6.1) `research/D-why-now.md` exists & >500B; (6.2) `# Part 3` heading in `biblehackathon.md`; (6.3) Agentic commerce (`MCP`) & checkout conversion (`Fastlane`) triggers; (6.4) Friendly-fraud/disputes & stablecoin (`PYUSD`) settlement triggers; (6.5) Global commerce & India DPI/cross-border triggers. |
| **7** | `M1` | Patrick Jane Synthesis: 7+ Connected Dots, Hidden Criteria, Landmines & 80% Trap (`Track F`) | `R1`, `AC1` | `research/F-connect-the-dots.md`, `biblehackathon.md` (Part 4) | (7.1) `research/F-connect-the-dots.md` exists & >500B; (7.2) `# Part 4` heading in `biblehackathon.md`; (7.3) At least 7 connected dots documented; (7.4) `Hidden evaluation criteria` & `Landmines` sections present; (7.5) `80% trap` analysis present. |
| **8** | `M1` | Competition Forecast, Prior Art & 5-Factor Domain Winnability Index (`Track E`) | `R1`, `R3`, `AC1` | `research/E-competition.md`, `biblehackathon.md` (Part 5) | (8.1) `research/E-competition.md` exists & >500B; (8.2) `# Part 5` heading in `biblehackathon.md`; (8.3) Competition forecast (`25,000`) & prior work counts; (8.4) All 5 strategic domains (`D1`..`D5`) ranked; (8.5) Canonical winnability scores (`9.07`, `9.05`, `8.79`, `8.37`, `8.33`) present. |
| **9** | `M1` | Extended War-Room Council Roster & Persona Dossiers (PayPal Mafia + Leadership + Core 17) | `R2`, `AC2` | `war-room/roster-additions.md`, `biblehackathon.md` (Part 6) | (9.1) `war-room/roster-additions.md` exists & >1KB; (9.2) 6-field persona dossier structure (`Rise`, `How they decide`, `Asks`, `Attacks`, `Voice`, `Blind spot`); (9.3) `# Part 6` & `# Sources` in `biblehackathon.md`; (9.4) Named PayPal Mafia (`Peter Thiel`, `Elon Musk`, `Reid Hoffman`, `Max Levchin`, `David Sacks`, `Roelof Botha`, `Keith Rabois`) present; (9.5) Multi-round debate transcript (`**SPEAKER:**` + `[S#]`) in `biblehackathon.md`. |
| **10** | `M1` | `biblehackathon.pdf` Styled A4 PDF Generation | `R3`, `AC1` | `biblehackathon.pdf` | (10.1) File exists at `s:\PayPal\biblehackathon.pdf`; (10.2) Size > 50 KB (`51,200` bytes); (10.3) Starts with `%PDF-` magic bytes; (10.4) Contains valid `%%EOF` trailer; (10.5) Contains multiple rendered `/Type /Page` objects. |
| **11** | `M2` | Phase 2 Deep Research Across 5 Strategic PayPal AI Domains | `R1`, `R3` | `research/domains/D1.md`..`D5.md` | (11.1) `D1.md` exists & >800B; (11.2) `D2.md` exists & >800B; (11.3) `D3.md` exists & >800B; (11.4) `D4.md` & `D5.md` exist & >800B each; (11.5) Domain files cover pain map, urgency, prior art, 3 gap buckets (`Exists-but-weak`, `Doesn't exist`, `Exists abroad`), rails/APIs, tech frontier, and seed ideas. |
| **12** | `M2` | Multi-Round War-Room Council Debates (`Rounds 0–5`) per Domain | `R2`, `AC2` | `war-room/D1.md`..`D5.md`, `ideas.md` | (12.1) `war-room/D1.md`..`D5.md` exist & >800B each; (12.2) `ideas.md` contains Rounds 0–5 war-room transcripts; (12.3) `ideas.md` includes all 7 core PayPal Mafia members (`Thiel`, `Musk`, `Hoffman`, `Levchin`, `Sacks`, `Botha`, `Rabois`); (12.4) `ideas.md` includes PayPal CEOs & executives (`Alex Chriss`, `Dan Schulman`, `Srini Venkatesan`, `Prakhar Mehrotra`, `Aaron J. Webster`, `Michelle Gill`, `Diego Scotti`, `Suzan Kereere`, `Jose Fernandez da Ponte`); (12.5) `ideas.md` has >=25 cited speaker turns (`**SPEAKER:** ... [S#]`). |
| **13** | `M2` | 25 Ranked Selectable Problem Statements (`PS-01` to `PS-25`) & Technical Approaches | `R3`, `AC3` | `ideas.md` | (13.1) `ideas.md` exists & >15KB; (13.2) `# Part 0` with Domain Winnability, `#1` pick `PS-01` (`PayOps AI`), and dark horse `PS-06` (`ChargebackZero`); (13.3) All 25 IDs `PS-01`..`PS-25` present; (13.4) Required template sections (`The pain`, `Why now`, `The demo moment`, `30-second explanation`, `Council jurisdiction`, `Tech stack`, `Implementation sketch`, `Score breakdown`); (13.5) Numbered `# Sources` section present. |
| **14** | `M2` | `ideas.pdf` Styled A4 PDF Generation | `R3`, `AC3` | `ideas.pdf` | (14.1) File exists at `s:\PayPal\ideas.pdf`; (14.2) Size > 50 KB (`51,200` bytes); (14.3) Starts with `%PDF-` magic bytes; (14.4) Contains valid `%%EOF` trailer; (14.5) Contains multiple rendered `/Type /Page` objects. |
| **15** | `M3` | `/bible` Group 1: `docs/00-overview/` (4 Files) | `R4`, `AC4` | `PROJECT_BRIEF.md`, `VISION.md`, `PITCH.md`, `HACKATHON_PLAN.md` | (15.1) `PROJECT_BRIEF.md` exists (>800B) & defines `PS-01` (`PayOps AI`) + canonical ID groups; (15.2) `VISION.md` exists (>800B) with North-Star & 1/5/10-yr horizon; (15.3) `PITCH.md` exists (>800B) with 3-min script & judge Q&A bank; (15.4) `HACKATHON_PLAN.md` exists (>800B) with H01–H48 plan & Devpost rubric checklist; (15.5) MVP vs production distinction documented. |
| **16** | `M3` | `/bible` Group 2: `docs/01-product/` (8 Files) | `R4`, `AC4` | `PRD.md`, `PERSONAS.md`, `USER_JOURNEYS.md`, `USER_STORIES.md`, `FEATURES.md`, `ROADMAP.md`, `METRICS.md`, `COMPETITIVE_ANALYSIS.md` | (16.1) `PRD.md` & `PERSONAS.md` exist (>800B); (16.2) `USER_JOURNEYS.md` & `USER_STORIES.md` exist (>800B) with Gherkin `Given`/`When`/`Then`; (16.3) `FEATURES.md` & `ROADMAP.md` exist (>800B) with MoSCoW prioritization; (16.4) `METRICS.md` & `COMPETITIVE_ANALYSIS.md` exist (>800B) with AARRR/North Star & moat analysis; (16.5) Mermaid journey diagrams present in `USER_JOURNEYS.md`. |
| **17** | `M3` | `/bible` Group 3: `docs/02-design/` (4 Files) | `R4`, `AC4` | `DESIGN_SYSTEM.md`, `UI_SPEC.md`, `ACCESSIBILITY.md`, `LOCALIZATION.md` | (17.1) `DESIGN_SYSTEM.md` exists (>800B) with design tokens; (17.2) `UI_SPEC.md` exists (>800B) with ASCII wireframes, `AG Grid`, `Bryntum`, & 5 UI states (`empty`/`loading`/`error`/`offline`/`success`); (17.3) `ACCESSIBILITY.md` exists (>800B) covering `WCAG 2.2`; (17.4) `LOCALIZATION.md` exists (>800B) covering `$`, `₹`, `PYUSD`; (17.5) Header metadata compliance across all 4 files. |
| **18** | `M3` | `/bible` Group 4: `docs/03-engineering/` + `adr/` + `api/openapi.yaml` (20 Files) | `R4`, `AC4` | 13 engineering docs, `ADR-0000`..`ADR-0005`, `api/openapi.yaml` | (18.1) All 13 core engineering docs exist & >800B; (18.2) All 6 ADR files (`ADR-0000`..`ADR-0005`) exist & >800B; (18.3) C4/ER Mermaid diagrams & PayPal patterns (`JunoDB`, `Cosmos.AI`, `PayPal-Request-Id`) in `ARCHITECTURE.md` & `DATA_MODEL.md`; (18.4) PayPal & sponsor integrations in `INTEGRATIONS.md`; (18.5) `api/openapi.yaml` exists (>1.5KB) with OpenAPI 3.1 & 14 endpoints. |
| **19** | `M4` | `/bible` Group 5: `docs/04-ai/` (6 Files) | `R4`, `AC4` | `MODELS.md`, `PROMPTS.md`, `AI_EVALS.md`, `DATA_PIPELINE.md`, `RESPONSIBLE_AI.md`, `FINE_TUNING.md` | (19.1) `MODELS.md` & `PROMPTS.md` exist (>800B); (19.2) `AI_EVALS.md` & `DATA_PIPELINE.md` exist (>800B); (19.3) `RESPONSIBLE_AI.md` & `FINE_TUNING.md` exist (>800B); (19.4) `MODELS.md` covers `M-01`..`M-05` with `$`/`₹` cost & latency; (19.5) `RESPONSIBLE_AI.md` covers autonomy slider, guardrails, `NIST`, `EU AI Act`, & `IndiaAI`/`MeitY`. |
| **20** | `M4` | `/bible` Group 6: `docs/05-ops/` + `.github/workflows/` (9 Files) | `R4`, `AC4` | 7 ops docs + `.github/workflows/ci.yml` & `deploy.yml` | (20.1) All 7 ops docs (`CICD.md`, `INFRASTRUCTURE.md`, `DEPLOYMENT.md`, `OBSERVABILITY.md`, `RUNBOOK.md`, `COST.md`, `SLA.md`) exist & >800B; (20.2) `.github/workflows/ci.yml` & `deploy.yml` exist & >200B; (20.3) `COST.md` covers 100 / 10k / 1M user scales in `$` & `₹`; (20.4) `RUNBOOK.md` covers failure playbooks & demo fallback; (20.5) `OBSERVABILITY.md` covers `Elastic`/`OpenTelemetry` & 180-day audit retention. |
| **21** | `M4` | `/bible` Group 7: `docs/06-security-compliance/` (6 Files) | `R4`, `AC4` | `SECURITY_ARCHITECTURE.md`, `THREAT_MODEL.md`, `PRIVACY.md`, `COMPLIANCE.md`, `RISK_REGISTER.md`, `REGULATORY_SANDBOX.md` | (21.1) `SECURITY_ARCHITECTURE.md` & `THREAT_MODEL.md` exist (>800B); (21.2) `PRIVACY.md` & `COMPLIANCE.md` exist (>800B); (21.3) `RISK_REGISTER.md` & `REGULATORY_SANDBOX.md` exist (>800B); (21.4) `OWASP`, `STRIDE`, `PCI-DSS`, & webhook HMAC verification documented; (21.5) `DPDP`, `GDPR`, `FinCEN`, `RBI`, & `R-01`..`R-12` documented. |
| **22** | `M4` | `/bible` Group 8 & 9: `docs/07-business/` (5 Files) & `docs/08-project/` (3 Files) | `R4`, `AC4` | `BUSINESS_MODEL.md`, `GTM.md`, `FINANCIALS.md`, `IMPACT.md`, `PROCUREMENT.md`, `BACKLOG.md`, `TEAM.md`, `GLOSSARY.md` | (22.1) All 5 business docs exist & >800B; (22.2) All 3 project docs exist & >800B; (22.3) Lean Canvas, unit economics (`CAC`/`LTV`), & 3-year projections in `$`/`₹`; (22.4) `RACI` matrix in `TEAM.md` & FinTech glossary in `GLOSSARY.md`; (22.5) `BACKLOG.md` links tickets to `F-xx`, `US-xx`, & `H01`–`H48`. |
| **23** | `M4` | `/bible` Group 0 & 11: Root Repository Files (8 Files) + Code Skeleton Directories | `R4`, `AC4` | `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `.env.example`, `MAP.md`, skeleton dirs | (23.1) `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `SECURITY.md` exist & non-empty; (23.2) `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `.env.example`, `MAP.md` exist & non-empty; (23.3) `.env.example` contains PayPal & AI env var templates without live secrets; (23.4) `MAP.md` contains directory tree, lookup table, Mermaid dependency graph, & 4 reading orders; (23.5) Code skeleton directories (`apps/`, `services/`, `packages/`, `ai/`, `infra/`, `api/`, `scripts/`, `tests/`) exist & are non-empty. |
| **24** | `E2E` | Automated Opaque-Box E2E Verification Suite & Readiness | `R1`–`R4`, `AC1`–`AC4` | `TEST_INFRA.md`, `TEST_READY.md`, `tests/verify_deliverables.py` | (24.1) `TEST_INFRA.md` exists & >1KB; (24.2) `TEST_READY.md` exists & >500B; (24.3) `tests/verify_deliverables.py` exists & passes `py_compile`; (24.4) Supports `--tier 1..4` CLI flags; (24.5) Executes >=5 checks for every inventoried feature. |

---

## 3. Canonical ID & Contract Matrix Enforced by Tier 3

`verify_deliverables.py --tier 3` enforces cross-document referential integrity across all Stage 1 and Stage 2 deliverables:

1. **Stage 1 ↔ Stage 2 Domain & Idea Contract**:
   - Strategic Domains: `D1` (`9.07`), `D2` (`9.05`), `D3` (`8.79`), `D5` (`8.37`), `D4` (`8.33`) consistent between `biblehackathon.md` and `ideas.md`.
   - Top Choice: `PS-01` (`PayOps AI`) consistent across `biblehackathon.md`, `ideas.md`, `PROJECT_BRIEF.md`, `PRD.md`, `README.md`, and `MAP.md`.
   - Dark Horse: `PS-06` (`ChargebackZero`) consistent between `biblehackathon.md` and `ideas.md`.
2. **Stage 2 `/bible` Canonical ID Registry**:
   - **Features (`F-01`..`F-12`)**: Present in `PROJECT_BRIEF.md`, `PRD.md`, `FEATURES.md`, `USER_STORIES.md`, and `BACKLOG.md`.
   - **User Stories (`US-01`..`US-16`)**: Present in `PROJECT_BRIEF.md`, `PRD.md`, `USER_STORIES.md`, and `BACKLOG.md`.
   - **Data Entities (`E-01`..`E-10`)**: Present in `PROJECT_BRIEF.md` and `DATA_MODEL.md`.
   - **API Endpoints (`API-01`..`API-14`)**: Present in `PROJECT_BRIEF.md`, `API_SPEC.md`, and `api/openapi.yaml` (canonical REST paths).
   - **AI Models (`M-01`..`M-05`)**: Present in `PROJECT_BRIEF.md` and `MODELS.md`.
   - **Risks (`R-01`..`R-12`)**: Present in `PROJECT_BRIEF.md` and `RISK_REGISTER.md`.
   - **Architecture Decision Records (`ADR-0001`..`ADR-0005`)**: Present in `PROJECT_BRIEF.md`, `ARCHITECTURE.md`, and as files in `docs/03-engineering/adr/`.

---

## 4. Running the Verification Suite

```powershell
# Run all 4 tiers (default)
python "s:\PayPal\tests\verify_deliverables.py"

# Run a single tier independently
python "s:\PayPal\tests\verify_deliverables.py" --tier 1
python "s:\PayPal\tests\verify_deliverables.py" --tier 2
python "s:\PayPal\tests\verify_deliverables.py" --tier 3
python "s:\PayPal\tests\verify_deliverables.py" --tier 4

# Syntax-check the test runner without executing deliverable assertions
python -m py_compile "s:\PayPal\tests\verify_deliverables.py"
```

- **Exit Code `0`**: All checks in the requested tier(s) passed.
- **Exit Code `1`**: One or more checks failed; detailed per-check diagnostic output is printed to stdout.
