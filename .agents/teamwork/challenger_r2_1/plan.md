# Task Plan — `challenger_r2_1` (Milestone 5 Iteration 2 Adversarial Challenger #1)

- **Identity**: `challenger_r2_1` (`teamwork_challenger`)
- **Working Directory**: `s:\PayPal\.agents\teamwork\challenger_r2_1`
- **Parent Orchestrator Conversation ID**: `cbf2d936-2ba2-47de-94ef-f1df6306e058`
- **Mandatory Inputs**:
  1. `s:\PayPal\.agents\teamwork\ORIGINAL_REQUEST.md`
  2. `s:\PayPal\PROJECT.md`
  3. `s:\PayPal\.agents\teamwork\challenger_1\handoff.md`
  4. `s:\PayPal\.agents\teamwork\worker_m5_fix\handoff.md`
- **Verification Scope**:
  1. Run `python "s:\PayPal\tests\verify_deliverables.py"` and verify `162/162` checks pass (`Exit Code 0`).
  2. Empirically verify all 3 challenges from `challenger_1/handoff.md` are resolved (`423/423` relative links resolve with `0` broken, `MAP.md` ASCII tree matches disk, `0` placeholders, valid YAML/JSON, valid `biblehackathon.pdf` & `ideas.pdf`).
  3. Write `s:\PayPal\.agents\teamwork\challenger_r2_1\handoff.md` with explicit verdict (`APPROVE` / `PASS` vs `FAIL`) and notify `cbf2d936-2ba2-47de-94ef-f1df6306e058`.
