"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("PayPal Sentinel Runtime Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center py-12 px-4 animate-pop-in">
      <div className="surface-bento max-w-lg w-full p-6 sm:p-8 text-center space-y-5">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-status-danger-bg border border-status-danger-border flex items-center justify-center text-status-danger-text">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-status-danger-bg text-status-danger-text border border-status-danger-border">
            Protected Workspace Recovery
          </span>
          <h1 className="editorial-heading text-2xl pt-1">
            Something interrupted this view
          </h1>
          <p className="editorial-subcopy text-sm">
            {error.message ||
              "An unexpected rendering condition occurred. No live PayPal payouts or invoices were affected."}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="btn-primary-mint px-5 py-2.5 text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry View
          </button>
          <Link
            href="/command-center"
            className="btn-outline-subtle px-4 py-2.5 text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
