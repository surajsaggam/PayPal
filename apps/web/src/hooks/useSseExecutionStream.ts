/**
 * PayOps AI (PayPal Sentinel) — Real-Time SSE Execution Stream Hook (SSE-01: /api/v1/stream/events)
 * Maps to: FRONTEND.md Section 2.1, F-07 AG Grid Enterprise applyTransactionAsync 60fps streaming
 * Write Owner: Dev 2 (100%)
 */

import { useEffect, useState } from "react";
import type { AgentToolExecution } from "@payops/shared";
import { useCockpitStore } from "../stores/useCockpitStore";

export interface GridApi<T = AgentToolExecution> {
  applyTransactionAsync: (transaction: { add?: T[]; update?: T[]; remove?: T[] }) => void;
}

const API_BASE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:4000";

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
        const delta: { type: "ADD" | "UPDATE"; row: AgentToolExecution } = JSON.parse(
          (event as MessageEvent).data
        );
        setLastEventIso(new Date().toISOString());
        if (gridApi) {
          gridApi.applyTransactionAsync({
            add: delta.type === "ADD" ? [delta.row] : undefined,
            update: delta.type === "UPDATE" ? [delta.row] : undefined,
          });
        }
        useCockpitStore.getState().prependExecution(delta.row);
      } catch {
        // Ignore malformed delta
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
