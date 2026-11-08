# `@payops/web` — PayOps AI (`PayPal Sentinel`, `PS-01`) Executive Financial Command Center

> **Write Owner (`IMPLEMENTATION_PLAN.md`):** `Dev 2` (`100%` Exclusive Ownership of `apps/web/**`, `tests/e2e/**`, and `packages/shared/src/mock-fixtures.ts`)

---

## 1. Architecture & Sponsor Track Coverage (`F-01`..`F-12`, `US-01`..`US-16`)

Built on **Next.js 15 (App Router)**, **React 18/19**, **Tailwind CSS (OKLCH Dark/Light Tokens)**, and **Zustand**, `@payops/web` implements the 5-screen Executive Financial Command Center for **PayOps AI (`PayPal Sentinel`, `PS-01`)**:

| Screen | Route & Shortcut | Sponsor & PayPal Tracks Covered | Key Components & Features |
| :--- | :--- | :--- | :--- |
| **Screen 1: Command Center** | `/command-center` (`Cmd+1`) | **AG Grid Enterprise 32.3.2 + AG Charts ($10,000 Track, `F-07`)**, `API-14` Insights (`TKT-027`), `SSE-01` (`applyTransactionAsync`) | `LedgerCommandGrid.tsx` (10k row benchmark `<800ms`, grouping/pivot, natural-language filter bar), `PolicyVerdictCell.tsx`, `GnnRiskSparklineCell.tsx`, `HitlInlineActionCell.tsx`, `DisputeDetailRenderer.tsx`, dynamic `computeLiveMerchantInsights` North-Star `ANMPR` counter, 30-day Cash Inflow Waterfall + GNN Risk Distribution charts |
| **Screen 2: Policy Firewall Studio** | `/policy-studio` (`Cmd+2`) | **`Cosmos.AI` DSL Policy Firewall (`F-02`)**, **APIMatic SDK Validator & Exporter ($3,000 Track, `F-09`, `US-14`)** | `policy-studio/page.tsx` (Karpathy `L0–L4` Autonomy Slider, interactive spend/velocity/GNN thresholds, counterfactual Dry-Run Simulator `US-02` with 3 scenario presets), `ApimaticSdkCodeDrawer.tsx` (live TS/Python `@paypal/paypal-server-sdk` export across all domains), `HitlApprovalCard.tsx` (`API-02` FIDO2 WebAuthn Passkey) |
| **Screen 3: Invoicing & Scheduler** | `/invoicing-scheduler` (`Cmd+3`) | **Bryntum Scheduler Pro 6.1.2 ($3,000 Track, `F-08`, `TKT-029`, `US-13`)**, **PayPal Smart Invoicing v2 & Subscriptions (`F-03`, `API-04`..`API-06`, `API-12`, `TKT-021`)** | `ReceivablesTimeline.tsx` (`next/dynamic({ ssr: false })`, two-way `onEventDrop` + `onEventResizeEnd`, 72h FDCPA/RBI dunning velocity guard `R-11`, SVG dependency chain, Recurring Invoice Series `#16`–`#19`, interactive Subscription lanes `API-12` (`create_subscription`, `update_subscription`, L2 Passkey-gated `cancel_subscription`), Dispute SLA Deadlines lane `E-08`), `DunningHistogram.tsx`, `InvoiceQrModal.tsx` |
| **Screen 4: Dispute War-Room** | `/dispute-war-room` (`Cmd+4`) | **Autonomous Dispute Defense (`F-04`, `TKT-026`, `US-07`..`US-09`)**, **`M-04` 3-Hop GNN Scorer (`F-10`, `payops-graphsage-lgbm-v1.2.onnx`)**, `M-03` Vision OCR, `M-05` Elastic RAG | `dispute-war-room/page.tsx` (interactive 3-hop Buyer–Device–Carrier Risk Graph node inspector `HOP_1_BUYER`..`HOP_3B_RING`, TreeSHAP attribution bars, manual Carrier POD upload & `M-03` OCR fallback dropzone, `EVIDENCE_SUBMITTED` stamp, Compelling Evidence 3.0 JSON/PDF export), `WebhookSimulatorToolbar.tsx` (`API-13`) |
| **Screen 5: Fastlane & PYUSD Bridge** | `/checkout-bridge` (`Cmd+5`) | **Channel3 MCP B2B Discovery ($1,500 Track, `F-12`, `US-16`)**, **PayPal Fastlane & Orders v2 (`F-05`, `F-06`, `TKT-020`)**, **PYUSD Solana Token-2022 Bridge (`F-11`, `TKT-022`, `US-15`)** | `FastlaneCheckoutIsland.tsx` (`@paypal/react-paypal-js` Zoid isolation `ADR-0005`, `R-07` HMAC-SHA256 recognition for `maya@lumina.io`, `10x` `JunoDB` retry deduplication stress test `R-02`, post-capture `create_shipment_tracking` `#28` & policy-guarded refund testing `API-09`), `PyusdSolanaBridgeModal.tsx` (mint `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo`, `R-08` non-custodial badge, `R-09` `Memo Required` simulator & validator), Elastic 180-day SHA-256 hash-chain verifier (`E-10`) & Zapier `HOLD_APPROVAL` payload inspector (`F-12`) |

---

## 2. Dual-Mode API Client, SSE Stream & Demo-Day Replay Safety Net (`R-06`, `SSE-01`, `TKT-035`)

- **3 Operating Modes (`apps/web/src/lib/api-client.ts`):**
  1. **`mock`**: Deterministic shared fixtures from `packages/shared/src/mock-fixtures.ts` (`MOCK_WORKSPACES`, `MOCK_INVOICES`, `MOCK_DISPUTES`, `MOCK_EXECUTIONS`, `MOCK_RECURRING_SERIES`, `MOCK_SUBSCRIPTION_PLANS`).
  2. **`live`**: Connects to `Dev 1`'s Fastify Control Plane (`http://localhost:4000/api/v1/...`) and real-time Server-Sent Events stream (`/api/v1/stream/events`).
  3. **`replay`**: Instant circuit-breaker fallback (`DEMO_REPLAY_MODE`, `R-06`) if `api-m.sandbox.paypal.com` returns `HTTP 429` or exceeds `2,500ms` during live judging.
- **Real-Time SSE Event Stream (`useSseExecutionStream.ts`, `SSE-01`):**
  - Subscribes to `execution_delta`, `dispute_alert`, and `policy_hold` events and updates both the AG Grid Enterprise viewport (`gridApi.applyTransactionAsync`) and the Zustand cockpit store without page reloads or hydration mismatches.
- **1-Click Pitch Choreography Bar (`WebhookSimulatorToolbar.tsx`, `TKT-035`, `TKT-036`):**
  - Provides 1-click triggers for all 4 live browser scenes in `docs/00-overview/PITCH.md`:
    1. `1. Smart Invoice ($1,850 + QR)` (`DEMO_1_SMART_INVOICE`)
    2. `2. INR Dispute Defense ($340)` (`DEMO_2_DISPUTE_DEFENSE`)
    3. `3. Block Prompt Injection ($2,400)` (`DEMO_3_INJECTION_BLOCK`)
    4. `4. PYUSD Solana Bridge ($1,850)` (`DEMO_4_PYUSD_BRIDGE`)

---

## 3. Accessibility (WCAG 2.2 AA), 5 Interactive UI States & Localization (`TKT-031`, `TKT-033`)

- **All 5 Interactive UI States (`UI_SPEC.md`):** Every screen supports `success`, `loading`, `empty`, `offline` (`PENDING_SYNC` queue with 1-click `Flush Queue Now`), and `error` (RFC 7807 / Carrier API timeout fallback with manual POD OCR dropzone and Bryntum drag snap-back).
- **Multi-Currency & Dual-Currency (`formatters.ts`):** Supports `USD ($)`, `INR (₹ Lakh/Crore)`, `EUR (€)`, `GBP (£)`, and `PYUSD (Solana)` with primary native currency + secondary cross-border equivalent and multi-timezone SLA countdown tooltips (`UTC`, `IST`, `CST`, `GMT`).
- **Multilingual & Hinglish Command Routing:** Interface dictionary supports `en`, `hi`, `es`, and `de`, while `normalizeMultilingualAgentPrompt` routes Hinglish (`hi-Latn`), Hindi (`hi`), Spanish (`es`), and German (`de`) natural-language commands to PayPal MCP tools.
- **WCAG 2.2 AA Compliance (`ACCESSIBILITY.md`):** Semantic `role="treegrid"` on AG Grid (`Criterion 1.3.1`), keyboard-accessible dunning slot selector on Bryntum Scheduler (`Criterion 2.5.7`), keyboard-focusable 3-Hop SVG Risk Graph nodes (`role="button"`, `tabIndex={0}`), accessible chart/graph table toggles (`Criterion 1.1.1`), `Cmd/Ctrl+Shift+D` dry-run shortcut (`US-02`), and `Escape` dismissal across all modals/drawers.

---

## 4. Local Development & Verification Commands

```powershell
# 1. Start Next.js 15 Dev Server on Port 3000
Set-Location "d:\PayPal\apps\web"
node "..\..\node_modules\next\dist\bin\next" dev --port 3000

# 2. Run Dev 2 Frontend Cockpit Unit & Integration Tests (11/11 tests)
Set-Location "d:\PayPal"
npx --yes vitest run --config "d:\PayPal\apps\web\vitest.config.ts"

# 3. Run Shared E2E Verification Suite (6/6 tests)
npx --yes vitest run "d:\PayPal\tests\e2e\checkout-dispute.spec.ts"

# 4. Typecheck packages/shared and apps/web (0 errors)
node "d:\PayPal\node_modules\typescript\bin\tsc" -p "d:\PayPal\packages\shared\tsconfig.json" --noEmit
node "d:\PayPal\node_modules\typescript\bin\tsc" -p "d:\PayPal\apps\web\tsconfig.json" --noEmit

# 5. Run 4-Tier Deliverable Verifier (162/162 checks, Exit Code 0)
python "d:\PayPal\tests\verify_deliverables.py"
```
