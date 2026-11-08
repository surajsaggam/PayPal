/**
 * PayOps AI (PayPal Sentinel) — Recurring Catalog & Subscription Plans Routes (API-12)
 * Maps to: F-08, E-09 (#31 create_product, #33 create_subscription_plan, #34 create_subscription)
 */

import type { FastifyInstance } from "fastify";
import {
  minorUnitsToTwoDecimalString,
  validatePayPalMonetaryPayload,
} from "@payops/shared";
import { elasticRagService } from "../../ai/m05-elastic-rag.js";
import { computeDeterministicIdempotencyKey } from "../../db/audit-chain.js";
import {
  normalizeWorkspaceId,
  repository,
  type HydratedSubscriptionPlan,
} from "../../db/repository.js";
import { PayOpsProblemError } from "../../lib/errors.js";
import { assertMutationPermitted } from "../../middleware/rbac-auth.js";
import { paypalToolkitHost } from "../agent-orchestrator/paypal-toolkit-host.js";
import { junoIdempotencyStore } from "../junodb-idempotency/idempotency-guard.js";

export async function registerSubscriptionsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/subscriptions/plans
   */
  app.get("/api/v1/subscriptions/plans", async (req) => {
    const query = (req.query ?? {}) as Record<string, string | undefined>;
    const workspaceId = normalizeWorkspaceId(query.workspaceId ?? query.workspace_id);
    const plans = repository.listSubscriptionPlans(workspaceId);
    return {
      workspaceId,
      workspace_id: workspaceId,
      plans,
      data: plans,
      total_count: plans.length,
    };
  });

  /**
   * API-12: POST /api/v1/subscriptions/plans
   * Creates a PayPal Catalog Product (create_product), Subscription Plan (create_subscription_plan),
   * and active Subscription (create_subscription).
   */
  app.post("/api/v1/subscriptions/plans", async (req, reply) => {
    const { operatorId } = assertMutationPermitted(req);
    const body = (req.body ?? {}) as Record<string, unknown>;

    const workspaceId = normalizeWorkspaceId(
      (body.workspaceId as string | undefined) ??
        (body.workspace_id as string | undefined)
    );
    const productName = String(
      body.productName ?? body.product_name ?? "Kaveri Managed Export Retainer"
    );
    const planName = String(
      body.planName ?? body.plan_name ?? "Monthly B2B Wholesale Plan"
    );
    const currencyInput = String(
      body.currencyCode ?? body.currency_code ?? "USD"
    ).toUpperCase();

    let rawAmount: string | number = "2500.00";
    if (body.amountValue !== undefined) {
      rawAmount = body.amountValue as string | number;
    } else if (body.amount_value !== undefined) {
      rawAmount = body.amount_value as string | number;
    } else if (typeof body.recurring_amount_minor === "number") {
      rawAmount = minorUnitsToTwoDecimalString(body.recurring_amount_minor);
    }

    const validation = validatePayPalMonetaryPayload(rawAmount, currencyInput);
    if (!validation.valid) {
      throw new PayOpsProblemError({
        status: 422,
        title: "APIMatic Subscription Plan Monetary Validation Failed",
        detail: validation.errors.join("; "),
        reasonCode: "R03_APIMATIC_VALIDATION_FAILED",
        errors: validation.errors,
      });
    }

    const cadenceRaw = String(
      body.billingIntervalUnit ?? body.billing_cycle_cadence ?? "MONTH"
    ).toUpperCase();
    const billingIntervalUnit: "MONTH" | "YEAR" =
      cadenceRaw === "YEAR" || cadenceRaw === "ANNUAL" ? "YEAR" : "MONTH";

    const headerKey = (req.headers["paypal-request-id"] as string | undefined)?.trim();
    const paypalRequestId =
      headerKey ||
      (body.idempotencyKey as string | undefined) ||
      computeDeterministicIdempotencyKey(
        workspaceId,
        "subscription_plan",
        `${productName}:${planName}:${validation.normalizedAmountValue}`,
        "create_plan"
      );

    const envelope = await junoIdempotencyStore.executeIdempotent(
      paypalRequestId,
      async () => {
        // Step 1: create_product (#31)
        const prodRes = await paypalToolkitHost.executeTool({
          toolName: "create_product",
          args: {
            name: productName,
            type: String(body.product_category ?? "SERVICE"),
          },
          workspaceId,
          paypalRequestId: `${paypalRequestId}_prod`,
        });
        const productId = String(prodRes.responsePayload.id);

        // Step 2: create_subscription_plan (#33)
        const planRes = await paypalToolkitHost.executeTool({
          toolName: "create_subscription_plan",
          args: {
            product_id: productId,
            plan_name: planName,
            billing_interval_unit: billingIntervalUnit,
            amountValue: validation.normalizedAmountValue,
            currencyCode: validation.currencyCode,
          },
          workspaceId,
          paypalRequestId,
        });
        const plan = planRes.responsePayload as unknown as HydratedSubscriptionPlan;

        // Step 3: create_subscription (#34)
        await paypalToolkitHost.executeTool({
          toolName: "create_subscription",
          args: {
            plan_id: plan.planId,
            subscriber_email:
              (body.subscriber_email as string | undefined) ??
              "ap@pacificboutique-la.example.com",
          },
          workspaceId,
          paypalRequestId: `${paypalRequestId}_sub`,
        });

        const auditEntry = repository.appendAuditLog({
          workspaceId,
          actorId: operatorId,
          toolName: "create_subscription_plan",
          paypalRequestId,
          policyVerdict: "APPROVED_L3_AUTO",
          payload: plan,
        });
        await elasticRagService.indexAuditLogEntry(auditEntry);

        return {
          statusCode: 201,
          result: {
            plan,
            ...plan,
            auditEntryHash: auditEntry.entryHash,
          },
        };
      }
    );

    reply.header("PayPal-Request-Id", envelope.paypalRequestId);
    if (envelope.replayed) {
      reply.header("X-Idempotent-Replayed", "true");
    }
    return reply.code(envelope.statusCode).send(envelope.result);
  });
}
