# Accessibility Specification (WCAG 2.2 AA & Global Compliance) — PayOps AI (PayPal Sentinel)
> Project: PayOps AI (PayPal Sentinel) · Owner: Frontend Accessibility & Inclusive Design Lead · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [Design System](./DESIGN_SYSTEM.md) · [UI Spec](./UI_SPEC.md) · [Localization](./LOCALIZATION.md)

---

## 1. Accessibility Mandate & Regulatory Alignment

Financial operations software must be usable by every operator, founder, auditor, and buyer regardless of visual, motor, auditory, or cognitive ability. Moreover, PayPal Developer Advocate **Jo Franchetti** explicitly evaluates web standards and accessible UI ergonomics. `PayOps AI (PayPal Sentinel)` is engineered to satisfy:

1. **W3C WCAG 2.2 Level AA** (with **Level AAA `>= 7.1:1`** contrast on all financial amounts, risk scores, and policy verdicts).
2. **United States:** Americans with Disabilities Act (**ADA Title III**) & **Section 508** (supporting public-sector procurement in `PROCUREMENT.md`).
3. **European Union:** **European Accessibility Act (EAA — Directive (EU) 2019/882, enforced June 2025)** for e-commerce and banking/payment interfaces (`EN 301 549`).
4. **India:** **Rights of Persons with Disabilities (RPwD) Act, 2016**, **IS 17802 (Part 1 & 2)**, and **Guidelines for Indian Government Websites & Apps (GIGW 3.0)**.

---

## 2. WCAG 2.2 Level AA Point-by-Point Compliance Checklist

| WCAG 2.2 Criterion | Level | Concrete Implementation in `PayOps AI` | Verification Method |
| :--- | :---: | :--- | :--- |
| **1.1.1 Non-Text Content** | A | Every QR code (`generate_invoice_qr_code`), **AG Charts** waterfall, and **GNN Risk Graph** node includes a programmatic text alternative (`aria-label` + accessible summary table toggle). | `axe-core` + NVDA / VoiceOver |
| **1.3.1 Info and Relationships** | A | **AG Grid Enterprise** (`F-07`) renders with full `role="treegrid"`, `aria-rowcount`, `aria-colcount`, and semantic column headers. | Chrome Accessibility Tree inspection |
| **1.4.3 / 1.4.6 Contrast** | AA / AAA | Body text `>= 7.1:1`; ledger figures `15.4:1`; status badges (`ALLOW`/`HOLD`/`DENY`) pair high-contrast color with distinct icons (`✓`, `⏸`, `✕`) and text labels so color is never the sole indicator (**1.4.1**). | OKLCH token verification (`DESIGN_SYSTEM.md`) |
| **1.4.4 Resize Text & 1.4.10 Reflow** | AA | Responsive CSS Grid layout supports **200% browser zoom** and `320px` CSS viewport width without clipping financial figures or horizontal page scrollbars. | Playwright viewport zoom test |
| **2.1.1 / 2.1.4 Keyboard & Shortcuts** | A | 100% of agent workflows, AG Grid row actions, and Bryntum milestone adjustments are operable via keyboard alone (`Cmd+K`, `Alt+A`, `Alt+R`, arrow keys) with remappable modifier keys. | Manual zero-mouse walkthrough |
| **2.4.7 / 2.4.11 Focus Appearance & Not Obscured (WCAG 2.2)** | AA | All interactive elements display a `2px solid #0070E0` (`--payops-brand-sky`) focus ring with `2px` offset (`>= 3:1` contrast) and are never hidden behind the sticky Command Bar. | Automated Playwright focus traversal |
| **2.5.7 Dragging Movements (WCAG 2.2)** | AA | Every drag-and-drop dunning milestone bar in **Bryntum Scheduler Pro (`F-08`)** also provides a single-click/keyboard accessible **Date/Offset Popover Editor** so motor-impaired users never need to drag a mouse. | Keyboard-only Bryntum schedule edit test |
| **2.5.8 Target Size Minimum (WCAG 2.2)** | AA | All touch and click targets (including inline `Approve` / `Reject` buttons in AG Grid and mobile approval cards) measure at least **`36×36 CSS pixels`** (`>= 24×24px` WCAG 2.2 minimum, `44×44px` on mobile). | CSS box-model audit |
| **3.3.7 Redundant Entry (WCAG 2.2)** | A | **Fastlane by PayPal** (`F-05`) and autonomous invoice pre-fill (`F-03`) eliminate repetitive manual typing of shipping/billing details. | User journey verification |
| **3.3.8 Accessible Authentication (WCAG 2.2)** | AA | Operator login and human-in-the-loop approval (`E-02`, `API-02`) support WebAuthn **Passkeys** and password managers without cognitive puzzle CAPTCHAs. | Auth flow inspection |
| **4.1.3 Status Messages** | AA | Live SSE updates from the PayPal MCP Orchestrator (`E-04`) and incoming webhooks (`API-13`) announce via polite ARIA live regions (`role="status" aria-live="polite"`) without stealing keyboard focus. | Screen-reader live stream test |

---

## 3. Keyboard Navigation & Power-Operator Shortcut Map

| Shortcut | Scope | Action Triggered |
| :--- | :--- | :--- |
| **`Cmd/Ctrl + K`** | Global | Focus the **PayPal MCP Agent Command Bar** (`UI_SPEC.md`). |
| **`Cmd/Ctrl + 1..5`** | Global | Switch directly between Screens 1 through 5. |
| **`Cmd/Ctrl + Shift + D`** | Command Bar | Toggle `dry_run: true` deterministic simulation mode (`US-02`). |
| **`Alt + A` / `Alt + R`** | Focused Held Row | Cryptographically **Approve** (`Alt+A`) or **Reject** (`Alt+R`) the focused `HOLD_APPROVAL` execution (`API-02`). |
| **`Arrow Keys` + `Space`** | AG Grid (`F-07`) | Navigate cells (`Arrow Keys`), expand/collapse Master-Detail dispute evidence row (`Space` / `Enter`). |
| **`Enter` then `Left/Right`**| Bryntum (`F-08`) | Shift selected invoice dunning milestone by `-1 / +1 day` via keyboard (satisfying WCAG 2.2 **2.5.7 Dragging Movements**). |
| **`Escape`** | Modals / Drawers | Close active QR modal, APIMatic code drawer, or clear Command Bar input. |

---

## 4. Screen Reader, Voice-First & Low-Literacy Financial Patterns

1. **Structured Screen-Reader Announcements for Financial Mutations:**
   When a `CUSTOMER.DISPUTE.CREATED` webhook arrives, the `aria-live="polite"` region announces a concise, structured summary rather than raw JSON:
   > *"Alert: New PayPal dispute PP-D-4012 for 340 US Dollars. Carrier status: Delivered by DHL. Friendly-fraud risk: High at 88 percent. Defense evidence compiled."*
2. **Voice-Assisted Bilingual Command Input (`en-US`, `en-IN`, `hi-IN`):**
   Merchants using mobile or assistive voice input can speak natural commands in English or Hindi/Hinglish (e.g., *"Acme Robotics ko 1,850 dollar ka invoice bhejo with QR code"*), which `M-02` + Bhashini/Whisper normalizes into a deterministic `API-04` request (`LOCALIZATION.md`).
3. **Plain-Language Policy & Risk Summaries:**
   Every complex `Cosmos.AI` DSL expression (`E-05`) and `M-04` GNN score is accompanied by a 1-sentence plain-language explanation at an 8th-grade reading level so non-technical SMB owners never misinterpret a financial guardrail.
