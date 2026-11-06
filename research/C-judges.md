# Track C Reconnaissance — Judges, Jury Psychology & 3-Minute Heat-Map (`C-judges.md`)

> **Forensic Scope**: Psychological, technical, and career profiles of all **13 official Devpost judges** (6 PayPal judges + 7 Sponsor judges) plus supplementary PayPal technical evaluator **Ishan Shah** [S1], culminating in the **3-Minute Judge Heat-Map** used to engineer our product architecture and demo video.

---

## 1. The 6 Official PayPal Judges (+ 1 Supplementary Technical Reviewer)

### 1.1 Jo Franchetti — *Developer Advocate, PayPal* [S1]
- **Career Path & Background**: Veteran web developer, software engineer, and Developer Advocate at PayPal; previously Developer Advocate at **Ably** (real-time pub/sub messaging), **Samsung Internet**, and **Deno** [S1, S14]. Co-hosted Official Webinar 1 (*"Start building with PayPal: Set Up PayPal's Sandbox and AI Toolkit From Scratch"*, Oct 6, 2026) [S14].
- **What She Rewards**: Clean modern web standards, real-time event-driven architectures (PayPal Webhooks updating UI state live without page refreshes), accessible and intuitive frontend design (**Design 20%**), and authentic live demos that actually hit the PayPal Sandbox [S14].
- **Pet Peeve**: Fake/mocked payment buttons that just show a `setTimeout` spinner without creating a real PayPal Sandbox resource, or cluttered, inaccessible UIs.
- **Likely Question**: *"When the PayPal Sandbox webhook fires for an invoice payment or dispute update, how does your application verify and propagate that event to the operator UI in real time?"*

### 1.2 Eddie Jaoude — *Developer Advocate, PayPal* [S1]
- **Career Path & Background**: Globally recognized open-source leader (**GitHub Star**, founder of **EddieHub**, 100,000+ developer community, full-stack TypeScript/Node.js specialist) and Developer Advocate at PayPal [S1, S14]. Co-hosted Official Webinar 1 on Oct 6, 2026 [S14].
- **What He Rewards**: **Impeccable open-source repository hygiene** — a crystal-clear `README.md` with architecture diagrams, an explicit **MIT or Apache-2.0 `LICENSE` file visible in the GitHub About section** (which he emphasized on the kickoff stream as a strict compliance gate), clean TypeScript typing, `.env.example`, `CONTRIBUTING.md`, and zero leaked secrets [S1, S14].
- **Pet Peeve**: Repos missing a license in the GitHub About box, committed `.env` files, single-commit code dumps with no documentation, or broken local setup steps.
- **Likely Question**: *"Can an external developer clone your GitHub repository, copy `.env.example`, and run your PayPal MCP and Sandbox integration in under five minutes?"*

### 1.3 Marco Podien — *Developer Advocate, PayPal* [S1]
- **Career Path & Background**: Europe-based Developer Advocate at PayPal; regular speaker at **PayPal DevDay**, WeAreDevelopers, and host of both the Oct 6 and Oct 13 (*EMEA/APAC*) *"Start building with PayPal"* live onboarding sessions [S1, S14, S17].
- **What He Rewards**: End-to-end mastery of the **PayPal Developer Platform** — combining `@paypal/agent-toolkit`, the **PayPal MCP Server**, **PayPal Server SDK**, and multi-endpoint REST APIs (`Orders v2`, `Invoicing v2`, `Subscriptions`, `Disputes`, `Shipment Tracking`) into a frictionless merchant and buyer journey [S14, S17].
- **Pet Peeve**: Treating PayPal as an afterthought (e.g., building a generic AI app and slapping a single static donation link at the bottom).
- **Likely Question**: *"How many distinct `@paypal/agent-toolkit` or PayPal REST v2 workflows does your agent orchestrate, and how do they work together across the merchant lifecycle?"*

### 1.4 Karthik Ravi — *Software Engineer, PayPal* [S1]
- **Career Path & Background**: Infrastructure and AI platform Software Engineer at PayPal, known for engineering talks on operating planet-scale **Kubernetes** clusters and scaling distributed Jupyter/AI compute workloads inside PayPal [S1].
- **What He Rewards**: **Technological Implementation (20%)** depth — resilient backend systems, idempotency (`PayPal-Request-Id` / `JunoDB`-style state locking), containerization, asynchronous worker queues, p99 latency awareness, and production-grade error handling when external APIs throttle or time out [S1, S20].
- **Pet Peeve**: Fragile single-file scripts that crash on network retries or risk double-charging/double-refunding a customer when an LLM retries a tool call.
- **Likely Question**: *"What happens if the LLM agent retries a `pay_order` or `create_refund` tool call due to a network timeout — how does your state layer guarantee strict idempotency?"*

### 1.5 Himraj Singh — *Engineering Manager, PayPal* [S1]
- **Career Path & Background**: Software Engineering Manager at PayPal leading **Enterprise AI, Trust, Security, and Developer Ecosystems**; conference speaker (including WeAreDevelopers) on enterprise AI governance, security boundaries, and safe agent execution [S1].
- **What He Rewards**: **Deterministic AI Guardrails & Financial Safety** — prompt-injection defenses, OAuth2 token isolation (keeping raw `PAYPAL_CLIENT_SECRET` out of LLM context), pre-execution policy rules (`Cosmos.AI` Decision DSL pattern), human-in-the-loop RBAC approval gates for high-value actions, and tamper-evident audit logs [S1, S26].
- **Pet Peeve**: Unbounded autonomous agents that can be tricked via indirect prompt injection (e.g., a malicious string inside an invoice memo or buyer dispute comment) into issuing unauthorized refunds or payouts.
- **Likely Question**: *"If a malicious buyer embeds a prompt injection inside a PayPal dispute message asking the agent to auto-accept their claim and refund $5,000, what deterministic control stops it?"*

### 1.6 Nathaniel Olson — *Senior Product Manager, PayPal* [S1]
- **Career Path & Background**: Senior Product Manager for **Developer Experience, PayPal Server SDKs, Agentic Commerce, and AI Context Tooling** at PayPal [S1, S39]. Speaker at PayPal DevDay and Nordic APIs on *"Deterministic API Context for AI Coding Assistants"*, **APIMatic Context Plugins**, **PayPal MCP Server**, and **`@paypal/agent-toolkit`** [S15, S39].
- **What He Rewards**: Projects that directly validate his flagship product thesis: combining **`@paypal/agent-toolkit` + PayPal MCP Server + APIMatic Context Plugins + PayPal Server SDK** to build high-impact **Agentic Commerce** workflows where AI agents safely discover, invoice, pay, track, and reconcile without hallucinating API schemas [S15, S18, S39].
- **Pet Peeve**: Hand-rolled, brittle `fetch()` calls to deprecated PayPal v1 endpoints when official MCP tools, `@paypal/agent-toolkit`, and APIMatic-validated Server SDKs exist.
- **Likely Question**: *"How did you leverage `@paypal/agent-toolkit`, the PayPal MCP Server, and APIMatic Context Plugins to eliminate schema hallucinations and make your agentic commerce workflow deterministic?"*

### 1.7 Ishan Shah *(Supplementary PayPal Evaluator)* — *Staff Software Engineer, PayPal* [S1]
- **Background & Focus**: Staff Software Engineer at PayPal involved in technical architecture and baseline screening; evaluates code modularity, API contract cleanliness, and real vs. mocked execution paths [S1].

---

## 2. The 7 Official Sponsor Judges

### 2.1 Sylwia Vargas — *Senior Technical Community Manager, AG Grid (and Bryntum)* [S1]
- **Background**: Senior Technical Community Manager at **AG Grid** and **Bryntum**; former DevRel at StackBlitz, Prisma, and Draftbit; co-organizer of Official Webinar 3 (*"Build a payments dashboard without building a dashboard"*, Oct 12, 2026) [S1, S4, S16].
- **What She Rewards**: Rich enterprise financial interfaces built with **AG Grid** (custom cell renderers, status badges, row grouping, live streaming updates, integrated financial charts, AI natural-language filter bar) that turn complex PayPal transaction/dispute data into an instant executive control plane [S4, S16].
- **Pet Peeve**: Installing `ag-grid-react` only to display 4 unformatted text columns with default styling.

### 2.2 Ameer Hassan — *Co-Founder, APIMatic* [S1]
- **Background**: Co-Founder and VP of Strategy at **APIMatic**; architect of the PayPal–APIMatic partnership powering the **PayPal Server SDK** and **APIMatic Context Plugins** (Official Webinar 2, Oct 7, 2026) [S1, S5, S15].
- **What He Rewards**: Explicit, documented use of **APIMatic Context Plugins** (MCP) and the strongly-typed **PayPal Server SDK** to prevent LLM hallucinations across complex PayPal API payloads, with clear proof in the repo and video [S5, S15].
- **Pet Peeve**: Claiming the APIMatic prize without actually using APIMatic Context Plugins or the PayPal Server SDK in the codebase.

### 2.3 Mats Bryntse — *Founder & CEO, Bryntum* [S1]
- **Background**: Founder and CEO of **Bryntum**, creator of enterprise JavaScript scheduling, Gantt, and calendar suites [S1, S7].
- **What He Rewards**: Interactive time-based financial orchestration using **Bryntum Scheduler Pro / Gantt / Calendar** — where visual timeline actions (dragging a dunning milestone, adjusting a recurring invoice series, or scheduling a payout window) directly invoke PayPal APIs [S7].
- **Pet Peeve**: Static, read-only timelines disconnected from PayPal backend actions.

### 2.4 Ignacio Valdez Bicard — *Founding Engineer, Channel3* [S1]
- **Background**: Founding Engineer at **Channel3**, building AI-native product catalog and shopping infrastructure [S1, S8].
- **What He Rewards**: Agentic shopping and procurement flows that query **Channel3's API / MCP server** for structured product data and convert discovery directly into a PayPal Order v2 checkout [S8].
- **Pet Peeve**: Hardcoded JSON product arrays instead of live catalog discovery.

### 2.5 Carly Richmond — *Senior Manager, Developer Advocacy, Elastic* [S1]
- **Background**: Senior Manager of Developer Advocacy at **Elastic**; former enterprise software engineer in investment banking; expert in **Elasticsearch hybrid RAG, vector search, and OpenTelemetry AI observability** [S1, S9].
- **What She Rewards**: Grounding financial AI agents in verifiable merchant policies/contracts via **Elastic hybrid search** (`M-05`) and logging every agent step and PayPal API call into an observable, searchable audit index (`E-10`) [S9].
- **Pet Peeve**: Black-box LLM agents with zero observability, zero trace IDs, and ungrounded policy answers.

### 2.6 Pooja Mistry — *Senior Developer Advocate, Postman* [S1]
- **Background**: Senior Developer Advocate at **Postman**; author and speaker on API-first engineering, **PayPal Public Postman Collections**, webhook testing, and AI agent API orchestration [S1, S11].
- **What She Rewards**: Clean REST/webhook architecture backed by a valid **OpenAPI 3.1 spec (`api/openapi.yaml`)** and an exportable Postman Collection that lets judges test every endpoint effortlessly [S11].
- **Pet Peeve**: Undocumented backend routes or unverified webhook endpoints.

### 2.7 Shifra Williams — *Founding Developer Relations Engineer, Render* [S1]
- **Background**: Founding DevRel Engineer at **Render** [S1, S12].
- **What She Rewards**: Cloud-native multi-service deployments on **Render** using Infrastructure-as-Code (`render.yaml` Blueprint), Managed PostgreSQL, Redis, and durable **Render Workflows** for background AI agent tasks, accessible via a fast, live `*.onrender.com` URL [S12].
- **Pet Peeve**: Submissions with broken demo links or "works on my localhost only" setups.

---

## 3. Master 13-Judge Heat-Map (What Each Judge Wants to See in < 3 Minutes)

| # | Judge | Affiliation & Role | Primary Rubric Lens | What They Reward Most | Top Pet Peeve (Landmine) | Likely Question | Our Pitch & Demo Angle (`PS-01: PayOps AI`) |
|---|---|---|---|---|---|---|---|
| 1 | **Jo Franchetti** | PayPal — Developer Advocate | Design (20%) & Presentation (20%) | Real-time PayPal Webhooks updating clean, accessible web UI live | Mocked `setTimeout` checkout spinners; clunky UI | *"How do PayPal webhooks update the UI in real time?"* | Show live Sandbox webhook (`INVOICING.*` / `CUSTOMER.DISPUTE.*`) streaming via SSE into the dashboard at 0:40. |
| 2 | **Eddie Jaoude** | PayPal — Developer Advocate | Tech Implementation (20%) & Repo Gate | MIT/Apache-2.0 license in GitHub About box, clean README, TypeScript | Missing license in About box; hardcoded keys; messy repo | *"Cananyone clone and run this in 5 minutes?"* | Highlight MIT License in GitHub About section, `MAP.md`, `.env.example`, and 1-command setup in video & README. |
| 3 | **Marco Podien** | PayPal — Developer Advocate | Tech Implementation (20%) & Impact (20%) | Multi-endpoint PayPal Sandbox flows (`Orders v2`, `Invoicing v2`, `Disputes`, `Tracking`) | Single-button PayPal wrapper with shallow integration | *"Which PayPal APIs and Agent Toolkit actions work together here?"* | Demonstrate all 35 `@paypal/agent-toolkit` tools orchestrated across Invoicing, Orders, Disputes, and Tracking. |
| 4 | **Karthik Ravi** | PayPal — Software Engineer | Tech Implementation (20%) | Distributed systems rigor, `PayPal-Request-Id` idempotency, fault tolerance | Fragile backend that double-charges on LLM retry | *"How do you prevent duplicate charges or refunds on agent retries?"* | Showcase our `JunoDB`-patterned idempotent state store (`E-04`) locking every `PayPal-Request-Id` with quorum audit logs. |
| 5 | **Himraj Singh** | PayPal — Engineering Manager | Tech Implementation (20%) & Impact (20%) | Enterprise AI trust, prompt-injection defense, `Cosmos.AI`-style policy guardrails | Unbounded AI agents with raw access to move money | *"What stops a prompt injection in an invoice/dispute from draining funds?"* | Demo a live prompt-injection attack inside a dispute message getting blocked in <15ms by our deterministic DSL Policy Firewall (`F-02`). |
| 6 | **Nathaniel Olson** | PayPal — Senior Product Manager | Innovation (20%) & Tech Implementation (20%) | `@paypal/agent-toolkit` + PayPal MCP Server + APIMatic Context Plugins | Hallucinated legacy PayPal v1 endpoints; ignoring MCP | *"How did MCP and APIMatic Context Plugins improve determinism?"* | Show the PayPal MCP Server + APIMatic Context Plugin validating schemas pre-execution with zero hallucinations (`F-01`, `F-09`). |
| 7 | **Sylwia Vargas** | AG Grid — Sr. Technical Community Manager | Design (20%) & AG Grid Prize ($10k) | Enterprise AG Grid with custom renderers, grouping, live updates & integrated charts | Basic unstyled 4-column table | *"How does AG Grid turn raw payment data into actionable decisions?"* | Feature our **AG Grid Financial Command Center (`F-07`)** with GNN risk badges, SLA grouping, and live cash-flow charts at 1:15. |
| 8 | **Ameer Hassan** | APIMatic — Co-Founder | Tech Implementation (20%) & APIMatic Prize ($3k) | APIMatic Context Plugins (MCP) + strongly-typed PayPal Server SDK | Claiming APIMatic without SDK/Context Plugin usage | *"Where did APIMatic Context Plugins prevent API errors in your build?"* | Show live APIMatic schema validation badge and documented MCP build telemetry in repo & video (`F-09`). |
| 9 | **Mats Bryntse** | Bryntum — Founder & CEO | Design (20%) & Bryntum Prize ($3k) | Interactive Bryntum Scheduler/Gantt driving live PayPal billing/dunning actions | Static calendar disconnected from PayPal APIs | *"How do timeline interactions trigger real PayPal workflows?"* | Demo dragging a dunning milestone on the **Bryntum Receivables Scheduler (`F-08`)** to trigger `send_invoice_reminder` & conditional rules. |
| 10 | **Ignacio Valdez Bicard** | Channel3 — Founding Engineer | Innovation (20%) & Channel3 Prize ($1.5k) | Live product discovery via Channel3 API/MCP flowing into PayPal checkout | Hardcoded fake product catalogs | *"How does your agent discover and purchase real catalog items?"* | Show B2B supply discovery via Channel3 MCP flowing directly into PayPal `create_order` (`F-05`, `F-12`). |
| 11 | **Carly Richmond** | Elastic — Sr. Manager, Dev Advocacy | Tech Implementation (20%) | Elasticsearch hybrid RAG over merchant policies + structured agent observability | Black-box agent decisions with no audit search | *"How do you ground agent policy checks and audit every tool call?"* | Show **Elastic** hybrid RAG retrieving merchant dispute policies (`M-05`) and indexing 180-day immutable audit logs (`E-10`). |
| 12 | **Pooja Mistry** | Postman — Sr. Developer Advocate | Tech Implementation (20%) | OpenAPI 3.1 specification, clean REST/Webhook contracts, Postman Collection | Undocumented endpoints; broken webhook verification | *"How can developers and judges test your API and webhook contracts?"* | Provide complete `api/openapi.yaml` (`API-01`..`API-14`) and one-click Postman Collection with HMAC webhook verifier. |
| 13 | **Shifra Williams** | Render — Founding DevRel Engineer | Presentation (20%) & Render Prize ($2.25k) | Live multi-service cloud deployment on Render (`render.yaml` + Render Workflows) | Localhost-only demo; broken deployment link | *"How is your multi-agent architecture deployed and orchestrated in the cloud?"* | Host the entire stack live on **Render** (`render.yaml` Blueprint + Managed Postgres/Redis + Render Workflows) (`ADR-0004`). |
