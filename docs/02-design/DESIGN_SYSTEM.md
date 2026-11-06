# Design System & Visual Language — PayOps AI (PayPal Sentinel)
> Project: PayOps AI (PayPal Sentinel) · Owner: Principal Design Systems Architect · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [UI Spec](./UI_SPEC.md) · [Accessibility](./ACCESSIBILITY.md) · [Localization](./LOCALIZATION.md) · [Frontend](../03-engineering/FRONTEND.md)

---

## 1. Design Philosophy (Jony Ive & Chad Hurley Principles Applied to Agentic Finance)

Financial control planes fail when they either look like consumer chat toys (hiding critical risk telemetry behind conversational bubbles) or cluttered 1990s ERP tables. **PayOps AI (`PayPal Sentinel`)** synthesizes **Jony Ive's material honesty and spatial hierarchy** with **Chad Hurley's original PayPal brand trust cues**:

1. **Deterministic Trust Visibility:** Every autonomous AI action visibly displays its **three cryptographic trust badges** inline: `APIMatic Schema: PASS`, `Cosmos.AI Policy: ALLOW / HOLD`, and `JunoDB Idempotency Key: PayPal-Request-Id`.
2. **Tabular Precision (`tabular-nums`):** Every currency figure (`$`, `€`, `£`, `₹`, `PYUSD`), basis-point metric, GNN fraud score (`0.88`), and SLA countdown timer uses strict monospace/tabular numeral alignment so columns in **AG Grid (`F-07`)** and **Bryntum (`F-08`)** scan effortlessly at 60fps.
3. **Calm By Default, High-Contrast on Anomaly:** Routine `ALLOW` transactions recede into subtle slate/admiral surfaces; only policy-held actions (`HOLD_APPROVAL`) and friendly-fraud alerts (`gnn_risk_score >= 0.70`) command saturated Amber or Crimson visual elevation.
4. **Unified Theme Synchronization Across Sponsor Engines:** Custom CSS design tokens (`--payops-*`) bind simultaneously to Tailwind CSS, **AG Grid Quartz Financial Theme** (`--ag-*`), and **Bryntum Stockholm/Material Theme** (`--b-*`) so the entire application feels crafted by a single hand.

---

## 2. Color Tokens (Dark Executive Default & High-Clarity Light Mode)

All semantic tokens are defined in both **Hex** and perceptual **OKLCH** and exceed WCAG 2.2 AA contrast thresholds (`>= 4.5:1` for body text; `>= 7.1:1` AAA for financial figures).

| Token Name | Semantic Purpose | Dark Mode (Default Cockpit) | Light Mode (Audit / Print) | Contrast Ratio |
| :--- | :--- | :--- | :--- | :---: |
| `--payops-bg-canvas` | Primary app background | `#070B14` · `oklch(14% 0.025 255)` | `#F8FAFC` · `oklch(98% 0.005 250)` | — |
| `--payops-bg-surface` | AG Grid / Bryntum panel surface | `#0F172A` · `oklch(19% 0.032 255)` | `#FFFFFF` · `oklch(100% 0 0)` | `14.8:1` |
| `--payops-bg-elevated` | Glass drawer / Command Bar (`Cmd+K`) | `#1E293B` · `oklch(27% 0.035 255)` | `#F1F5F9` · `oklch(96% 0.008 250)` | `11.2:1` |
| `--payops-brand-admiral` | PayPal Heritage Admiral Blue | `#003087` · `oklch(32% 0.165 260)` | `#003087` · `oklch(32% 0.165 260)` | `10.4:1` (on white) |
| `--payops-brand-sky` | Primary interactive CTA & active tab | `#0070E0` · `oklch(55% 0.190 255)` | `#005EA6` · `oklch(46% 0.170 255)` | `7.2:1` |
| `--payops-brand-pyusd` | `PYUSD` Solana Token-2022 accent | `#14F195` · `oklch(84% 0.210 158)` | `#059669` · `oklch(60% 0.150 162)` | `8.9:1` |
| `--payops-status-allow` | Policy `ALLOW` & `DELIVERED` badge | `#10B981` · `oklch(70% 0.170 160)` | `#047857` · `oklch(52% 0.140 162)` | `7.8:1` |
| `--payops-status-hold` | Policy `HOLD_APPROVAL` & SLA warning | `#F59E0B` · `oklch(76% 0.175 75)` | `#B45309` · `oklch(54% 0.155 60)` | `8.4:1` |
| `--payops-status-deny` | Policy `DENY` & GNN High Fraud (`>=0.70`) | `#EF4444` · `oklch(63% 0.220 25)` | `#B91C1C` · `oklch(48% 0.195 25)` | `7.1:1` |
| `--payops-text-primary` | Primary headings & ledger amounts | `#F8FAFC` · `oklch(98% 0.005 250)` | `#0F172A` · `oklch(19% 0.032 255)` | `15.4:1` |
| `--payops-text-secondary`| Metadata, labels, timestamps | `#94A3B8` · `oklch(70% 0.025 255)` | `#475569` · `oklch(44% 0.030 255)` | `7.1:1` |
| `--payops-border-subtle` | Hairline grid & card dividers (`1px`) | `#1E293B` · `oklch(27% 0.035 255)` | `#E2E8F0` · `oklch(91% 0.012 250)` | — |

---

## 3. Typography & Multi-Script Font Stack

To support global (`$`, `€`, `£`) and Indian (`₹`, Devanagari) commerce seamlessly (`LOCALIZATION.md`), `PayOps AI` loads a three-tier variable font stack:

- **Primary UI & Executive Headings (`--font-sans`):** `'Inter Variable', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif`
- **Financial Ledgers, DSL Rules & Trace IDs (`--font-mono`):** `'JetBrains Mono Variable', 'Fira Code', monospace` with mandatory CSS:
  ```css
  .financial-figure {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums slashed-zero;
    letter-spacing: -0.015em;
  }
  ```
- **Indic / Multilingual Fallback (`--font-indic`):** `'Noto Sans Devanagari', 'Noto Sans', sans-serif` (ensuring crisp rendering of the Indian Rupee sign `₹` and Hindi `hi-IN` invoice line items).

### Type Scale
| Token | Size (`rem` / `px`) | Line Height | Weight | Tracking | Usage |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `display-kpi` | `2.0rem` (`32px`) | `1.15` | `700` | `-0.03em` | North-Star `ANMPR` & DSO hero counters |
| `heading-screen` | `1.375rem` (`22px`) | `1.25` | `600` | `-0.02em` | Screen titles & drawer headers |
| `heading-panel` | `1.0rem` (`16px`) | `1.35` | `600` | `-0.01em` | AG Grid / Bryntum section headers |
| `body-default` | `0.875rem` (`14px`) | `1.50` | `400` | `0.00em` | Standard copy, agent explanations, dispute notes |
| `table-cell` | `0.8125rem` (`13px`) | `1.35` | `500` | `-0.01em` | High-density AG Grid rows & Bryntum timeline bars |
| `code-badge` | `0.75rem` (`12px`) | `1.20` | `600` | `+0.02em` | `PayPal-Request-Id`, MCP tool pills, status badges |

---

## 4. Spatial Grid, Layout & Component Inventory

### 4.1 Three-Zone Executive Cockpit Architecture
- **Top Global Status & Demo Telemetry Bar (`56px` fixed height):** Workspace switcher (`E-01`), Live PayPal Sandbox OAuth2 status pill, `JunoDB` Quorum indicator, `DEMO_REPLAY_MODE` toggle, and 1-Click Webhook Simulator buttons.
- **Left Collapsible Navigation Rail (`240px` expanded / `64px` collapsed):** Direct switching across the 5 core screens (`1. AG Grid Command Center`, `2. Policy Firewall Studio`, `3. Smart Invoicing & Bryntum Scheduler`, `4. Dispute Defense War-Room`, `5. Agentic Checkout & PYUSD Bridge`).
- **Bottom/Floating Global Agent Command Bar (`Cmd+K`):** Spotlight-style natural-language input bar with live `M-02` intent badge, `dry_run` toggle (`US-02`), and expandable **Live MCP Tool Execution Trace Drawer**.

### 4.2 Core Custom & Sponsor Component Library

| Component Name | Backing Engine | Key Props & Interactive Capabilities |
| :--- | :--- | :--- |
| `<LedgerCommandGrid />` | **AG Grid Enterprise `32.3.2`** (`F-07`) | Async SSE row updates (`applyTransactionAsync`), Master-Detail evidence view, integrated **AG Charts** waterfall/sparklines, custom `PolicyVerdictCellRenderer`. |
| `<ReceivablesTimeline />` | **Bryntum Scheduler Pro `6.1.2`** (`F-08`) | Two-way drag-and-drop dunning milestone bars, dependency connectors, lower working-capital capacity histogram. |
| `<PolicyFirewallEditor />` | Custom AST Visual Builder (`F-02`) | Edits `Cosmos.AI`-style DSL rules (`E-05`), highlights matched DAG nodes in green/amber/red, runs `dry_run` counterfactual tests. |
| `<HitlApprovalCard />` | Cryptographic Approval Widget (`US-03`) | Displays held tool call diff, `M-02` injection score, `M-04` GNN risk score, and 1-click signed `Approve (Alt+A)` / `Reject (Alt+R)` buttons (`API-02`). |
| `<ApimaticCodeDrawer />` | **APIMatic SDK Exporter** (`F-09`) | Shows pre-flight schema validation result (`PASS`) and copies runnable TypeScript or Python `@paypal/paypal-server-sdk` code (`US-14`). |
| `<FastlanePyusdBridge />` | `@paypal/react-paypal-js` + Solana (`F-05`, `F-11`) | Combines PayPal **Fastlane** 1-tap guest checkout, Invoice QR code modal, and Solana Token-2022 `PYUSD` memo-bound settlement. |

---

## 5. Physics-Based Motion & Reduced-Motion Tokens

Following Apple-grade interface fluidity while respecting operator focus:
- **Drawer & Modal Spring (`--spring-snappy`):** `cubic-bezier(0.22, 1, 0.36, 1)` (`220ms` duration) for opening the MCP Trace Drawer and APIMatic Code Exporter.
- **AG Grid Row Flash (`--flash-highlight`):** `600ms` subtle emerald/amber background pulse when a live PayPal webhook (`API-13`) mutates a row.
- **`prefers-reduced-motion: reduce`:** All spring translations and row flashes automatically collapse to instant `0ms` opacity fades (`ACCESSIBILITY.md`).

---

## 6. Voice & Microcopy Tone Guidelines

- **Deterministic, Concise, Never Chatty:** `PayOps AI` speaks like a seasoned Chief Financial Officer and Risk Officer—never using filler phrases like *"Sure! I'd be happy to help you with that!"*
  - *Bad (Toy Chatbot):* `"Yay! I just created your invoice! Hope they pay soon! 🎉"`
  - *Good (`PayOps AI`):* `"Invoice INV2-8841 ($1,850.00 USD) created and sent via PayPal Invoicing v2. 2.0% Net-10 discount rule active; QR code attached. Idempotency key: pp-req-9f81a2."`
- **Actionable Error & Hold Explanations:** Every held or denied action states the exact rule ID, threshold, and remediation button (e.g., `"Execution Held by Rule POL-02: Refund amount $1,250.00 exceeds auto-approval cap ($500.00). Requires FINANCE_ADMIN signature."`).
