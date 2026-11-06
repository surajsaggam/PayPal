# Task Plan — `challenger_r2_2` (Milestone 5 Iteration 2 Adversarial Challenger #2)

- **Identity**: `challenger_r2_2` (`teamwork_challenger`)
- **Working Directory**: `s:\PayPal\.agents\teamwork\challenger_r2_2`
- **Parent Orchestrator Conversation ID**: `cbf2d936-2ba2-47de-94ef-f1df6306e058`
- **Mandatory Inputs**:
  1. `s:\PayPal\.agents\teamwork\ORIGINAL_REQUEST.md`
  2. `s:\PayPal\PROJECT.md`
  3. `s:\PayPal\.agents\teamwork\challenger_2\handoff.md`
  4. `s:\PayPal\.agents\teamwork\worker_m5_fix\handoff.md`
- **Verification Scope**:
  1. Run `python "s:\PayPal\tests\verify_deliverables.py"` and verify `162/162` checks pass (`Exit Code 0`).
  2. Empirically verify all 5 challenges from `challenger_2/handoff.md` are resolved (all 17 Core Council seats appear in `**SPEAKER:**` headers in both `biblehackathon.md` and `ideas.md`, `0` uncited speaker turns, `biblehackathon.md:147` clarifies `12 core MCP (+ 8 helper = 20)`, and both PDFs are re-rendered).
  3. Write `s:\PayPal\.agents\teamwork\challenger_r2_2\handoff.md` with explicit verdict (`APPROVE` / `PASS` vs `FAIL`) and notify `cbf2d936-2ba2-47de-94ef-f1df6306e058`.
