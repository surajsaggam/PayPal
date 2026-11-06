# Scope: `M5_Iteration_2_Final_Gate_Verification` (`sub_orch_m5_gate`)

## Architecture & Context
- **Parent Orchestrator**: `teamwork_orchestrator_r1` (`cbf2d936-2ba2-47de-94ef-f1df6306e058`)
- **Sub-Orchestrator Working Directory**: `s:\PayPal\.agents\teamwork\sub_orch_m5_gate`
- **Project Root**: `s:\PayPal`
- **Original Request**: `s:\PayPal\.agents\teamwork\ORIGINAL_REQUEST.md`
- **Global Scope Document**: `s:\PayPal\PROJECT.md`
- **Remediation Handoff**: `s:\PayPal\.agents\teamwork\worker_m5_fix\handoff.md`

## Pre-Condition Verified by `worker_m5_fix`
All 6 surgical remediation tasks from Iteration 1 (`reviewer_1`, `reviewer_2`, `challenger_1`, `challenger_2`, `auditor_1`) have been completed on disk:
1. Canonical `s:\PayPal\research\domains\D1.md`..`D5.md` and `s:\PayPal\war-room\D1.md`..`D5.md` (+ `D1-debate.md`..`D5-debate.md`) exist on disk alongside the descriptive filenames.
2. `s:\PayPal\MAP.md` lines 35–47, 58, 169, 217, 225 have been updated (`423/423` relative links resolve, `0` broken).
3. `s:\PayPal\docs\04-ai\AI_EVALS.md`, `MODELS.md`, `PROMPTS.md`, `ai/agents/paypal-mcp-config.json`, `.github/workflows/ci.yml`, and `deploy.yml` have been aligned (including the exact noun `"hallucination"`).
4. `s:\PayPal\docs\08-project\BACKLOG.md` has all range shorthands expanded (`100%` of canonical IDs `F-01..12`, `US-01..16`, `E-01..10`, `API-01..14`, `M-01..05`, `R-01..12`, `ADR-0000..0005` present explicitly).
5. `s:\PayPal\biblehackathon.md` & `.pdf` (1,690,214 B) and `s:\PayPal\ideas.md` & `.pdf` (3,684,904 B) have all 17 Core Council seats in `**SPEAKER:**` headers, 100% `[S#]` turn citations, clarified `12 core MCP (+ 8 helper = 20)` invoicing count, and newly rendered PDFs.
6. `python "s:\PayPal\tests\verify_deliverables.py"` passes **162 / 162 checks (`100%`, Exit Code `0`)**.

## Required Execution (`sub_orch_m5_gate`)
Spawn these **5 fresh verification subagents in parallel** (creating `.agents/teamwork/<name>/` for each and including `s:\PayPal\.agents\teamwork\ORIGINAL_REQUEST.md` in every prompt):
1. `reviewer_r2_1` (`teamwork_reviewer` in `s:\PayPal\.agents\teamwork\reviewer_r2_1`): Independent Reviewer #1 — verify `python "s:\PayPal\tests\verify_deliverables.py"` (`162/162 PASS`) and verify that all 4 findings from `s:\PayPal\.agents\teamwork\reviewer_1\handoff.md` are resolved across R1–R4.
2. `reviewer_r2_2` (`teamwork_reviewer` in `s:\PayPal\.agents\teamwork\reviewer_r2_2`): Independent Reviewer #2 — verify `python "s:\PayPal\tests\verify_deliverables.py"` (`162/162 PASS`) and verify that all 4 findings from `s:\PayPal\.agents\teamwork\reviewer_2\handoff.md` are resolved.
3. `challenger_r2_1` (`teamwork_challenger` in `s:\PayPal\.agents\teamwork\challenger_r2_1`): Adversarial Challenger #1 — run `python "s:\PayPal\tests\verify_deliverables.py"` (`162/162 PASS`) and verify all 3 challenges from `s:\PayPal\.agents\teamwork\challenger_1\handoff.md` (`423/423` relative links, `0` placeholders, valid YAML/JSON/PDFs).
4. `challenger_r2_2` (`teamwork_challenger` in `s:\PayPal\.agents\teamwork\challenger_r2_2`): Adversarial Challenger #2 — run `python "s:\PayPal\tests\verify_deliverables.py"` (`162/162 PASS`) and verify all 5 challenges from `s:\PayPal\.agents\teamwork\challenger_2\handoff.md` (17 Core Council speaker headers & `[S#]` citations in `biblehackathon.md` and `ideas.md`, `35` core tool count clarity, updated PDFs).
5. `auditor_r2_1` (`teamwork_auditor` in `s:\PayPal\.agents\teamwork\auditor_r2_1`): Forensic Integrity Auditor — verify that `worker_m5_fix`'s changes are 100% genuine, `tests/verify_deliverables.py` was untouched and passes `162/162`, zero placeholders exist, and issue binary verdict (`CLEAN` vs `INTEGRITY VIOLATION`).

Collect all 5 `handoff.md` verdicts into `s:\PayPal\.agents\teamwork\sub_orch_m5_gate\GATE_STATUS.md`, write `s:\PayPal\.agents\teamwork\sub_orch_m5_gate\handoff.md`, and send completion message via `send_message` to parent orchestrator `cbf2d936-2ba2-47de-94ef-f1df6306e058`.
