/**
 * PayOps AI (PayPal Sentinel) — OpenTelemetry Trace Correlation & Pre-Ingestion PII Scrubber Hook
 */

import crypto from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { scrubObjectPii } from "../lib/pii-scrubber.js";

declare module "fastify" {
  interface FastifyRequest {
    traceId: string;
    rawBodyString?: string;
    panRedactedInRequest?: boolean;
  }
}

export function registerTraceAndPiiHooks(app: FastifyInstance): void {
  app.addHook("onRequest", async (req: FastifyRequest, reply: FastifyReply) => {
    const incomingTrace =
      (req.headers["x-trace-id"] as string | undefined) ??
      (req.headers["traceparent"] as string | undefined)?.split("-")[1];

    const traceId = incomingTrace?.trim() || crypto.randomBytes(16).toString("hex");
    req.traceId = traceId;
    reply.header("X-Trace-Id", traceId);
  });

  app.addHook("preHandler", async (req: FastifyRequest) => {
    if (req.body && typeof req.body === "object") {
      // Preserve raw JSON string before scrubbing for webhook CRC32 verification if not already set
      if (!req.rawBodyString) {
        req.rawBodyString = JSON.stringify(req.body);
      }
      const scrubbed = scrubObjectPii(req.body);
      req.body = scrubbed.value;
      req.panRedactedInRequest = scrubbed.panDetected;
    }
  });
}
