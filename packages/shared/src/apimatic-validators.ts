/**
 * PayOps AI (PayPal Sentinel) — APIMatic Context Plugin & Deterministic Payload Validator (F-09)
 * Write Owner (H03-H48): Dev 1 (100%)
 */

import type { CurrencyCode } from "./entities.js";

const TWO_DECIMAL_AMOUNT_REGEX = /^[0-9]+\.[0-9]{2}$/;
const ALLOWED_CURRENCIES: ReadonlySet<string> = new Set(["USD", "INR", "EUR", "GBP", "PYUSD"]);

export interface ApimaticValidationResult {
  valid: boolean;
  normalizedAmountValue: string;
  currencyCode: CurrencyCode;
  errors: string[];
}

export function validatePayPalMonetaryPayload(
  amountInput: string | number,
  currencyInput: string
): ApimaticValidationResult {
  const errors: string[] = [];
  const normalizedCurrency = currencyInput.trim().toUpperCase();
  if (!ALLOWED_CURRENCIES.has(normalizedCurrency)) {
    errors.push(`Unsupported ISO-4217 currency code: ${currencyInput}`);
  }

  const normalizedAmount =
    typeof amountInput === "number" ? amountInput.toFixed(2) : amountInput.trim();
  if (typeof amountInput === "number") {
    errors.push("Raw float amount rejected by APIMatic validator; must pass 2-decimal string (R-03)");
  } else if (!TWO_DECIMAL_AMOUNT_REGEX.test(normalizedAmount)) {
    errors.push(`Monetary value '${amountInput}' must match ^[0-9]+\\.[0-9]{2}$`);
  }

  return {
    valid: errors.length === 0,
    normalizedAmountValue: normalizedAmount,
    currencyCode: (ALLOWED_CURRENCIES.has(normalizedCurrency) ? normalizedCurrency : "USD") as CurrencyCode,
    errors,
  };
}
