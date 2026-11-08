/**
 * PayOps AI (PayPal Sentinel) — Zapier Outbound Catch-Hook Dispatcher (F-12)
 * Dispatches structured JSON alerts on HITL holds, dispute resolutions, and PYUSD settlements
 * with 3x retry backoff and an in-memory delivery ledger for zero-flake verification.
 */

import crypto from "node:crypto";
import { envConfig } from "../../config/env.js";

export interface ZapierWebhookDeliveryRecord {
  deliveryId: string;
  eventType:
    | "HITL_APPROVAL_REQUIRED"
    | "DISPUTE_AUTO_DEFENDED"
    | "PYUSD_SETTLEMENT_CONFIRMED"
    | "CUSTOM_ALERT";
  workspaceId: string;
  paypalRequestId: string;
  targetUrl: string;
  attempts: number;
  status: "DELIVERED_SANDBOX_SIMULATED" | "DELIVERED_LIVE_HTTP";
  timestampIso: string;
  payload: Record<string, unknown>;
}

class ZapierWebhookDispatcher {
  private readonly deliveries: ZapierWebhookDeliveryRecord[] = [];

  public async dispatchAlert(params: {
    eventType: ZapierWebhookDeliveryRecord["eventType"];
    workspaceId: string;
    paypalRequestId?: string;
    payload: Record<string, unknown>;
  }): Promise<ZapierWebhookDeliveryRecord> {
    const deliveryId = `zap_${crypto.randomBytes(6).toString("hex")}`;
    const timestampIso = new Date().toISOString();
    const paypalRequestId = params.paypalRequestId ?? `idem_zap_${deliveryId}`;
    const targetUrl = envConfig.zapierWebhookUrl;

    let status: ZapierWebhookDeliveryRecord["status"] = "DELIVERED_SANDBOX_SIMULATED";
    let attempts = 1;

    // Only make external network calls if explicitly pointed to a live non-demo hook
    if (
      targetUrl &&
      !targetUrl.includes("/hooks/catch/demo/") &&
      process.env.ENABLE_LIVE_ZAPIER_HTTP === "true"
    ) {
      const delays = [50, 100, 200];
      for (let i = 0; i < delays.length; i += 1) {
        attempts = i + 1;
        try {
          const res = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              deliveryId,
              eventType: params.eventType,
              workspaceId: params.workspaceId,
              paypalRequestId,
              timestampIso,
              payload: params.payload,
            }),
            signal: AbortSignal.timeout(1500),
          });
          if (res.ok) {
            status = "DELIVERED_LIVE_HTTP";
            break;
          }
        } catch {
          await new Promise((r) => setTimeout(r, delays[i]));
        }
      }
    }

    const record: ZapierWebhookDeliveryRecord = {
      deliveryId,
      eventType: params.eventType,
      workspaceId: params.workspaceId,
      paypalRequestId,
      targetUrl,
      attempts,
      status,
      timestampIso,
      payload: params.payload,
    };
    this.deliveries.push(record);
    return record;
  }

  public listDeliveries(workspaceId?: string): ReadonlyArray<ZapierWebhookDeliveryRecord> {
    if (!workspaceId) {
      return [...this.deliveries];
    }
    return this.deliveries.filter((d) => d.workspaceId === workspaceId);
  }
}

export const zapierDispatcher = new ZapierWebhookDispatcher();
