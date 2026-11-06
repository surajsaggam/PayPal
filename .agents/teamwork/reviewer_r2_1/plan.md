# Task Plan — `reviewer_r2_1` (Milestone 5 Iteration 2 Independent Reviewer #1)

- **Identity**: `reviewer_r2_1` (`teamwork_reviewer`)
- **Working Directory**: `s:\PayPal\.agents\teamwork\reviewer_r2_1`
- **Parent Orchestrator Conversation ID**: `cbf2d936-2ba2-47de-94ef-f1df6306e058`
- **Mandatory Inputs**:
  1. `s:\PayPal\.agents\teamwork\ORIGINAL_REQUEST.md`
  2. `s:\PayPal\PROJECT.md`
  3. `s:\PayPal\.agents\teamwork\reviewer_1\handoff.md`
  4. `s:\PayPal\.agents\teamwork\worker_m5_fix\handoff.md`
- **Verification Scope**:
  1. Run `python "s:\PayPal\tests\verify_deliverables.py"` and verify `162/162` checks pass (`Exit Code 0`).
  2. Verify all 4 findings from `reviewer_1/handoff.md` (`research/domains/D1..D5.md`, `war-room/D1..D5.md` + `MAP.md:169`, `"hallucination"` in `AI_EVALS.md`, `"US-05"` in `BACKLOG.md`) are 100% resolved.
  3. Write `s:\PayPal\.agents\teamwork\reviewer_r2_1\handoff.md` with explicit verdict (`APPROVE` vs `REQUEST_CHANGES`) and notify `cbf2d936-2ba2-47de-94ef-f1df6306e058`.
