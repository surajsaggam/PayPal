import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CockpitShell } from "@/components/agent/CockpitShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#003087",
};

export const metadata: Metadata = {
  title: {
    default: "PayPal Sentinel — Autonomous Treasury, Receivables & Dispute Protection",
    template: "%s | PayPal Sentinel",
  },
  description:
    "Autonomous CFO treasury workspace powered by PayPal Invoicing, Dispute Protection, Fastlane Checkout, and PYUSD Cross-Border Settlement with human-in-the-loop passkey guardrails.",
  keywords: [
    "PayPal Sentinel",
    "Autonomous Treasury",
    "Receivables Automation",
    "Dispute Defense",
    "PYUSD Settlement",
    "Fastlane Checkout",
    "CFO Command Center",
  ],
  authors: [{ name: "PayPal Sentinel Treasury Team" }],
  openGraph: {
    title: "PayPal Sentinel — Autonomous CFO Treasury & Payment Operations",
    description:
      "Real-time receivables collection, automated dispute evidence assembly, policy-guarded refunds, and instant PYUSD cross-border vendor settlement.",
    type: "website",
    siteName: "PayPal Sentinel",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`light overflow-x-hidden scroll-smooth ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen overflow-x-hidden bg-canvas text-ink font-sans antialiased selection:bg-accent-lime selection:text-accent-lime-ink">
        <CockpitShell>{children}</CockpitShell>
      </body>
    </html>
  );
}

