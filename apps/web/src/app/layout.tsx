import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "PayOps AI · PayPal Sentinel | Autonomous Working-Capital & Dispute Defense Cockpit",
  description:
    "PayPal AI Hackathon 2026 — 5-Screen Autonomous Commerce Cockpit powered by @paypal/agent-toolkit MCP, AG Grid Enterprise, Bryntum Scheduler, Elastic Hybrid RAG, and APIMatic.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`light ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-canvas text-ink font-sans antialiased selection:bg-accent-lime selection:text-accent-lime-ink">
        <CockpitShell>{children}</CockpitShell>
      </body>
    </html>
  );
}
