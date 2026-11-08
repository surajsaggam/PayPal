/**
 * PayOps AI (PayPal Sentinel) — APIMatic Context Plugin & Deterministic Payload Validator (F-09)
 * Write Owner (H03-H48): Dev 1 (100%)
 */

import type { CurrencyCode } from "./entities.js";

const TWO_DECIMAL_AMOUNT_REGEX = /^[0-9]+\.[0-9]{2}$/;
const ZERO_DECIMAL_AMOUNT_REGEX = /^[0-9]+$/;
const ALLOWED_CURRENCIES: ReadonlySet<string> = new Set(["USD", "INR", "EUR", "GBP", "PYUSD"]);
const ZERO_DECIMAL_CURRENCIES: ReadonlySet<string> = new Set(["JPY", "HUF", "TWD"]);

export interface ApimaticValidationResult {
  valid: boolean;
  normalizedAmountValue: string;
  currencyCode: CurrencyCode;
  errors: string[];
}

export interface McpToolValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedArgs: Record<string, unknown>;
}

export interface ApimaticSdkSnippets {
  sdkSnippetTs: string;
  sdkSnippetPython: string;
}

/**
 * Validates PayPal v2 monetary payloads (amountValue + currencyCode).
 * Rejects raw floating-point numbers (R-03) and enforces 2-decimal ISO-4217 string formatting.
 */
export function validatePayPalMonetaryPayload(
  amountInput: string | number,
  currencyInput: string
): ApimaticValidationResult {
  const errors: string[] = [];
  const normalizedCurrency = (currencyInput ?? "").trim().toUpperCase();
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency);

  if (!ALLOWED_CURRENCIES.has(normalizedCurrency) && !isZeroDecimal) {
    errors.push(`Unsupported ISO-4217 currency code: ${currencyInput}`);
  }

  const normalizedAmount =
    typeof amountInput === "number" ? amountInput.toFixed(2) : String(amountInput ?? "").trim();

  if (typeof amountInput === "number") {
    errors.push("Raw float amount rejected by APIMatic validator; must pass 2-decimal string (R-03)");
  } else if (isZeroDecimal) {
    if (!ZERO_DECIMAL_AMOUNT_REGEX.test(normalizedAmount)) {
      errors.push(
        `Zero-decimal currency '${normalizedCurrency}' value '${amountInput}' must match ^[0-9]+$ (R-03)`
      );
    }
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

/**
 * Converts integer minor units (e.g., 245000 cents/paise) to a canonical 2-decimal string ("2450.00").
 */
export function minorUnitsToTwoDecimalString(amountMinor: number): string {
  if (!Number.isFinite(amountMinor) || amountMinor < 0) {
    return "0.00";
  }
  return (Math.round(amountMinor) / 100).toFixed(2);
}

/**
 * Converts a 2-decimal string ("2450.00") to integer minor units (245000).
 */
export function twoDecimalStringToMinorUnits(amountValue: string): number {
  const parsed = Number(amountValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.round(parsed * 100);
}

/**
 * Pre-validates MCP tool arguments against APIMatic PayPal OpenAPI 3.1 constraints before dispatch (F-09).
 */
export function validateMcpToolPayload(
  toolName: string,
  args: Record<string, unknown>
): McpToolValidationResult {
  const errors: string[] = [];
  const sanitizedArgs: Record<string, unknown> = { ...args };

  const currencyCandidate =
    (args.currencyCode as string | undefined) ??
    (args.currency_code as string | undefined) ??
    "USD";

  // Check if a monetary amount is supplied in either amountValue / amount_value or unit_amount
  const rawAmount =
    args.amountValue !== undefined
      ? args.amountValue
      : args.amount_value !== undefined
        ? args.amount_value
        : undefined;

  if (rawAmount !== undefined) {
    if (typeof rawAmount === "number") {
      errors.push("Raw float amount rejected by APIMatic validator; must pass 2-decimal string (R-03)");
    } else if (typeof rawAmount === "string") {
      const check = validatePayPalMonetaryPayload(rawAmount, currencyCandidate);
      if (!check.valid) {
        errors.push(...check.errors);
      } else {
        sanitizedArgs.amountValue = check.normalizedAmountValue;
        sanitizedArgs.currencyCode = check.currencyCode;
      }
    }
  } else if (typeof args.amount_minor === "number") {
    if (!Number.isInteger(args.amount_minor) || args.amount_minor < 0) {
      errors.push("amount_minor must be a non-negative integer in minor currency units (R-03)");
    } else {
      const converted = minorUnitsToTwoDecimalString(args.amount_minor);
      const check = validatePayPalMonetaryPayload(converted, currencyCandidate);
      if (!check.valid) {
        errors.push(...check.errors);
      } else {
        sanitizedArgs.amountValue = check.normalizedAmountValue;
        sanitizedArgs.currencyCode = check.currencyCode;
      }
    }
  }

  // Prevent forbidden Sandbox PLATFORM vaulting parameter that triggers HTTP 403 (Devpost Forum #45483)
  if (
    toolName === "create_order" &&
    typeof args.disbursement_mode === "string" &&
    args.disbursement_mode.toUpperCase() === "PLATFORM"
  ) {
    errors.push(
      "PLATFORM disbursement_mode rejected by APIMatic Sandbox guard (#45483); use CAPTURE or AUTHORIZE"
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedArgs,
  };
}

/**
 * Generates copy-ready TypeScript and Python SDK snippets using @paypal/paypal-server-sdk (US-14, F-09).
 */
export function generateApimaticSdkSnippets(
  toolName: string,
  args: Record<string, unknown>,
  paypalRequestId: string
): ApimaticSdkSnippets {
  const amountValue =
    (args.amountValue as string | undefined) ??
    (args.amount_value as string | undefined) ??
    (typeof args.amount_minor === "number" ? minorUnitsToTwoDecimalString(args.amount_minor) : "2450.00");
  const currencyCode =
    (args.currencyCode as string | undefined) ??
    (args.currency_code as string | undefined) ??
    "USD";

  const sdkSnippetTs = [
    `import { Client, Environment, OrdersController, InvoicesController } from "@paypal/paypal-server-sdk";`,
    ``,
    `const client = new Client({`,
    `  clientCredentialsAuthCredentials: {`,
    `    oAuthClientId: process.env.PAYPAL_CLIENT_ID!,`,
    `    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET!,`,
    `  },`,
    `  environment: Environment.Sandbox,`,
    `});`,
    ``,
    `// Tool: ${toolName} | APIMatic Validated Payload`,
    `const response = await client.execute({`,
    `  tool: "${toolName}",`,
    `  paypalRequestId: "${paypalRequestId}",`,
    `  amount: { currencyCode: "${currencyCode}", value: "${amountValue}" },`,
    `  payload: ${JSON.stringify(args)},`,
    `});`,
  ].join("\n");

  const sdkSnippetPython = [
    `import os`,
    `from paypalserversdk.http.auth.o_auth_2 import ClientCredentialsAuthCredentials`,
    `from paypalserversdk.paypal_serversdk_client import PaypalServersdkClient`,
    `from paypalserversdk.configuration import Environment`,
    ``,
    `client = PaypalServersdkClient(`,
    `    client_credentials_auth_credentials=ClientCredentialsAuthCredentials(`,
    `        o_auth_client_id=os.environ["PAYPAL_CLIENT_ID"],`,
    `        o_auth_client_secret=os.environ["PAYPAL_CLIENT_SECRET"],`,
    `    ),`,
    `    environment=Environment.SANDBOX,`,
    `)`,
    ``,
    `# Tool: ${toolName} | PayPal-Request-Id: ${paypalRequestId}`,
    `result = client.execute_mcp_tool(`,
    `    tool_name="${toolName}",`,
    `    paypal_request_id="${paypalRequestId}",`,
    `    amount={"currency_code": "${currencyCode}", "value": "${amountValue}"},`,
    `)`,
  ].join("\n");

  return { sdkSnippetTs, sdkSnippetPython };
}
