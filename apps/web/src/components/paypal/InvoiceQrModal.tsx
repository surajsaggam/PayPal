"use client";

/**
 * PayOps AI (PayPal Sentinel) — Enlarged Editorial Smart Invoice & QR Payment Card
 * Increase.com Light-First Editorial Modal:
 *  - High-density deterministic 25x25 QR matrix with corner scan brackets & vector center emblem
 *  - Clean human-readable typography (no raw sandbox URLs, idempotency strings, or API ticket codes)
 *  - Smooth pop-in entrance animation and tactile button micro-interactions
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  QrCode,
  X,
  Sparkles,
  CheckCircle2,
  Coins,
  Send,
  Copy,
  Check,
  Building2,
  Mail,
  CalendarClock,
  Smartphone,
  ShieldCheck,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrencyAmount, formatDualCurrency } from "../../lib/formatters";
import { useCockpitStore } from "../../stores/useCockpitStore";

/**
 * Derives a clean, human-readable organization name from an invoice recipient email.
 */
function formatRecipientOrganization(email: string): string {
  const knownOrganizations: Record<string, string> = {
    "accounts@acmerobotics.example.io": "Acme Robotics Inc.",
    "ap@vortexlogistics.example.in": "Vortex Logistics Pvt. Ltd.",
    "treasury@heliossolar.example.de": "Helios Solar GmbH",
    "finance@kaverisilk.example.in": "Kaveri Sustainable Apparel",
    "billing@nordicfreight.example.eu": "Nordic Freight Systems",
  };
  if (knownOrganizations[email.toLowerCase()]) {
    return knownOrganizations[email.toLowerCase()];
  }
  const domainPart = email.split("@")[1]?.split(".")[0] ?? "Enterprise Customer";
  return domainPart
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into a clean editorial date (e.g., "Nov 15, 2026").
 */
function formatEditorialDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Generates a realistic, high-density 25x25 QR code matrix deterministically from a seed string,
 * preserving standard finder patterns, separators, timing tracks, and a center emblem reserve.
 */
function generateQrMatrix(seed: string): boolean[][] {
  const size = 25;
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  // Reserve 8x8 finder regions in 3 corners (top-left, top-right, bottom-left)
  const markFinderArea = (r0: number, c0: number) => {
    for (let r = r0 - 1; r <= r0 + 7; r++) {
      for (let c = c0 - 1; c <= c0 + 7; c++) {
        if (r >= 0 && r < size && c >= 0 && c < size) {
          reserved[r][c] = true;
        }
      }
    }
  };
  markFinderArea(0, 0);
  markFinderArea(0, size - 7);
  markFinderArea(size - 7, 0);

  // Reserve 5x5 center emblem area (rows 10..14, cols 10..14)
  for (let r = 9; r <= 15; r++) {
    for (let c = 9; c <= 15; c++) {
      reserved[r][c] = true;
    }
  }

  // Timing patterns on row 6 and col 6
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Alignment pattern at (16..20, 16..20)
  for (let r = 16; r <= 20; r++) {
    for (let c = 16; c <= 20; c++) {
      reserved[r][c] = true;
      const isBorder = r === 16 || r === 20 || c === 16 || c === 20;
      const isCenter = r === 18 && c === 18;
      matrix[r][c] = isBorder || isCenter;
    }
  }

  // Deterministic hash stream from seed string
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      matrix[r][c] = (Math.abs(hash) % 10) < 5;
    }
  }

  return matrix;
}

export function InvoiceQrModal() {
  const {
    qrModalInvoice,
    openQrModal,
    openPyusdModal,
    activeCurrency,
    rescheduleInvoiceReminder,
  } = useCockpitStore();

  const [copiedLink, setCopiedLink] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  useEffect(() => {
    setCopiedLink(false);
    setReminderSent(false);
  }, [qrModalInvoice?.invoiceId]);

  useEffect(() => {
    if (!qrModalInvoice) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        openQrModal(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [qrModalInvoice, openQrModal]);

  const qrMatrix = useMemo(
    () =>
      qrModalInvoice
        ? generateQrMatrix(`${qrModalInvoice.invoiceId}:${qrModalInvoice.invoiceNumber}`)
        : [],
    [qrModalInvoice]
  );

  if (!qrModalInvoice) return null;

  const customerName = formatRecipientOrganization(qrModalInvoice.recipientEmail);
  const secondaryCurrency = formatDualCurrency(
    qrModalInvoice.amountValue,
    qrModalInvoice.currencyCode,
    activeCurrency === qrModalInvoice.currencyCode ? "INR" : activeCurrency
  ).secondary;

  const statusConfig =
    qrModalInvoice.status === "PAID"
      ? {
          label: "Paid in Full",
          badgeClass:
            "border-status-success-border bg-status-success-bg text-status-success-text",
          dotClass: "bg-status-success-bar",
        }
      : qrModalInvoice.status === "OVERDUE"
        ? {
            label: "Overdue",
            badgeClass:
              "border-status-danger-border bg-status-danger-bg text-status-danger-text",
            dotClass: "bg-status-danger-bar",
          }
        : {
            label: "Awaiting Payment",
            badgeClass:
              "border-status-info-border bg-status-info-bg text-status-info-text",
            dotClass: "bg-status-info-bar",
          };

  const handleCopyPaymentLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(
        `https://pay.paypal.com/invoice/${qrModalInvoice.invoiceNumber}`
      );
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleSendReminder = () => {
    rescheduleInvoiceReminder(qrModalInvoice.invoiceId, "2026-11-16");
    setReminderSent(true);
    setTimeout(() => {
      openQrModal(null);
    }, 650);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-qr-modal-title"
      onClick={() => openQrModal(null)}
      className="fixed inset-0 z-50 flex items-center justify-center apple-modal-scrim p-4 sm:p-6 transition-opacity duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl apple-glass-sheet text-ink overflow-hidden animate-pop-in"
      >
        {/* Minimal Editorial Header */}
        <div className="flex items-center justify-between border-b border-hairline bg-surface/80 px-6 py-5">
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-hairline bg-elevated text-ink shadow-2xs transition-transform duration-200 hover:scale-105">
              <QrCode className="h-5 w-5 text-ink" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2
                  id="invoice-qr-modal-title"
                  className="text-base font-semibold tracking-tight text-ink"
                >
                  Instant QR Invoice
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-[11px] font-semibold ${statusConfig.badgeClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClass}`} />
                  {statusConfig.label}
                </span>
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted tabular-nums">
                <span>Invoice {qrModalInvoice.invoiceNumber}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3 w-3 text-ink-muted" />
                  Due {formatEditorialDate(qrModalInvoice.dueDate)}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openQrModal(null)}
            aria-label="Close QR Invoice Card"
            className="rounded-xl p-2 text-ink-muted transition-all duration-200 hover:bg-subtle hover:text-ink active:scale-[0.95] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Enlarged Main Content */}
        <div className="p-6 space-y-5">
          {/* Customer & Total Amount Hero Card */}
          <div className="rounded-2xl border border-hairline bg-surface/70 p-4 sm:p-5 transition-all duration-200 hover:border-slate-300">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                  <Building2 className="h-3.5 w-3.5 text-ink-secondary" />
                  <span>Billed To</span>
                </div>
                <div className="text-base font-semibold text-ink">{customerName}</div>
                <div className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                  <Mail className="h-3 w-3 text-ink-muted" />
                  <span>{qrModalInvoice.recipientEmail}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                  Amount Due
                </div>
                <div className="mt-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-ink tabular-nums">
                  {formatCurrencyAmount(
                    qrModalInvoice.amountValue,
                    qrModalInvoice.currencyCode,
                    activeCurrency
                  )}
                </div>
                <div className="mt-0.5 text-xs font-medium text-ink-muted tabular-nums">
                  {secondaryCurrency}
                </div>
              </div>
            </div>

            {/* Clean Early-Payment Incentive Pill */}
            {qrModalInvoice.conditionalRule && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-status-success-border bg-status-success-bg/85 px-3.5 py-2.5 text-xs text-status-success-text tabular-nums">
                <span className="inline-flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>
                    {qrModalInvoice.conditionalRule.ruleType === "EARLY_PAYMENT_DISCOUNT"
                      ? `${qrModalInvoice.conditionalRule.percentage}% Early-Payment Discount Available`
                      : `${qrModalInvoice.conditionalRule.percentage}% Late-Payment Fee Applies After Due Date`}
                  </span>
                </span>
                <span className="rounded-pill bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-status-success-text shadow-2xs tabular-nums">
                  Valid until {formatEditorialDate(qrModalInvoice.conditionalRule.triggerDate)}
                </span>
              </div>
            )}
          </div>

          {/* Enlarged Interactive Scannable QR Showcase */}
          <div className="group relative flex flex-col items-center justify-center rounded-2xl border border-hairline bg-white p-6 text-slate-900 shadow-xs transition-all duration-300 hover:shadow-md">
            {/* Subtle Corner Framing Brackets */}
            <div className="relative p-3.5 rounded-2xl bg-white transition-transform duration-300 ease-spring group-hover:scale-[1.03]">
              <span className="pointer-events-none absolute top-0 left-0 h-5 w-5 rounded-tl-xl border-t-2 border-l-2 border-slate-900/80 transition-colors duration-300 group-hover:border-[#0070E0]" />
              <span className="pointer-events-none absolute top-0 right-0 h-5 w-5 rounded-tr-xl border-t-2 border-r-2 border-slate-900/80 transition-colors duration-300 group-hover:border-[#0070E0]" />
              <span className="pointer-events-none absolute bottom-0 left-0 h-5 w-5 rounded-bl-xl border-b-2 border-l-2 border-slate-900/80 transition-colors duration-300 group-hover:border-[#0070E0]" />
              <span className="pointer-events-none absolute bottom-0 right-0 h-5 w-5 rounded-br-xl border-b-2 border-r-2 border-slate-900/80 transition-colors duration-300 group-hover:border-[#0070E0]" />

              <svg
                viewBox="0 0 290 290"
                className="h-52 w-52 sm:h-56 sm:w-56"
                role="img"
                aria-label={`PayPal Invoice QR Code for ${qrModalInvoice.invoiceId}`}
              >
                <rect width="290" height="290" rx="12" fill="#FFFFFF" />

                {/* Top-Left Finder Pattern (0,0) */}
                <rect
                  x="20"
                  y="20"
                  width="70"
                  height="70"
                  rx="14"
                  fill="none"
                  stroke="#0F172A"
                  strokeWidth="10"
                />
                <rect x="40" y="40" width="30" height="30" rx="6" fill="#0070E0" />

                {/* Top-Right Finder Pattern (18,0) */}
                <rect
                  x="200"
                  y="20"
                  width="70"
                  height="70"
                  rx="14"
                  fill="none"
                  stroke="#0F172A"
                  strokeWidth="10"
                />
                <rect x="220" y="40" width="30" height="30" rx="6" fill="#0070E0" />

                {/* Bottom-Left Finder Pattern (0,18) */}
                <rect
                  x="20"
                  y="200"
                  width="70"
                  height="70"
                  rx="14"
                  fill="none"
                  stroke="#0F172A"
                  strokeWidth="10"
                />
                <rect x="40" y="220" width="30" height="30" rx="6" fill="#0070E0" />

                {/* High-Density Data Modules (25x25 Grid) */}
                {qrMatrix.map((row, rIdx) =>
                  row.map((active, cIdx) => {
                    if (!active) return null;
                    const x = 20 + cIdx * 10;
                    const y = 20 + rIdx * 10;
                    const isAccent = (rIdx + cIdx) % 7 === 0;
                    return (
                      <rect
                        key={`${rIdx}-${cIdx}`}
                        x={x + 1}
                        y={y + 1}
                        width="8"
                        height="8"
                        rx="2.2"
                        fill={isAccent ? "#0070E0" : "#0F172A"}
                      />
                    );
                  })
                )}

                {/* Center Brand Emblem (Vector Shield & Checkmark — No Raw Monospace Text) */}
                <rect
                  x="113"
                  y="113"
                  width="64"
                  height="64"
                  rx="16"
                  fill="#FFFFFF"
                />
                <rect
                  x="118"
                  y="118"
                  width="54"
                  height="54"
                  rx="13"
                  fill="#0F172A"
                />
                <path
                  d="M145 129L157 134V143C157 151.5 151.8 158.8 145 161C138.2 158.8 133 151.5 133 143V134L145 129Z"
                  fill="#0070E0"
                />
                <path
                  d="M140.5 145.2L143.6 148.3L150.2 141.7"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>

            {/* Clean Instructions & Feature Badges */}
            <div className="mt-4 text-center space-y-3">
              <div className="text-sm font-semibold text-ink">
                Scan with PayPal, Venmo, or your phone camera
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-hairline bg-surface px-3 py-1 text-[11px] font-medium text-ink-secondary">
                  <Smartphone className="h-3.5 w-3.5 text-[#0070E0]" />
                  One-Tap Mobile Pay
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-hairline bg-surface px-3 py-1 text-[11px] font-medium text-ink-secondary">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Instant Receipt
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-hairline bg-surface px-3 py-1 text-[11px] font-medium text-ink-secondary">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Verified Invoice
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Footer Actions with Smooth Hover Transitions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-hairline bg-surface/90 px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPaymentLink}
              className="btn-outline-subtle px-3.5 py-2 text-xs font-medium transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-xs cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-status-success-text" />
                  <span className="text-status-success-text font-semibold">Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-ink-secondary" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSendReminder}
              className="btn-outline-subtle px-3.5 py-2 text-xs font-medium transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-xs cursor-pointer"
            >
              {reminderSent ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-status-success-text" />
                  <span className="text-status-success-text font-semibold">Reminder Sent</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 text-ink-secondary" />
                  <span>Send Reminder</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const target = qrModalInvoice;
              openQrModal(null);
              openPyusdModal(target);
            }}
            className="btn-primary-mint px-4 py-2 text-xs font-semibold transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
          >
            <Coins className="h-4 w-4" />
            <span>Pay with PYUSD</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
