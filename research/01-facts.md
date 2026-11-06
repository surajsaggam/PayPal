# Phase 1 Reconnaissance — Verified Facts & PayPal Stack Extraction (`01-facts.md`)

> **Source Authority**: Extracted from `https://paypalaihackathon.devpost.com/` [S1], Official Rules (`https://paypalaihackathon.devpost.com/rules`) [S2], Official Resources (`https://paypalaihackathon.devpost.com/resources`) [S3], Official Sponsor Detail Pages (`/details/*`) [S4–S13], and PayPal Open-Source & Engineering Publications (`github.com/paypal/agent-toolkit`, `github.com/paypal/junodb`, PayPal Technology Blog) [S18–S35].

---

## 1. Hackathon Identity & Core Parameters

| Attribute | Verified Fact | Source |
|---|---|---|
| **Hackathon Name** | **PayPal AI Hackathon** | [S1] |
| **Official Tagline** | **Build What's Next with PayPal and AI** | [S1] |
| **Primary URL** | `https://paypalaihackathon.devpost.com/` | [S1] |
| **Official Rules URL** | `https://paypalaihackathon.devpost.com/rules` | [S2] |
| **Resources URL** | `https://paypalaihackathon.devpost.com/resources` | [S3] |
| **Sponsor / Host** | **PayPal Inc.**, 2211 North First Street, San Jose, California 95131, United States | [S2] |
| **Administrator** | **Devpost, Inc.**, 250 Broadway, Floor 24, New York, NY 10007, United States | [S2] |
| **Format** | Global Online Hackathon (Virtual; community hub on official **PayPal Developer Discord**) | [S1] |
| **Registered Participants** | **25,000+ to 28,000+ registered builders** worldwide | [S1] |
| **Submission Window** | **October 1, 2026 (9:15 AM PT) – November 12, 2026 (12:00 PM PT / Noon PST)** | [S1, S2] |
| **Early Eligibility Review Deadline** | **Thursday, November 5, 2026** (Announced by Hackathon Manager **Janet Fang** in Official Devpost Update `#47306` for early Stage 1 compliance verification) | [S1, S2] |
| **Judging Window** | **December 1, 2026 (2:00 PM PT) – December 15, 2026 (8:00 AM PT)** | [S2] |
| **Winners Announced** | **On or around December 21, 2026 (2:00 PM PT)** | [S2] |
| **Total Prize Pool** | **$69,750 total value** ($67,500 in cash across 19 cash awards + $2,250 in Render Cloud Credits + 3 × 6-month APIMatic Business Subscriptions) across **15 prize categories** and **22 winning slots** | [S1, S2] |
| **Prize Stacking Rule (Rules § 8)** | Maximum **1 Grand Prize (1st/2nd/3rd) + 1 Sponsor Prize** OR **1 Honorable Mention (PayPal Special Award) + 1 Sponsor Prize** per submission | [S2] |
| **Team Size Rule** | **No maximum limit** (Solo individuals, multi-person teams of any size, or legally incorporated organizations; must appoint 1 Representative) | [S2] |
| **Eligibility & Exclusions** | Open globally to individuals of legal age of majority and valid legal entities, **excluding** residents of **Brazil, Quebec (Canada), Russia, Crimea, Cuba, Iran, North Korea**, and any jurisdiction under comprehensive **U.S. OFAC sanctions** | [S2] |
| **New vs. Existing Code** | Both brand-new and pre-existing projects are eligible, provided **meaningful, demonstrable progress** is made during the Oct 1 – Nov 12, 2026 submission period | [S2] |
| **Intellectual Property (IP)** | **100% entrant ownership retained**; PayPal & Devpost receive a non-exclusive, royalty-free license to evaluate and publicly promote submissions | [S2] |

---

## 2. Verbatim Challenge Mandate & Problem Statement Structure

From `https://paypalaihackathon.devpost.com/` [S1]:
> *"PayPal already moves money for millions of people and businesses, every day, all over the world. This hackathon is us opening that platform up and asking what happens when you put AI behind the wheel. New agents, new ways to pay and get paid, tools nobody's built yet. We want to see what you make of it.*
>
> *AI is changing how people build, buy, sell, work, connect, and move money. Now it's your turn to imagine what comes next.*
>
> ***Build What's Next with PayPal and AI** is a global online hackathon inviting developers, designers, founders, students, and builders to create something new using **PayPal and AI**.*
>
> *There are no prescribed problem statements and no set of tracks. Build an agent, an app, an automation, a new payment experience, a business tool, a social product, or something we haven't thought of yet.*
>
> *The only fundamental requirement: **your project must meaningfully use both PayPal and AI**."*

### De Facto Tracks Derived from Prize & Sponsor Architecture (`D1`–`D5`)
Because the hackathon deliberately omits rigid tracks in favor of targeted special awards and sponsor tool prizes, the problem space maps cleanly into **five strategic domains (`D1`–`D5`)**:
1. **`D1` — Agentic Commerce & Autonomous SMB Financial Operations**: Anchored by **Best Use of Agentic Commerce ($5,000)**, **Best Use of PayPal + AI ($5,000)**, **Best Use of AG Grid ($5,000 1st)**, **APIMatic ($1,000)**, and **Render ($1,000 credits)** [S1].
2. **`D2` — Autonomous Dispute Defense, Friendly-Fraud Graph & Risk Intelligence**: Anchored by **Most Impactful ($5,000)**, **Best Use of PayPal + AI ($5,000)**, `@paypal/agent-toolkit` Disputes/Tracking tools, and **Elastic** RAG/Observability [S1, S9, S18].
3. **`D3` — Programmable Cross-Border B2B Treasury, Smart Invoicing & PYUSD Settlement**: Anchored by **Most Impactful ($5,000)**, **Best Use of Agentic Commerce ($5,000)**, **Best Use of Bryntum ($1,000)**, Invoicing v2, and **PYUSD** on Ethereum/Solana [S1, S7, S33].
4. **`D4` — Next-Gen Social, Multi-Party Split & Fastlane Conversational Checkout**: Anchored by **Most Creative ($5,000)**, **Best Demo Delivery ($5,000)**, **Best Use of Channel3 ($1,500)**, **Fastlane**, and **Venmo** [S1, S8, S30].
5. **`D5` — Developer Experience, Deterministic API Context Plugins & Payment Observability**: Anchored by **Best Use of APIMatic ($1,000 + SaaS)**, **Best Use of AG Grid ($5,000)**, **Postman**, and **PayPal Server SDK** [S1, S5, S11].

---

## 3. Complete Prize Pool Breakdown ($69,750 Across 15 Categories & 22 Winners)

| # | Prize Category | Tier | Cash Prize | Non-Cash / Credits | Winners | Category Cash Subtotal | Category Total Value |
|---|---|---|---|---|---:|---:|---:|
| 1 | **1st Place** | Overall Grand Prize | $12,000 | None | 1 | $12,000 | $12,000 |
| 2 | **2nd Place** | Overall Grand Prize | $8,000 | None | 1 | $8,000 | $8,000 |
| 3 | **3rd Place** | Overall Grand Prize | $5,000 | None | 1 | $5,000 | $5,000 |
| 4 | **Most Creative** | PayPal Special Award | $5,000 | None | 1 | $5,000 | $5,000 |
| 5 | **Most Impactful** | PayPal Special Award | $5,000 | None | 1 | $5,000 | $5,000 |
| 6 | **Best Demo Delivery** | PayPal Special Award | $5,000 | None | 1 | $5,000 | $5,000 |
| 7 | **Best Use of PayPal + AI** | PayPal Special Award | $5,000 | None | 1 | $5,000 | $5,000 |
| 8 | **Best Use of Agentic Commerce** | PayPal Special Award | $5,000 | None | 1 | $5,000 | $5,000 |
| 9 | **Best Use of AG Grid - 1st Place** | Sponsor Award (AG Grid) | $5,000 | None | 1 | $5,000 | $5,000 |
| 10 | **Best Use of AG Grid - 2nd Place** | Sponsor Award (AG Grid) | $2,000 | None | 1 | $2,000 | $2,000 |
| 11 | **Best Use of AG Grid - 3rd Place** | Sponsor Award (AG Grid) | $1,000 | None | 3 | $3,000 | $3,000 |
| 12 | **Best Use of APIMatic** | Sponsor Award (APIMatic) | $1,000 | 6-mo APIMatic Business Sub | 3 | $3,000 | $3,000 + 3× SaaS |
| 13 | **Best Use of Bryntum** | Sponsor Award (Bryntum) | $1,000 | None | 3 | $3,000 | $3,000 |
| 14 | **Best Use of Channel3** | Sponsor Award (Channel3) | $1,500 | None | 1 | $1,500 | $1,500 |
| 15 | **Best Use of Render (1st / 2nd / 3rd)** | Sponsor Award (Render) | $0 | $1,000 / $750 / $500 Credits | 3 | $0 | $2,250 |
| — | **TOTAL** | **15 Categories** | — | — | **22** | **$67,500** | **$69,750 (+ 3 SaaS)** |

---

## 4. Official Judging Criteria (5 × 20% = 100%) & Official Rules Section 6 Disclosures

Per `https://paypalaihackathon.devpost.com/` [S1, S2], after passing the **Stage 1 Baseline Compliance Gate** (verifying PayPal + AI integration, public open-source repository with license visible in the About section, functional live demo or reproducible instructions, and <3:00 public YouTube video), entries are scored on:

1. **Technological Implementation (20%)**: *"How thoroughly and skillfully does the project use PayPal Developer Platform and AI tool(s)? Does the project reflect genuine effort and a working, non-trivial implementation?"* [S1]
2. **Design (20%)**: *"Does the project deliver a complete, coherent product experience — not just a technical proof of concept?"* [S1]
3. **Potential Impact (20%)**: *"Does the project make a credible, specific case for solving a real problem for a real audience — and does the solution actually address that problem based on what's demonstrated?"* [S1]
4. **Innovation/Idea (20%)**: *"How creative and novel is the concept and does the project differ from existing concepts?"* [S1]
5. **Presentation (20%)**: *"Does the video clearly demonstrate the project working end-to-end? Does the pitch communicate what problem is solved, who it's for, and why it matters? Is the overall presentation easy to follow?"* [S1]

### 4.1 Official Rules Section 6 & Section 8 Critical Governance Clauses
- **Automated AI-Driven Analysis Disclosure (Official Rules § 6)**: Official Rules Section 6 explicitly discloses that the Sponsor and Administrator may use **automated, AI-driven analysis tools** during Stage 1 and Stage 2 review to scan open-source repositories, verify real PayPal SDK/API call graphs (`@paypal/agent-toolkit`, `@paypal/paypal-server-sdk`, REST v2 endpoints), inspect commit activity during the hackathon window, and check open-source license compliance before and alongside human panel scoring [S2].
- **Exact Stage 2 Tie-Breaker Hierarchy (Official Rules § 6)**: In the event two or more submissions are tied on total score (out of 100%), ties are broken strictly in the following order:
  1. **Technological Implementation** (Criterion #1)
  2. **Design** (Criterion #2)
  3. **Potential Impact** (Criterion #3)
  4. **Innovation/Idea** (Criterion #4)
  5. **Presentation** (Criterion #5) [S2]
- **Official Rules Section 8 Prize Stacking Cap**: A single submission may win at most **1 Grand Prize (1st, 2nd, or 3rd Place) + 1 Sponsor Prize** OR **1 Honorable Mention (PayPal Special Award: Most Creative, Most Impactful, Best Demo Delivery, Best Use of PayPal + AI, or Best Use of Agentic Commerce) + 1 Sponsor Prize** [S2].

---

## 5. Official Webinars & Mandatory Submission Deliverables

### 5.1 Official Hackathon Webinars & Devpost Updates
| # | Date & Time (PT) | Session Title & Speakers | YouTube Link / Reference |
|---|---|---|---|
| 1 | **Oct 6, 2026 (9:00–9:45 AM PT)** | *Start building with PayPal: Set Up PayPal's Sandbox and AI Toolkit From Scratch* (Jo Franchetti, Marco Podien, Eddie Jaoude) | `https://www.youtube.com/watch?v=FFJfCW9z3Do` [S14] |
| 2 | **Oct 7, 2026 (9:00–9:30 AM PT)** | *Power Your PayPal Hackathon Project with APIMatic Context Plugins* (APIMatic & PayPal SDK team) | `https://youtu.be/zRWixN68tDg` [S15] |
| 3 | **Oct 12, 2026 (7:00–7:45 AM PT)** | *Build a payments dashboard without building a dashboard* (AG Grid / AG Studio + PayPal API) | `https://www.youtube.com/watch?v=LGfG44i1Fj8` [S16] |
| 4 | **Oct 13, 2026 (1:00–2:00 AM PT)** | *Start building with PayPal (EMEA/APAC Developer Onboarding)* (Marco Podien & PayPal DevRel) | `https://youtu.be/ck_zyB66p_Y` [S17] |
| 5 | **Nov 5, 2026 (Update #47306)** | *Early Eligibility Review Deadline Announcement* (Hackathon Manager **Janet Fang**) | `https://paypalaihackathon.devpost.com/updates/47306` [S1, S2] |

### 5.2 Mandatory Submission Gate Checklist
- [x] **Meaningful PayPal + AI Integration**: Uses PayPal Developer Sandbox + at least one PayPal API/SDK/Toolkit (`@paypal/agent-toolkit`, PayPal MCP Server, Server SDK, Orders v2, Invoicing v2, Disputes, Subscriptions, Tracking) paired with load-bearing AI [S1].
- [x] **Public Open-Source Code Repository**: Hosted on GitHub, GitLab, or Bitbucket with **an open-source license file (e.g., MIT or Apache-2.0) visible at the top of the repo in the About section** and zero hardcoded credentials [S1, S2].
- [x] **Working Functional Demo**: Live hosted URL (e.g., on Render) or complete reproducible setup instructions; static mockups or click-through prototypes are strictly disqualified [S1, S2].
- [x] **Public YouTube Demo Video (< 3:00)**: Under 3 minutes showing the application working live end-to-end on the target device [S1, S2].
- [x] **Devpost Text Write-up & Tool Declaration**: Explicit breakdown of problem, solution, PayPal tools, AI models, and sponsor tools utilized [S1].

---

## 6. PayPal Company, Product Ecosystem & Engineering Stack Summary

### 6.1 Core Languages, Frameworks & Data Infrastructure
- **Java (`Spring Boot` + `PayPal Raptor`)**: Standardized enterprise microservices backbone for ledgers, settlement, risk orchestration, and compliance with mTLS and distributed tracing [S22].
- **Node.js / TypeScript (`Kraken.js`, `Zoid`, `PayPal Web SDK v6`, `React`, `Next.js`)**: Created and open-sourced **Kraken.js** (`github.com/krakenjs/kraken-js`) for secure Express.js web apps, **Zoid** (`github.com/krakenjs/zoid`) for cross-domain isolated smart payment components, and **PayPal Web SDK v6 (`web-sdk/v6/core`)** (which requires awaiting the asynchronous `.start()` Promise before rendering payment components and enforces strict mutual exclusivity between `clientId` and `clientToken`) [S23, S24].
- **Golang & `JunoDB` (`github.com/paypal/junodb`)**: Open-source distributed key-value store serving **350+ billion requests/day** at **99.9999% (six 9s) availability** and single-digit millisecond latency, built in Go with **RocksDB** persistent storage, **etcd** cluster coordination, and quorum Two-Phase Commit (2PC) [S20, S21].
- **`Apache Kafka`**: Global event bus processing **1.3+ trillion messages/day** (peaking at 21M msgs/sec) across 1,500+ brokers and 85+ clusters [S25].
- **Real-Time Risk, HTAP Storage & `gators` ML Feature Engineering**: **Aerospike** (sub-ms behavioral risk features), **Redis Enterprise** (read-after-write consistency in **Simility**), **Couchbase**, **TiDB** (MySQL-compatible Raft HTAP), **Oracle/MySQL**, **Elasticsearch**, **Apache Spark + NVIDIA RAPIDS GPUs**, **Google Cloud BigQuery**, and PayPal's open-source **`gators`** library (`github.com/paypal/gators`, built on **Polars + ONNX Runtime** for zero-copy, sub-millisecond tabular and graph feature engineering) [S26–S29].

### 6.2 AI, Risk & Agentic Commerce Platforms (`Cosmos.AI`, `Store Sync`, `Agent Ready`, `KYA`, `AI-Toolkit`)
- **`Cosmos.AI` Platform**: PayPal's unified MLOps/LLM platform featuring multi-tenant `AI Projects`, an **Envoy-based Cosmos LLM Gateway** routing **hundreds of billions of tokens/day** across 100+ models (OpenAI, Claude, Gemini, Nemotron, vLLM/Triton), and the **Cosmos Decision Platform** with a custom **DSL Rule Engine** evaluating Directed Acyclic Graphs (DAGs) of risk/compliance rules [S26].
- **Real-Time Graph Database, Mirror Graphs & GNNs**: Models buyers, merchants, cards, devices, and IPs as a heterogeneous graph across Real-Time, Interactive, and Analytics tiers, using **Mirror Graphs** to feed multi-hop node embeddings into **Graph Neural Networks (GNNs)** and **Simility** ($120M acquisition) [S27, S28].
- **PayPal Agentic Commerce Services (`Store Sync` & `Agent Ready`)**:
  - **`Store Sync`** (powered by PayPal's **February 2026 acquisition of Cymbio**): Synchronizes merchant product catalogs, inventory, and fulfillment metadata across AI agent discovery channels while keeping merchants as the Merchant of Record [S35, S38].
  - **`Agent Ready`**: Connects PayPal's 430M+ wallets and merchant rails to both the **Agentic Commerce Protocol [ACP]** (supporting OpenAI Instant Checkout and PayPal's **Delegated Token API** with scoped `allowance` constraints — `max_amount`, `currency`, `merchant_id`, `expires_at`) and the **Universal Commerce Protocol [UCP]** (powering Google AI Mode / Gemini shopping agents), backed by CTO **Srini Venkatesan's "Know Your Agent (KYA)"** cryptographic agent identity and allowance verification standard (Ai4 2026 Keynote) [S37, S38].
- **PayPal AI Toolkit (`github.com/paypal/AI-Toolkit` v0.6.0 & `/paypal:doctor`)**: PayPal's official multi-IDE AI developer toolkit (`v0.6.0`) featuring the **Merchant AI Integration Agent** and the **`/paypal:doctor` 9-point diagnostic checklist** that statically and dynamically audits PayPal integrations for OAuth2 scope validity, Sandbox/Live host consistency, `PayPal-Request-Id` idempotency, webhook signature verification, and Web SDK v6 compliance [S18, S19].
- **`@paypal/agent-toolkit` (`github.com/paypal/agent-toolkit`) & PayPal MCP Server (`@paypal/mcp` / `mcp.paypal.com`)**: Exposes **35 tools across 7 categories**:
  1. **Invoices & Recurring Series (20 tools)**: `create_invoice`, `list_invoices`, `get_invoice`, `send_invoice`, `send_invoice_reminder`, `cancel_sent_invoice`, `generate_invoice_qr_code`, `delete_invoice`, `generate_invoice_number`, `search_invoicing`, `update_invoicing`, `cancel_invoice_auto_reminder`, `record_payment_for_invoice`, `record_refund_for_invoice`, `create_conditional_rules_for_invoice`, `create_recurring_series`, `activate_recurring_series`, `get_recurring_series`, `cancel_recurring_series`, `delete_recurring_series` [S18].
  2. **Orders & Payments (5 tools)**: `create_order`, `get_order`, `pay_order`, `create_refund`, `get_refund` [S18].
  3. **Dispute Management (3 tools)**: `list_disputes`, `get_dispute`, `accept_dispute_claim` [S18].
  4. **Shipment Tracking (3 tools)**: `create_shipment_tracking`, `get_shipment_tracking`, `update_shipment_tracking` [S18].
  5. **Catalog Management (3 tools)**: `create_product`, `list_products`, `show_product_details` [S18].
  6. **Subscription Management (7 tools)**: `create_subscription_plan`, `list_subscription_plans`, `show_subscription_plan_details`, `create_subscription`, `show_subscription_details`, `update_subscription`, `cancel_subscription` [S18].
  7. **Reporting & Insights (2 tools)**: `list_transactions`, `get_merchant_insights` [S18].
- **Live Devpost Forum Sandbox Gotchas & Production Mitigations**:
  1. **Forum Thread #45463 / GitHub Issue #119 (`mcp.sandbox.paypal.com/sse` Crash)**: The hosted `mcp.sandbox.paypal.com/sse` endpoint runs on Cloudflare Workers where Axios `1.20.0` sets `cache: "default"` on `fetch()`, throwing `TypeError: Unsupported cache mode: default`. Our architecture mitigates this completely by running `@paypal/agent-toolkit` in-process on Node.js 22 with an automatic direct REST v2 fallback (`services/api`).
  2. **Forum Thread #45483 (`403 NOT_ENABLED_TO_VAULT_PAYMENT_SOURCE`)**: Unvetted developer Sandbox accounts attempting `PLATFORM` mode vaulting receive HTTP `403 NOT_ENABLED_TO_VAULT_PAYMENT_SOURCE`. Our architecture mitigates this by executing `intent: "AUTHORIZE"` orders followed by deterministic server-side capture (`POST /v2/checkout/orders/{id}/capture`).
- **Core Payment & Stablecoin Rails**: **PayPal REST APIs v2** (`Orders v2`, `Invoicing v2`, `Disputes v1`, `Subscriptions v1`, `Tracking v1`, `Webhooks v1`), **PayPal Complete Payments (PPCP)**, **Fastlane by PayPal** (~80% guest conversion, up to 50% faster checkout), **Braintree GraphQL API**, **Venmo** (90M+ US users), and **PayPal USD (`PYUSD`)** issued by Paxos on **Ethereum ERC-20** (`0x6c3ea9036406852006290770BEdFcAbA0e23A0e8`) and **Solana SPL Token-2022** (`2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo`) with Confidential Transfers, Transfer Hooks, and Memo Required extensions [S29–S34].
