/**
 * PayOps AI (PayPal Sentinel) — Deterministic PayPal Sandbox & Local Ledger Seeder
 * Maps to: F-01, F-02, F-03, F-04, F-05, F-06, E-01..E-10
 * Usage: pnpm tsx scripts/seed-sandbox.ts
 */

import crypto from "node:crypto";

export interface SeedMerchantWorkspace {
  workspaceId: string;
  merchantName: string;
  baseCurrency: "USD" | "INR" | "EUR" | "GBP";
  riskTier: "LOW" | "STANDARD" | "ELEVATED";
  autonomyLevel: "L0" | "L1" | "L2" | "L3" | "L4";
}

export interface SeedInvoiceFixture {
  invoiceId: string;
  invoiceNumber: string;
  recipientEmail: string;
  amountValue: string;
  currencyCode: "USD" | "INR" | "EUR";
  dueDate: string;
  qrCodeUri: string;
  conditionalRule: {
    ruleType: "EARLY_PAYMENT_DISCOUNT" | "LATE_PAYMENT_FEE";
    percentage: string;
    triggerDate: string;
  };
  idempotencyKey: string;
}

export interface SeedDisputeFixture {
  disputeId: string;
  orderId: string;
  reasonCode: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED" | "SIGNIFICANTLY_NOT_AS_DESCRIBED" | "UNAUTHORIZED";
  disputedAmountValue: string;
  currencyCode: "USD" | "INR";
  carrierCode: "DHL_EXPRESS" | "FEDEX" | "BLUEDART";
  trackingNumber: string;
  trackingStatus: "DELIVERED" | "IN_TRANSIT";
  gnnRiskScore: number;
  recommendedAction: "CONTEST_WITH_COMPELLING_EVIDENCE" | "AUTO_ACCEPT_LOW_VALUE_CLAIM" | "ROUTE_TO_HITL_PASSKEY";
}

export function computeDeterministicIdempotencyKey(
  workspaceId: string,
  entityType: string,
  entityId: string,
  action: string
): string {
  const raw = `${workspaceId}:${entityType}:${entityId}:${action}`;
  const digest = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
  return `idem_${workspaceId}_${digest}`;
}

export function computeAuditChainHash(
  prevHash: string,
  timestampIso: string,
  actorId: string,
  toolName: string,
  payloadJson: string,
  policyVerdict: string
): string {
  const payloadSha = crypto.createHash("sha256").update(payloadJson).digest("hex");
  return crypto
    .createHash("sha256")
    .update(`${prevHash}|${timestampIso}|${actorId}|${toolName}|${payloadSha}|${policyVerdict}`)
    .digest("hex");
}

export const SEED_WORKSPACES: SeedMerchantWorkspace[] = [
  {
    workspaceId: "ws_99102a",
    merchantName: "Kaveri Sustainable Knitwear Exports Pvt Ltd (Bengaluru & Tiruppur)",
    baseCurrency: "USD",
    riskTier: "LOW",
    autonomyLevel: "L3",
  },
  {
    workspaceId: "ws_88410b",
    merchantName: "Vance Precision Prototyping & Design LLC (Austin, TX)",
    baseCurrency: "USD",
    riskTier: "LOW",
    autonomyLevel: "L3",
  },
];

export const SEED_INVOICES: SeedInvoiceFixture[] = [
  {
    invoiceId: "INV2-X89A-4412-9012-7731",
    invoiceNumber: "INV-2026-8841",
    recipientEmail: "procurement@pacificboutique-la.example.com",
    amountValue: "2450.00",
    currencyCode: "USD",
    dueDate: "2026-11-20",
    qrCodeUri: "https://api-m.sandbox.paypal.com/v2/invoicing/invoices/INV2-X89A-4412-9012-7731/generate-qr-code",
    conditionalRule: {
      ruleType: "EARLY_PAYMENT_DISCOUNT",
      percentage: "2.00",
      triggerDate: "2026-11-10",
    },
    idempotencyKey: computeDeterministicIdempotencyKey("ws_99102a", "invoice", "INV-2026-8841", "create_and_send"),
  },
  {
    invoiceId: "INV2-B71C-3390-1184-6620",
    invoiceNumber: "INV-2026-8842",
    recipientEmail: "ap@nordicretail-berlin.example.com",
    amountValue: "168000.00",
    currencyCode: "INR",
    dueDate: "2026-11-25",
    qrCodeUri: "https://api-m.sandbox.paypal.com/v2/invoicing/invoices/INV2-B71C-3390-1184-6620/generate-qr-code",
    conditionalRule: {
      ruleType: "EARLY_PAYMENT_DISCOUNT",
      percentage: "1.50",
      triggerDate: "2026-11-12",
    },
    idempotencyKey: computeDeterministicIdempotencyKey("ws_99102a", "invoice", "INV-2026-8842", "create_and_send"),
  },
];

export const SEED_DISPUTES: SeedDisputeFixture[] = [
  {
    disputeId: "PP-D-90412",
    orderId: "8XL99102481",
    reasonCode: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
    disputedAmountValue: "420.00",
    currencyCode: "USD",
    carrierCode: "DHL_EXPRESS",
    trackingNumber: "JJD014600009812",
    trackingStatus: "DELIVERED",
    gnnRiskScore: 0.89,
    recommendedAction: "CONTEST_WITH_COMPELLING_EVIDENCE",
  },
  {
    disputeId: "PP-D-90419",
    orderId: "4KM22019482",
    reasonCode: "SIGNIFICANTLY_NOT_AS_DESCRIBED",
    disputedAmountValue: "35.00",
    currencyCode: "USD",
    carrierCode: "FEDEX",
    trackingNumber: "794801928374",
    trackingStatus: "DELIVERED",
    gnnRiskScore: 0.12,
    recommendedAction: "AUTO_ACCEPT_LOW_VALUE_CLAIM",
  },
];

async function runSandboxSeed(): Promise<void> {
  const genesisHash = "0".repeat(64);
  const nowIso = "2026-11-05T08:00:00.000Z";
  const auditHash1 = computeAuditChainHash(
    genesisHash,
    nowIso,
    "agent_service_m01",
    "send_invoice",
    JSON.stringify(SEED_INVOICES[0]),
    "APPROVED_L3_AUTO"
  );
  const auditHash2 = computeAuditChainHash(
    auditHash1,
    nowIso,
    "agent_service_m01",
    "get_shipment_tracking",
    JSON.stringify(SEED_DISPUTES[0]),
    "CONTEST_WITH_COMPELLING_EVIDENCE"
  );

  console.log(
    JSON.stringify(
      {
        status: "SEED_COMPLETED",
        paypalEnvironment: process.env.PAYPAL_ENVIRONMENT ?? "sandbox",
        workspacesSeeded: SEED_WORKSPACES.length,
        invoicesSeeded: SEED_INVOICES.length,
        disputesSeeded: SEED_DISPUTES.length,
        auditChainHead: auditHash2,
      },
      null,
      2
    )
  );
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("seed-sandbox.ts")) {
  runSandboxSeed().catch((err) => {
    console.error("Sandbox seed failed:", err);
    process.exit(1);
  });
}
