/**
 * PayOps AI (PayPal Sentinel) — Deterministic Frontend Mock & Replay Fixtures
 * Write Owner (H03-H48): Dev 2 (100%)
 * Allows Dev 2 to build all 5 UI screens (AG Grid F-07, Bryntum F-08, Passkey UX) with zero backend blocking.
 */

import type { PayPalDisputeCase, PayPalInvoiceRecord, MerchantWorkspace } from "./entities.js";

export const MOCK_WORKSPACES: MerchantWorkspace[] = [
  {
    workspaceId: "ws_99102a",
    merchantName: "Kaveri Sustainable Knitwear Exports Pvt Ltd (Bengaluru & Tiruppur)",
    paypalMerchantId: "7789102938471",
    baseCurrency: "USD",
    riskTier: "LOW",
    autonomyLevel: "L3",
    createdAt: "2026-11-05T08:00:00.000Z",
  },
  {
    workspaceId: "ws_88410b",
    merchantName: "Vance Precision Prototyping & Design LLC (Austin, TX)",
    paypalMerchantId: "8841029384712",
    baseCurrency: "USD",
    riskTier: "LOW",
    autonomyLevel: "L3",
    createdAt: "2026-11-05T08:00:00.000Z",
  },
];

export const MOCK_INVOICES: PayPalInvoiceRecord[] = [
  {
    invoiceId: "INV2-X89A-4412-9012-7731",
    workspaceId: "ws_99102a",
    invoiceNumber: "INV-2026-8841",
    recipientEmail: "procurement@pacificboutique-la.example.com",
    amountValue: "2450.00",
    currencyCode: "USD",
    status: "SENT",
    dueDate: "2026-11-20",
    qrCodeUri: "https://api-m.sandbox.paypal.com/v2/invoicing/invoices/INV2-X89A-4412-9012-7731/generate-qr-code",
    conditionalRule: {
      ruleType: "EARLY_PAYMENT_DISCOUNT",
      percentage: "2.00",
      triggerDate: "2026-11-10",
    },
    idempotencyKey: "idem_ws_99102a_invoice_INV_2026_8841",
  },
];

export const MOCK_DISPUTES: PayPalDisputeCase[] = [
  {
    disputeId: "PP-D-90412",
    workspaceId: "ws_99102a",
    orderId: "8XL99102481",
    reasonCode: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
    disputedAmountValue: "420.00",
    currencyCode: "USD",
    carrierCode: "DHL_EXPRESS",
    trackingNumber: "JJD014600009812",
    trackingStatus: "DELIVERED",
    gnnRiskScore: 0.89,
    treeShapReasons: [
      "CARRIER_SIGNED_DELIVERY_MATCHES_BUYER_ZIP (+0.44)",
      "REPEAT_INR_CLAIM_ACROSS_3_MERCHANTS_90D (+0.31)",
      "DEVICE_FINGERPRINT_MATCHES_CHECKOUT_IP (+0.14)",
    ],
    recommendedAction: "CONTEST_WITH_COMPELLING_EVIDENCE",
    responseDueIso: "2026-11-15T23:59:59.000Z",
  },
];
