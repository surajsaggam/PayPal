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

  if (event.eventType === "execution_delta") {
    const raw = event.payload as
      | AgentToolExecution
      | { type?: "ADD" | "UPDATE"; row?: AgentToolExecution };
    const row = "row" in raw && raw.row ? raw.row : (raw as AgentToolExecution);
    const txType = "type" in raw && raw.type ? raw.type : "ADD";

    if (gridApi) {
      gridApi.applyTransactionAsync({
        add: txType === "ADD" ? [row] : undefined,
        update: txType === "UPDATE" ? [row] : undefined,
      });
    }
    store.prependExecution(row);
    return;
  }

  if (event.eventType === "dispute_alert") {
    const dispute = event.payload as PayPalDisputeCase;
    store.upsertDisputeAlert(dispute);
    if (gridApi) {
      const latestExec = useCockpitStore.getState().executions[0];
      if (latestExec) {
        gridApi.applyTransactionAsync({ add: [latestExec] });
      }
    }
    return;
  }

  if (event.eventType === "policy_hold") {
    const heldRow = event.payload as AgentToolExecution;
    if (gridApi) {
      gridApi.applyTransactionAsync({ add: [heldRow] });
    }
    store.prependExecution(heldRow);
    store.openHitlApproval(heldRow);
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

    source.addEventListener("execution_delta", (event) => {
      try {
        const parsed = JSON.parse((event as MessageEvent).data) as
          | AgentToolExecution
          | { type?: "ADD" | "UPDATE"; row?: AgentToolExecution };
        const nowIso = new Date().toISOString();
        setLastEventIso(nowIso);
        dispatchSyntheticSseEvent(
          {
            eventType: "execution_delta",
            timestampIso: nowIso,
            payload: parsed as Record<string, unknown>,
          },
          gridApi
        );
      } catch {
        // Ignore malformed delta
      }
    });

    source.addEventListener("dispute_alert", (event) => {
      try {
        const dispute = JSON.parse((event as MessageEvent).data) as PayPalDisputeCase;
        const nowIso = new Date().toISOString();
        setLastEventIso(nowIso);
        dispatchSyntheticSseEvent(
          {
            eventType: "dispute_alert",
            timestampIso: nowIso,
            payload: dispute,
          },
          gridApi
        );
      } catch {
        // Ignore malformed dispute alert
      }
    });

    source.addEventListener("policy_hold", (event) => {
      try {
        const heldExec = JSON.parse((event as MessageEvent).data) as AgentToolExecution;
        const nowIso = new Date().toISOString();
        setLastEventIso(nowIso);
        dispatchSyntheticSseEvent(
          {
            eventType: "policy_hold",
            timestampIso: nowIso,
            payload: heldExec,
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
