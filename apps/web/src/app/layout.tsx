import type { Metadata } from "next";
import "./globals.css";
import { CockpitShell } from "../components/agent/CockpitShell";

export const metadata: Metadata = {
  title: "PayOps AI (PayPal Sentinel) — Autonomous Agentic CFO & Dispute-Defense Control Plane",
  description:
    "PayPal AI Hackathon (PS-01): 35 PayPal MCP Tools, Cosmos.AI Policy Firewall, JunoDB Idempotent Ledger, AG Grid Enterprise, Bryntum Scheduler Pro, APIMatic Validator & PYUSD Solana Bridge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-sky-500 selection:text-white">
        <CockpitShell>{children}</CockpitShell>
      </body>
    </html>
  );
}
