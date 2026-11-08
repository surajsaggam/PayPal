/**
 * PayOps AI (PayPal Sentinel) — Fastify 5.1 Application Factory (buildApp / createServer)
 * Wires Helmet, CORS, Rate-Limit, OpenTelemetry Trace & Luhn PAN Scrubber, RFC 7807 Error Handler,
 * and all 14 REST endpoints (API-01..API-14), alias routes, SSE stream (SSE-01), and /api/v1/health.
 */

import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { repository } from "./db/repository.js";
import { PayOpsProblemError, sendProblemDetails } from "./lib/errors.js";
import { registerTraceAndPiiHooks } from "./middleware/trace-and-security.js";
import { registerAgentRoutes } from "./modules/agent-orchestrator/agent.routes.js";
import { registerAnalyticsRoutes } from "./modules/analytics/insights.routes.js";
import { registerDisputesRoutes } from "./modules/disputes/disputes.routes.js";
import { registerInvoicingRoutes } from "./modules/invoicing/invoicing.routes.js";
import { junoIdempotencyStore } from "./modules/junodb-idempotency/idempotency-guard.js";
import { registerOrdersRoutes } from "./modules/orders-checkout/orders.routes.js";
import { registerPolicyRoutes } from "./modules/policy-firewall/policies.routes.js";
import { registerStreamAndHealthRoutes } from "./modules/stream/sse.routes.js";
import { registerSubscriptionsRoutes } from "./modules/subscriptions/subscriptions.routes.js";
import { registerWebhooksRoutes } from "./modules/webhooks/webhooks.routes.js";

export async function buildApp(opts?: FastifyServerOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: opts?.logger ?? false,
    ...opts,
  });

  // Initialize Dual-Mode persistence & JunoDB 2PC lock store
  await repository.initializePostgresIfConfigured();
  await junoIdempotencyStore.initializeRedisIfConfigured();

  // 1. Security Headers (@fastify/helmet — Lusca/Kraken.js-grade CSP & HSTS)
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  // 2. CORS (@fastify/cors)
  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "PayPal-Request-Id",
      "X-PayOps-Signature",
      "X-PayOps-Role",
      "X-Operator-Id",
      "X-Workspace-Id",
      "X-Trace-Id",
      "PAYPAL-TRANSMISSION-ID",
      "PAYPAL-TRANSMISSION-TIME",
      "PAYPAL-TRANSMISSION-SIG",
      "PAYPAL-CERT-URL",
      "PAYPAL-AUTH-ALGO",
    ],
    exposedHeaders: ["PayPal-Request-Id", "X-Idempotent-Replayed", "X-Trace-Id"],
  });

  // 3. Rate Limiting (@fastify/rate-limit)
  await app.register(rateLimit, {
    max: 1000,
    timeWindow: "1 minute",
  });

  // 4. Trace Correlation & Pre-Ingestion Luhn PAN Scrubber (R-07)
  registerTraceAndPiiHooks(app);

  // 5. RFC 7807 Problem Details Error & NotFound Handlers
  app.setErrorHandler((err, req, reply) => sendProblemDetails(req, reply, err as Error));
  app.setNotFoundHandler((req, reply) =>
    sendProblemDetails(
      req,
      reply,
      new PayOpsProblemError({
        status: 404,
        title: "Endpoint Not Found",
        detail: `Route ${req.method} ${req.url} does not exist on PayOps Sentinel API.`,
        reasonCode: "ROUTE_NOT_FOUND",
      })
    )
  );

  // 6. Register All Canonical & Extension Routes (API-01..API-14, SSE-01, Health)
  await registerStreamAndHealthRoutes(app);
  await registerAgentRoutes(app);
  await registerPolicyRoutes(app);
  await registerInvoicingRoutes(app);
  await registerOrdersRoutes(app);
  await registerDisputesRoutes(app);
  await registerSubscriptionsRoutes(app);
  await registerWebhooksRoutes(app);
  await registerAnalyticsRoutes(app);

  return app;
}

export const createServer = buildApp;
