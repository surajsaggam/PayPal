# Task Plan — `worker_m5_fix` (Milestone 5 Surgical Remediation Worker)

## Working Directory & Identity
- **Identity**: `worker_m5_fix` (`teamwork_worker`)
- **Working Directory**: `s:\PayPal\.agents\teamwork\worker_m5_fix`
- **Parent Orchestrator Conversation ID**: `cbf2d936-2ba2-47de-94ef-f1df6306e058`

## Mandatory Inputs to Read First
1. `s:\PayPal\.agents\teamwork\ORIGINAL_REQUEST.md`
2. `s:\PayPal\PROJECT.md`
3. `s:\PayPal\.agents\teamwork\reviewer_1\handoff.md`
4. `s:\PayPal\.agents\teamwork\reviewer_2\handoff.md`
5. `s:\PayPal\.agents\teamwork\challenger_1\handoff.md`
6. `s:\PayPal\.agents\teamwork\challenger_2\handoff.md`
7. `s:\PayPal\.agents\teamwork\auditor_1\handoff.md`

## Surgical Remediation Scope (6 Exact Tasks)

1. **Task 1 — Canonical Domain Research & War-Room File Paths (`T1-F11-1`..`T1-F11-5`, `T1-F12-1`)**:
   - In `s:\PayPal\research\domains\`, copy the 5 existing descriptive domain files to canonical filenames `D1.md`, `D2.md`, `D3.md`, `D4.md`, and `D5.md` (keep both the descriptive files and `D1.md`..`D5.md` so any reference to either convention resolves):
     - `D1-agentic-commerce-smb-finops.md` -> `D1.md`
     - `D2-autonomous-dispute-risk-graph.md` -> `D2.md`
     - `D3-cross-border-treasury-pyusd.md` -> `D3.md`
     - `D4-social-split-fastlane-checkout.md` -> `D4.md`
     - `D5-devex-apimatic-observability.md` -> `D5.md`
   - In `s:\PayPal\war-room\`, copy the 5 existing war-room files (`D1-war-room.md`..`D5-war-room.md`) to canonical filenames `D1.md`..`D5.md` (and also `D1-debate.md`..`D5-debate.md` if helpful, keeping `D1-war-room.md`..`D5-war-room.md`).

2. **Task 2 — Fix Broken Relative Link & Directory Tree in `s:\PayPal\MAP.md` (`T4-WALK-MAP-01`) + Persona Name Alignment**:
   - In `s:\PayPal\MAP.md`:
     - Update lines 35–47 (ASCII directory tree) so the listed filenames under `research/domains/` and `war-room/` match the canonical files on disk (`D1.md`..`D5.md` or actual slug names on disk).
     - Update line 169 (`[war-room/D1-debate.md](./war-room/D1-debate.md)`) to `[war-room/D1.md](./war-room/D1.md)` so 100% of relative links in `MAP.md` resolve on disk.
     - Replace `Priya Nair` (around lines 58 and 225) with canonical persona `Maya Lin (P-01)` / `Arjun Mehta (P-02)` per `reviewer_2` Finding 4.

3. **Task 3 — Add Exact Substring `"hallucination"` in `s:\PayPal\docs\04-ai\AI_EVALS.md` (`T1-F19-4`) & Align `MODELS.md`/`PROMPTS.md`/`paypal-mcp-config.json` Thresholds**:
   - In `s:\PayPal\docs\04-ai\AI_EVALS.md`:
     - Ensure the exact substring `"hallucination"` (case-insensitive) appears explicitly (e.g., on line 10 and line 57: `RT-03: Hallucinated Zero-Decimal Currency Trap / Parameter Hallucination Rate (R-03)`).
   - Per `reviewer_2` Finding 4, align `Priya Nair` -> `Maya Lin (P-01)` / `Arjun Mehta (P-02)` in `s:\PayPal\docs\04-ai\MODELS.md:54`, and clarify/align the auto-refund hold threshold (`$500.00` standard / `$250.00` strict mode), low-value dispute auto-accept threshold (`<= $25.00` standard / `<= $50.00` configurable), `max_tool_hops = 6`, and Node.js `22.11.0` across `ai/agents/paypal-mcp-config.json`, `docs/04-ai/PROMPTS.md`, `docs/04-ai/AI_EVALS.md`, and `.github/workflows/ci.yml` & `deploy.yml`.

4. **Task 4 — Expand Range Shorthands in `s:\PayPal\docs\08-project\BACKLOG.md` (`T3-US-BACKLOG`)**:
   - In `s:\PayPal\docs\08-project\BACKLOG.md`:
     - Expand `` `US-04`..`US-06` `` on line 64 (`TKT-018`) to `` `US-04`, `US-05`, `US-06` ``.
     - Expand `` `US-10`..`US-11` `` on line 66 (`TKT-020`) to `` `US-10`, `US-11` `` and `` `API-07`..`API-09` `` to `` `API-07`, `API-08`, `API-09` ``.
     - Expand `` `US-07`..`US-09` `` on line 79 (`TKT-026`) to `` `US-07`, `US-08`, `US-09` ``.
     - Expand `` `E-01`..`E-09` `` on line 27 to `` `E-01`, `E-02`, `E-03`, `E-04`, `E-05`, `E-06`, `E-07`, `E-08`, `E-09`, `E-10` ``, and ensure all `R-01`..`R-12` (including `R-08`) and `ADR-0000`..`ADR-0005` appear explicitly in `BACKLOG.md`.

5. **Task 5 — White-Box Council Transcript & Tool Count Polish in `s:\PayPal\biblehackathon.md` & `s:\PayPal\ideas.md` + Re-render Both PDFs (`challenger_2` Challenges 4 & 5)**:
   - In `s:\PayPal\biblehackathon.md`:
     - Line 147 (`### 5. Complete @paypal/agent-toolkit`): Clarify the `Invoices` row count so the arithmetic clearly shows `12 core MCP tools (+ 8 extended recurring-series/helper methods = 20 total)` summing to `35 core MCP tools` across the 7 categories.
     - Part 6 Debate Transcript (around line 552): Ensure `**ALEX KARP:**` appears as an explicit `**SPEAKER:**` turn header with an `[S#]` citation tag, and ensure `**STEVE JOBS:**` (line 552) includes an inline `[S1, S18]` citation tag so 100% of the 17 Core Council seats appear in `**SPEAKER:**` headers and 100% of speaker turns have `[S#]` citations.
     - Re-render `s:\PayPal\biblehackathon.pdf` using `python "C:\Users\suraj\.gemini\config\skills\war-room-council\scripts\md2pdf.py" "s:\PayPal\biblehackathon.md" "s:\PayPal\biblehackathon.pdf" --title "PayPal AI Hackathon — War-Room Reconnaissance & Company Bible" --subtitle "Forensic Intelligence: Devpost Rules, PayPal Production Stack, Leadership & PayPal Mafia Council"`.
   - In `s:\PayPal\ideas.md`:
     - Add explicit `**SPEAKER:** ... [S#]` debate turn headers for **`**SETH GODIN:**`**, **`**GARY VAYNERCHUK:**`**, and **`**TIM COOK:**`** (e.g., in Domain D1 Round 3 / Round 5) so all 17 Core/Extra Council seats appear in `**SPEAKER:**` headers and `Tim Cook` is actively represented.
     - Add an inline `[S11, S16]` citation tag to the `**DR. R.S. SHARMA:**` turn on line 513 so 100% of speaker turns in `ideas.md` have `[S#]` citations.
     - Re-render `s:\PayPal\ideas.pdf` using `python "C:\Users\suraj\.gemini\config\skills\war-room-council\scripts\md2pdf.py" "s:\PayPal\ideas.md" "s:\PayPal\ideas.pdf" --title "PayPal AI Hackathon — War-Room Council Debates & 25 Selectable Ideas" --subtitle "PayPal Mafia + Executive Council Deliberations, Ranked Problem Statements & Execution Plans"`.

6. **Task 6 — Full E2E & White-Box Verification**:
   - Run `python "s:\PayPal\tests\verify_deliverables.py"` and verify **`162 / 162 checks passed (Exit Code 0)`**.
   - Run white-box verification confirming:
     - 0 broken relative links across all `.md` files in `s:\PayPal` (including `MAP.md`).
     - 0 occurrences of `\b(TODO|TBD)\b|coming soon` (case-insensitive) across the entire workspace.
     - All 17 Core Council seats appear in `**SPEAKER:**` headers in both `biblehackathon.md` and `ideas.md`, and 0 speaker turns lack `[S#]` citations.
     - Both `biblehackathon.pdf` and `ideas.pdf` exist, are >50 KB, start with `%PDF-`, and end with `%%EOF`.
