# PayPal AI Hackathon (`paypalaihackathon.devpost.com`) — Forensic Survey & Analysis Report

> **Executive Summary:** The **PayPal AI Hackathon ("Build What's Next with PayPal and AI")** is a global online hackathon hosted by PayPal Inc. and administered by Devpost, Inc. from **October 1, 2026 to November 12, 2026 (12:00 PM PT)**, with over **25,000+ registered participants** competing for **$69,750 in total prizes ($67,500 in cash + $2,250 in cloud credits + partner subscriptions)**. Crucially, the hackathon has **no rigid problem statements or restricted tracks**—instead, it challenges builders to meaningfully combine the **PayPal Developer Platform (Sandbox, Server SDKs, PayPal Agent Toolkit `@paypal/agent-toolkit`, and PayPal MCP Server)** with **AI models/agents**, while rewarding specific strategic pillars through five $5,000 special awards (including **Best Use of Agentic Commerce** and **Best Use of PayPal + AI**) and ten ecosystem sponsor tool challenges.

---

## 1. Hackathon Overview, Identity & Timeline

### 1.1 Official Identity & Vision
| Attribute | Verbatim / Verified Detail | Source |
|---|---|---|
| **Official Title** | **PayPal AI Hackathon** | `https://paypalaihackathon.devpost.com/` |
| **Official Tagline / Theme** | **Build What's Next with PayPal and AI** | `https://paypalaihackathon.devpost.com/` |
| **Official URL** | `https://paypalaihackathon.devpost.com/` | Devpost |
| **Sponsor (Host)** | **PayPal Inc.**, 2211 North First Street, San Jose, California 95131, United States | `https://paypalaihackathon.devpost.com/rules` |
| **Administrator** | **Devpost, Inc.**, 250 Broadway, Floor 24, New York, NY 10007, United States | `https://paypalaihackathon.devpost.com/rules` |
| **Format & Location** | **Global Online Hackathon** (Virtual; community hub on the official **PayPal Developer Discord**) | `https://paypalaihackathon.devpost.com/` |
| **Participant Count** | **25,000+ to 28,000+ registered participants** globally | Devpost participant counter & index snapshots |
| **Total Prize Pool** | **$69,750 total value** (**$67,500 in cash prizes** across 19 cash awards + **$2,250 in Render Credits** + **3x 6-month APIMatic Business Subscriptions**) | `https://paypalaihackathon.devpost.com/` |

### 1.2 Verbatim Challenge Framing ("About the challenge")
From `https://paypalaihackathon.devpost.com/` (lines 10–21 of captured overview):
> *"PayPal already moves money for millions of people and businesses, every day, all over the world. This hackathon is us opening that platform up and asking what happens when you put AI behind the wheel. New agents, new ways to pay and get paid, tools nobody's built yet. We want to see what you make of it.*
>
> *AI is changing how people build, buy, sell, work, connect, and move money. Now it's your turn to imagine what comes next.*
>
> ***Build What's Next with PayPal and AI** is a global online hackathon inviting developers, designers, founders, students, and builders to create something new using **PayPal and AI**.*
>
> *There are no prescribed problem statements and no set of tracks. Build an agent, an app, an automation, a new payment experience, a business tool, a social product, or something we haven't thought of yet.*
>
> *The only fundamental requirement: **your project must meaningfully use both PayPal and AI**."*

### 1.3 Complete Timeline, Milestones & Official Webinar Schedule
| Milestone / Event | Date & Time (Pacific Time) | Details / Recording Link |
|---|---|---|
| **Submissions Open** | **October 1, 2026 — 9:15 AM PT** | Hackathon launches on Devpost; registration and sandbox building open. |
| **Webinar 1: Start building with PayPal** | **October 6, 2026 — 9:00 AM – 9:45 AM PT** | *Set Up PayPal's Sandbox and AI Toolkit From Scratch (Live Walkthrough)* — Hosted by PayPal DevRel (**Jo Franchetti**, **Marco Podien**, **Eddie Jaoude**). Covers rules, PayPal Developer Sandbox, access tokens, webhooks, and the PayPal AI/Agent Toolkit with coding agents like Claude Code. [YouTube (`FFJfCW9z3Do`)](https://www.youtube.com/watch?v=FFJfCW9z3Do) |
| **Webinar 2: Power Your PayPal Hackathon Project with APIMatic Context Plugins** | **October 7, 2026 — 9:00 AM – 9:30 AM PT** | Live walkthrough showing how to eliminate LLM hallucinations on legacy payment endpoints by using **APIMatic Context Plugins** (MCP-compatible deterministic SDK context) to build a TypeScript coffee shop checkout app with the PayPal Server SDK. [YouTube (`zRWixN68tDg`)](https://youtu.be/zRWixN68tDg) |
| **Webinar 3: Build a payments dashboard without building a dashboard** | **October 12, 2026 — 7:00 AM – 7:45 AM PT** | Technical session demonstrating how to pull live payment/transaction data from the PayPal API into **AG Studio / AG Grid** to spin up an enterprise-grade payment analytics dashboard without hand-coding UI boilerplate. [YouTube (`LGfG44i1Fj8`)](https://www.youtube.com/watch?v=LGfG44i1Fj8) |
| **Webinar 4: Start building with PayPal (EMEA/APAC Session)** | **October 13, 2026 — 1:00 AM – 2:00 AM PT** | Companion live developer onboarding session covering core PayPal APIs, SDKs, identity tools, AI integrations, and sandbox setup. [YouTube (`ck_zyB66p_Y`)](https://youtu.be/ck_zyB66p_Y) |
| **Submission Deadline** | **November 12, 2026 — 12:00 PM PT (Noon PST)** | Hard cutoff for submitting code repo, <3-minute YouTube demo video, functional demo link/instructions, and Devpost write-up. |
| **Judging Period** | **December 1, 2026 (2:00 PM PT) – December 15, 2026 (8:00 AM PT)** | Baseline compliance screening followed by panel evaluation across the 5 equally weighted rubric criteria. |
| **Winners Announced** | **On or around December 21, 2026 — 2:00 PM PT** | Official announcement of Grand Prize, Special Category, and Sponsor Award winners. |

---

## 2. Tracks, Problem Statements, Categories & Ecosystem Sponsors

### 2.1 Open-Ended Core Structure vs. De Facto Prize Tracks
While PayPal explicitly states *"There are no prescribed problem statements and no set of tracks"*, the prize architecture creates **three distinct strategic tiers** that function as de facto tracks:
1. **Tier 1 — Overall Podium ($25,000 across 1st, 2nd, 3rd Place):** Rewards the best end-to-end product combining PayPal Developer Platform and AI across all 5 judging criteria.
2. **Tier 2 — PayPal Strategic Special Categories ($25,000 across 5 × $5,000 awards):**
   - **Best Use of Agentic Commerce ($5,000):** Autonomous AI agents that negotiate, purchase, invoice, manage subscriptions, or execute commercial transactions on a user's or business's behalf using PayPal payment infrastructure.
   - **Best Use of PayPal + AI ($5,000):** Deep, non-trivial architectural synergy between PayPal APIs/SDKs (`@paypal/agent-toolkit`, PayPal MCP Server, Orders v2, Invoicing v2, Subscriptions, Payouts, Disputes, Webhooks) and AI reasoning/execution.
   - **Most Creative ($5,000):** Out-of-the-box novelty and imagination in blending AI interactions with digital finance, social payments, or new commerce primitives.
   - **Most Impactful ($5,000):** Highest real-world utility solving a concrete, high-urgency pain point for consumers, freelancers, SMBs, or enterprises.
   - **Best Demo Delivery ($5,000):** Best <3-minute YouTube demo video and live working demonstration that tells a crystal-clear problem-to-solution story.
3. **Tier 3 — Ecosystem Sponsor Tool Challenges ($17,500 cash + $2,250 Render Credits + APIMatic Subscriptions):** Allows multi-prize stacking by integrating official partner technologies alongside PayPal and AI.

### 2.2 Complete Breakdown of the 10 Official Ecosystem Sponsors & Developer Tools
On `https://paypalaihackathon.devpost.com/`, PayPal lists **10 official sponsor tools** (`https://paypalaihackathon.devpost.com/details/<sponsor>`). Using a sponsor tool is optional for the main prizes, but qualifies teams for dedicated sponsor awards and provides free hackathon access/credits:

| # | Sponsor | Devpost Detail URL | Core Technology & Hackathon Integration Role | Dedicated Sponsor Prize? |
|---|---|---|---|---|
| 1 | **AG Grid** | `/details/aggrid` | High-performance JavaScript/TypeScript data grid, integrated financial charting, and **AG Studio** for instant payment/ledger analytics dashboards. | **Yes — $10,000 total cash** ($5,000 1st; $2,000 2nd; 3 × $1,000 3rd) |
| 2 | **APIMatic** | `/details/apimatic` | **APIMatic Context Plugins** (MCP-compatible deterministic SDK/API context for AI coding agents like Claude Code & Cursor) + automated TypeScript/Python PayPal Server SDK generation. | **Yes — $3,000 cash + SaaS** (3 × $1,000 cash + 6 months APIMatic Business Subscription) |
| 3 | **Astropods** | `/details/astropods` | Agent Operating System (`docs.astropods.com`) for deploying, running, monitoring, and governing production-ready AI agents via declarative specs and CLI tools. | Ecosystem tool partner (no separate cash line item listed on main prize table) |
| 4 | **Bryntum** | `/details/bryntum` | Enterprise web UI components (**Bryntum Gantt, Scheduler, Calendar, Grid**) for project management, milestone billing, resource scheduling, and contractor payout timelines. | **Yes — $3,000 total cash** (3 × $1,000 cash winners) |
| 5 | **Channel3** | `/details/channel3` | AI shopping and retail commerce infrastructure providing clean, normalized product data across millions of retail items via REST API and MCP server. | **Yes — $1,500 cash** (1 winner) |
| 6 | **Elastic** | `/details/elastic` | **Elasticsearch** vector database, hybrid search, RAG retrieval, and observability for grounding multi-step AI commerce agents. | Ecosystem tool partner (free trial / resource support; judge on panel) |
| 7 | **KERNEL** | `/details/kernel` | Developer ecosystem and builder community tooling partner. | Ecosystem tool partner |
| 8 | **Postman** | `/details/postman` | Official **PayPal Public Postman Workspace & Collections**, API testing, mocking, and AI-native API workflow orchestration. | Ecosystem tool partner (judge on panel) |
| 9 | **Render** | `/details/render` | Cloud application hosting, managed Postgres/Redis, and distributed background task orchestration via **Render Workflows**. | **Yes — $2,250 Render Credits** ($1,000 1st; $750 2nd; $500 3rd) |
| 10 | **Zapier** | `/details/zapier` | Workflow automation platform connecting AI agents and PayPal webhook events to 7,000+ external SaaS applications. | Ecosystem tool partner |

### 2.3 Core PayPal Developer Resources Highlighted on `/resources`
The `/resources` tab and official kick-off webinars highlight the following core PayPal technical building blocks:
1. **PayPal Developer Sandbox (`developer.paypal.com`):** Free sandbox merchant and buyer accounts, OAuth 2.0 client credentials (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`), test credit cards, and webhook simulators.
2. **PayPal Agent Toolkit (`@paypal/agent-toolkit` on npm / `paypal-agent-toolkit` on PyPI / `github.com/paypal/agent-toolkit`):**
   - Official open-source library bridging PayPal APIs with **Vercel AI SDK, LangChain, CrewAI, OpenAI Agents SDK, and Amazon Bedrock**.
   - Built-in tool actions for:
     - **Orders v2** (`orders.create`, `orders.get`, `orders.capture`)
     - **Invoicing v2** (`invoices.create`, `invoices.send`, `invoices.list`, `invoices.sendReminder`, `invoices.cancel`, `invoices.generateQRCode`)
     - **Subscriptions v1** (`products.create`, `subscriptionPlans.create`, `subscriptions.create`, `subscriptions.show`, `subscriptions.cancel`)
     - **Shipment Tracking v1** (`shipment.create`, `shipment.show`)
     - **Catalog Products v1** (`products.create`, `products.list`, `products.show`)
     - **Disputes v1 & Transaction Search** (`disputes.list`, `disputes.get`, `transactions.list`)
3. **PayPal Model Context Protocol (MCP) Server:** Local and remote MCP server integration allowing Claude Desktop, Claude Code, Cursor, and custom MCP hosts to invoke PayPal sandbox payment tools directly via natural language.
4. **PayPal Server SDKs & JavaScript SDK:** Official strongly-typed Server SDKs (TypeScript/Node.js, Python, Java, C#, PHP, Go; co-engineered with APIMatic) and client-side `@paypal/react-paypal-js` / JS SDK v5/v6 for Smart Payment Buttons, Advanced Card Processing, Apple Pay, Google Pay, and Venmo/Pay Later.

---

## 3. Rules, Eligibility, Submission Requirements & IP Terms

### 3.1 Eligibility & Geographic Exclusions (`https://paypalaihackathon.devpost.com/rules`)
- **Age & Entity Eligibility:** Open to:
  1. Individuals who have reached the legal age of majority in their jurisdiction of residence at the time of entry;
  2. Teams of eligible individuals; and
  3. Organizations (corporations, nonprofits, LLCs, partnerships, and other legal entities) that are properly organized/incorporated and validly existing at the time of entry.
- **Geographic Exclusions:** Open globally **except** where prohibited by U.S. or local law. Residents of the following jurisdictions are **strictly excluded**:
  - **Brazil**
  - **Quebec (Canada)**
  - **Russia**
  - **Crimea**
  - **Cuba**
  - **Iran**
  - **North Korea**
  - Any other country or territory subject to comprehensive sanctions administered by the U.S. Treasury’s **Office of Foreign Assets Control (OFAC)**.

### 3.2 Team Rules & New vs. Existing Projects
- **Team Size Limit:** **No maximum limit.** Entrants may compete solo, in a team of any size, or as an organization.
- **Multiple Teams / Entries:** An eligible individual may join more than one team or organization and may also enter individually, provided each submission is distinct and complies with all rules.
- **Team Representative:** Every team or organization must appoint a single **Representative** authorized to submit the entry and receive any prize distribution on the team's behalf.
- **New vs. Existing Projects:** Both brand-new projects and pre-existing projects are eligible, **provided the team makes meaningful, demonstrable progress on the project during the official hackathon submission period (October 1 – November 12, 2026)**.

### 3.3 Mandatory Submission Deliverables ("What to Submit")
Per `https://paypalaihackathon.devpost.com/` (lines 81–111), every valid submission must include:
1. **Working Project Integrating PayPal + AI:**
   - Must meaningfully integrate at least one PayPal technology, API, SDK, product, or developer capability (using the free PayPal Developer Sandbox).
   - Must meaningfully incorporate AI into the user experience or backend functionality.
2. **Text Description:** Comprehensive write-up explaining the project's problem, features, architecture, and functionality.
3. **Tools Identification:** Explicit declaration of which AI models/services, PayPal APIs/SDKs, and sponsor tools were used and how they were implemented.
4. **Functional Demo (Strict Disqualifier if Missing):**
   - Judges must be able to actually run or interact with a working build via either:
     - A **hosted live demo URL**, OR
     - **Clear, complete setup and run instructions** in the code repository so judges can build and run it themselves.
   - **Explicit Disqualifier:** *"A design mockup, static prototype, or non-functional demo does not meet this requirement."*
5. **Public Open-Source Code Repository:**
   - Hosted on **GitHub, GitLab, or Bitbucket**.
   - Must contain all source code, assets, and instructions needed to run the project.
   - Must be **public and open source, with an open-source license file visible at the top of the repo (in the About section)**.
   - API keys and credentials must not be hardcoded (use environment variables / `.env.example`).
6. **Demo Video (< 3 Minutes):**
   - Must be **under 3 minutes** (judges are explicitly not required to watch past 3:00).
   - Must show the project **functioning live on the device it was built for**.
   - Must be uploaded to **YouTube** and set to **publicly visible**, with the link submitted on the Devpost form.
   - Must not include unauthorized third-party trademarks or copyrighted music/material.

### 3.4 Intellectual Property (IP) Rights
- **100% Entrant Ownership:** All submissions remain the sole intellectual property of the individuals, teams, or organizations that developed them. Neither PayPal nor Devpost claims ownership over submitted code or IP.
- **License Granted to Sponsor:** By submitting, entrants grant PayPal (Sponsor) and Devpost (Administrator) a non-exclusive, worldwide, royalty-free license to:
  1. Access, test, and evaluate the submission for judging purposes; and
  2. Publicly display, promote, and reference the submission, project video, and entrant names/likenesses in marketing, blog posts, and promotional materials related to the hackathon.
- **Originality Warranty:** Entrants warrant that their submission is original work and does not infringe any third-party copyright, patent, trademark, trade secret, or privacy right.

---

## 4. Exact Judging Criteria & Rubric

Submissions first undergo a **Stage 1 Baseline Compliance Check** (verifying PayPal + AI usage, public open-source repo with license in About section, working demo, and <3-min YouTube video). Qualifying submissions are then scored by the judging panel across **five equally weighted criteria (20% each)**:

| # | Criterion Name | Weight | Verbatim Rubric Definition (`paypalaihackathon.devpost.com`, lines 287–296) | Forensic Interpretation (How to Score 5/5) |
|---|---|---|---|---|
| 1 | **Technological Implementation** | **20%** | *"How thoroughly and skillfully does the project use PayPal Developer Platform and AI tool(s)? Does the project reflect genuine effort and a working, non-trivial implementation?"* | Do not just wrap a single PayPal button next to a chatbot. Combine **PayPal Agent Toolkit / MCP Server**, multi-endpoint PayPal REST APIs (**Orders v2, Invoicing v2, Payouts, Subscriptions, Disputes, Webhooks**), deterministic schema validation (**APIMatic Context Plugins**), and real multi-step AI agent orchestration with audit logs and safety guardrails. |
| 2 | **Design** | **20%** | *"Does the project deliver a complete, coherent product experience — not just a technical proof of concept?"* | Polished, cohesive UX/UI that feels like a real shipping SaaS/consumer product. Integrating **AG Grid / AG Studio** or **Bryntum** provides instant enterprise-grade visual polish alongside modern responsive design. |
| 3 | **Potential Impact** | **20%** | *"Does the project make a credible, specific case for solving a real problem for a real audience — and does the solution actually address that problem based on what's demonstrated?"* | Anchor the pitch in quantifiable merchant/consumer pain (e.g., B2B invoice delinquency, autonomous agent spend governance, cross-border freelancer milestone payouts, dispute resolution) with clear ROI. |
| 4 | **Innovation/Idea** | **20%** | *"How creative and novel is the concept and does the project differ from existing concepts?"* | Avoid generic "AI shopping chatbot" clichés. Build novel **Agentic Commerce** primitives—e.g., cryptographic spend policies for autonomous agents, self-reconciling escrow/milestone contracts, or autonomous dispute-prevention agents. |
| 5 | **Presentation** | **20%** | *"Does the video clearly demonstrate the project working end-to-end? Does the pitch communicate what problem is solved, who it's for, and why it matters? Is the overall presentation easy to follow?"* | Tight, high-energy **< 3:00 YouTube video**: 25s hook & problem, 110s live end-to-end demo showing real PayPal Sandbox transactions firing + AI agent reasoning + webhook confirmation, 30s architecture & impact, 15s close. |

---

## 5. Complete Prize Pool & Mathematical Breakdown ($69,750 Total)

The Devpost page states **$69,750 in total prizes** in the "Why Join?" section (line 28) and **$67,500+ in prizes (+ other prizes)** in the prize header (lines 112–114). Here is the exact line-by-line verification of all **15 prize categories (22 total winning slots)**:

| Prize Category | Tier | Cash per Winner | Non-Cash / Credits per Winner | # of Winners | Category Subtotal (Cash) | Category Subtotal (Total Value) |
|---|---|---|---|---|---|---|
| **1st Place** | Overall Grand Prize | $12,000 | — | 1 | $12,000 | $12,000 |
| **2nd Place** | Overall Grand Prize | $8,000 | — | 1 | $8,000 | $8,000 |
| **3rd Place** | Overall Grand Prize | $5,000 | — | 1 | $5,000 | $5,000 |
| **Most Creative** | PayPal Special Award | $5,000 | — | 1 | $5,000 | $5,000 |
| **Most Impactful** | PayPal Special Award | $5,000 | — | 1 | $5,000 | $5,000 |
| **Best Demo Delivery** | PayPal Special Award | $5,000 | — | 1 | $5,000 | $5,000 |
| **Best Use of PayPal + AI** | PayPal Special Award | $5,000 | — | 1 | $5,000 | $5,000 |
| **Best Use of Agentic Commerce** | PayPal Special Award | $5,000 | — | 1 | $5,000 | $5,000 |
| **Best Use of AG Grid - 1st Place** | Sponsor Award (AG Grid) | $5,000 | — | 1 | $5,000 | $5,000 |
| **Best Use of AG Grid - 2nd Place** | Sponsor Award (AG Grid) | $2,000 | — | 1 | $2,000 | $2,000 |
| **Best Use of AG Grid - 3rd Place** | Sponsor Award (AG Grid) | $1,000 | — | 3 | $3,000 | $3,000 |
| **Best Use of APIMatic** | Sponsor Award (APIMatic) | $1,000 | 6 months APIMatic Business Subscription | 3 | $3,000 | $3,000 + 3× SaaS subs |
| **Best Use of Bryntum** | Sponsor Award (Bryntum) | $1,000 | — | 3 | $3,000 | $3,000 |
| **Best Use of Channel3** | Sponsor Award (Channel3) | $1,500 | — | 1 | $1,500 | $1,500 |
| **Best Use of Render - 1st Place** | Sponsor Award (Render) | $0 | $1,000 Render Credits | 1 | $0 | $1,000 |
| **Best Use of Render - 2nd Place** | Sponsor Award (Render) | $0 | $750 Render Credits | 1 | $0 | $750 |
| **Best Use of Render - 3rd Place** | Sponsor Award (Render) | $0 | $500 Render Credits | 1 | $0 | $500 |
| **TOTAL** | **15 Categories** | — | — | **22 Winner Slots** | **$67,500 Cash** | **$69,750 (+ 3 APIMatic Subs)** |

> **Strategic Prize-Stacking Insight:** A single well-architected project that wins **1st Place ($12,000)** or a **PayPal Special Category ($5,000)** while integrating **AG Grid ($5,000 1st)**, **APIMatic ($1,000)**, **Bryntum ($1,000)**, **Channel3 ($1,500)**, and **Render ($1,000 credits)** can legitimately compete across multiple prize pools simultaneously, maximizing expected value and win probability.

---

## 6. Forensic Profiles of Every Named Judge, Speaker & Organizer

The Devpost page (`https://paypalaihackathon.devpost.com/`, lines 222–285) lists **13 official judges** (6 from PayPal and 7 from Ecosystem Sponsors), with an additional PayPal Staff Software Engineer (**Ishan Shah**) documented in supplementary Devpost judging panels.

### 6.1 PayPal Judging Panel & Organizers (6 Official Devpost Judges + 1 Supplementary)

| # | Name | Official Title on Devpost | Background, Technical Focus & What They Value |
|---|---|---|---|
| 1 | **Jo Franchetti** | *Developer Advocate - PayPal* | Experienced web developer, software engineer, and Developer Advocate at PayPal (previously at Ably, Samsung Internet, Deno). Co-hosted the Oct 6 kick-off live build session (*Set Up PayPal's Sandbox and AI Toolkit From Scratch*). Passionate about clean web standards, real-time webhooks, developer ergonomics, accessible UI, and end-to-end working demos that don't fake backend calls. |
| 2 | **Eddie Jaoude** | *Developer Advocate - PayPal* | World-renowned open-source advocate (GitHub Star, founder of EddieHub, 100k+ developer community). Co-hosted the Oct 6 live build walkthrough. Heavily values **repository hygiene**: clean READMEs, proper open-source license in the GitHub About section, reproducible local setup instructions, TypeScript best practices, and genuine open-source community utility. |
| 3 | **Marco Podien** | *Developer Advocate - PayPal* | Developer Advocate at PayPal based in Europe; co-host of the Oct 6 & Oct 13 *Start building with PayPal* sessions and PayPal DevDay workshops. Focuses on full-stack PayPal integrations (JavaScript SDK, Orders v2, Server SDKs, PayPal Agent Toolkit, and MCP servers). Looks for frictionless checkout UX and well-structured PayPal Sandbox integrations. |
| 4 | **Karthik Ravi** | *Software Engineer - PayPal* | Infrastructure and platform Software Engineer at PayPal, known for conference talks on operating large-scale Kubernetes clusters and scaling massive Jupyter notebook/AI compute environments at PayPal. Evaluates **Technological Implementation** with an eye toward scalable architecture, reliability, containerization, and non-trivial backend engineering. |
| 5 | **Himraj Singh** | *Engineering Manager - PayPal* | Software Engineering Manager at PayPal focusing on **Enterprise AI, Trust, Security, and Developer Ecosystems** (speaker at WeAreDevelopers on enterprise AI trust and security). Cares deeply about **guardrails, human-in-the-loop authorization, audit trails, fraud/risk controls, and safe execution** when AI agents move money. |
| 6 | **Nathaniel Olson** | *Senior Product Manager - PayPal* | Senior Product Manager / Product Lead for **Developer Experience, Server SDKs, Agentic Commerce, and AI Context Tooling** at PayPal. Featured speaker at PayPal DevDay and Nordic APIs on *Deterministic API Context for AI Coding Assistants*, **APIMatic Context Plugins**, **PayPal Server SDK**, and **Model Context Protocol (MCP)**. He is the product brain behind PayPal's push into deterministic AI-assisted coding and agentic commerce—projects that showcase **MCP + `@paypal/agent-toolkit` + APIMatic Context Plugins** speak directly to his product roadmap. |
| 7 | **Ishan Shah** *(Supplementary)* | *Staff Software Engineer - PayPal* | Cited in Devpost judging index summaries as a Staff Software Engineer at PayPal participating in baseline/technical evaluation of AI and software architecture submissions. |

### 6.2 Sponsor & Ecosystem Judging Panel (7 Official Devpost Judges)

| # | Name | Official Title on Devpost | Background, Technical Focus & What They Value |
|---|---|---|---|
| 8 | **Sylwia Vargas** | *Senior Technical Community Manager - AG Grid* | Senior Technical Community Manager at **AG Grid** (and Bryntum); previously DevRel at StackBlitz, Prisma, Draftbit. Evaluates the **$10,000 Best Use of AG Grid** track and co-led the Oct 12 dashboard webinar initiative. Rewards projects that go beyond basic tables to use **AG Grid Enterprise / AG Studio features**: integrated financial charts, real-time transaction streaming, row grouping, custom cell renderers, and AI-driven grid filtering. |
| 9 | **Ameer Hassan** | *Co-Founder - APIMatic* | Co-Founder and VP of Strategy at **APIMatic**. Co-led the partnership bringing **APIMatic Context Plugins** and strongly-typed **PayPal Server SDKs** to PayPal's developer portal. Evaluates the **$3,000 Best Use of APIMatic** prize. Looks for developers who use APIMatic Context Plugins (via MCP in Claude Code/Cursor) and the generated PayPal Server SDK to build hallucination-free, multi-endpoint PayPal integrations, and who document this workflow clearly in their repo/video. |
| 10 | **Mats Bryntse** | *CEO - Bryntum* | Founder & CEO of **Bryntum**. Evaluates the **$3,000 Best Use of Bryntum** track. Looks for rich interactive scheduling, resource allocation, Gantt timelines, or calendar-driven financial workflows (e.g., milestone-based contractor payouts or subscription billing schedules) where Bryntum UI components drive real PayPal transactions. |
| 11 | **Ignacio Valdez Bicard** | *Founding Engineer - Channel3* | Founding Engineer at **Channel3**. Evaluates the **$1,500 Best Use of Channel3** prize. Looks for AI shopping agents and agentic commerce experiences that query Channel3's normalized multi-million-product catalog (via API or MCP server) and seamlessly execute checkout via PayPal Orders/Agent Toolkit. |
| 12 | **Carly Richmond** | *Senior Manager, Developer Advocacy - Elastic* | Senior Manager of Developer Advocacy & Principal Developer Advocate at **Elastic** (former enterprise frontend/full-stack engineer in investment banking). Specializes in **Elasticsearch vector search, hybrid RAG, and AI agent observability**. Values grounding AI financial agents in verifiable data via Elastic search/RAG and clean UI/UX. |
| 13 | **Pooja Mistry** | *Sr. Developer Advocate - Postman* | Senior Developer Advocate at **Postman**. Specializes in API-first design, Postman Collections, AI-native API workflows, and MCP server testing. Values clean API orchestration and well-documented endpoints. |
| 14 | **Shifra Williams** | *Founding Developer Relations Engineer - Render* | Founding DevRel Engineer at **Render**. Evaluates the **$2,250 Best Use of Render** prize. Focuses on production deployment on Render (web services, managed Postgres, background workers, and **Render Workflows** for durable multi-step AI agent execution) and requires a live hosted Render URL. |

---

## 7. Project Gallery & Submission Landscape Analysis

- **Current Hackathon Status (as of November 5, 2026):**
  - The hackathon is currently in its **final week of the open submission phase** (submissions close **November 12, 2026 at 12:00 PM PT**, judging runs **December 1–15, 2026**, and winners are announced **December 21, 2026**).
  - Because judging has not yet begun, **no winners have been announced**, and Devpost's `/project-gallery` is populated only by early submissions prior to the November 12 deadline.
- **Observed Early Submission Patterns (`site:devpost.com/software "PayPal AI Hackathon"`):**
  - **25,000+ registered participants** on Devpost, with typical online Devpost conversion rates implying ~500–1,500 final submissions by November 12, 2026.
  - Early public submissions indexed on Devpost (`devpost.com/software/...`) cluster around two primary archetypes:
    1. **Autonomous Payment & Ledger Agents:** Systems combining **Claude (Anthropic SDK)** or **OpenAI** with **PayPal Invoicing v2, Orders v2, Payouts, and MCP servers** to automate billing, negotiate payment plans, or execute ledger reconciliations with strict audit logs and spend guardrails.
    2. **Agentic Commerce Assistants:** Conversational or workflow agents that discover products, manage subscriptions, process refunds/disputes, or trigger low-code payment automations.
- **Competitive Gap & Opportunity Analysis:**
  - Most typical hackathon entrants build thin "chat-with-checkout" wrappers that fail **Himraj Singh's** enterprise trust/guardrail standards, **Nathaniel Olson's** deterministic SDK/MCP integration vision, **Karthik Ravi's** backend depth bar, and **Sylwia Vargas's** enterprise dashboard UX bar.
  - A submission that combines:
    1. **PayPal Agent Toolkit (`@paypal/agent-toolkit`) + PayPal MCP Server + PayPal Server SDK (Orders v2, Invoicing v2, Payouts, Disputes, Webhooks)**,
    2. **APIMatic Context Plugins** for deterministic schema/SDK grounding,
    3. **Policy-enforced Agentic Commerce Guardrails** (cryptographic/programmable budget caps, human-in-the-loop approval thresholds, real-time webhook reconciliation),
    4. **AG Grid / AG Studio** (and optionally **Bryntum** / **Channel3**) for an executive-grade financial control plane, and
    5. Live cloud deployment on **Render** with a crisp **<3-minute YouTube demo** and MIT/Apache-2.0 licensed GitHub repo
    is positioned to dominate both the **Overall Podium ($12,000)**, **Best Use of Agentic Commerce ($5,000)** / **Best Use of PayPal + AI ($5,000)**, and multiple **Sponsor Awards ($5,000 AG Grid + $1,000 APIMatic + $1,000 Render Credits)**.
