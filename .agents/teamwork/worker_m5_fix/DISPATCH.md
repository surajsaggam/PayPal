## 2026-11-05T09:21:18Z

You are `worker_m5_fix` (`teamwork_worker`), the Milestone 5 Surgical Remediation Worker for the PayPal AI Hackathon & `/bible` Specification Suite in `s:\PayPal`.

### Identity & Workspace
- **Your Agent Name / Identity**: `worker_m5_fix`
- **Your Working Directory**: `s:\PayPal\.agents\teamwork\worker_m5_fix` (Write your metadata files `DISPATCH.md`, `BRIEFING.md`, `progress.md`, and `handoff.md` here ONLY)
- **Parent Orchestrator Conversation ID**: `cbf2d936-2ba2-47de-94ef-f1df6306e058` (Report back via `send_message` to this ID when complete)
- **Integrity Mode**: `development`

### Mandatory Integrity Warning
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
> NEVER modify `s:\PayPal\tests\verify_deliverables.py` to weaken or bypass any check — fix the deliverable files themselves!
> NEVER introduce the literal strings `TODO`, `TBD`, or `coming soon` (case-insensitive) anywhere in `s:\PayPal`.

### Mandatory Files to Read First
1. `s:\PayPal\.agents\teamwork\ORIGINAL_REQUEST.md` (Mandatory: read before starting work)
2. `s:\PayPal\.agents\teamwork\worker_m5_fix\plan.md` (Your detailed 6-task surgical remediation plan)
3. `s:\PayPal\PROJECT.md`

### Your Surgical Remediation Scope (Execute All 6 Tasks in `plan.md`)
1. **Task 1 — Canonical Domain & War-Room File Paths (`T1-F11-1`..`T1-F11-5`, `T1-F12-1`)**:
   - In `s:\PayPal\research\domains\`, copy the 5 existing descriptive domain files to canonical filenames `D1.md`, `D2.md`, `D3.md`, `D4.md`, and `D5.md` (keep both the slug-named files and `D1.md`..`D5.md` on disk):
     - `D1-agentic-commerce-smb-finops.md` -> `D1.md`
     - `D2-autonomous-dispute-risk-graph.md` -> `D2.md`
     - `D3-cross-border-treasury-pyusd.md` -> `D3.md`
     - `D4-social-split-fastlane-checkout.md` -> `D4.md`
     - `D5-devex-apimatic-observability.md` -> `D5.md`
   - In `s:\PayPal\war-room\`, copy `D1-war-room.md`..`D5-war-room.md` to canonical filenames `D1.md`..`D5.md` (and also `D1-debate.md`..`D5-debate.md`, keeping all sets so any reference resolves).

2. **Task 2 — Fix Broken Relative Link & Directory Tree in `s:\PayPal\MAP.md` (`T4-WALK-MAP-01`) + Persona Name Alignment**:
   - In `s:\PayPal\MAP.md`:
     - Update lines 35–47 (ASCII directory tree) so the listed filenames under `research/domains/` and `war-room/` match the actual files on disk (`D1.md`..`D5.md`).
     - Update line 169 (`[war-room/D1-debate.md](./war-room/D1-debate.md)`) to `[war-room/D1.md](./war-room/D1.md)`.
     - Replace `Priya Nair` (around lines 58 and 225) with canonical persona `Maya Lin (P-01)` / `Arjun Mehta (P-02)`.

3. **Task 3 — Add Exact Substring `"hallucination"` in `s:\PayPal\docs\04-ai\AI_EVALS.md` (`T1-F19-4`) & Align M3/M4 Thresholds**:
   - In `s:\PayPal\docs\04-ai\AI_EVALS.md`: include the exact noun `"hallucination"` (e.g., on line 10 and line 57: `Zero-Hallucination Schema & Parameter Hallucination Rate`).
   - Replace `Priya Nair` with `Maya Lin (P-01)` / `Arjun Mehta (P-02)` in `s:\PayPal\docs\04-ai\MODELS.md:54`.
   - Align the auto-refund hold threshold (`$500.00` standard / `$250.00` strict mode), low-value dispute auto-accept threshold (`<= $25.00` standard / `<= $50.00` configurable), `max_tool_hops = 6` (`max_tool_steps: 6`), and Node.js `22.11.0` across `s:\PayPal\ai\agents\paypal-mcp-config.json`, `s:\PayPal\docs\04-ai\PROMPTS.md`, `s:\PayPal\docs\04-ai\AI_EVALS.md`, and `s:\PayPal\.github\workflows\ci.yml` & `deploy.yml`.

4. **Task 4 — Expand Range Shorthands in `s:\PayPal\docs\08-project\BACKLOG.md` (`T3-US-BACKLOG`)**:
   - In `s:\PayPal\docs\08-project\BACKLOG.md`:
     - Line 64 (`TKT-018`): expand `` `US-04`..`US-06` `` to `` `US-04`, `US-05`, `US-06` ``.
     - Line 66 (`TKT-020`): expand `` `US-10`..`US-11` `` to `` `US-10`, `US-11` `` and `` `API-07`..`API-09` `` to `` `API-07`, `API-08`, `API-09` ``.
     - Line 79 (`TKT-026`): expand `` `US-07`..`US-09` `` to `` `US-07`, `US-08`, `US-09` ``.
     - Line 27: expand `` `E-01`..`E-09` `` to `` `E-01`, `E-02`, `E-03`, `E-04`, `E-05`, `E-06`, `E-07`, `E-08`, `E-09`, `E-10` `` and explicitly list `ADR-0000`, `ADR-0001`, `ADR-0002`, `ADR-0003`, `ADR-0004`, `ADR-0005` and `R-08` so 100% of canonical IDs (`F-01..12`, `US-01..16`, `E-01..10`, `API-01..14`, `M-01..05`, `R-01..12`, `ADR-0000..0005`) appear as explicit literal strings in `BACKLOG.md`.

5. **Task 5 — White-Box Council Transcript & Tool Count Polish in `s:\PayPal\biblehackathon.md` & `s:\PayPal\ideas.md` + Re-render Both PDFs**:
   - In `s:\PayPal\biblehackathon.md`:
     - Line 147 (`### 5. Complete @paypal/agent-toolkit`): clarify the `Invoices` count as `12 core MCP (+ 8 recurring-series/helper = 20)` so the core MCP tools clearly sum to `35`.
     - Part 6 Debate Transcript (around line 552): add an explicit `**ALEX KARP:**` speaker turn header with `[S1, S18]` citation, and add `[S1, S18]` citation to `**STEVE JOBS:**` on line 552 so all 17 Core Council seats appear in `**SPEAKER:**` headers and 100% of speaker turns have `[S#]` citations.
     - Re-render `s:\PayPal\biblehackathon.pdf` via `python "C:\Users\suraj\.gemini\config\skills\war-room-council\scripts\md2pdf.py" "s:\PayPal\biblehackathon.md" "s:\PayPal\biblehackathon.pdf" --title "PayPal AI Hackathon — War-Room Reconnaissance & Company Bible" --subtitle "Forensic Intelligence: Devpost Rules, PayPal Production Stack, Leadership & PayPal Mafia Council"`.
   - In `s:\PayPal\ideas.md`:
     - Add explicit `**SPEAKER:** ... [S#]` debate turn headers for **`**SETH GODIN:**`**, **`**GARY VAYNERCHUK:**`**, and **`**TIM COOK:**`** (e.g., in Domain D1 Round 3 / Round 5) so all 17 Core/Extra Council seats appear in `**SPEAKER:**` headers in `ideas.md`.
     - Add an inline `[S11, S16]` citation tag to `**DR. R.S. SHARMA:**` (around line 513) so 100% of speaker turns in `ideas.md` have `[S#]` citations.
     - Re-render `s:\PayPal\ideas.pdf` via `python "C:\Users\suraj\.gemini\config\skills\war-room-council\scripts\md2pdf.py" "s:\PayPal\ideas.md" "s:\PayPal\ideas.pdf" --title "PayPal AI Hackathon — War-Room Council Debates & 25 Selectable Ideas" --subtitle "PayPal Mafia + Executive Council Deliberations, Ranked Problem Statements & Execution Plans"`.

6. **Task 6 — Verification & Handoff**:
   - Run `python "s:\PayPal\tests\verify_deliverables.py"` and confirm **`162/162` checks pass with exit code `0`**.
   - Run a Python check confirming:
     - 0 broken relative links across all `.md` files in `s:\PayPal`.
     - 0 occurrences of `\b(TODO|TBD)\b|coming soon` across all deliverable files.
     - All 17 Core Council seats appear in `**SPEAKER:**` headers in both `biblehackathon.md` and `ideas.md`, and 0 speaker turns lack `[S#]` citations.
   - Write `s:\PayPal\.agents\teamwork\worker_m5_fix\handoff.md` and notify `cbf2d936-2ba2-47de-94ef-f1df6306e058` via `send_message`.
