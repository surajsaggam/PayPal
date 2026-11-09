# `@payops/web` — PayOps AI (`PayPal Sentinel`, `PS-01`) Executive Financial Command Center

> **Write Owner (`IMPLEMENTATION_PLAN.md`):** `Dev 2` (`100%` Exclusive Ownership of `apps/web/**`, `tests/e2e/**`, and `packages/shared/src/mock-fixtures.ts`)

---

## 1. Design System & Editorial UI/UX Architecture

Built on **Next.js 15 (App Router)**, **React 18/19**, **Tailwind CSS**, and **Zustand**, `@payops/web` implements an **Increase.com-inspired light-first editorial fintech interface** across all 5 screens of **PayOps AI (`PayPal Sentinel`, `PS-01`)**:

- **Light-First Editorial Surface Hierarchy (`globals.css`, `tailwind.config.ts`)**:
  - Crisp `#FFFFFF` canvas (`--bg-canvas`), `#F8FAFC` subtle Bento containers (`--bg-surface`), `1px` `#E2E8F0` hairline borders (`--border-hairline`), `#E2FF66` acid-lime announcement badges, `#6EE7B7` mint primary action buttons, and `#18181B` carbon-dark secondary CTAs.
  - Spring-snappy micro-interactions (`cubic-bezier(0.22, 1, 0.36, 1)`), staggered pop-in card transitions (`.animate-pop-in`), tab-switch animations (`.animate-tab-switch`), and zero-clipping responsive tables.
- **Human-Readable Business Copy (`Inter` Typography)**:
  - All 5 dashboards present clear, executive-friendly financial copy rather than raw backend enums, hashes, or internal ticket IDs, while preserving optional developer SDK inspection drawers.
- **Single-Line Sticky Top Navbar (`CockpitShell.tsx`)**:
  - Geometric `|SENTINEL` brand wordmark, hover-pill navigation across all 5 screens (`⌘1`–`⌘5`), collapsible **Environment** mega-menu popover (Sandbox mode, Currency, Locale, UI State, and live status cards), workspace selector, theme toggle, and 1-click **Guided Pitch** trigger.

---

## 2. 5-Screen Functional & Sponsor Track Coverage (`F-01`..`F-12`, `US-01`..`US-16`)

| Screen | Route & Shortcut | Sponsor & PayPal Tracks Covered | Key Components & Features |
| :--- | :--- | :--- | :--- |
| **Screen 1: Command Center** | `/command-center` (`Cmd+1`) | **AG Grid Enterprise 32.3.2 + AG Charts ($10,000 Track, `F-07`)**, `API-14` Insights (`TKT-027`), `SSE-01` (`applyTransactionAsync`) | Asymmetric Increase-style Hero with full-bleed 3D ribbon art (`command-center/page.tsx`), 4 architectural KPI cards, **Autonomous workflows on every PayPal rail** showcase (`WebhookSimulatorToolbar.tsx`), 2-column Bento analytics (30-Day Cash Inflow Waterfall + Fraud Risk Distribution), and zero-clipping 5-column **Autonomous Execution & Dispute Ledger** (`LedgerCommandGrid.tsx`, `DisputeDetailRenderer.tsx`) with tabbed 3-gate inspection & 10,000-row `<800ms` benchmark |
| **Screen 2: Policy Studio** | `/policy-studio` (`Cmd+2`) | **`Cosmos.AI` Policy Firewall (`F-02`)**, **APIMatic SDK Validator & Exporter ($3,000 Track, `F-09`, `US-14`)** | Interactive **Autonomy Level (`L0`–`L4`)** tier cards (`policy-studio/page.tsx`) where switching `L0` to `L4` dynamically updates the Active Tier Summary banner, 4 operational workflow metrics, spending/risk thresholds (`Single Refund Limit`, `24-Hour Refund Cap`, `Max Fraud Risk Score`), 3 readable Protection Rule cards, and the tier-aware **Interactive Policy Simulator** + collapsible `@paypal/paypal-server-sdk` code preview |
| **Screen 3: Smart Invoicing** | `/invoicing-scheduler` (`Cmd+3`) | **Bryntum Scheduler Pro 6.1.2 ($3,000 Track, `F-08`, `TKT-029`, `US-13`)**, **PayPal Smart Invoicing v2 & Subscriptions (`F-03`, `API-04`..`API-06`, `API-12`, `TKT-021`)** | 30-Day Working Capital Forecast (`DunningHistogram.tsx`), zero-overflow **Receivables & Reminders Schedule** (`ReceivablesTimeline.tsx` with 72h reminder spacing guard, Recurring Billing Series, Subscription Plans, and Dispute Deadlines tabs), Smart Invoice generator, and the enlarged **Instant QR Invoice Card** (`InvoiceQrModal.tsx`) |
| **Screen 4: Dispute Defense** | `/dispute-war-room` (`Cmd+4`) | **Autonomous Dispute Defense (`F-04`, `TKT-026`, `US-07`..`US-09`)**, **`M-04` 3-Hop GNN Scorer (`F-10`)**, `M-03` Vision OCR, `M-05` Elastic RAG | Active Customer Disputes queue (`dispute-war-room/page.tsx`), interactive **3-Hop Buyer–Device–Carrier Relationship Map** (`svg[aria-label="3-Hop Buyer Device Carrier Fraud Graph"]`), plain-English Fraud Signal Breakdown bars, Carrier Delivery Receipt OCR uploader, and **Evidence Package Preview** with English/Hindi receipt translation |
| **Screen 5: Fastlane & PYUSD** | `/checkout-bridge` (`Cmd+5`) | **Channel3 MCP B2B Discovery ($1,500 Track, `F-12`, `US-16`)**, **PayPal Fastlane & Orders v2 (`F-05`, `F-06`, `TKT-020`)**, **PYUSD Solana Token-2022 Bridge (`F-11`, `TKT-022`, `US-15`)** | Wholesale Supplier Catalog (`checkout-bridge/page.tsx`), **PayPal Fastlane Express Checkout** (`FastlaneCheckoutIsland.tsx` with 10x duplicate-charge protection test, shipment tracking, and refund checks), **Instant Cross-Border PYUSD Settlement** (`PyusdSolanaBridgeModal.tsx`), and **Tamper-Proof Activity & Compliance Log** |

---

## 3. Enlarged QR Invoice Card & Companion Modals

- **Instant QR Invoice Card (`InvoiceQrModal.tsx`)**:
  - Enlarged `rounded-3xl` editorial modal featuring a deterministic **25×25 scannable QR code matrix** (`224px × 224px`), animated corner scan brackets, and a vector shield/checkmark center emblem.
  - Displays formatted customer organization name, email, due date, semantic status badge (`Awaiting Payment` / `Paid in Full` / `Overdue`), dual-currency total, and early-payment discount validity pill.
  - Interactive action footer with **Copy Link** (live `"Link Copied"` checkmark state), **Send Reminder** (live `"Reminder Sent"` confirmation), and **Pay with PYUSD** (`PyusdSolanaBridgeModal.tsx`).
- **Passkey Authorization Modal (`HitlApprovalCard.tsx`)**:
  - Clean human-readable approval card for held refunds or unauthorized override attempts, supporting team-member role switching and `Alt+A` / `Alt+R` keyboard shortcuts.

---

## 4. Dual-Mode API Client, SSE Stream & Demo-Day Replay Safety Net (`R-06`, `SSE-01`, `TKT-035`)

- **3 Operating Modes (`apps/web/src/lib/api-client.ts`)**:
  1. **`mock`**: Deterministic shared fixtures from `packages/shared/src/mock-fixtures.ts`.
  2. **`live`**: Connects to Fastify Control Plane (`http://localhost:4000/api/v1/...`) and real-time Server-Sent Events stream (`/api/v1/stream/events`).
  3. **`replay`**: Instant `<50ms` circuit-breaker fallback (`DEMO_REPLAY_MODE`, `R-06`) if upstream sandbox returns `HTTP 429` or times out.
- **WCAG 2.2 AA & Multilingual Support (`TKT-031`, `TKT-033`)**:
  - Supports `USD ($)`, `INR (₹ Lakh/Crore)`, `EUR (€)`, `GBP (£)`, and `PYUSD` across `en`, `hi`, `es`, and `de` locales, plus Hinglish (`hi-Latn`) natural-language prompt normalization in the bottom **Sentinel Assistant (`Cmd+K`)** bar (`GlobalCommandBar.tsx`).

---

## 5. Local Development & Verification Commands

```powershell
# 1. Start Next.js 15 Dev Server on Port 3000
npm --prefix apps/web run dev

# 2. Run Frontend Unit & Integration Tests (13/13 tests)
npx vitest run -c apps/web/vitest.config.ts

# 3. Run Shared E2E Verification Suite (6/6 tests)
npx vitest run tests/e2e/checkout-dispute.spec.ts

# 4. Typecheck apps/web (0 errors)
npm --prefix apps/web run typecheck

# 5. Run 4-Tier Deliverable Verifier (162/162 checks, Exit Code 0)
python tests/verify_deliverables.py
```
