/**
 * PayOps AI (PayPal Sentinel) — Role-Based Access Control (RBAC) Guard (E-02)
 * Enforces role permissions across OWNER, FINANCE_ADMIN, OPS_ANALYST, AUDITOR, and AGENT_SERVICE.
 */

import type { FastifyRequest } from "fastify";
import { repository } from "../db/repository.js";
import { PayOpsProblemError } from "../lib/errors.js";

export function resolveRequestOperatorRole(req: FastifyRequest): {
  operatorId: string;
  role: string;
} {
  const roleHeader = (req.headers["x-payops-role"] as string | undefined)?.trim();
  const operatorHeader = (req.headers["x-operator-id"] as string | undefined)?.trim();
  const bodyObj =
    req.body && typeof req.body === "object"
      ? (req.body as Record<string, unknown>)
      : {};
  const bodyOperatorId =
    (bodyObj.operatorUserId as string | undefined) ??
    (bodyObj.operator_id as string | undefined);

  const operatorId = operatorHeader ?? bodyOperatorId ?? "usr_maya_lin_owner";
  const operator = repository.getOperator(operatorId);

  const role = (
    roleHeader ??
    operator?.role ??
    (operatorId.toLowerCase().includes("auditor")
      ? "AUDITOR"
      : operatorId.toLowerCase().includes("ops")
        ? "OPS_ANALYST"
        : operatorId.toLowerCase().includes("agent")
          ? "AGENT_SERVICE"
          : "OWNER")
  ).toUpperCase();

  return { operatorId, role };
}

/**
 * Blocks AUDITOR (or UNAUTHORIZED) roles from performing state-mutating POST/PUT/DELETE requests.
 */
export function assertMutationPermitted(
  req: FastifyRequest,
  options?: { requireAdminOrOwner?: boolean }
): { operatorId: string; role: string } {
  const { operatorId, role } = resolveRequestOperatorRole(req);

  if (role === "AUDITOR" || role === "UNAUTHORIZED") {
    throw new PayOpsProblemError({
      status: 403,
      title: "Forbidden RBAC Role for State Mutation",
      detail: `Role '${role}' is read-only and prohibited from executing state-mutating operations.`,
      reasonCode: "RBAC_READ_ONLY_ROLE_FORBIDDEN",
    });
  }

  if (options?.requireAdminOrOwner && role !== "OWNER" && role !== "FINANCE_ADMIN") {
    throw new PayOpsProblemError({
      status: 403,
      title: "Forbidden RBAC Role — Finance Admin or Owner Required",
      detail: `Role '${role}' cannot modify policy rules or approve HITL holds. Required: OWNER or FINANCE_ADMIN.`,
      reasonCode: "RBAC_ADMIN_OR_OWNER_REQUIRED",
    });
  }

  return { operatorId, role };
}
