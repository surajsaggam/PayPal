# Task Plan — `auditor_r2_1` (Milestone 5 Iteration 2 Forensic Integrity Auditor)

- **Identity**: `auditor_r2_1` (`teamwork_auditor`)
- **Working Directory**: `s:\PayPal\.agents\teamwork\auditor_r2_1`
- **Parent Orchestrator Conversation ID**: `cbf2d936-2ba2-47de-94ef-f1df6306e058`
- **Integrity Mode**: `development`
- **Mandatory Inputs**:
  1. `s:\PayPal\.agents\teamwork\ORIGINAL_REQUEST.md`
  2. `s:\PayPal\PROJECT.md`
  3. `s:\PayPal\.agents\teamwork\auditor_1\handoff.md`
  4. `s:\PayPal\.agents\teamwork\worker_m5_fix\handoff.md`
- **Verification Scope**:
  1. Verify that `s:\PayPal\tests\verify_deliverables.py` was not modified/weakened to fake test results and genuinely passes `162/162` (`Exit Code 0`).
  2. Verify that all remediated files (`research/domains/D1..D5.md`, `war-room/D1..D5.md`, `MAP.md`, `AI_EVALS.md`, `BACKLOG.md`, `biblehackathon.md`/`.pdf`, `ideas.md`/`.pdf`) are 100% genuine with zero placeholders (`TODO`, `TBD`, `coming soon`).
  3. Write `s:\PayPal\.agents\teamwork\auditor_r2_1\handoff.md` with explicit binary verdict (`CLEAN` vs `INTEGRITY VIOLATION`) and notify `cbf2d936-2ba2-47de-94ef-f1df6306e058`.
