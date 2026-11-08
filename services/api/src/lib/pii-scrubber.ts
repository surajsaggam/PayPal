/**
 * PayOps AI (PayPal Sentinel) — Luhn PAN Scrubber & Buyer PII HMAC-SHA256 Tokenizer (R-07)
 * Ensures zero raw PANs or unhashed buyer PII ever enter LLM context windows, PostgreSQL, or Pino logs.
 */

import crypto from "node:crypto";
import { envConfig } from "../config/env.js";

/**
 * Validates whether a digit sequence passes the ISO/IEC 7812 Luhn checksum algorithm.
 */
export function isValidLuhnPan(digitsOnly: string): boolean {
  if (digitsOnly.length < 13 || digitsOnly.length > 19 || !/^[0-9]+$/.test(digitsOnly)) {
    return false;
  }
  let sum = 0;
  let shouldDouble = false;
  for (let i = digitsOnly.length - 1; i >= 0; i -= 1) {
    let digit = Number(digitsOnly.charCodeAt(i) - 48);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum > 0 && sum % 10 === 0;
}

/**
 * Scans free-text strings for 13–19 digit sequences (including spaces or hyphens)
 * and replaces any Luhn-valid payment card number with [REDACTED_PAYMENT_IDENTIFIER] (R-07).
 */
export function scrubPanAndSensitiveText(input: string): {
  scrubbed: string;
  panDetected: boolean;
  redactedCount: number;
} {
  if (!input || typeof input !== "string") {
    return { scrubbed: input ?? "", panDetected: false, redactedCount: 0 };
  }

  let redactedCount = 0;
  const candidateRegex = /\b(?:\d[ -]*?){13,19}\b/g;

  const scrubbed = input.replace(candidateRegex, (match) => {
    const digitsOnly = match.replace(/[^0-9]/g, "");
    if (isValidLuhnPan(digitsOnly)) {
      redactedCount += 1;
      return "[REDACTED_PAYMENT_IDENTIFIER]";
    }
    return match;
  });

  return {
    scrubbed,
    panDetected: redactedCount > 0,
    redactedCount,
  };
}

/**
 * Recursively scrubs strings in an arbitrary JSON object/array payload for Luhn PANs.
 */
export function scrubObjectPii<T>(value: T): { value: T; panDetected: boolean } {
  let anyPan = false;

  function walk(node: unknown): unknown {
    if (typeof node === "string") {
      const res = scrubPanAndSensitiveText(node);
      if (res.panDetected) {
        anyPan = true;
      }
      return res.scrubbed;
    }
    if (Array.isArray(node)) {
      return node.map(walk);
    }
    if (node !== null && typeof node === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        out[k] = walk(v);
      }
      return out;
    }
    return node;
  }

  return {
    value: walk(value) as T,
    panDetected: anyPan,
  };
}

/**
 * Computes a deterministic 64-character hex HMAC-SHA256 digest of a buyer email or identifier (DPDP Act 2023 / GDPR).
 */
export function hashBuyerIdentifier(emailOrId: string, salt?: string): string {
  const effectiveSalt = salt ?? envConfig.kmsWorkspaceMasterKeyHex;
  const normalized = (emailOrId ?? "anonymous@example.com").trim().toLowerCase();
  return crypto.createHmac("sha256", effectiveSalt).update(normalized).digest("hex");
}
