# Skill & Deliverable Specification Inventory (`war-room-council`, `bible`, `ORIGINAL_REQUEST.md`)

## 1. Executive Summary & Critical Spec Reconciliations

This document catalogs every authoritative requirement, file path, section template, scoring rubric, council persona rule, helper script, and anti-placeholder constraint from:
1. `C:\Users\suraj\.gemini\config\skills\war-room-council\` (`SKILL.md`, `references/*.md`, `scripts/md2pdf.py`)
2. `C:\Users\suraj\.gemini\config\skills\bible\` (`SKILL.md`, `references/doc-catalog.md`)
3. `s:\PayPal\.agents\teamwork\ORIGINAL_REQUEST.md` (Requirements R1–R4 and Acceptance Criteria)

### ⚠️ Critical Reconciliations Between `ORIGINAL_REQUEST.md` and Skill Defaults
Downstream builders and reviewers **must** honor the following four reconciliations where `ORIGINAL_REQUEST.md` adds stricter or more specific constraints on top of the base skills:

1. **Workspace Output Root (`s:\PayPal` vs `~/hackathons/<slug>/`)**:
   - Base `war-room-council/SKILL.md` (Step 0) defaults to `~/hackathons/<slug>/` and `bible/SKILL.md` (Step 2) defaults to `~/hackathons/<hackathon-slug>/build/<idea-slug>/`.
   - `ORIGINAL_REQUEST.md` (lines 7, 21, 24, 34, 40, 43) explicitly requires `biblehackathon.md`, `biblehackathon.pdf`, `ideas.md`, `ideas.pdf`, and the complete `/bible` project specification and execution plan suite to exist directly inside `s:\PayPal`.
2. **Multi-Round Debate Transcripts Inside `biblehackathon.md` and `ideas.md`**:
   - Base `war-room-council/references/output-templates.md` (line 108) states: *"Rules for ideas.md: No war-room transcript; only conclusions"* (keeping transcripts only in `war-room/<domain>.md`).
   - `ORIGINAL_REQUEST.md` Acceptance Criterion 2 (line 37) **explicitly overrides** this: *"The council analysis in `biblehackathon.md` and `ideas.md` explicitly includes named members of the PayPal Mafia alongside PayPal CEOs, executives, and engineering personas, with multi-round debate transcripts evaluating candidate approaches against PayPal's actual tech stack and judging criteria."*
   - **Rule for Downstream Workers**: Include both the structured template tables/verdicts **AND** the explicit multi-round war-room debate transcripts (`**SPEAKER:** ... [S#]`) in `biblehackathon.md` (Part 6 / synthesis debate) and `ideas.md` (per-domain war-room debate rounds) in addition to `war-room/<domain>.md`.
3. **Mandatory PayPal Mafia + PayPal Leadership Council Expansion**:
   - Base `war-room-council` has 11 Core Seats + 6 Extra Strategy Seats + Domain Bench.
   - `ORIGINAL_REQUEST.md` (R2, line 18; AC2, line 37) requires explicitly adding the **PayPal Mafia** (Peter Thiel [already Seat #1], Elon Musk [already Seat #8], plus **Reid Hoffman, Max Levchin, David Sacks, Roelof Botha, Keith Rabois**) alongside **PayPal current/former CEOs, executives, and engineering leaders** (with full persona dossiers in `war-room/roster-additions.md` and in-character multi-round debate participation).
4. **Clarification on `/bible` Folder Numbering (`docs/00-overview` through `docs/08-project`)**:
   - While informal summaries mention `01-...` through `10-...`, the authoritative `bible/SKILL.md` (line 36) and `bible/references/doc-catalog.md` (lines 30–117) define **9 numbered folders from `docs/00-overview` through `docs/08-project`** (plus `docs/03-engineering/adr/`, root files, `api/openapi.yaml`, `.github/workflows/`, and code skeleton directories). See Section 7 below for the exact 65+ file catalog.
5. **⚠️ `AGENTS.md` Rule Warning**:
   - `bible/SKILL.md` (line 71) and `doc-catalog.md` (line 23) list `AGENTS.md` as a root repo file pointing to `CLAUDE.md`. However, Teamwork workspace conventions warn that files named `AGENTS.md` or `GEMINI.md` are loaded as always-on agent rules. Never place `AGENTS.md` inside `.agents/teamwork/`, and verify orchestrator preference before creating `AGENTS.md` in `s:\PayPal`.

---

## 2. Specification Miner Summary Tables

## Features Discovered
| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Skill Workflow (`war-room-council`) | Phase 0 & 1: Hackathon Recon & Fact Extraction | Fetches hackathon page/brochures, saves raw sources, extracts verbatim problem statements, tracks, timeline, prizes, judging criteria, sponsors, and judges. | Hackathon URL (`https://paypalaihackathon.devpost.com/`), team parameters | `research/00-source/*`, `research/01-facts.md`, `state.md` | Falls back from WebFetch to public API, organizer site, web search, browser tool; never fabricates unknown facts (`unknown` or `HUNCH:` with evidence). | `war-room-council/SKILL.md` (lines 49–58), `references/recon-playbook.md` (lines 6–18) |
| 2 | Skill Workflow (`war-room-council`) | Phase 1: Parallel Recon Tracks A–E & Jane Synthesis (Track F) | 5 parallel research tracks (Organisers, Sponsors, Judges/Heat-map, Why-Now/Triggers, Competition Forecast) + Patrick Jane dot-connecting synthesis. | `research/01-facts.md`, web search results | `research/A-organisers.md`, `B-sponsors.md`, `C-judges.md`, `D-why-now.md`, `E-competition.md`, `F-connect-the-dots.md` | Rejects unsourced claims; requires at least 7 connected dots with evidence in `F-connect-the-dots.md`. | `war-room-council/SKILL.md` (lines 60–88), `references/recon-playbook.md` (lines 19–79) |
| 3 | Council Architecture (`war-room-council` + R2) | Persona Dossiers, Jurisdiction Rule & Veto System | 17 default seats (11 Core + 6 Extra) + Domain Bench + PayPal Mafia (Thiel, Musk, Hoffman, Levchin, Sacks, Botha, Rabois) + PayPal CEOs/Leadership. Each seat operates in LEAD, SUPPORT, or SILENT mode per domain. | `references/council-roster.md`, research on new seats | `war-room/roster-additions.md`, Council Roster Table in `state.md` & `biblehackathon.md` | Standing vetoes from Harvey/Sharma (illegal/unlicensed), Mike Ross (exploitative), Karpathy (undemoable in time box), or Munger (unrebutted fatal flaw) block an idea until restructured. | `references/council-roster.md` (lines 1–281), `ORIGINAL_REQUEST.md` (lines 17–18, 37) |
| 4 | Skill Workflow (`war-room-council`) | Phase 2: Domain Deep Research | Per-domain deep dive covering: (1) Pain map with 5+ real voices, (2) Urgency 1–10, (3) Prior art table (startups, GitHub repos, papers, govt systems, past hackathons), (4) Gap analysis in 3 buckets, (5) Rails/data/APIs, (6) Tech frontier, (7) 15+ raw idea seeds. | `research/01-facts.md`, domain/track definitions | `research/domains/<domain>.md` | Every "doesn't exist" claim must list exact search queries run. | `references/war-room-protocol.md` (lines 3–25) |
| 5 | Skill Workflow (`war-room-council`) | Phase 3: Multi-Round War Room Debate & Idea Scoring | Runs Rounds 0–5 per domain (R0 Brief, R1 Idea Storm [20–30 candidates], R2 Attack, R3 Rebuild & Merge, R4 Score & Vote [9-criterion weighted rubric], R5 Polish). | Domain research, council roster, `law-checklist.md` | `war-room/<domain>.md`, `war-room/<domain>-ideas.md`, plus transcripts in `biblehackathon.md` & `ideas.md` per AC2 | Every factual claim in dialogue must end with `[S#]` or `[unverified]`. Top 5 per domain must include >=1 "Doesn't exist" and >=1 "Exists abroad, not in India" if supported. | `references/war-room-protocol.md` (lines 26–65), `ORIGINAL_REQUEST.md` (line 37) |
| 6 | Skill Workflow (`war-room-council`) | Phase 4: Domain Winnability Index | 5-factor weighted ranking of domains/tracks (Competition density 25%, Prior-work saturation 20%, Excitement/demo 20%, Jury/organiser alignment 20%, Feasibility 15%). | Tracks A–E + domain research + war-room outputs | Ranked Winnability table, #1 pick, dark horse pick in `biblehackathon.md` and `ideas.md` | Must state underlying data/uncertainty for estimates. | `references/war-room-protocol.md` (lines 66–80) |
| 7 | Deliverable (`war-room-council` + R1/R3) | `biblehackathon.md` & `biblehackathon.pdf` | 6-part Hackathon & Company Bible + numbered Sources + Council Debate Analysis. | Recon Tracks A–F, PayPal company/tech-stack research, Winnability Index | `s:\PayPal\biblehackathon.md`, `s:\PayPal\biblehackathon.pdf` | H1 (`#`) triggers page break in PDF; avoid raw HTML; every fact needs inline source link. | `references/output-templates.md` (lines 10–50), `ORIGINAL_REQUEST.md` (lines 14–16, 34) |
| 8 | Deliverable (`war-room-council` + R2/R3) | `ideas.md` & `ideas.pdf` | Part 0 (Where to Play + Winnability + All Ideas at a Glance) + Top 5 ranked ideas per domain/track with full template fields, PayPal tech stack architecture, execution sketch, 9-criterion score breakdown, and council debate transcript. | `war-room/<domain>-ideas.md`, `war-room/<domain>.md`, Winnability Index | `s:\PayPal\ideas.md`, `s:\PayPal\ideas.pdf` | Must have no duplicate ideas across domains, all template fields populated, real verified links, and rendered non-empty PDF. | `references/output-templates.md` (lines 54–112), `ORIGINAL_REQUEST.md` (lines 20–21, 37, 40) |
| 9 | Helper Script (`war-room-council`) | `scripts/md2pdf.py` PDF Generator | Converts Markdown to styled A4 PDF with cover page (`WAR ROOM COUNCIL` kicker, title, subtitle), auto-generated TOC (`toc_depth: 1-2`), and custom CSS via headless Edge or Chrome. | `input.md`, optional `output.pdf`, `--title`, `--subtitle` | Styled `.pdf` file; prints `PDF written: <path> (<size> KB)` with exit code 0 | Exits with error message if `python-markdown` missing (`pip install markdown`), no Edge/Chrome found, subprocess times out (>180s), or output PDF is missing/0 bytes. | `war-room-council/scripts/md2pdf.py` (lines 1–117) |
| 10 | Deliverable Suite (`bible` + R4) | `/bible` 55+ File Project Specification & Skeleton | Generates 65+ company-grade documentation files (`MAP.md`, `CLAUDE.md`, `README.md`, `docs/00-overview` through `docs/08-project`, ADRs, `api/openapi.yaml`, `.github/workflows/*.yml`) and project directory skeleton for the #1 council-selected idea. | Top selected idea from `ideas.md`, `biblehackathon.md`, PayPal tech stack context | Complete doc tree + skeleton in `s:\PayPal` | Zero `TODO`/`TBD`/`coming soon` placeholders allowed; all IDs (`F-xx`, `US-xx`, `E-xx`, `API-xx`, `R-xx`, `ADR-xxxx`, `M-xx`) must match `PROJECT_BRIEF.md`. | `bible/SKILL.md` (lines 1–84), `bible/references/doc-catalog.md` (lines 1–126), `ORIGINAL_REQUEST.md` (lines 23–24, 43) |

## Edge Cases
| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | `md2pdf.py` CLI | `python "C:\Users\suraj\.gemini\config\skills\war-room-council\scripts\md2pdf.py" --help` | Exits with code 0; outputs usage showing positional `input`, optional positional `output`, `--title TITLE`, and `--subtitle SUBTITLE`. |
| 2 | `md2pdf.py` Environment Dependencies | Python `markdown` module and browser binary check on Windows host | Verified installed: `markdown 3.10`, `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`, and `C:\Program Files\Google\Chrome\Application\chrome.exe`. |
| 3 | `md2pdf.py` Title Fallback | Omitting `--title` CLI flag when invoking `md2pdf.py` | Automatically extracts the first `# ` (H1) line from the Markdown file as the cover title, or falls back to `src.stem` if no `# ` heading exists (`md2pdf.py` lines 99–101). |
| 4 | `md2pdf.py` Page Break & HTML Handling | Using `#` (H1) for minor sections or embedding raw HTML in Markdown | Every `#` (H1) after the first has CSS `page-break-before: always;`, forcing a new PDF page. Raw HTML may break rendering (`output-templates.md` line 5: "Keep `#` (H1) for major parts only... avoid HTML"). |
| 5 | `war-room-council` vs `ORIGINAL_REQUEST.md` Transcript Rule | Following `output-templates.md` line 108 ("No war-room transcript; only conclusions") literally | Violates `ORIGINAL_REQUEST.md` Acceptance Criterion 2 (line 37), which requires multi-round debate transcripts in `biblehackathon.md` and `ideas.md`. Both conclusions AND multi-round debate transcripts must be included. |
| 6 | `/bible` Anti-Placeholder Gate | Leaving `TODO`, `TBD`, or `coming soon` anywhere in the `/bible` documentation suite | While `doc-catalog.md` line 13 says "No 'TBD' without an owner and a date", `ORIGINAL_REQUEST.md` line 43 enforces a strict zero-tolerance rule: **free of placeholder text (`TODO`, `TBD`, `coming soon`)**. Downstream writers must not use those strings at all. |

---

## 3. Deep-Dive Specification: `war-room-council` Workflow, Research Tracks & Council Rules

### 3.1 Ground Rules (`war-room-council/SKILL.md` lines 27–35)
- **Truth over theatre**: Every fact, number, repo, paper, and news item must come from a real search result with a URL + date link. Never invent sources, star counts, quotes, or judges.
- **Handling unknowns & hunches**: Unknown facts must be explicitly stated as `unknown`. Hunches must be labelled `HUNCH:` and tied to specific evidence.
- **Thinking models, not real quotes**: Council lines are in-character reconstructions based on each person's real decision frameworks; never present war-room dialogue as real-world quotes unless citing an actual researched speech/post with a source link.
- **Recency**: Prefer news, earnings calls, and regulatory updates from the last 12–18 months.

### 3.2 Phase 1 — Reconnaissance Playbook (`references/recon-playbook.md`)
1. **Raw Material & Fact Extraction (`research/00-source/` & `research/01-facts.md`)**:
   - Extract: hackathon name, edition, dates & rounds, format (online/offline, hours), eligibility, team size, prizes, evaluation criteria (with weights), submission requirements (PPT, video, repo, prototype), themes/tracks/domains, every problem statement verbatim with ID and owner, sponsors and tiers, judges/mentors/jury, partner institutions, contacts.
   - **Per R1 (`ORIGINAL_REQUEST.md`)**: Also extract comprehensive research on **PayPal as a company**—its engineering tools, frameworks, infrastructure, tech stacks, APIs/SDKs, product ecosystem (PayPal Checkout, Braintree, Venmo, Hyperwallet, Fastlane, PayPal Zettle, PYUSD, Fraud/Risk AI, Cosmos/JunoDB/Raptor/Hera, etc.), employees, engineering leaders, and current/former CEOs (Alex Chriss, Dan Schulman, etc.).
2. **Five Parallel Recon Tracks**:
   - **Track A — Organisers & Committee (`research/A-organisers.md`)**: Ownership, mandate, hidden motives (hiring, API adoption, R&D, PR, ecosystem building), organizing team backgrounds/posts (last 12 months), previous editions and past winners.
   - **Track B — Sponsors (`research/B-sponsors.md`)**: Business model, latest earnings/strategy, developer products/APIs/models they want used, controversies/regulatory issues, what a sponsor prize rewards, and **which sponsor/PayPal tech to visibly use and why**.
   - **Track C — Judges & Jury Psychology (`research/C-judges.md`)**: Career path, companies founded/invested in, public opinions, pet peeves, what they reward in past judging, likely questions, and a **Judge Heat-Map** (what each judge wants to see in 3 minutes).
   - **Track D — Why These Problem Statements, Why Now (`research/D-why-now.md`)**: Policy triggers, industry/financial incidents, geopolitical lens, historical bottlenecks, sponsor product launches/deadlines. Output per PS: `Trigger → Evidence [source] → What the authors are actually worried about → What a winning answer must prove`.
   - **Track E — Competition Forecast (`research/E-competition.md`)**: Estimated team count, predicted **default ideas (the 80% trap)** for each PS, and prior work counts (GitHub repos with queries/counts, Kaggle datasets, startups, arXiv/Scholar papers from last 3 years).
3. **Track F — Patrick Jane's Synthesis Session (`research/F-connect-the-dots.md`)**:
   - Chaired by Patrick Jane with Jaishankar, Sharma, Thiel, Karp, Graham, and Munger (plus PayPal Mafia/Leadership seats).
   - Must produce 6 items:
     1. **The real reason this hackathon exists** (1 paragraph with evidence)
     2. **What the organisers secretly fear** & **what they want to announce afterwards**
     3. **Hidden evaluation criteria** (what the rubric doesn't state but the jury rewards)
     4. **Landmines** (topics, claims, or tech that will annoy this jury)
     5. **Dots nobody else will connect** (**at least 7 numbered dots**, each with evidence)
     6. **The 80% trap** (what most teams will build, so we avoid it)

### 3.3 Council Composition, PayPal Mafia & Leadership Requirements, Jurisdiction & Vetoes
1. **Default Core Seats (11 seats — always present, `references/council-roster.md`)**:
   - `#1 Peter Thiel` — Market Gaps, Monopoly, Contrarian Truth, 0→1, 7 questions (*PayPal Mafia co-founder*)
   - `#2 Alex Karp` — The Explainer / Philosophy of the Pitch, Ontology first, moral frame
   - `#3 Patrick Jane ◇` — Dot-Connector, Mind-Reader, Organizer/Judge psychology, **Chair of Recon Debate**
   - `#4 Warren Buffett` — Money, Unit Economics, Durability, Float, Pricing Power
   - `#5 Harvey Specter ◇` — Legal Strategy, Global & Indian Law, Licensing/Structuring
   - `#6 Mike Ross ◇` — Human Pain, Empathy, Emotional Truth, Composite Persona grounded in data
   - `#7 Steve Jobs †` — Positioning, Simplicity, 45-second Demo Wow, 3-minute Pitch Theatre
   - `#8 Elon Musk` — Delusional Ambition, First Principles, 5-step Algorithm, Year-10 Moonshot (*PayPal Mafia / X.com co-founder*)
   - `#9 Andrej Karpathy` — AI & Technology Architect, Software 2.0, Evals, Autonomy Slider, Load-bearing AI
   - `#10 S. Jaishankar` — India Strategy & Geopolitics, DPI Diplomacy, Strategic Autonomy
   - `#11 Dr. R.S. Sharma` — India Compliance & Government Machinery, India Stack / DEPA / DPDP Act
2. **Default Extra Strategy Seats (6 seats — always present)**:
   - `#12 Charlie Munger †` — Inversion, Pre-Mortem ("how does this die"), Incentives
   - `#13 Seth Godin` — Positioning, Smallest Viable Audience, Remarkability
   - `#14 Gary Vaynerchuk` — Distribution & Attention, First 10,000 Users Channels
   - `#15 Tim Cook` — Operations, Supply Chain, Scale, SLAs, Day-to-Day Execution
   - `#16 Jony Ive` — Product Craft, 3-Screen Core UX Flow, Material Honesty
   - `#17 Paul Graham` — Startup Judgement, Schlep Blindness, Tarpit Detector, **Chair of Idea Scoring**
3. **Mandatory PayPal Mafia Expansion (`ORIGINAL_REQUEST.md` R2 & AC2)**:
   - In addition to **Peter Thiel** and **Elon Musk**, the council **must** explicitly include:
     - **Reid Hoffman** (PayPal EVP / Founding Board Member, LinkedIn co-founder, Greylock, Blitzscaling, network effects & viral distribution)
     - **Max Levchin** (PayPal co-founder & CTO, Affirm founder/CEO, Igor/Gausebeck-Levchin test [CAPTCHA], fraud/risk engines, point-of-sale BNPL underwriting)
     - **David Sacks** (PayPal original COO / product leader, Yammer, Craft Ventures, SaaS metrics, bottom-up enterprise virality, craft of product execution)
     - **Roelof Botha** (PayPal CFO, Sequoia Capital Managing Partner, unit economics, fraud-loss vs TPV margin discipline, 10x scale metrics)
     - **Keith Rabois** (PayPal EVP Business Development, Khosla Ventures / Founders Fund / OpenStore, barrel vs ammunition talent, proprietary data/distribution leverage)
4. **Mandatory PayPal CEOs, Executives & Engineering Leadership Bench (`ORIGINAL_REQUEST.md` R1, R2, AC2)**:
   - Must include researched dossiers and active debate turns for key PayPal leadership & technical personas (e.g., **Alex Chriss** [President & CEO — Fastlane, SMB/Enterprise commerce, AI-driven checkout personalization], **Srini Venkatesan** [CTO — PayPal AI platform, Cosmos, commerce agents], **Archie Deskus** [EVP & CISO/Tech Ops], **Prakhar Mehrotra** [SVP AI], **Dan Schulman** [former CEO], plus default FinTech bench seats **Patrick Collison**, **Vijay Shekhar Sharma**, **Nandan Nilekani**).
   - For every newly added seat not in `council-roster.md`, write a complete 6-field dossier (`Rise`, `How they decide`, `Asks`, `Attacks`, `Voice`, `Blind spot`) into `war-room/roster-additions.md`.
5. **Jurisdiction Modes & Veto Rules (`references/council-roster.md` lines 14–29)**:
   - **LEAD (aggressive)**: Core seats owning the dimension + home-domain bench + PayPal Mafia/Leadership seats. Full attack, rebuild, and veto power.
   - **SUPPORT (constructive)**: Cross-domain experts adding 1 transferable insight (no vetoes).
   - **SILENT**: Domain experts with nothing real to add stay silent.
   - **Four Standing Vetoes** (an idea cannot pass while a veto stands):
     1. **Harvey Specter / R.S. Sharma**: Illegal or requires an unobtainable license → veto until restructured (e.g., partnering with a licensed entity / PayPal rail).
     2. **Mike Ross**: Hurts or exploits the users it claims to help → veto.
     3. **Andrej Karpathy**: Cannot be credibly built and demoed within the hackathon time box → veto unless scope is cut.
     4. **Charlie Munger**: Has an obvious, fatal "how does this die" flaw nobody can rebut → veto.
6. **Speaking Protocol (`references/council-roster.md` lines 273–280)**:
   - Format: `**SPEAKER:** <1–4 sentences> [S#]` (every factual claim ends with `[S#]` mapped to sources or `[unverified]`).
   - Attack ideas aggressively, never insult people.
   - No seat may say "this is impossible" except as a precise constraint; Musk answers every "impossible" with a first-principles cut.

### 3.4 Phase 2–4 — Domain Research, War Room Rounds 0–5, and Scoring Rubrics (`references/war-room-protocol.md`)
1. **Phase 2 (`research/domains/<domain>.md`) — 7 Required Sections**:
   - (1) **The pain map** (who suffers, how many, cost in $/₹/hours, why fixes fail, **5+ real voices** with quotes and links)
   - (2) **Urgency** (recent news from last 12 months with dates, policy/industry deadlines, budget/investment lines, **Urgency Score 1–10** with reasons)
   - (3) **Prior art** (table of startups/products, GitHub repos with stars/last commit/search queries, research papers with year/venue/link, deployed systems, past hackathon winners)
   - (4) **Gap analysis in 3 buckets**:
     - `Exists-but-weak` (what exists, specific weakness, 10x improvement)
     - `Doesn't exist` (why nobody is doing it and why it is now solvable)
     - `Exists abroad, not in India` / `Cross-market gap` (what works elsewhere and what must adapt for target market/PayPal rails)
   - (5) **Rails, APIs & data available** (PayPal APIs/SDKs, sandboxes, open datasets, India Stack/global rails)
   - (6) **Tech frontier** (newest models, protocols, agent frameworks, PayPal AI tooling with sources)
   - (7) **Raw idea seeds** (**15+ one-line seeds**, each tagged with its gap bucket)
2. **Phase 3 (`war-room/<domain>.md`) — 6 Sequential Rounds (Rounds 0–5)**:
   - **Round 0 — Brief (Patrick Jane, 5 lines)**: What PS authors/PayPal really want, the 80% trap, best dots.
   - **Round 1 — Idea Storm**: Every LEAD seat proposes 1–3 ideas (**aim for 20–30 candidates** per domain; Thiel and Musk must each propose at least one crazy idea).
   - **Round 2 — Attack**: Idea-by-idea aggressive critique in strict order: `Munger (pre-mortem) → Harvey + Sharma (legal/regulatory) → Buffett + Botha (who pays / unit economics) → Karpathy + Levchin (buildable & demoable? load-bearing AI & risk?) → Mike Ross (human help & ethics) → Graham + Sacks + Rabois (tarpit? judge appeal? distribution?) → Domain/PayPal Leads (field & stack reality)`. Musk and Thiel defend or rescue. Vetoed ideas die or get restructured.
   - **Round 3 — Rebuild & Merge**: Combine survivors; sharpen the secret (Thiel), the human (Mike), the rail/compliance (Sharma/Harvey), the moat & economics (Buffett/Botha), the PayPal/AI stack (Karpathy/Levchin/Chriss).
   - **Round 4 — Score & Vote**: Score survivors using the 9-criterion weighted rubric. **Top 5 ideas per domain** advance (must include >=1 `Doesn't exist` and >=1 `Exists abroad, not in India` / cross-market idea if supported by research).
   - **Round 5 — Polish**: Jobs names each top-5 idea and writes the one-liner; Karp writes the 30-second explanation; Godin defines who it is for; Gary Vee + Hoffman define the first-10k-users channel; Ive designs the 3-screen UX flow.
3. **Idea Scoring Rubric (9 Criteria, Weighted Total out of 10.0)**:
   | # | Criterion | Weight | Rubric Key (`ideas.md`) | Owner |
   |---|---|---|---|---|
   | 1 | Pain severity & scale | 15% | `pain` | Mike Ross + Domain/PayPal Lead |
   | 2 | Novelty / secret (gap others miss) | 15% | `novelty` | Thiel + Jane |
   | 3 | Alignment with organiser/judge/sponsor intent | 15% | `alignment` | Jane + Jaishankar + PayPal Leadership |
   | 4 | Demo-ability & wow in the time box | 15% | `demo` | Jobs + Karpathy |
   | 5 | Technical feasibility for this team | 10% | `feasibility` | Karpathy + Levchin |
   | 6 | Ecosystem / India / Rail fit & deployability | 10% | `India` / `rail fit` | Sharma + Jaishankar |
   | 7 | Business viability & unit economics | 10% | `business` | Buffett + Botha |
   | 8 | Legal/compliance cleanliness | 5% | `legal` | Harvey + Sharma |
   | 9 | Moonshot scale | 5% | `moonshot` | Musk |
4. **Phase 4 — Domain Winnability Index (5 Factors, Weighted Total)**:
   | # | Factor | Weight | Measurement Basis |
   |---|---|---|---|
   | 1 | Competition density (inverse) | 25% | Predicted share of teams choosing this domain/track |
   | 2 | Prior-work saturation (inverse) | 20% | GitHub repo counts, past-hackathon projects, startups for the PS |
   | 3 | Excitement / demo factor | 20% | How visual, live, and surprising a demo can be |
   | 4 | Jury & organiser alignment | 20% | From Tracks A, C, D: how much PayPal decision-makers & judges care |
   | 5 | Feasibility for the team in the time box | 15% | Data/API/sandbox access, complexity |

---

## 4. Deep-Dive Specification: `biblehackathon.md` & `biblehackathon.pdf`

- **Target Paths**: `s:\PayPal\biblehackathon.md` and `s:\PayPal\biblehackathon.pdf`
- **Formatting Rules (`references/output-templates.md` lines 3–7)**:
  - Keep `#` (H1) for **major parts only** (each `#` starts a new page in the PDF).
  - Use `##` (H2) for sections and `###` (H3) for subsections.
  - Markdown tables render cleanly; **avoid raw HTML**.
  - Every factual claim must have an inline source link (`[S#]` or `[Source](url)`).
  - End the file with a numbered `# Sources` section.
- **Required Heading & Content Structure**:
  ```markdown
  # <Hackathon Name> — The Hackathon Bible
  > One-paragraph verdict: what this hackathon really is, why it exists, and how to win it.

  # Part 1 — The Facts
  ## At a glance
  (Table: dates, rounds, format, team size, prizes, eligibility, submission format, links)
  ## Evaluation criteria
  (Stated weights + council's read of the hidden weights)
  ## Themes & problem statements
  (Every PS/track: ID, title, owner, one-line summary, verbatim details)
  ## Timeline & deliverables checklist
  ## PayPal Company, Product Ecosystem & Engineering Stack Forensics (Required by R1 & AC1)
  (Comprehensive breakdown of PayPal's tools, frameworks, languages, infrastructure [Raptor, JunoDB, Hera, Cosmos AI, GraphQL, Node.js/Java/Python/React], APIs/SDKs [PayPal REST APIs, Braintree, Venmo, Fastlane, Zettle, Hyperwallet, PYUSD, Agentic/MCP toolkits], and engineering culture)

  # Part 2 — The People
  ## Organisers & committee
  (Who, mandate, motive, evidence; plus PayPal current & former CEOs [Alex Chriss, Dan Schulman] and executive/engineering leadership priorities per R1)
  ## Sponsors & ecosystem partners
  (Each: what they sell, what they want from this, how to win their prize, which PayPal/partner tech to visibly use)
  ## Judges & jury
  (Each: background, what they reward, likely question, how to pitch to them)
  ## Judge heat-map
  (Table: Judge × Role/Background × What They Want × Likely Question × Our Pitch Angle)

  # Part 3 — Why This Hackathon, Why Now
  ## The real reason it exists
  ## Policy, regulatory & industry drivers
  ## Incidents & history behind the problem statements
  (Table/list per PS: Trigger → Evidence [source] → Real worry → What a winning answer must prove)
  ## Geopolitical & global commerce lens (global + India DPI/cross-border)
  ## What the organisers want to announce afterwards

  # Part 4 — Connecting the Dots
  ## Dots nobody else will connect
  (At least 7 numbered dots, each with concrete evidence and citations)
  ## Hidden evaluation criteria
  ## Landmines — what will annoy this jury
  ## The 80% trap — what most teams will build

  # Part 5 — The Battlefield
  ## Competition forecast
  (Team estimates, default 80%-trap ideas per domain/track)
  ## Prior work by domain
  (Counts & examples: GitHub repos, startups, papers, past hackathon winners)
  ## Domain Winnability ranking
  (Table with 5 factor scores + weighted total + 3-line rationale per domain + #1 recommended domain & idea + dark horse pick)

  # Part 6 — The Council
  ## Who sat in the war room
  (Table: Seat # · Person · Role/Group [Core / Extra / PayPal Mafia / PayPal Leadership / Domain Bench] · Jurisdiction · Mode per domain [LEAD/SUPPORT/SILENT])
  ## PayPal Mafia & Executive Council Recon Synthesis Transcript (Required by AC2)
  (Multi-round debate transcript chaired by Patrick Jane featuring Peter Thiel, Elon Musk, Reid Hoffman, Max Levchin, David Sacks, Roelof Botha, Keith Rabois, Alex Chriss / PayPal Leadership, Karpathy, Buffett, Munger, Harvey, Sharma, etc. debating PayPal's stack, hackathon tracks, and winning strategy)

  # Sources
  (Numbered list of all verified URLs with dates)
  ```

---

## 5. Deep-Dive Specification: `ideas.md` & `ideas.pdf`

- **Target Paths**: `s:\PayPal\ideas.md` and `s:\PayPal\ideas.pdf`
- **Required Quantity & Diversity**:
  - **Top 5 ranked ideas per domain/track**, ordered by Domain Winnability Index.
  - Per domain, the Top 5 must include at least one `Doesn't exist` idea and at least one `Exists abroad, not in India` (or cross-market gap) idea alongside `Exists-but-weak` ideas.
  - No duplicate ideas across domains.
- **Required Heading & Content Structure**:
  ```markdown
  # <Hackathon Name> — Top Ideas by Domain
  > How to read this: 5 ideas per domain, ranked. Scores are the council's weighted rubric (out of 10).
  > Winnability ranking of domains is in Part 0.

  # Part 0 — Where to Play
  ## Domain Winnability ranking
  (Same 5-factor table as in biblehackathon.md)
  ## The council's #1 pick and dark horse
  (Domain + Idea Name + 5-line reason for #1 pick and dark horse)
  ## All ideas at a glance
  (Master Table: Domain · Rank · Idea Name · Problem Statement ID · Type · Score (/10) · One-liner)

  # <Domain 1 Name>
  ## Domain snapshot
  (3–5 lines: the pain, the urgency, the gap, links)
  ## Multi-Round War Room Debate Transcript (Required by R2 & AC2)
  (Rounds 0–5 debate transcript featuring PayPal Mafia [Thiel, Musk, Hoffman, Levchin, Sacks, Botha, Rabois], PayPal CEOs/executives/engineers, and Core Council seats evaluating candidate approaches against PayPal's actual tech stack and judging criteria)

  ## Idea 1 — <Name>: <one-liner>
  **Type:** Exists-but-weak / Doesn't exist / Exists abroad, not in India   **Score:** X.X/10   **Problem statement:** <ID>

  **The pain (Mike Ross):** Who, how many, a composite person's moment (explicitly marked composite, grounded in cited data).
  **Why now:** Urgency, incident/policy/industry trigger, with sources.
  **The gap others miss (Jane / Thiel):** The contrarian secret in 2–3 lines.
  **What exists and why it falls short:** Table — `Product/Repo/Paper | What it does | Specific gap | Link` (plus exact search queries if claiming "Doesn't exist").
  **How it works:** 4–7 bullet end-to-end flow from user/merchant action to outcome.
  **The demo moment (Jobs):** What judges see in the first 45 seconds.
  **30-second explanation (Karp):** Plain-language paragraph anyone can repeat.

  **Council jurisdiction (verdicts from key seats + PayPal Mafia & Leadership):**
  | Seat | Verdict |
  |---|---|
  | Thiel — market & moat | ... |
  | Levchin / Sacks / Hoffman / Botha / Rabois — PayPal Mafia lens | Fraud/risk architecture, checkout UX, viral network effect, unit economics, proprietary wedge |
  | PayPal Leadership (Chriss / Venkatesan) — PayPal stack & ecosystem fit | Alignment with PayPal APIs, Fastlane, Braintree, Venmo, PYUSD, Cosmos AI |
  | Buffett — money | Revenue model, who pays, $/₹ pricing, float & fintech hooks |
  | Harvey / Sharma — legal & compliance | Applicable laws (PCI-DSS, GLBA, FinCEN, RBI, DPDP, EU AI Act) + how MVP stays clean |
  | Jaishankar — strategic alignment | Global commerce / DPI / sovereign rail alignment |
  | Karpathy — AI & tech | Model choices, eval baseline, why the AI is load-bearing |
  | Mike Ross — human & ethics | Frontline/merchant/consumer impact & safeguards |
  | Munger — how it dies | Top pre-mortem failure mode + concrete mitigation |
  | Musk — year-10 moonshot | 10-year, 100M+ user first-principles scale |
  | <Domain lead> — field reality | Production merchant/payments reality |
  | Godin / Gary Vee — first 10k users | Beachhead audience & acquisition channel |

  **Tech stack (PayPal + Core):** Frontend · Backend · AI/ML (models, APIs, agent framework) · Data (sources, DB) · PayPal Tools & Rails (REST APIs, Braintree, Fastlane, Venmo, PYUSD, JunoDB/Raptor/GraphQL patterns, MCP) · India/Global rails · Infra · Sponsor tech used.
  **Implementation sketch (Execution Plan):** MVP scope for the hackathon time box in hour blocks (e.g., H0–6 data + backend, H6–18 core AI + PayPal API integration, H18–30 UI + end-to-end flow, H30–36 evals + polish + pitch), what is real vs mocked in the demo, datasets/sandboxes with links.
  **Score breakdown:** `pain X · novelty X · alignment X · demo X · feasibility X · India/rail fit X · business X · legal X · moonshot X` (weighted total = X.X/10).

  (Repeat exact format for Idea 2, Idea 3, Idea 4, Idea 5 in Domain 1)

  # <Domain 2 Name>
  ... (Repeat for every domain/track in winnability order)

  # Sources
  (Merged numbered list of all verified URLs with dates and search queries)
  ```

---

## 6. Deep-Dive Specification: PDF Generation Script (`md2pdf.py`)

- **Script Path**: `C:\Users\suraj\.gemini\config\skills\war-room-council\scripts\md2pdf.py`
- **How It Works**:
  1. Reads UTF-8/UTF-8-SIG Markdown file.
  2. Converts Markdown to HTML using `python-markdown` with extensions `["tables", "fenced_code", "toc", "sane_lists", "attr_list"]` (`toc_depth: "1-2"`).
  3. Prepends a styled `.cover` page (`WAR ROOM COUNCIL` kicker, `--title` [or first `# ` heading], and `--subtitle`) and a `.toc` (`Contents`) page.
  4. Applies embedded A4 print CSS (`@page { size: A4; margin: 18mm 16mm 20mm 16mm; }`, Segoe UI/Inter font, `#b3261e` crimson accents, dark table headers, `page-break-before: always` on every `h1` after the first).
  5. Writes temporary HTML to a temp dir and invokes headless Microsoft Edge or Google Chrome (`--headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf=<out>`).
  6. Verifies output file exists and has size > 0 bytes, then prints `PDF written: <path> (<KB> KB)`.
- **Exact Commands to Render Required Deliverables in `s:\PayPal`**:
  ```powershell
  python "C:\Users\suraj\.gemini\config\skills\war-room-council\scripts\md2pdf.py" "s:\PayPal\biblehackathon.md" "s:\PayPal\biblehackathon.pdf" --subtitle "PayPal AI Hackathon · 2026"
  python "C:\Users\suraj\.gemini\config\skills\war-room-council\scripts\md2pdf.py" "s:\PayPal\ideas.md" "s:\PayPal\ideas.pdf" --subtitle "PayPal AI Hackathon · Top Ideas by Domain"
  ```
- **Verified Local Machine Status**:
  - `python-markdown` v3.10 is already installed (`import markdown` succeeds).
  - Headless browser binaries found: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` and `C:\Program Files\Google\Chrome\Application\chrome.exe`.

---

## 7. Deep-Dive Specification: `/bible` 55+ File Project Specification Suite

Per `C:\Users\suraj\.gemini\config\skills\bible\SKILL.md` and `C:\Users\suraj\.gemini\config\skills\bible\references\doc-catalog.md`, the `/bible` suite for the council's #1 selected idea must be generated inside `s:\PayPal` (either directly rooted in `s:\PayPal` or with `MAP.md` and `docs/` accessible in `s:\PayPal` per R4/AC4 — **Recommendation**: place `MAP.md`, `CLAUDE.md`, `docs/00-overview/` … `docs/08-project/`, `api/openapi.yaml`, `.github/workflows/`, and the code skeleton folders directly in `s:\PayPal\` so that any reviewer checking `s:\PayPal\MAP.md` and `s:\PayPal\docs\...` finds them immediately at the top level!).

### 7.1 Mandatory Header Block & Cross-Reference IDs (`doc-catalog.md` lines 3–14)
1. **Every Markdown doc in `docs/` MUST start with this exact header block**:
   ```markdown
   # <Title>
   > Project: <name> · Owner: <role> · Status: Draft v0.1 · Last updated: <YYYY-MM-DD>
   > Related: [PRD](../01-product/PRD.md) · [Architecture](../03-engineering/ARCHITECTURE.md) …
   ```
2. **Single Source of Truth IDs (defined in `docs/00-overview/PROJECT_BRIEF.md` and used consistently across all 55+ files)**:
   - `F-01`, `F-02`, … — Features (with MoSCoW priority)
   - `US-01`, `US-02`, … — User Stories
   - `E-01`, `E-02`, … — Data Entities
   - `API-01`, `API-02`, … — API Endpoints
   - `M-01`, `M-02`, … — AI/ML Models
   - `R-01`, `R-02`, … — Risks
   - `ADR-0001`, `ADR-0002`, … — Architecture Decision Records
3. **MVP vs Production Separation**: Every doc must explicitly distinguish `"MVP (hackathon)"` vs `"v1 (production)"`.
4. **Diagrams**: All architecture, sequence, ER, user journey, C4, and dependency diagrams must use valid **Mermaid** (` ```mermaid `).

### 7.2 Complete File-by-File Catalog (65+ Required Files + Skeleton Directories)

#### Group 0 — Root Repository Files (9 Files)
| # | Relative Path | Purpose & Required Sections |
|---|---|---|
| 1 | `README.md` | **Front door**: One-liner, problem, demo GIF placeholder/workflow, features (`F-xx`), quick start (clone → env → run), tech stack badges, short project structure linking `MAP.md`, docs index, team, licence. |
| 2 | `MAP.md` | **Navigation for humans and AI (written last from actual files on disk)**: Full directory tree with one-line purpose per folder/file; `"Where do I find…?"` table (question → doc); doc dependency graph (Mermaid); tailored reading orders for: new dev, hackathon judge, designer, AI coding agent. |
| 3 | `CLAUDE.md` | **Instructions for AI coding agents**: Project summary, exact commands (`install`/`dev`/`test`/`lint`/`build`), architecture in 10 lines, code conventions, folder rules, do/don't list, security rules (no secrets, PII handling, PCI/PayPal token rules), how to run AI evals, links to key docs. |
| 4 | `AGENTS.md` | **Agent pointer file**: Pointer to `CLAUDE.md` and `MAP.md` (Note: place only in project root if safe, NEVER inside `.agents/teamwork/`). |
| 5 | `CONTRIBUTING.md` | **How to contribute**: Setup, branch naming, commit convention (Conventional Commits), PR template, review checklist, definition of done. |
| 6 | `SECURITY.md` | **Security policy**: Supported versions, vulnerability reporting, response SLAs, security contacts, link to `docs/06-security-compliance/`. |
| 7 | `CHANGELOG.md` | **Keep a Changelog format**: `Unreleased` + `v0.1.0` (Hackathon MVP release). |
| 8 | `CODE_OF_CONDUCT.md` | **Contributor Covenant**: Standard short-form code of conduct. |
| 9 | `.env.example` | **Environment template**: Every required environment variable grouped by service (PayPal Client ID/Secret/Webhook ID, DB URL, Redis, LLM API keys, telemetry) with explanatory comments and zero real secrets. |

#### Group 1 — `docs/00-overview/` (4 Files)
| # | Relative Path | Required Sections |
|---|---|---|
| 10 | `docs/00-overview/PROJECT_BRIEF.md` | **Single source of truth (written first)**: Product name, one-liner, problem, target users, idea type, the contrarian secret, feature list with IDs (`F-xx`) + MoSCoW, core entities (`E-xx`), API surface (`API-xx` names), integrations (PayPal APIs/SDKs + external), full tech stack decisions with exact versions, AI models (`M-xx`), top risks (`R-xx`), non-goals, hackathon constraints (team, hours, judging criteria). |
| 11 | `docs/00-overview/VISION.md` | Vision, mission, north-star metric, 1-year / 5-year / 10-year picture (Musk), core principles, why now (with cited sources), impact thesis. |
| 12 | `docs/00-overview/PITCH.md` | 3-minute pitch script (Jobs structure: villain → hero → live demo → "one more thing"), 30-second explanation (Karp), slide-by-slide outline, demo script with exact clicks and offline/fallback plan if Wi-Fi/API dies, judge Q&A bank (**20+ likely questions mapped to specific judges with answers**), PayPal/sponsor-prize angle. |
| 13 | `docs/00-overview/HACKATHON_PLAN.md` | **Hour-by-hour build plan** (e.g. H01 to H36/H48), team roles, critical path, what is real vs mocked in demo, cut list if behind schedule, submission checklist mapped to every Devpost evaluation criterion, rehearsal schedule. |

#### Group 2 — `docs/01-product/` (8 Files)
| # | Relative Path | Required Sections |
|---|---|---|
| 14 | `docs/01-product/PRD.md` | Background & problem (with cited data), goals & non-goals, success metrics, personas summary, scope (`MVP (hackathon)` / `v1 (production)` / `v2`), functional requirements (per feature `F-xx`: description, user stories `US-xx`, acceptance criteria, priority), non-functional requirements (performance, availability, offline, languages, accessibility, security, privacy), assumptions, dependencies, resolved design decisions, release criteria. |
| 15 | `docs/01-product/PERSONAS.md` | **3–5 personas grounded in cited data**: demographics, device/network, language, day-in-the-life, pains, goals, current workarounds, real sourced quotes from research, what would make them stop using it. |
| 16 | `docs/01-product/USER_JOURNEYS.md` | Current-state vs future-state journey per persona (Mermaid `journey` / `flowchart`), emotional curve, moments of truth, edge cases. |
| 17 | `docs/01-product/USER_STORIES.md` | Epics → stories (`US-xx`) in `"As a… I want… so that…"` format, Gherkin (`Given/When/Then`) acceptance criteria, priority, estimate (`S`/`M`/`L`), mapped feature `F-xx`. |
| 18 | `docs/01-product/FEATURES.md` | Feature matrix table: `F-xx · Name · Description · Persona · MoSCoW · MVP? · Dependency · Owner`; feature flags strategy. |
| 19 | `docs/01-product/ROADMAP.md` | Hackathon MVP → 30/60/90 days → 6 months → 1 year; concrete milestones, merchant/enterprise pilots, PayPal ecosystem partnerships. |
| 20 | `docs/01-product/METRICS.md` | North star metric, input metrics, AARRR funnel, payment/conversion impact metrics, analytics event taxonomy (`event_name`, `properties`, `trigger`), dashboard layout. |
| 21 | `docs/01-product/COMPETITIVE_ANALYSIS.md` | Competitor table (US/global + India, funding, features, pricing, specific weaknesses), 2x2 positioning map, our moat (Thiel), why incumbents/competitors cannot copy fast. |

#### Group 3 — `docs/02-design/` (4 Files)
| # | Relative Path | Required Sections |
|---|---|---|
| 22 | `docs/02-design/DESIGN_SYSTEM.md` | Design principles (Ive + PayPal brand harmony), colour tokens (light/dark hex/OKLCH), typography (including multi-script/Indic support), spacing scale, component inventory, iconography, motion/spring tokens, voice & tone. |
| 23 | `docs/02-design/UI_SPEC.md` | Every screen: purpose, layout (**ASCII wireframe**), component breakdown, interactive states (`empty` / `loading` / `error` / `offline` / `success`), microcopy, analytics events fired. |
| 24 | `docs/02-design/ACCESSIBILITY.md` | WCAG 2.2 AA checklist, keyboard navigation, screen reader ARIA patterns, colour contrast ratios, font scaling, cognitive/low-literacy & voice-assisted checkout patterns, ADA/EAA/RPwD compliance. |
| 25 | `docs/02-design/LOCALIZATION.md` | Supported locales & currencies (multi-currency PayPal settlement + regional languages), i18n framework, translation pipeline, RTL/script/font handling, number/date/currency (`$`, `€`, `£`, `₹`) formatting rules. |

#### Group 4 — `docs/03-engineering/` + `adr/` + `api/` (18+ Files)
| # | Relative Path | Required Sections |
|---|---|---|
| 26 | `docs/03-engineering/ARCHITECTURE.md` | **C4 model**: Context, Container, and Component diagrams (Mermaid); key flows as Mermaid sequence diagrams; data flow; deployment view; scalability approach (referencing PayPal architectural patterns: Raptor/GraphQL/JunoDB/Kafka/idempotent payment state machines); offline/retry strategy; failure modes; trade-offs; links to ADRs. |
| 27 | `docs/03-engineering/TECH_STACK.md` | Table: `Layer · Choice · Exact Version · Why (Karpathy/PayPal alignment) · Alternatives Rejected · Licence` across frontend, mobile, backend, DB, cache, queue, AI/LLM, infra, CI, monitoring, auth, payments/PayPal SDKs, rails, sponsor tech. |
| 28 | `docs/03-engineering/DATA_MODEL.md` | **ER diagram (Mermaid)**, every entity `E-xx` with exact fields, SQL/JSON types, constraints, indexes, PII/PCI classification per field, retention period, schema migration strategy. |
| 29 | `docs/03-engineering/API_SPEC.md` | REST/GraphQL/webhook conventions (versioning, RFC 7807 error format, cursor pagination, OAuth2/JWT auth, `PayPal-Request-Id` idempotency headers), every endpoint `API-xx` with method, path, full request/response JSON examples, status codes, rate limits, auth scopes, webhook signature verification. |
| 30 | `api/openapi.yaml` | **Complete, valid OpenAPI 3.1 YAML specification** matching every `API-xx` endpoint and `E-xx` schema in `API_SPEC.md` and `DATA_MODEL.md`. |
| 31 | `docs/03-engineering/INTEGRATIONS.md` | Every external & PayPal integration (PayPal Orders v2, Subscriptions, Payouts/Hyperwallet, Braintree, Fastlane, PYUSD, Risk/Disputes API, Webhooks, LLM providers, etc.): purpose, sandbox access steps + links, auth flow, data exchanged, failure/retry/circuit-breaker handling, cost per call. |
| 32 | `docs/03-engineering/FRONTEND.md` | App architecture, routing, state management, data fetching, PayPal JS SDK / React PayPal JS integration, performance budget, folder conventions, component patterns. |
| 33 | `docs/03-engineering/BACKEND.md` | Service layout, domain modules, background workers, queues, caching (JunoDB/Redis patterns), RBAC/ABAC auth model, input validation (Zod/Pydantic), error handling, strict payment idempotency. |
| 34 | `docs/03-engineering/CODING_STANDARDS.md` | Language style guides (TypeScript/Python/Java), linter/formatter rules, naming conventions, structured logging rules (zero secrets/PANs), code review checklist. |
| 35 | `docs/03-engineering/GIT_WORKFLOW.md` | Trunk-based / GitHub flow branching, branch naming, Conventional Commits, PR rules, release tagging, semantic versioning. |
| 36 | `docs/03-engineering/TESTING.md` | Test pyramid, unit/integration/e2e/contract/load/security tests, frameworks (Vitest/Playwright/Pytest), coverage targets, synthetic test data (PayPal Sandbox test cards/accounts, no real PII), CI gates, manual demo test script. |
| 37 | `docs/03-engineering/PERFORMANCE.md` | SLOs/SLIs (latency p50/p95/p99, availability, error budget), checkout latency targets, load test plan (k6/Locust), caching tiers, cost-performance trade-offs. |
| 38 | `docs/03-engineering/ENVIRONMENT_SETUP.md` | Prerequisites (Node/Python/Docker versions), step-by-step local setup on Windows/macOS/Linux, PayPal Sandbox credential setup, seed script usage, troubleshooting table. |
| 39 | `docs/03-engineering/adr/ADR-0000-template.md` | Standard MADR (Markdown Any Decision Records) template: Status, Context, Decision Drivers, Considered Options, Decision Outcome, Consequences. |
| 40 | `docs/03-engineering/adr/ADR-0001-tech-stack.md` | ADR #1: Core Frontend/Backend/PayPal SDK Architecture choice. |
| 41 | `docs/03-engineering/adr/ADR-0002-database-and-state.md` | ADR #2: Primary Database, Caching, and Idempotent Ledger design. |
| 42 | `docs/03-engineering/adr/ADR-0003-ai-model-and-agent-architecture.md` | ADR #3: AI/LLM Model & Agent orchestration choice (`M-xx`). |
| 43 | `docs/03-engineering/adr/ADR-0004-hosting-and-deployment.md` | ADR #4: Cloud Infrastructure & Deployment topology. |
| 44 | `docs/03-engineering/adr/ADR-0005-auth-and-payment-security.md` | ADR #5: Authentication, Webhook Verification & Tokenization security model. |

#### Group 5 — `docs/04-ai/` (5 Core Files + 1 Optional)
| # | Relative Path | Required Sections |
|---|---|---|
| 45 | `docs/04-ai/MODELS.md` | Every model `M-xx`: task, exact model name & provider/version, why chosen, alternatives rejected, inputs/outputs, latency & cost per call (`$` and `₹`), context window limits, fallback model, on-device vs cloud, multilingual performance, formal Model Card (intended use, limitations). |
| 46 | `docs/04-ai/PROMPTS.md` | Versioned system prompts and prompt templates, tool/function calling JSON schemas (including PayPal Agentic/MCP tools), output guardrails, few-shot examples, prompt-injection & jailbreak defences. |
| 47 | `docs/04-ai/AI_EVALS.md` | Eval datasets (source, size, labelling methodology), task-specific metrics (precision/recall/F1, tool-call accuracy, hallucination rate, latency), baselines, acceptance thresholds, red-team test suite, CI regression gate, human-in-the-loop review loop. |
| 48 | `docs/04-ai/DATA_PIPELINE.md` | Data sources (with URLs/licences), ingestion, cleaning/PII scrubbing, synthetic data generation, embeddings & vector store schema, RAG architecture (chunking, hybrid retrieval, re-ranking), refresh cadence, data lineage. |
| 49 | `docs/04-ai/RESPONSIBLE_AI.md` | Bias & fairness analysis (demographic, geographic, merchant-size), explainability (reason codes for risk/financial decisions), human-in-the-loop thresholds, autonomy levels (Karpathy slider), misuse scenarios, alignment with NIST AI RMF, EU AI Act tier, and MeitY/IndiaAI guidelines. |

#### Group 6 — `docs/05-ops/` + `.github/workflows/` (6 Core Docs + Workflow YAMLs)
| # | Relative Path | Required Sections |
|---|---|---|
| 50 | `docs/05-ops/CICD.md` | Pipeline diagram (Mermaid); stages (`lint → test → build → security scan → ai-eval → deploy`); **complete inline GitHub Actions YAML** for each workflow; environments (`dev`/`staging`/`prod`); secrets handling; preview deploys; automated rollback. |
| 51 | `.github/workflows/ci.yml` (and `deploy.yml`) | **Actual, runnable GitHub Actions workflow YAML files** on disk (`bible/SKILL.md` line 61). |
| 52 | `docs/05-ops/INFRASTRUCTURE.md` | Cloud/hosting architecture, regional data residency, network topology diagram (Mermaid), IaC (Terraform/Pulumi/Docker Compose) configuration, container specs, auto-scaling rules, backup policy, cost optimization with credits. |
| 53 | `docs/05-ops/DEPLOYMENT.md` | Step-by-step MVP deployment and production release runbook, feature flags, zero-downtime database migrations, webhook endpoint registration, rollback verification. |
| 54 | `docs/05-ops/OBSERVABILITY.md` | Structured PII-redacted logging, Prometheus/OpenTelemetry metrics & distributed tracing, dashboard panels, alert rules with exact thresholds, LLM observability (token burn, latency, drift), 180-day audit log retention (PCI/CERT-In). |
| 55 | `docs/05-ops/RUNBOOK.md` | On-call rotation basics, incident severity levels (SEV-1 to SEV-4), **step-by-step playbooks for top 10 failure modes**, CERT-In 6-hour / GDPR / DPDP / PCI incident reporting procedures, backup/restore drill, disaster recovery (RPO/RTO), **demo-day emergency fallback plan**. |
| 56 | `docs/05-ops/COST.md` | Monthly cost model table at **100 / 10,000 / 1,000,000 users** (compute, DB, AI tokens, PayPal transaction fees, webhooks/SMS), unit cost per user/transaction in `$` and `₹`, free tiers & credits, cost optimization levers. |

#### Group 7 — `docs/06-security-compliance/` (5 Core Files)
| # | Relative Path | Required Sections |
|---|---|---|
| 57 | `docs/06-security-compliance/SECURITY_ARCHITECTURE.md` | Auth (OAuth2/OIDC/Passkeys), fine-grained authorization, TLS 1.3 / AES-256 encryption, KMS key management, webhook HMAC/cert verification, **OWASP Top 10 + OWASP LLM Top 10 mitigations**, PCI-DSS SAQ-A / tokenization boundaries, dependency scanning, pen-test plan. |
| 58 | `docs/06-security-compliance/THREAT_MODEL.md` | Data flow diagram with trust boundaries (Mermaid), **STRIDE table per component**, payment/AI abuse cases (account takeover, friendly fraud, webhook replay, prompt injection, agent unauthorized spend), mitigations, residual risk. |
| 59 | `docs/06-security-compliance/PRIVACY.md` | Personal data inventory table (`field · purpose · legal basis · retention · who sees it`), consent flows & notice text (GDPR/CCPA/DPDP Act), data subject/principal rights (access, correction, erasure, grievance), DPIA, cross-border transfer safeguards, privacy by design. |
| 60 | `docs/06-security-compliance/COMPLIANCE.md` | Every applicable law & financial regulation (US FinCEN/GLBA/FTC, PCI-DSS v4.0, EU GDPR/PSD2/AI Act, India RBI/PA/DPDP Act 2023 & Rules 2025) formatted as: `Applies? · Requirement · How we comply in MVP · What's needed for production · Owner`; licensing strategy (leveraging PayPal's licensed rails vs requiring own license); certification roadmap (SOC 2 Type II, ISO 27001, ISO 42001, PCI-DSS). |
| 61 | `docs/06-security-compliance/RISK_REGISTER.md` | Comprehensive risk table (`R-xx · Risk Description · Category [tech/legal/market/ops/ethical] · Likelihood · Impact · Severity · Mitigation · Owner · Status`) sourced from Charlie Munger's pre-mortem. |

#### Group 8 — `docs/07-business/` (4 Core Files)
| # | Relative Path | Required Sections |
|---|---|---|
| 62 | `docs/07-business/BUSINESS_MODEL.md` | Lean Canvas, customer segments (merchants/consumers/enterprises), value proposition, revenue streams (take-rate BPS, SaaS tiers, float/settlement yield), pricing in `$` and `₹`, moat analysis (Buffett + Thiel + Botha), PayPal ecosystem revenue synergy. |
| 63 | `docs/07-business/GTM.md` | Beachhead market (Godin smallest viable audience), acquisition plan for **first 10 / 100 / 10,000 users**, channels (Gary Vee + Reid Hoffman viral loops + David Sacks bottom-up SaaS), PayPal merchant distribution partnerships, launch timeline, messaging per persona. |
| 64 | `docs/07-business/FINANCIALS.md` | Unit economics (`CAC`, `LTV`, `LTV:CAC`, payback period, gross margin, net take-rate), **3-year financial projection table** with explicit assumptions, funding/capital needs, grant/incubator/venture paths. |
| 65 | `docs/07-business/IMPACT.md` | Theory of change, merchant/consumer economic impact metrics (fraud reduction, checkout conversion lift, working capital saved), UN SDG mapping, measurement plan, grounded human stories (Mike Ross). |

#### Group 9 — `docs/08-project/` (3 Core Files)
| # | Relative Path | Required Sections |
|---|---|---|
| 66 | `docs/08-project/BACKLOG.md` | Epics → granular tickets with `Ticket ID · Title · Description · Acceptance Criteria · Estimate (hrs) · Owner Role · Hackathon Hour Block (e.g., H01–H04)`, formatted ready to paste into GitHub Issues. |
| 67 | `docs/08-project/TEAM.md` | Team roles, responsibilities, **RACI matrix** across all workstreams (Product, Frontend, Backend/PayPal Integration, AI/Evals, Pitch/QA), communication cadence, conflict/decision protocol. |
| 68 | `docs/08-project/GLOSSARY.md` | Comprehensive glossary of domain terms, PayPal/FinTech acronyms (TPV, BPS, Fastlane, Braintree, PYUSD, 3DS2, CDR, PAN, SAR, JunoDB, Raptor), regulatory acronyms (PCI-DSS, GLBA, DPDP, PSD2), and AI/ML terms. |

#### Group 10 — Optional Domain-Specific Docs (`doc-catalog.md` lines 118–125)
Include any that fit the top chosen PayPal FinTech/AI idea (recommended to include `REGULATORY_SANDBOX.md` and `SLA.md` for a FinTech/Enterprise PayPal solution, bringing the total Markdown file count to **68+ files**):
- `docs/06-security-compliance/REGULATORY_SANDBOX.md` (FinTech regulatory sandbox strategy: CFPB/FCA/RBI/MAS)
- `docs/05-ops/SLA.md` (Merchant/Enterprise B2B SLA commitments, uptime tiers, credit remedies)
- `docs/04-ai/FINE_TUNING.md` (Domain adaptation / LoRA fine-tuning pipeline if applicable)
- `docs/03-engineering/MOBILE.md` (Mobile checkout / Venmo / wallet SDK integration if applicable)
- `docs/07-business/PROCUREMENT.md` (Enterprise / public-sector procurement security packet if applicable)

#### Group 11 — Project Code Skeleton Directories (`bible/SKILL.md` lines 35–37)
Create these directories with `.gitkeep` (or initial config/spec files) adjusted to the stack:
- `apps/.gitkeep`
- `services/.gitkeep`
- `packages/.gitkeep`
- `ai/.gitkeep`
- `infra/.gitkeep`
- `api/openapi.yaml`
- `scripts/.gitkeep`
- `tests/.gitkeep`
- `.github/workflows/ci.yml`

---

## 8. Anti-Placeholder Rules & Master Verification Checklist

Every downstream builder and the independent verification agent must validate all deliverables against these strict rules:

1. **Zero Prohibited Placeholder Strings (`ORIGINAL_REQUEST.md` line 43)**:
   - Run ripgrep case-insensitively across `biblehackathon.md`, `ideas.md`, `MAP.md`, and all files in `docs/` for:
     - `TODO`
     - `TBD`
     - `coming soon`
     - `lorem ipsum`
     - `[insert` / `<insert` / `placeholder` (Note: in `README.md`, document a concrete ASCII/Mermaid demo flow or actual asset path instead of writing the literal word `placeholder` if strict regex checks scan for it).
   - **Result must be 0 matches** for `TODO`, `TBD`, and `coming soon`.
2. **Cross-Document ID Integrity (`bible/SKILL.md` line 75)**:
   - Every `F-xx`, `US-xx`, `E-xx`, `API-xx`, `M-xx`, `R-xx`, and `ADR-xxxx` defined in `docs/00-overview/PROJECT_BRIEF.md` must match across `PRD.md`, `FEATURES.md`, `USER_STORIES.md`, `DATA_MODEL.md`, `API_SPEC.md`, `api/openapi.yaml`, `MODELS.md`, `RISK_REGISTER.md`, and `BACKLOG.md`.
3. **Header Block & Link Integrity (`doc-catalog.md` lines 3–9)**:
   - Every file in `docs/00-overview/` through `docs/08-project/` starts with the `# <Title>` + `> Project: ...` + `> Related: ...` metadata block, and every relative Markdown link resolves to an existing file on disk.
4. **PDF Rendering Verification (`war-room-council/SKILL.md` lines 112–114 & AC1/AC3)**:
   - Both `s:\PayPal\biblehackathon.pdf` and `s:\PayPal\ideas.pdf` exist, are generated via `md2pdf.py`, and have non-trivial file sizes (>50 KB).
5. **PayPal Grounding & Council Verification (AC1, AC2, AC3, AC4)**:
   - `biblehackathon.md` and `ideas.md` contain real Devpost facts from `https://paypalaihackathon.devpost.com/`, deep PayPal engineering/tech-stack/leadership research, and multi-round debate transcripts featuring named PayPal Mafia members (`Peter Thiel`, `Elon Musk`, `Reid Hoffman`, `Max Levchin`, `David Sacks`, `Roelof Botha`, `Keith Rabois`) alongside PayPal CEOs/executives (`Alex Chriss`, `Dan Schulman`, `Srini Venkatesan`, etc.) and the 17 core `war-room-council` personas.
