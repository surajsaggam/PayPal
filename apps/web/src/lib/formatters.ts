/**
 * PayOps AI (PayPal Sentinel) — Multi-Currency ($, ₹, €, £, PYUSD) & Multilingual (en, hi, es, de) Formatters
 * Maps to: TKT-031, LOCALIZATION.md, DESIGN_SYSTEM.md (tabular-nums precision)
 */

import type { CurrencyCode } from "@payops/shared";

export type SupportedLocale = "en" | "hi" | "es" | "de";

const FX_RATES_FROM_USD: Record<CurrencyCode, number> = {
  USD: 1.0,
  INR: 84.0,
  EUR: 0.92,
  GBP: 0.79,
  PYUSD: 1.0,
};

export function convertCurrencyAmount(
  amountValue: string | number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number {
  const numeric = typeof amountValue === "string" ? parseFloat(amountValue) : amountValue;
  if (Number.isNaN(numeric)) return 0;
  if (fromCurrency === toCurrency) return numeric;
  const inUsd = numeric / (FX_RATES_FROM_USD[fromCurrency] || 1);
  return inUsd * (FX_RATES_FROM_USD[toCurrency] || 1);
}

export function formatCurrencyAmount(
  amountValue: string | number | undefined,
  sourceCurrency: CurrencyCode = "USD",
  displayCurrency?: CurrencyCode,
  compactInr = false
): string {
  if (amountValue === undefined || amountValue === null) return "—";
  const targetCurrency = displayCurrency ?? sourceCurrency;
  const converted = convertCurrencyAmount(amountValue, sourceCurrency, targetCurrency);

  if (targetCurrency === "PYUSD") {
    return `${converted.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} PYUSD`;
  }

  if (targetCurrency === "INR") {
    if (compactInr && converted >= 100000) {
      if (converted >= 10000000) {
        return `₹${(converted / 10000000).toFixed(2)} Cr`;
      }
      return `₹${(converted / 100000).toFixed(2)}L`;
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  }

  const localeMap: Record<Exclude<CurrencyCode, "PYUSD" | "INR">, string> = {
    USD: "en-US",
    EUR: "de-DE",
    GBP: "en-GB",
  };

  return new Intl.NumberFormat(localeMap[targetCurrency], {
    style: "currency",
    currency: targetCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
}

/**
 * Dual-Currency Display Rule (LOCALIZATION.md Section 2):
 * Primary amount is always rendered in the native PayPal transaction currency;
 * secondary amount shows the cross-border equivalent in the workspace/reference currency.
 */
export function formatDualCurrency(
  amountValue: string | number | undefined,
  sourceCurrency: CurrencyCode = "USD",
  referenceCurrency: CurrencyCode = "INR"
): {
  primary: string;
  secondary: string;
  combined: string;
  rateNote: string;
} {
  if (amountValue === undefined || amountValue === null) {
    return { primary: "—", secondary: "", combined: "—", rateNote: "" };
  }
  const fallbackRef: CurrencyCode =
    sourceCurrency === referenceCurrency
      ? sourceCurrency === "INR"
        ? "USD"
        : "INR"
      : referenceCurrency;

  const primary = `${formatCurrencyAmount(amountValue, sourceCurrency, sourceCurrency)} ${sourceCurrency}`;
  const secondaryFormatted = formatCurrencyAmount(
    amountValue,
    sourceCurrency,
    fallbackRef,
    fallbackRef === "INR"
  );
  const secondary = `≈ ${secondaryFormatted} ${fallbackRef}`;
  const fxRate = (FX_RATES_FROM_USD[fallbackRef] / FX_RATES_FROM_USD[sourceCurrency]).toFixed(2);

  return {
    primary,
    secondary,
    combined: `${primary} (${secondary})`,
    rateNote: `1 ${sourceCurrency} = ${fxRate} ${fallbackRef}`,
  };
}

/**
 * Multi-Timezone Dispute SLA Deadline Formatter (LOCALIZATION.md Section 3)
 */
export function formatSlaCountdown(
  isoDeadline: string,
  referenceIso = "2026-11-08T18:00:00.000Z"
): {
  badgeText: string;
  isUrgent: boolean;
  hoursRemaining: number;
  tooltipTimezones: {
    utc: string;
    ist: string;
    cst: string;
    gmt: string;
  };
} {
  const dueMs = new Date(isoDeadline).getTime();
  const refMs = new Date(referenceIso).getTime();
  const diffHours = Math.max(0, Math.round((dueMs - refMs) / (1000 * 60 * 60)));
  const days = Math.floor(diffHours / 24);
  const remHours = diffHours % 24;
  const badgeText = days > 0 ? `${days}d ${remHours}h remaining` : `${remHours}h remaining`;

  const dueDate = new Date(isoDeadline);
  const fmt = (timeZone: string, label: string) => {
    try {
      return `${new Intl.DateTimeFormat("en-GB", {
        timeZone,
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(dueDate)} ${label}`;
    } catch {
      return `${isoDeadline} ${label}`;
    }
  };

  return {
    badgeText,
    isUrgent: diffHours <= 120,
    hoursRemaining: diffHours,
    tooltipTimezones: {
      utc: fmt("UTC", "UTC"),
      ist: fmt("Asia/Kolkata", "IST (UTC+05:30)"),
      cst: fmt("America/Chicago", "CST (UTC-06:00)"),
      gmt: fmt("Europe/London", "GMT (UTC+00:00)"),
    },
  };
}

/**
 * Hinglish / Hindi / Spanish / German Natural-Language Command Bar Normalization
 * Maps to: LOCALIZATION.md Section 4.1 & ACCESSIBILITY.md Section 4.2
 */
export function normalizeMultilingualAgentPrompt(rawPrompt: string): {
  detectedLanguage: "en" | "hi-Latn" | "hi" | "es" | "de";
  inferredIntent: "INVOICE" | "REFUND" | "DISPUTE" | "ORDER";
  normalizedSummary: string;
} {
  const lower = rawPrompt.toLowerCase();

  const isHinglish =
    /\b(bhejo|banao|karo|wapas|rupaye|ka invoice|ko invoice|chahiye)\b/i.test(rawPrompt);
  const isDevanagari = /[\u0900-\u097F]/.test(rawPrompt);
  const isSpanish = /\b(crear|factura|reembolso|disputa|enviar|descuento|pedido)\b/i.test(rawPrompt);
  const isGerman = /\b(rechnung|erstattung|streitfall|senden|rabatt|bestellung)\b/i.test(rawPrompt);

  const detectedLanguage = isDevanagari
    ? "hi"
    : isHinglish
      ? "hi-Latn"
      : isSpanish
        ? "es"
        : isGerman
          ? "de"
          : "en";

  const isRefund =
    lower.includes("refund") ||
    lower.includes("wapas") ||
    lower.includes("reembolso") ||
    lower.includes("erstattung") ||
    rawPrompt.includes("रिफंड") ||
    rawPrompt.includes("वापस");

  const isDispute =
    lower.includes("dispute") ||
    lower.includes("inr") ||
    lower.includes("disputa") ||
    lower.includes("streitfall") ||
    rawPrompt.includes("विवाद");

  const isOrder =
    lower.includes("order") ||
    lower.includes("restock") ||
    lower.includes("pedido") ||
    lower.includes("bestellung") ||
    rawPrompt.includes("ऑर्डर");

  const inferredIntent = isRefund
    ? "REFUND"
    : isDispute
      ? "DISPUTE"
      : isOrder
        ? "ORDER"
        : "INVOICE";

  return {
    detectedLanguage,
    inferredIntent,
    normalizedSummary: `[Lang=${detectedLanguage} -> Intent=${inferredIntent}] ${rawPrompt.trim()}`,
  };
}

export interface LocalizedStrings {
  appTitle: string;
  appSubtitle: string;
  navCommandCenter: string;
  navPolicyStudio: string;
  navInvoicingScheduler: string;
  navDisputeWarRoom: string;
  navCheckoutBridge: string;
  kpiAnmpr: string;
  kpiDso: string;
  kpiDisputeWinRate: string;
  kpiPolicyFirewall: string;
  cmdBarPlaceholder: string;
  executeMcpCta: string;
  dryRunLabel: string;
}

export const LOCALE_DICTIONARY: Record<SupportedLocale, LocalizedStrings> = {
  en: {
    appTitle: "PayOps AI · PayPal Sentinel",
    appSubtitle: "Autonomous Agentic CFO, Smart Invoicing & Dispute-Defense Control Plane",
    navCommandCenter: "1. Command Center",
    navPolicyStudio: "2. Policy Studio",
    navInvoicingScheduler: "3. Smart Invoicing & Schedule",
    navDisputeWarRoom: "4. Dispute Defense",
    navCheckoutBridge: "5. Fastlane & PYUSD Bridge",
    kpiAnmpr: "Net Margin Protected",
    kpiDso: "Avg Days Sales Outstanding",
    kpiDisputeWinRate: "Dispute Win Rate",
    kpiPolicyFirewall: "Policy Firewall Integrity",
    cmdBarPlaceholder:
      'Ask PayPal Sentinel (e.g., "Create $1,850 invoice for Acme Robotics with 2% Net-10 discount & QR")...',
    executeMcpCta: "Execute via PayPal MCP ↵",
    dryRunLabel: "Dry-Run Simulation",
  },
  hi: {
    appTitle: "PayOps AI · पेपैल सेंटिनल",
    appSubtitle: "स्वायत्त एजेंटिक CFO, स्मार्ट इनवॉइसिंग और विवाद-रक्षा नियंत्रण पटल",
    navCommandCenter: "1. कमांड सेंटर",
    navPolicyStudio: "2. पॉलिसी फ़ायरवॉल स्टूडियो",
    navInvoicingScheduler: "3. स्मार्ट इनवॉइस और शेड्यूल",
    navDisputeWarRoom: "4. विवाद रक्षा केंद्र",
    navCheckoutBridge: "5. Fastlane और PYUSD ब्रिज",
    kpiAnmpr: "सुरक्षित शुद्ध मार्जिन",
    kpiDso: "औसत वसूली दिवस (DSO)",
    kpiDisputeWinRate: "विवाद जीत दर",
    kpiPolicyFirewall: "पॉलिसी फ़ायरवॉल सुरक्षा",
    cmdBarPlaceholder:
      'पेपैल सेंटिनल को निर्देश दें (उदा., "Acme Robotics ko 1,850 dollar ka invoice bhejo with QR code")...',
    executeMcpCta: "PayPal MCP निष्पादित करें ↵",
    dryRunLabel: "ड्राई-रन परीक्षण",
  },
  es: {
    appTitle: "PayOps AI · PayPal Sentinel",
    appSubtitle: "Plano de Control CFO Agéntico, Facturación Inteligente y Defensa de Disputas",
    navCommandCenter: "1. Centro de Comando",
    navPolicyStudio: "2. Estudio de Políticas",
    navInvoicingScheduler: "3. Facturación y Calendario",
    navDisputeWarRoom: "4. Defensa de Disputas",
    navCheckoutBridge: "5. Fastlane y Puente PYUSD",
    kpiAnmpr: "Margen Neto Protegido",
    kpiDso: "DSO Promedio (Días de Cobro)",
    kpiDisputeWinRate: "Éxito en Disputas",
    kpiPolicyFirewall: "Integridad del Firewall",
    cmdBarPlaceholder:
      'Ordene a PayPal Sentinel (ej., "Crear factura de $1,850 para Acme Robotics con 2% dto. y QR")...',
    executeMcpCta: "Ejecutar vía PayPal MCP ↵",
    dryRunLabel: "Modo Simulación (Dry-Run)",
  },
  de: {
    appTitle: "PayOps AI · PayPal Sentinel",
    appSubtitle: "Autonome Agentic-CFO-, Smart-Invoicing- & Streitfall-Abwehr-Kontrollebene",
    navCommandCenter: "1. Leitstand (AG Grid)",
    navPolicyStudio: "2. Policy-Firewall-Studio",
    navInvoicingScheduler: "3. Smart Invoicing & Zeitplan",
    navDisputeWarRoom: "4. Streitfall-Abwehrzentrum",
    navCheckoutBridge: "5. Fastlane & PYUSD-Brücke",
    kpiAnmpr: "Geschützte Nettomarge",
    kpiDso: "Ø DSO (Forderungslaufzeit)",
    kpiDisputeWinRate: "Streitfall-Gewinnrate",
    kpiPolicyFirewall: "Policy-Firewall-Integrität",
    cmdBarPlaceholder:
      'Anweisung an PayPal Sentinel (z.B. „Rechnung über 1.850 $ für Acme Robotics mit 2 % Skonto & QR senden“)...',
    executeMcpCta: "Über PayPal MCP ausführen ↵",
    dryRunLabel: "Trockenlauf-Simulation",
  },
};
