# Frontend Engineering Specification (`apps/web`) — PayOps AI (PayPal Sentinel)
> Project: PayOps AI (PayPal Sentinel) · Owner: Principal Frontend Architect · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [Design System](../02-design/DESIGN_SYSTEM.md) · [UI Spec](../02-design/UI_SPEC.md) · [Architecture](./ARCHITECTURE.md) · [ADR-0001](./adr/ADR-0001-tech-stack.md)

---

## 1. Application Architecture & Directory Layout (`Next.js 15` + `React 19`)

The web client (`apps/web`) is built on **Next.js `15.0.3` (App Router)**, **React `19.0.0`**, and **TypeScript `5.6.3`**, combining Server Components for zero-waterfall initial hydration with specialized client islands for **AG Grid Enterprise `32.3.2` (`F-07`)**, **Bryntum Scheduler Pro `6.1.2` (`F-08`)**, and **`@paypal/react-paypal-js` `8.7.0` (`F-05`)**.

```text
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                        # Global cockpit shell, PayPalScriptProvider & CommandBar (Cmd+K)
│   │   ├── page.tsx                          # Redirects to /command-center
│   │   ├── (cockpit)/
│   │   │   ├── command-center/page.tsx       # Screen 1: AG Grid Enterprise + AG Charts (F-07)
│   │   │   ├── policy-studio/page.tsx        # Screen 2: Cosmos.AI DSL Editor & APIMatic Export (F-02, F-09)
│   │   │   ├── invoicing-scheduler/page.tsx  # Screen 3: Smart Invoicing v2 & Bryntum Timeline (F-03, F-08)
│   │   │   ├── dispute-war-room/page.tsx     # Screen 4: Dispute Defense & M-04 GNN Graph (F-04, F-10)
│   │   │   └── checkout-bridge/page.tsx      # Screen 5: Channel3, Fastlane & PYUSD Bridge (F-05, F-11, F-12)
│   ├── components/
│   │   ├── ag-grid/                          # LedgerCommandGrid, PolicyVerdictCell, DisputeDetailRenderer
│   │   ├── bryntum/                          # ReceivablesTimeline, DunningHistogram (SSR-disabled dynamic import)
│   │   ├── paypal/                           # FastlaneCheckoutIsland, InvoiceQrModal, PyusdSolanaBridgeModal
│   │   ├── agent/                            # GlobalCommandBar, McpToolTraceDrawer, HitlApprovalCard
│   │   └── apimatic/                         # ApimaticSdkCodeDrawer (TypeScript / Python export)
│   ├── hooks/
│   │   ├── useSseExecutionStream.ts          # EventSource hook streaming E-04 & E-08 deltas into AG Grid
│   │   └── useHitlSignature.ts               # WebCrypto Ed25519 / HMAC approval signing (API-02)
│   └── stores/
│       └── useCockpitStore.ts                # Zustand store for workspace currency, dry_run flag & replay state
```

---

## 2. Routing, State Management & Real-Time SSE Synchronization

### 2.1 Hybrid Data Fetching & Live Streaming Pattern
Rather than polling `API-05` or `API-10` on a timer (which wastes PayPal Sandbox quota and introduces UI lag), `apps/web` pairs **TanStack Query v5** initial snapshots with a persistent **Server-Sent Events (`EventSource`)** stream (`/api/v1/stream/events`):

```typescript
// apps/web/src/hooks/useSseExecutionStream.ts
import { useEffect } from 'react';
import type { GridApi } from 'ag-grid-community';
import type { AgentToolExecution } from '@payops/shared-types';

export function useSseExecutionStream(gridApi: GridApi<AgentToolExecution> | null, workspaceId: string) {
  useEffect(() => {
    if (!gridApi) return;
    const source = new EventSource(`/api/v1/stream/events?workspace_id=${workspaceId}`);

    source.addEventListener('execution_delta', (event) => {
      const delta: { type: 'ADD' | 'UPDATE'; row: AgentToolExecution } = JSON.parse(event.data);
      // 60fps high-frequency row mutation in AG Grid Enterprise without React tree re-render
      gridApi.applyTransactionAsync({
        add: delta.type === 'ADD' ? [delta.row] : undefined,
        update: delta.type === 'UPDATE' ? [delta.row] : undefined,
      });
    });

    return () => source.close();
  }, [gridApi, workspaceId]);
}
```

---

## 3. Sponsor & PayPal UI SDK Integration Patterns

### 3.1 `AG Grid Enterprise 32.3.2` & `AG Charts Enterprise` (`F-07`)
- Configured with `getRowId={(params) => params.data.execution_id}`, `masterDetail={true}`, `enableCharts={true}`, `rowGroupPanelShow="always"`, and `asyncTransactionWaitMillis={30}`.
- Custom cell renderers (`PolicyVerdictCell`, `GnnRiskSparklineCell`, `HitlInlineActionCell`) are wrapped in `React.memo` to sustain `60fps` scrolling across `10,000+` ledger rows.

### 3.2 `Bryntum Scheduler Pro 6.1.2` (`F-08`)
- Because Bryntum manipulates browser DOM geometry directly, `<ReceivablesTimeline />` is loaded via `next/dynamic({ ssr: false })`.
- Two-way binding hooks into `onEventDrop` and `onEventResizeEnd`: dragging an invoice dunning milestone dispatches an optimistic mutation to `API-06` (`POST /api/v1/invoices/{invoiceId}/remind`) with automatic rollback on HTTP failure.

### 3.3 `@paypal/react-paypal-js` & `Fastlane` Guest Checkout (`F-05`)
- Wrapped in `<PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID, components: 'buttons,fastlane', enableFunding: 'venmo,paylater', currency: activeCurrency }}>`.
- All payment inputs execute strictly inside PayPal's **Zoid** cross-origin iframes (`ADR-0005`), guaranteeing zero raw card data ever enters our application DOM.

---

## 4. Offline Resilience, PWA & Performance Budget

| Metric / Budget | Target Threshold | Enforcement Mechanism |
| :--- | :---: | :--- |
| **First Contentful Paint (`FCP`) / `LCP`** | `< 0.8s` / `< 1.2s` | Next.js Server Components + route-level code splitting for AG Grid & Bryntum bundles. |
| **Interaction to Next Paint (`INP`)** | `< 80 ms` | AG Grid `applyTransactionAsync()` batching + Web Worker offloading for natural-language grid filtering. |
| **Cumulative Layout Shift (`CLS`)** | `0.00` | Fixed skeleton heights + `font-variant-numeric: tabular-nums` (`DESIGN_SYSTEM.md`). |
| **Offline / Demo Replay Continuity** | `100%` | IndexedDB state caching + top-bar `FF_DEMO_REPLAY_FALLBACK` switch (`R-06`). |
