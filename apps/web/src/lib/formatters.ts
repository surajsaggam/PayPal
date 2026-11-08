/**
 * PayOps AI (PayPal Sentinel) — Multi-Currency ($, ₹, €, £, PYUSD) & Multilingual (en, hi, es) Formatters
 * Maps to: TKT-031, LOCALIZATION.md, DESIGN_SYSTEM.md (tabular-nums precision)
 */

import type { CurrencyCode } from "@payops/shared";

export type SupportedLocale = "en" | "hi" | "es";

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
    navCommandCenter: "1. Command Center (AG Grid)",
    navPolicyStudio: "2. Policy Firewall Studio",
    navInvoicingScheduler: "3. Smart Invoicing & Bryntum",
    navDisputeWarRoom: "4. Dispute Defense War-Room",
    navCheckoutBridge: "5. Fastlane & PYUSD Bridge",
    kpiAnmpr: "ANMPR (Net Margin Protected)",
    kpiDso: "Avg DSO (F-03 Invoicing)",
    kpiDisputeWinRate: "Dispute Win Rate (F-04 GNN)",
    kpiPolicyFirewall: "Policy Firewall Integrity",
    cmdBarPlaceholder:
      'Ask PayPal Sentinel (e.g., "Create $1,850 invoice for Acme Robotics with 2% Net-10 discount & QR")...',
    executeMcpCta: "Execute via PayPal MCP ↵",
    dryRunLabel: "Dry-Run Simulation",
  },
  hi: {
    appTitle: "PayOps AI · पेपैल सेंटिनल",
    appSubtitle: "स्वायत्त एजेंटिक CFO, स्मार्ट इनवॉइसिंग और विवाद-रक्षा नियंत्रण पटल",
    navCommandCenter: "1. कमांड सेंटर (AG Grid)",
    navPolicyStudio: "2. पॉलिसी फ़ायरवॉल स्टूडियो",
    navInvoicingScheduler: "3. स्मार्ट इनवॉइस और Bryntum",
    navDisputeWarRoom: "4. विवाद रक्षा वॉर-रूम",
    navCheckoutBridge: "5. Fastlane और PYUSD ब्रिज",
    kpiAnmpr: "ANMPR (सुरक्षित शुद्ध मार्जिन)",
    kpiDso: "औसत DSO (F-03 वसूली)",
    kpiDisputeWinRate: "विवाद जीत दर (F-04 GNN)",
    kpiPolicyFirewall: "पॉलिसी फ़ायरवॉल सुरक्षा",
    cmdBarPlaceholder:
      'पेपैल सेंटिनल को निर्देश दें (उदा., "Acme Robotics के लिए 2% छूट और QR के साथ $1,850 का इनवॉइस बनाएं")...',
    executeMcpCta: "PayPal MCP निष्पादित करें ↵",
    dryRunLabel: "ड्राई-रन परीक्षण",
  },
  es: {
    appTitle: "PayOps AI · PayPal Sentinel",
    appSubtitle: "Plano de Control CFO Agéntico, Facturación Inteligente y Defensa de Disputas",
    navCommandCenter: "1. Centro de Comando (AG Grid)",
    navPolicyStudio: "2. Estudio de Políticas DSL",
    navInvoicingScheduler: "3. Facturación y Bryntum",
    navDisputeWarRoom: "4. Sala de Defensa de Disputas",
    navCheckoutBridge: "5. Fastlane y Puente PYUSD",
    kpiAnmpr: "ANMPR (Margen Neto Protegido)",
    kpiDso: "DSO Promedio (F-03 Cobros)",
    kpiDisputeWinRate: "Éxito en Disputas (F-04 GNN)",
    kpiPolicyFirewall: "Integridad del Firewall",
    cmdBarPlaceholder:
      'Ordene a PayPal Sentinel (ej., "Crear factura de $1,850 para Acme Robotics con 2% dto. y QR")...',
    executeMcpCta: "Ejecutar vía PayPal MCP ↵",
    dryRunLabel: "Modo Simulación (Dry-Run)",
  },
};
