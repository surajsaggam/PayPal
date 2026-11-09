/**
 * PayOps AI (PayPal Sentinel) — Real-Time SSE Execution Stream Hook (SSE-01: /api/v1/stream/events)
 * Maps to: FRONTEND.md Section 2.1, F-07 AG Grid Enterprise applyTransactionAsync 60fps streaming,
 * F-04 & F-10 real-time dispute_alert and policy_hold SSE handling (H23-H24)
 * Write Owner: Dev 2 (100%)
 */

import { useEffect, useState } from "react";
import type { AgentToolExecution, PayPalDisputeCase, SseStreamEvent } from "@payops/shared";
import { useCockpitStore } from "../stores/useCockpitStore";

export interface GridApi<T = AgentToolExecution> {
  applyTransactionAsync: (transaction: { add?: T[]; update?: T[]; remove?: T[] }) => void;
}

const API_BASE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:4000";

/**
 * Processes an SSE-01 event (execution_delta, dispute_alert, policy_hold, replay_mode_engaged)
 * and synchronizes both AG Grid Enterprise (applyTransactionAsync) and the Zustand Cockpit Store.
 */
export function dispatchSyntheticSseEvent(
  event: SseStreamEvent,
  gridApi?: GridApi<AgentToolExecution> | null
): void {
  const store = useCockpitStore.getState();
  const rawPayload = event.payload as Record<string, unknown> | undefined;
  const inner =
    rawPayload &&
    typeof rawPayload === "object" &&
    "payload" in rawPayload &&
    "eventType" in rawPayload
      ? (rawPayload.payload as Record<string, unknown>)
      : rawPayload;

  if (event.eventType === "execution_delta") {
    if (inner && typeof inner === "object") {
      // Handle autonomous invoice creation delta emitted by API-04
      const maybeInvoice = (inner as { invoice?: Record<string, unknown> }).invoice;
      if (maybeInvoice && typeof maybeInvoice.invoiceId === "string") {
        store.createAutonomousInvoice(
          maybeInvoice as unknown as Parameters<typeof store.createAutonomousInvoice>[0]
        );
      }
      // Handle PYUSD settlement confirmation delta emitted by F-11
      if (
        inner.event === "PYUSD_SETTLEMENT_CONFIRMED" &&
        typeof inner.invoiceId === "string"
      ) {
        const invId = String(inner.invoiceId);
        const txSig = String(
          inner.solanaTxSignature ?? "5xPyusdSolanaToken2022Sig99102aConfirmed"
        );
        const memoStr = String(
          inner.memo ?? `PAYOPS:${invId}:idem_ws_99102a_pyusd`
        );
        store.settleInvoiceWithPyusd(invId, txSig, memoStr);
      }
    }

    const candidate = (
      inner && typeof inner === "object" && "row" in inner && inner.row
        ? inner.row
        : inner
    ) as Partial<AgentToolExecution> | undefined;

    if (
      candidate &&
      typeof candidate.executionId === "string" &&
      typeof candidate.toolName === "string" &&
      typeof candidate.gnnRiskScore === "number"
    ) {
      const row = candidate as AgentToolExecution;
      const txType =
        inner && typeof inner === "object" && "type" in inner && inner.type === "UPDATE"
          ? "UPDATE"
          : "ADD";

      if (gridApi) {
        gridApi.applyTransactionAsync({
          add: txType === "ADD" ? [row] : undefined,
          update: txType === "UPDATE" ? [row] : undefined,
        });
      }
      store.prependExecution(row);
    }
    return;
  }

  if (event.eventType === "dispute_alert") {
    const disputeCandidate = (
      inner && typeof inner === "object" && "dispute" in inner && inner.dispute
        ? inner.dispute
        : inner
    ) as Partial<PayPalDisputeCase> | undefined;

    if (
      disputeCandidate &&
      typeof disputeCandidate.disputeId === "string" &&
      typeof disputeCandidate.gnnRiskScore === "number"
    ) {
      store.upsertDisputeAlert(disputeCandidate as PayPalDisputeCase);
      if (gridApi) {
        const latestExec = useCockpitStore.getState().executions[0];
        if (latestExec) {
          gridApi.applyTransactionAsync({ add: [latestExec] });
        }
      }
    }
    return;
  }

  if (event.eventType === "policy_hold") {
    const heldCandidate = (
      inner && typeof inner === "object" && "row" in inner && inner.row
        ? inner.row
        : inner
    ) as Partial<AgentToolExecution> | undefined;

    if (
      heldCandidate &&
      typeof heldCandidate.executionId === "string" &&
      typeof heldCandidate.toolName === "string" &&
      typeof heldCandidate.gnnRiskScore === "number"
    ) {
      const heldRow = heldCandidate as AgentToolExecution;
      if (gridApi) {
        gridApi.applyTransactionAsync({ add: [heldRow] });
      }
      store.prependExecution(heldRow);
      store.openHitlApproval(heldRow);
    }
    return;
  }

  if (event.eventType === "replay_mode_engaged") {
    store.setApiMode("replay");
  }
}

export function useSseExecutionStream(
  gridApi: GridApi<AgentToolExecution> | null,
  workspaceId: string
) {
  const apiMode = useCockpitStore((s) => s.apiMode);
  const [connected, setConnected] = useState<boolean>(true);
  const [lastEventIso, setLastEventIso] = useState<string>("2026-11-08T18:42:11.000Z");

  useEffect(() => {
    if (apiMode !== "live") {
      setConnected(true);
      return;
    }

    if (typeof EventSource === "undefined") {
      return;
    }

    const source = new EventSource(
      `${API_BASE_URL}/api/v1/stream/events?workspace_id=${encodeURIComponent(workspaceId)}`
    );

    source.onopen = () => {
      setConnected(true);
    };

    const unwrapSseFrameData = (rawText: string): Record<string, unknown> => {
      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      if (
        parsed &&
        typeof parsed === "object" &&
        "payload" in parsed &&
        "eventType" in parsed &&
        parsed.payload &&
        typeof parsed.payload === "object"
      ) {
        return parsed.payload as Record<string, unknown>;
      }
      return parsed;
    };

    source.addEventListener("execution_delta", (event) => {
      try {
        const payload = unwrapSseFrameData((event as MessageEvent).data);
        const nowIso = new Date().toISOString();
        setLastEventIso(nowIso);
        dispatchSyntheticSseEvent(
          {
            eventType: "execution_delta",
            timestampIso: nowIso,
            payload,
          },
          gridApi
        );
      } catch {
        // Ignore malformed delta
      }
    });

    source.addEventListener("dispute_alert", (event) => {
      try {
        const payload = unwrapSseFrameData((event as MessageEvent).data);
        const nowIso = new Date().toISOString();
        setLastEventIso(nowIso);
        dispatchSyntheticSseEvent(
          {
            eventType: "dispute_alert",
            timestampIso: nowIso,
            payload,
          },
          gridApi
        );
      } catch {
        // Ignore malformed dispute alert
      }
    });

    source.addEventListener("policy_hold", (event) => {
      try {
        const payload = unwrapSseFrameData((event as MessageEvent).data);
        const nowIso = new Date().toISOString();
        setLastEventIso(nowIso);
        dispatchSyntheticSseEvent(
          {
            eventType: "policy_hold",
            timestampIso: nowIso,
            payload,
          },
          gridApi
        );
      } catch {
        // Ignore malformed policy_hold event
      }
    });

    source.onerror = () => {
      source.close();
      // R-06 graceful fallback to deterministic replay if live stream drops
      setConnected(false);
    };

    return () => {
      source.close();
    };
  }, [gridApi, workspaceId, apiMode]);

  return { connected, lastEventIso };
}
