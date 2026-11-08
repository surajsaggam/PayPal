/**
 * PayOps AI (PayPal Sentinel) — Real-Time Server-Sent Events (SSE-01) Broadcast Bus
 * Broadcasts execution_delta, dispute_alert, policy_hold, and replay_mode_engaged events.
 */

import { EventEmitter } from "node:events";
import type { SseStreamEvent } from "@payops/shared";

class PayOpsSseEventBus {
  private readonly emitter = new EventEmitter();
  private readonly recentEvents: SseStreamEvent[] = [];
  private readonly maxRecent = 50;

  constructor() {
    this.emitter.setMaxListeners(200);
  }

  public publish(event: SseStreamEvent): void {
    this.recentEvents.push(event);
    if (this.recentEvents.length > this.maxRecent) {
      this.recentEvents.shift();
    }
    this.emitter.emit("sse_event", event);
  }

  public emitEvent(
    eventType: SseStreamEvent["eventType"],
    payload: SseStreamEvent["payload"]
  ): SseStreamEvent {
    const event: SseStreamEvent = {
      eventType,
      timestampIso: new Date().toISOString(),
      payload,
    };
    this.publish(event);
    return event;
  }

  public subscribe(listener: (event: SseStreamEvent) => void): () => void {
    this.emitter.on("sse_event", listener);
    return () => {
      this.emitter.off("sse_event", listener);
    };
  }

  public getRecentEvents(limit = 10): SseStreamEvent[] {
    return this.recentEvents.slice(-limit);
  }
}

export const sseBus = new PayOpsSseEventBus();
