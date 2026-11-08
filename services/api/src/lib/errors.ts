/**
 * PayOps AI (PayPal Sentinel) — RFC 7807 Problem Details Error Handling (application/problem+json)
 */

import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export interface ProblemDetailsPayload {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  trace_id: string;
  paypal_request_id?: string;
  reason_code?: string;
  errors?: string[];
}

export class PayOpsProblemError extends Error {
  public readonly status: number;
  public readonly type: string;
  public readonly title: string;
  public readonly detail: string;
  public readonly reasonCode?: string;
  public readonly paypalRequestId?: string;
  public readonly errors?: string[];

  constructor(opts: {
    status: number;
    title: string;
    detail: string;
    type?: string;
    reasonCode?: string;
    paypalRequestId?: string;
    errors?: string[];
  }) {
    super(opts.detail);
    this.name = "PayOpsProblemError";
    this.status = opts.status;
    this.title = opts.title;
    this.detail = opts.detail;
    this.type =
      opts.type ??
      `https://payops.ai/errors/${opts.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    this.reasonCode = opts.reasonCode;
    this.paypalRequestId = opts.paypalRequestId;
    this.errors = opts.errors;
  }
}

export function sendProblemDetails(
  req: FastifyRequest,
  reply: FastifyReply,
  err: PayOpsProblemError | FastifyError | Error
): FastifyReply {
  const traceId =
    (req as FastifyRequest & { traceId?: string }).traceId ??
    (req.headers["x-trace-id"] as string | undefined) ??
    "trace_payops_default";

  if (err instanceof PayOpsProblemError) {
    const payload: ProblemDetailsPayload = {
      type: err.type,
      title: err.title,
      status: err.status,
      detail: err.detail,
      instance: req.url,
      trace_id: traceId,
      paypal_request_id:
        err.paypalRequestId ?? (req.headers["paypal-request-id"] as string | undefined),
      reason_code: err.reasonCode,
      errors: err.errors,
    };
    return reply
      .code(err.status)
      .header("Content-Type", "application/problem+json; charset=utf-8")
      .send(payload);
  }

  const statusCode =
    typeof (err as FastifyError).statusCode === "number"
      ? (err as FastifyError).statusCode!
      : 500;
  const payload: ProblemDetailsPayload = {
    type: `https://payops.ai/errors/http-${statusCode}`,
    title: statusCode === 429 ? "Too Many Requests" : err.name || "Internal Server Error",
    status: statusCode,
    detail: err.message || "Unexpected error occurred",
    instance: req.url,
    trace_id: traceId,
    paypal_request_id: req.headers["paypal-request-id"] as string | undefined,
  };
  return reply
    .code(statusCode)
    .header("Content-Type", "application/problem+json; charset=utf-8")
    .send(payload);
}
