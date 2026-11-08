/**
 * PayOps AI (PayPal Sentinel) — Asynchronous Policy, Webhook & Dunning Worker
 * Maps to: infra/render.yaml (payops-policy-worker) & services/api/package.json ("worker")
 */

import { scoreFriendlyFraudGnn } from "../ai/m04-gnn-scorer.js";
import { elasticRagService } from "../ai/m05-elastic-rag.js";
import { repository } from "../db/repository.js";
import { logger } from "../lib/logger.js";
import { zapierDispatcher } from "../modules/webhooks/zapier-dispatcher.js";

export async function runPolicyWebhookWorkerCycle(workspaceId = "ws_99102a"): Promise<{
  workspaceId: string;
  disputesEvaluated: number;
  invoicesInspected: number;
  auditChainValid: boolean;
}> {
  const disputes = repository.listDisputes(workspaceId);
  for (const disp of disputes) {
    const gnn = scoreFriendlyFraudGnn({
      disputeId: disp.disputeId,
      orderId: disp.orderId,
      reasonCode: disp.reasonCode,
      disputedAmountUsd: Number(disp.disputedAmountValue),
      trackingStatus: disp.trackingStatus,
      carrierCode: disp.carrierCode,
    });
    const rag = elasticRagService.retrieveCompellingEvidenceCitation({
      reasonCode: disp.reasonCode,
      carrierCode: disp.carrierCode,
      trackingStatus: disp.trackingStatus,
    });
    repository.saveDispute({
      ...disp,
      gnnRiskScore: gnn.gnnRiskScore,
      gnn_risk_score: gnn.gnnRiskScore,
      treeShapReasons: gnn.treeShapReasons,
      gnn_reason_codes: gnn.treeShapReasons,
      evidence_bundle_json: {
        ...disp.evidence_bundle_json,
        elastic_policy_citation: rag.citation,
      },
    });
  }

  const invoices = repository.listInvoices({ workspaceId });
  const auditCheck = repository.verifyAuditLedgerIntegrity();

  await zapierDispatcher.dispatchAlert({
    eventType: "CUSTOM_ALERT",
    workspaceId,
    payload: {
      workerCycle: "COMPLETED",
      disputesEvaluated: disputes.length,
      invoicesInspected: invoices.length,
    },
  });

  return {
    workspaceId,
    disputesEvaluated: disputes.length,
    invoicesInspected: invoices.length,
    auditChainValid: auditCheck.valid,
  };
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("policy-webhook-worker.ts") ||
  process.argv[1]?.endsWith("policy-webhook-worker.js")
) {
  runPolicyWebhookWorkerCycle()
    .then((summary) => {
      logger.info(summary, "PayOps policy-webhook-worker cycle completed");
    })
    .catch((err) => {
      console.error("Policy webhook worker failed:", err);
      process.exit(1);
    });
}
