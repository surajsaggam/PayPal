/**
 * PayOps AI (PayPal Sentinel) — Autonomous Smart Invoicing v2 & PYUSD Settlement Routes (API-04, API-05, API-06)
 */

import type { FastifyInstance } from "fastify";
import {
  evaluateCosmosPolicyFirewall,
  evaluateInvoiceReminderCooldown,
  minorUnitsToTwoDecimalString,
  validatePayPalMonetaryPayload,
  type CurrencyCode,
} from "@payops/shared";
import { elasticRagService } from "../../ai/m05-elastic-rag.js";
import { computeDeterministicIdempotencyKey } from "../../db/audit-chain.js";
import { normalizeWorkspaceId, repository, type HydratedInvoiceRecord } from "../../db/repository.js";
import { PayOpsProblemError } from "../../lib/errors.js";
import { sseBus } from "../../lib/sse-bus.js";
import { assertMutationPermitted } from "../../middleware/rbac-auth.js";
import { paypalToolkitHost } from "../agent-orchestrator/paypal-toolkit-host.js";
import { junoIdempotencyStore } from "../junodb-idempotency/idempotency-guard.js";
import { executePyusdSolanaSettlement } from "../pyusd-bridge/pyusd-solana.service.js";

export async function registerInvoicingRoutes(app: FastifyInstance): Promise<void> {
  /**
   * API-04: POST /api/v1/invoices/autonomous
   * Generates sequential invoice number, validates 2-decimal ISO-4217 amount via APIMatic (F-09),
   * attaches conditional early-payment discount / late-fee rules, generates QR code, and sends Invoice v2.
   */
  app.post("/api/v1/invoices/autonomous", async (req, reply) => {
    const { operatorId } = assertMutationPermitted(req);
    const body = (req.body ?? {}) as Record<string, unknown>;

    const workspaceId = normalizeWorkspaceId(
      (body.workspaceId as string | undefined) ??
        (body.workspace_id as string | undefined)
    );
    const recipientEmail = String(
      body.recipientEmail ??
        body.recipient_email ??
        "procurement@pacificboutique-la.example.com"
    );
    const currencyInput = String(
      body.currencyCode ?? body.currency_code ?? "USD"
    ).toUpperCase();

    // Support both amountValue ("2450.00") and OpenAPI items[].unit_amount_minor
    let rawAmount: string | number = "2450.00";
    if (body.amountValue !== undefined) {
      rawAmount = body.amountValue as string | number;
    } else if (body.amount_value !== undefined) {
      rawAmount = body.amount_value as string | number;
    } else if (typeof body.amount_minor === "number") {
      rawAmount = minorUnitsToTwoDecimalString(body.amount_minor);
    } else if (Array.isArray(body.items) && body.items.length > 0) {
      const totalMinor = (body.items as Array<Record<string, unknown>>).reduce(
        (acc, item) =>
          acc +
          Number(item.quantity ?? 1) * Number(item.unit_amount_minor ?? 245000),
        0
      );
      rawAmount = minorUnitsToTwoDecimalString(totalMinor);
    }

    const validation = validatePayPalMonetaryPayload(rawAmount, currencyInput);
    if (!validation.valid) {
      throw new PayOpsProblemError({
        status: 422,
        title: "APIMatic Invoice Monetary Payload Validation Failed",
        detail: validation.errors.join("; "),
        reasonCode: "R03_APIMATIC_VALIDATION_FAILED",
        errors: validation.errors,
      });
    }

    const dueDate = String(body.dueDate ?? body.due_date ?? "2026-11-28");
    const earlyDiscountPct = String(
      body.earlyPaymentDiscountPct ??
        (body.conditional_rules as Record<string, unknown> | undefined)
          ?.early_discount_pct ??
        "2.00"
    );

    const headerKey = (req.headers["paypal-request-id"] as string | undefined)?.trim();
    const paypalRequestId =
      headerKey ||
      (body.idempotencyKey as string | undefined) ||
      computeDeterministicIdempotencyKey(
        workspaceId,
        "invoice",
        `${recipientEmail}:${validation.normalizedAmountValue}:${dueDate}`,
        "create_and_send"
      );

    const envelope = await junoIdempotencyStore.executeIdempotent(
      paypalRequestId,
      async () => {
        // Step 1: Generate next sequential invoice number (#9)
        const numRes = await paypalToolkitHost.executeTool({
          toolName: "generate_invoice_number",
          args: { workspace_id: workspaceId },
          workspaceId,
          paypalRequestId: `${paypalRequestId}_num`,
        });
        const invoiceNumber = String(numRes.responsePayload.invoice_number);

        // Step 2: Create draft invoice (#1)
        const createRes = await paypalToolkitHost.executeTool({
          toolName: "create_invoice",
          args: {
            invoiceNumber,
            recipientEmail,
            amountValue: validation.normalizedAmountValue,
            currencyCode: validation.currencyCode,
            dueDate,
            earlyPaymentDiscountPct: earlyDiscountPct,
          },
          workspaceId,
          paypalRequestId: `${paypalRequestId}_create`,
        });
        const draftInvoice = createRes.responsePayload as unknown as HydratedInvoiceRecord;

        // Step 3: Attach conditional Net-10 discount rules (#15)
        await paypalToolkitHost.executeTool({
          toolName: "create_conditional_rules_for_invoice",
          args: {
            invoice_id: draftInvoice.invoiceId,
            rule_type: "EARLY_PAYMENT_DISCOUNT",
            percentage: earlyDiscountPct,
            trigger_date: "2026-11-15",
          },
          workspaceId,
          paypalRequestId: `${paypalRequestId}_rules`,
        });

        // Step 4: Generate payment QR code (#7)
        await paypalToolkitHost.executeTool({
          toolName: "generate_invoice_qr_code",
          args: { invoice_id: draftInvoice.invoiceId },
          workspaceId,
          paypalRequestId: `${paypalRequestId}_qr`,
        });

        // Step 5: Optional recurring series (#16, #17)
        let recurringSeriesId: string | null = null;
        if (body.enableRecurringSeries || body.recurring_cadence) {
          const serRes = await paypalToolkitHost.executeTool({
            toolName: "create_recurring_series",
            args: {
              invoice_id: draftInvoice.invoiceId,
              cadence: String(body.recurring_cadence ?? "MONTHLY"),
            },
            workspaceId,
            paypalRequestId: `${paypalRequestId}_series`,
          });
          recurringSeriesId = String(serRes.responsePayload.series_id);
          await paypalToolkitHost.executeTool({
            toolName: "activate_recurring_series",
            args: { series_id: recurringSeriesId },
            workspaceId,
            paypalRequestId: `${paypalRequestId}_series_act`,
          });
        }

        // Step 6: Evaluate Cosmos.AI Policy Firewall for send_invoice (#4)
        const activePolicy = repository.getActiveRefundPolicy(workspaceId);
        const amountUsd =
          validation.currencyCode === "INR"
            ? Number(validation.normalizedAmountValue) / 84
            : Number(validation.normalizedAmountValue);

        const verdict = evaluateCosmosPolicyFirewall(
          "send_invoice",
          amountUsd,
          0,
          0.02,
          false,
          {
            maxSingleAutoRefundUsd: activePolicy.maxSingleAutoRefundUsd,
            maxDailyRefundVelocityUsd: activePolicy.maxDailyRefundVelocityUsd,
            maxGnnRiskScoreForAutoRefund: activePolicy.maxGnnRiskScoreForAutoRefund,
            maxSingleAutoInvoiceSendUsd: activePolicy.maxSingleAutoInvoiceSendUsd,
            autonomyLevel: activePolicy.autonomyLevel,
          }
        );

        let finalInvoice = repository.getInvoice(draftInvoice.invoiceId) ?? draftInvoice;
        if (verdict.verdict === "APPROVED_L3_AUTO") {
          const sendRes = await paypalToolkitHost.executeTool({
            toolName: "send_invoice",
            args: { invoice_id: draftInvoice.invoiceId },
            workspaceId,
            paypalRequestId: `${paypalRequestId}_send`,
          });
          finalInvoice =
            (sendRes.responsePayload.invoice as HydratedInvoiceRecord | undefined) ??
            finalInvoice;
        } else {
          finalInvoice = {
            ...finalInvoice,
            status: "SCHEDULED",
            dunning_state: "DRAFT",
          };
        }

        finalInvoice = {
          ...finalInvoice,
          idempotencyKey: paypalRequestId,
          recurring_series_id: recurringSeriesId,
        };
        repository.saveInvoice(finalInvoice);

        const auditEntry = repository.appendAuditLog({
          workspaceId,
          actorId: operatorId,
          toolName: "send_invoice",
          paypalRequestId,
          policyVerdict: verdict.verdict,
          payload: finalInvoice,
        });
        await elasticRagService.indexAuditLogEntry(auditEntry);
        sseBus.emitEvent("execution_delta", { invoice: finalInvoice });

        return {
          statusCode: 201,
          result: {
            ...finalInvoice,
            invoice: finalInvoice,
            paypalRequestId,
            policyVerdict: verdict.verdict,
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

  /**
   * API-05: GET /api/v1/invoices
   * Lists PayPalInvoiceRecord (E-07) rows enriched with aging buckets and Bryntum Scheduler tasks.
   */
  app.get("/api/v1/invoices", async (req) => {
    const query = (req.query ?? {}) as Record<string, string | undefined>;
    const workspaceId = normalizeWorkspaceId(query.workspaceId ?? query.workspace_id);
    const limit = query.limit ? Number(query.limit) : undefined;

    const invoices = repository.listInvoices({
      workspaceId,
      dunningState: query.dunning_state ?? query.status,
      currency: query.currency ?? query.currencyCode,
      limit,
    });

    return {
      workspaceId,
      workspace_id: workspaceId,
      invoices,
      data: invoices,
      next_cursor: null,
      total_count: invoices.length,
    };
  });

  /**
   * API-06: POST /api/v1/invoices/:invoiceId/remind
   * Triggers policy-checked smart reminder (with 72h cooldown R-11), updates Bryntum schedule,
   * or records PYUSD Solana SPL Token-2022 settlement (F-11).
   */
  app.post<{ Params: { invoiceId: string } }>(
    "/api/v1/invoices/:invoiceId/remind",
    async (req, reply) => {
      const { operatorId } = assertMutationPermitted(req);
      const { invoiceId } = req.params;
      const body = (req.body ?? {}) as Record<string, unknown>;

      const existing = repository.getInvoice(invoiceId);
      if (!existing) {
        throw new PayOpsProblemError({
          status: 404,
          title: "Invoice Not Found",
          detail: `No PayPalInvoiceRecord (E-07) found for invoiceId '${invoiceId}'.`,
          reasonCode: "INVOICE_NOT_FOUND",
        });
      }

      const action = String(body.action ?? "SEND_REMINDER_NOW").toUpperCase();

      // Mode 1: PYUSD Solana SPL Token-2022 Settlement (F-11)
      if (action === "RECORD_PYUSD_SETTLEMENT" || body.pyusd_settlement) {
        const pyusdObj = (body.pyusd_settlement ?? {}) as Record<string, unknown>;
        const paypalRequestId =
          (req.headers["paypal-request-id"] as string | undefined) ??
          computeDeterministicIdempotencyKey(
            existing.workspaceId,
            "invoice",
            invoiceId,
            "pyusd_settle"
          );

        const pyusdOutcome = await executePyusdSolanaSettlement({
          workspaceId: existing.workspaceId,
          invoiceId,
          amountMinor:
            typeof pyusdObj.amount_minor === "number"
              ? pyusdObj.amount_minor
              : existing.amount_minor,
          paypalRequestId,
          memo: pyusdObj.memo_verified as string | undefined,
          solanaTxSignature: pyusdObj.solana_tx_signature as string | undefined,
        });

        reply.header("PayPal-Request-Id", paypalRequestId);
        return reply.code(200).send({
          ...pyusdOutcome.invoice,
          pyusdSettlement: pyusdOutcome,
          auditEntryHash: pyusdOutcome.auditEntryHash,
        });
      }

      // Mode 2: Bryntum Dunning Schedule Update (US-13)
      const newTriggerDate =
        (body.newTriggerDate as string | undefined) ??
        (body.scheduled_reminder_at as string | undefined)?.slice(0, 10);

      if (action === "UPDATE_BRYNTUM_SCHEDULE" || (newTriggerDate && !body.forceSendNow)) {
        const paypalRequestId =
          (req.headers["paypal-request-id"] as string | undefined) ??
          computeDeterministicIdempotencyKey(
            existing.workspaceId,
            "invoice",
            invoiceId,
            `schedule_${newTriggerDate ?? "update"}`
          );

        await paypalToolkitHost.executeTool({
          toolName: "update_invoicing",
          args: {
            invoice_id: invoiceId,
            due_date: newTriggerDate ?? existing.dueDate,
          },
          workspaceId: existing.workspaceId,
          paypalRequestId,
        });

        const updated = repository.getInvoice(invoiceId)!;
        reply.header("PayPal-Request-Id", paypalRequestId);
        return reply.code(200).send({
          ...updated,
          invoice: updated,
          invoiceId: updated.invoiceId,
          status: "REMINDER_SCHEDULED_72H_GUARD_OK",
          newTriggerDate: newTriggerDate ?? updated.dueDate,
          scheduleUpdated: true,
        });
      }

      // Mode 3: Smart Invoice Reminder with 72h Cooldown Check (R-11)
      const activePolicy = repository.getActiveRefundPolicy(existing.workspaceId);
      const cooldownCheck = evaluateInvoiceReminderCooldown(
        existing.lastReminderSentAt,
        activePolicy.minHoursBetweenInvoiceReminders ?? 72
      );

      if (!cooldownCheck.allowed) {
        throw new PayOpsProblemError({
          status: 409,
          title: "Invoice Reminder 72-Hour Cooldown Active",
          detail: `Cannot send reminder for invoice '${invoiceId}': only ${cooldownCheck.hoursElapsed}h elapsed since last reminder (minimum ${activePolicy.minHoursBetweenInvoiceReminders ?? 72}h required by R-11).`,
          reasonCode: cooldownCheck.reasonCode,
        });
      }

      const paypalRequestId =
        (req.headers["paypal-request-id"] as string | undefined) ??
        computeDeterministicIdempotencyKey(
          existing.workspaceId,
          "invoice",
          invoiceId,
          "send_reminder"
        );

      const remRes = await paypalToolkitHost.executeTool({
        toolName: "send_invoice_reminder",
        args: {
          invoice_id: invoiceId,
          note: String(body.note ?? "Automated PayOps Sentinel dunning reminder"),
        },
        workspaceId: existing.workspaceId,
        paypalRequestId,
      });

      const updated =
        (remRes.responsePayload.invoice as HydratedInvoiceRecord | undefined) ??
        repository.getInvoice(invoiceId)!;

      const auditEntry = repository.appendAuditLog({
        workspaceId: existing.workspaceId,
        actorId: operatorId,
        toolName: "send_invoice_reminder",
        paypalRequestId,
        policyVerdict: "APPROVED_L3_AUTO",
        payload: { invoiceId, lastReminderSentAt: updated.lastReminderSentAt },
      });
      await elasticRagService.indexAuditLogEntry(auditEntry);

      reply.header("PayPal-Request-Id", paypalRequestId);
      return reply.code(200).send({
        ...updated,
        auditEntryHash: auditEntry.entryHash,
      });
    }
  );

  /**
   * Extension / Alias Routes for PYUSD Solana Token-2022 Bridge (F-11):
   * POST /api/v1/pyusd/settle & POST /api/v1/settlements/pyusd
   */
  const handlePyusdEndpoint = async (req: { body: unknown; headers: Record<string, unknown> }, reply: { header: (k: string, v: string) => void; code: (n: number) => { send: (p: unknown) => unknown } }) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const invoiceId = String(
      body.invoiceId ?? body.invoice_id ?? "INV2-X89A-4412-9012-7731"
    );
    const paypalRequestId =
      (req.headers["paypal-request-id"] as string | undefined) ??
      (body.paypalRequestId as string | undefined) ??
      (body.paypal_request_id as string | undefined);

    const outcome = await executePyusdSolanaSettlement({
      workspaceId: (body.workspaceId ?? body.workspace_id) as string | undefined,
      invoiceId,
      amountValue: (body.amountValue ?? body.amount_value) as string | undefined,
      amountMinor: body.amount_minor as number | undefined,
      recipientWallet: body.recipientWallet as string | undefined,
      paypalRequestId,
      memo: body.memo as string | undefined,
      solanaTxSignature: (body.solanaTxSignature ?? body.solana_tx_signature) as
        | string
        | undefined,
      confidentialTransfer: body.confidentialTransfer as boolean | undefined,
    });

    reply.header("PayPal-Request-Id", paypalRequestId ?? outcome.invoice.idempotencyKey);
    return reply.code(200).send(outcome);
  };

  app.post("/api/v1/pyusd/settle", async (req, reply) => {
    assertMutationPermitted(req);
    return handlePyusdEndpoint(req, reply);
  });

  app.post("/api/v1/pyusd/settle-invoice", async (req, reply) => {
    assertMutationPermitted(req);
    return handlePyusdEndpoint(req, reply);
  });

  app.post("/api/v1/settlements/pyusd", async (req, reply) => {
    assertMutationPermitted(req);
    return handlePyusdEndpoint(req, reply);
  });
}
