/**
 * PayOps AI (PayPal Sentinel) — PayPal Webhook Verification & Zapier Bridge Routes (API-13 / API-06, F-12)
 */

import type { FastifyInstance } from "fastify";
import { scoreFriendlyFraudGnn } from "../../ai/m04-gnn-scorer.js";
import { elasticRagService } from "../../ai/m05-elastic-rag.js";
import { normalizeWorkspaceId, repository } from "../../db/repository.js";
import { sseBus } from "../../lib/sse-bus.js";
import { paypalToolkitHost } from "../agent-orchestrator/paypal-toolkit-host.js";
import { junoIdempotencyStore } from "../junodb-idempotency/idempotency-guard.js";
import { verifyPayPalWebhookSignature } from "./verify-paypal-webhook.js";
import { zapierDispatcher } from "./zapier-dispatcher.js";

export async function registerWebhooksRoutes(app: FastifyInstance): Promise<void> {
  const handlePayPalWebhook = async (
    req: {
      headers: Record<string, string | string[] | undefined>;
      body: unknown;
      rawBodyString?: string;
    },
    reply: {
      header: (k: string, v: string) => void;
      code: (n: number) => { send: (p: unknown) => unknown };
    }
  ) => {
    const bodyObj = (req.body ?? {}) as Record<string, unknown>;
    const rawBody = req.rawBodyString ?? JSON.stringify(bodyObj);

    const verification = verifyPayPalWebhookSignature({
      headers: req.headers,
      rawBody,
    });

    const eventId = String(bodyObj.id ?? verification.transmissionId);
    const eventType = String(bodyObj.event_type ?? "CUSTOMER.DISPUTE.CREATED");
    const resource = (bodyObj.resource ?? {}) as Record<string, unknown>;
    const workspaceId = normalizeWorkspaceId(
      (resource.workspace_id as string | undefined) ?? "ws_99102a"
    );

    const junoEnvelope = await junoIdempotencyStore.executeIdempotent(
      `webhook_${verification.transmissionId}`,
      async () => {
        let triggeredWorkflow = "F04_AUTONOMOUS_DISPUTE_DEFENSE";

        if (eventType === "CUSTOMER.DISPUTE.CREATED") {
          triggeredWorkflow = "F04_AUTONOMOUS_DISPUTE_DEFENSE";
          const disputeId = String(resource.dispute_id ?? "PP-D-90412");
          const existingDispute = repository.getDispute(disputeId);
          const gnn = scoreFriendlyFraudGnn({
            disputeId,
            disputedAmountUsd: existingDispute
              ? Number(existingDispute.disputedAmountValue)
              : 420,
            trackingStatus: existingDispute?.trackingStatus ?? "DELIVERED",
            reasonCode: existingDispute?.reasonCode ?? "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
          });
          if (existingDispute) {
            sseBus.emitEvent("dispute_alert", {
              ...existingDispute,
              gnnRiskScore: gnn.gnnRiskScore,
            });
          }
        } else if (eventType === "INVOICING.INVOICE.PAID") {
          triggeredWorkflow = "F03_INVOICE_RECONCILIATION";
          const invoiceId = String(
            resource.invoice_id ?? resource.id ?? "INV2-X89A-4412-9012-7731"
          );
          await paypalToolkitHost.executeTool({
            toolName: "cancel_invoice_auto_reminder",
            args: { invoice_id: invoiceId },
            workspaceId,
            paypalRequestId: `wh_cancel_rem_${verification.transmissionId}`,
          });
          const inv = repository.getInvoice(invoiceId);
          if (inv) {
            repository.saveInvoice({
              ...inv,
              status: "PAID",
              dunning_state: "PAID",
            });
          }
        } else if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
          triggeredWorkflow = "F05_ORDER_CAPTURE_SYNC";
          const orderId = String(resource.order_id ?? "8XL99102481");
          const ord = repository.getOrder(orderId);
          if (ord) {
            repository.saveOrder({
              ...ord,
              status: "COMPLETED",
            });
          }
        } else if (eventType === "BILLING.SUBSCRIPTION.RENEWED") {
          triggeredWorkflow = "F08_SUBSCRIPTION_RENEWAL";
        }

        const auditEntry = repository.appendAuditLog({
          workspaceId,
          actorId: "paypal_webhook_verifier",
          toolName: eventType,
          paypalRequestId: verification.transmissionId,
          policyVerdict: "WEBHOOK_SIGNATURE_VERIFIED",
          payload: {
            webhookEventId: eventId,
            eventType,
            triggeredWorkflow,
            crc32Decimal: verification.crc32Decimal,
          },
        });
        await elasticRagService.indexAuditLogEntry(auditEntry);

        return {
          statusCode: 202,
          result: {
            webhook_event_id: eventId,
            signature_verified: true,
            event_type: eventType,
            triggered_workflow: triggeredWorkflow,
            idempotent_replayed: false,
            audit_entry_hash: auditEntry.entryHash,
          },
        };
      }
    );

    const payload = {
      ...junoEnvelope.result,
      idempotent_replayed: junoEnvelope.replayed,
    };

    if (junoEnvelope.replayed) {
      reply.header("X-Idempotent-Replayed", "true");
    }
    return reply.code(202).send(payload);
  };

  /**
   * API-13: POST /api/v1/webhooks/paypal (plus alias POST /api/v1/webhooks)
   */
  app.post("/api/v1/webhooks/paypal", handlePayPalWebhook);
  app.post("/api/v1/webhooks", handlePayPalWebhook);

  /**
   * Extension Routes for Zapier Outbound MCP Bridge (F-12):
   * POST /api/v1/integrations/zapier/trigger & GET /api/v1/integrations/zapier/deliveries
   */
  app.post("/api/v1/integrations/zapier/trigger", async (req) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const workspaceId = normalizeWorkspaceId(
      (body.workspaceId as string | undefined) ??
        (body.workspace_id as string | undefined)
    );
    const eventType =
      (body.eventType as
        | "HITL_APPROVAL_REQUIRED"
        | "DISPUTE_AUTO_DEFENDED"
        | "PYUSD_SETTLEMENT_CONFIRMED"
        | "CUSTOM_ALERT") ?? "CUSTOM_ALERT";

    return zapierDispatcher.dispatchAlert({
      eventType,
      workspaceId,
      paypalRequestId: body.paypalRequestId as string | undefined,
      payload: (body.payload as Record<string, unknown>) ?? body,
    });
  });

  app.get("/api/v1/integrations/zapier/deliveries", async (req) => {
    const query = (req.query ?? {}) as Record<string, string | undefined>;
    const deliveries = zapierDispatcher.listDeliveries(
      query.workspaceId ?? query.workspace_id
    );
    return {
      deliveries,
      total_count: deliveries.length,
    };
  });
}
