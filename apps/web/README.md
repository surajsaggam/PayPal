# `@payops/web` — PayOps AI (PayPal Sentinel) Executive Financial Command Center

> **Write Owner (`IMPLEMENTATION_PLAN.md`):** `Dev 2` (100% Exclusive Ownership of `apps/web/**`, `tests/e2e/**`, and `packages/shared/src/mock-fixtures.ts`)

## 1. Architecture & Sponsor Track Coverage

Built on **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS (OKLCH Dark/Light Tokens)**, and **Zustand**, `@payops/web` implements the 5-screen Executive Financial Command Center for **PayOps AI (`PayPal Sentinel`, `PS-01`)**:

| Screen | Route & Shortcut | Sponsor & PayPal Tracks Covered | Key Components |
| :--- | :--- | :--- | :--- |
| **Screen 1: Command Center** | `/command-center` (`Cmd+1`) | **AG Grid Enterprise 32.3.2 + AG Charts ($10,000 Track, `F-07`)**, `API-14` Insights, `SSE-01` (`applyTransactionAsync`) | `LedgerCommandGrid.tsx`, `PolicyVerdictCell.tsx`, `GnnRiskSparklineCell.tsx`, `HitlInlineActionCell.tsx`, `DisputeDetailRenderer.tsx` |
| **Screen 2: Policy Firewall Studio** | `/policy-studio` (`Cmd+2`) | **`Cosmos.AI` DSL Policy Firewall (`F-02`)**, **APIMatic SDK Validator & Exporter ($3,000 Track, `F-09`, `US-14`)** | `policy-studio/page.tsx`, `ApimaticSdkCodeDrawer.tsx`, `HitlApprovalCard.tsx` (`API-02` FIDO2 WebAuthn Passkey) |
| **Screen 3: Invoicing & Scheduler** | `/invoicing-scheduler` (`Cmd+3`) | **Bryntum Scheduler Pro 6.1.2 ($3,000 Track, `F-08`, `US-13`)**, **PayPal Smart Invoicing v2 (`F-03`, `API-04`..`API-06`)** | `ReceivablesTimeline.tsx` (`next/dynamic({ ssr: false })`), `DunningHistogram.tsx`, `InvoiceQrModal.tsx` |
| **Screen 4: Dispute War-Room** | `/dispute-war-room` (`Cmd+4`) | **Autonomous Dispute Defense (`F-04`)**, **`M-04` 3-Hop GNN Scorer (`F-10`, `US-08`)**, `M-03` Vision OCR, `M-05` Elastic RAG | `dispute-war-room/page.tsx`, `WebhookSimulatorToolbar.tsx` (`API-13` simulator) |
| **Screen 5: Fastlane & PYUSD Bridge** | `/checkout-bridge` (`Cmd+5`) | **Channel3 MCP B2B Discovery ($1,500 Track, `F-12`, `US-16`)**, **PayPal Fastlane & Orders v2 (`F-05`, `F-06`)**, **PYUSD Solana Token-2022 Bridge (`F-11`, `US-15`)** | `FastlaneCheckoutIsland.tsx`, `PyusdSolanaBridgeModal.tsx` (`R-08`, `R-09` `Memo Required` guard) |

---

## 2. Dual-Mode & Demo-Day Replay Safety Net (`R-06`, `TKT-035`)

`apps/web/src/lib/api-client.ts` supports three seamless operating modes (configurable via `NEXT_PUBLIC_API_MODE` or the top-bar live switcher):
- **`mock`**: Uses deterministic shared fixtures from `packages/shared/src/mock-fixtures.ts` (`MOCK_WORKSPACES`, `MOCK_INVOICES`, `MOCK_DISPUTES`, `MOCK_EXECUTIONS`).
- **`live`**: Connects to `Dev 1`'s Fastify API server (`http://localhost:4000/api/v1/...`) and live SSE stream (`/api/v1/stream/events`).
- **`replay`**: Automatic circuit-breaker fallback (`R-06`) if `api-m.sandbox.paypal.com` returns `HTTP 429` or exceeds `2,500ms` during live judging.

---

## 3. Accessibility (WCAG 2.2 AA) & Localization (`TKT-031`, `TKT-033`)

- **Multi-Currency & Dual-Currency (`formatters.ts`):** Supports `USD ($)`, `INR (₹ Lakh/Crore)`, `EUR (€)`, `GBP (£)`, and `PYUSD (Solana)` with primary native currency + secondary cross-border equivalent (`LOCALIZATION.md` Section 2).
- **Multilingual & Hinglish Command Routing:** Interface dictionary supports `en`, `hi`, `es`, and `de`, while `normalizeMultilingualAgentPrompt` routes Hinglish (`hi-Latn`), Hindi (`hi`), Spanish (`es`), and German (`de`) natural-language commands to PayPal MCP tools.
- **WCAG 2.2 AA Compliance (`ACCESSIBILITY.md`):** Semantic `role="treegrid"` on AG Grid (`Criterion 1.3.1`), keyboard-accessible dunning slot selector on Bryntum Scheduler (`Criterion 2.5.7`), accessible chart/graph table toggles (`Criterion 1.1.1`), `Cmd/Ctrl+Shift+D` dry-run shortcut (`US-02`), and `Escape` dismissal across all modals/drawers.

---

## 4. Local Development & Verification Commands

```powershell
# 1. Run Dev 2 Frontend Cockpit Unit & Integration Tests (8/8 tests)
npx --yes vitest run --config "apps/web/vitest.config.ts"

# 2. Run Shared E2E Verification Suite (6/6 tests)
npx --yes vitest run "tests/e2e/checkout-dispute.spec.ts"

# 3. Typecheck apps/web (0 errors)
node "node_modules/typescript/bin/tsc" -p "apps/web/tsconfig.json" --noEmit

# 4. Run 4-Tier Deliverable Verifier (162/162 checks)
python "tests/verify_deliverables.py"
```
