/**
 * PayOps AI (PayPal Sentinel) — Structured Pino Logger with Secret & PII Redaction (R-07)
 */

import pino from "pino";
import { envConfig } from "../config/env.js";

export const logger = pino({
  level: envConfig.nodeEnv === "test" ? "silent" : "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "paypalClientSecret",
      "client_secret",
      "access_token",
      "*.card_number",
      "*.cvv",
      "*.pan",
      "*.privateKey",
    ],
    censor: "[REDACTED]",
  },
  base: {
    service: "payops-api",
    env: envConfig.nodeEnv,
  },
});
