# `tests/e2e` — PayOps AI (`PayPal Sentinel`, `PS-01`) End-to-End & Accessibility Verification Suite

> **Write Owner (`IMPLEMENTATION_PLAN.md`):** `Dev 2` (`100%` Exclusive Ownership of `tests/e2e/**`)

---

## 1. Test Suites Overview

| File | Runner | Purpose & Coverage (`TKT-033`, `F-01`..`F-12`, `US-01`..`US-16`) |
| :--- | :--- | :--- |
| [`checkout-dispute.spec.ts`](./checkout-dispute.spec.ts) | Vitest (`6/6` PASS) | Deterministic end-to-end verification of `JunoDB` idempotency (`F-06`, `R-02`), `APIMatic` 2-decimal string validation (`F-09`, `R-03`), indirect prompt-injection blocking (`F-02`, `R-01`), `M-04` friendly-fraud GNN dispute defense (`F-04`, `F-10`), conditional early-payment invoicing (`F-03`), and `SHA-256` hash-chained immutable audit logs (`E-10`). |
| [`cockpit-screens.playwright.ts`](./cockpit-screens.playwright.ts) | Playwright / Vitest Harness (`13/13` PASS in `cockpit.test.ts`) | Multi-screen browser & accessibility harness across all 5 cockpit routes (`/command-center`, `/policy-studio`, `/invoicing-scheduler`, `/dispute-war-room`, `/checkout-bridge`), verifying WCAG 2.2 AA `role="treegrid"` (`Criterion 1.3.1`), keyboard dunning reschedule (`Criterion 2.5.7`), accessible chart/graph table toggles (`Criterion 1.1.1`), keyboard shortcut matrix (`Cmd+1..Cmd+5`, `Cmd+K`, `Cmd/Ctrl+Shift+D`, `Alt+A`/`Alt+R`, `Escape`), `R-06` `<50ms` HTTP 429 circuit-breaker failover (`MOCK_SIGNED_SANDBOX_TRANSCRIPTS`), `2:52` 4-click guided pitch choreography (`SCENARIO_1_INVOICE`..`SCENARIO_4_PYUSD`) & `H41` 1-click clean demo reset, Bryntum two-way `onEventResizeEnd` & recurring series (`#16`–`#19`), 3-hop GNN telemetry inspection (`US-08`), Channel3 B2B procurement (`F-12`), `10x` JunoDB order capture dedup (`R-02`), `PYUSD` Token-2022 `Memo Required` validation (`R-09`), and `E-10` SHA-256 hash-chain tamper detection. |

---

## 2. Execution Commands

```powershell
# Run the 6/6 E2E Checkout, Invoicing, Policy Firewall & Dispute Defense Suite
npx --yes vitest run "d:\PayPal\tests\e2e\checkout-dispute.spec.ts"

# Run the 13/13 Frontend Cockpit & Playwright Harness Suite
npx --yes vitest run --config "d:\PayPal\apps\web\vitest.config.ts"

# Run the 162/162 4-Tier Repository & Devpost Deliverable Verifier
python "d:\PayPal\tests\verify_deliverables.py"
```
