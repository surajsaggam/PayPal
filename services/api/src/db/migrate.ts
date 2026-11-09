/**
 * PayOps AI (PayPal Sentinel) — Database Migration & Immutability Trigger Installer
 * Usage: pnpm --filter @payops/api db:migrate
 */

import { repository } from "./repository.js";
import * as schema from "./schema.js";

export const IMMUTABLE_AUDIT_TRIGGER_SQL = `
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ImmutableAuditLog (E-10) is append-only. UPDATE and DELETE are strictly prohibited.'
  USING ERRCODE = '23514';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_audit_log_protect ON immutable_audit_logs;
CREATE TRIGGER trg_immutable_audit_log_protect
BEFORE UPDATE OR DELETE ON immutable_audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
`;

export async function runMigrations(): Promise<{
  status: "MIGRATED_POSTGRES" | "INITIALIZED_IN_MEMORY_LEDGER";
  tablesRegistered: number;
  auditChainVerified: boolean;
}> {
  await repository.initializePostgresIfConfigured({ waitForBootstrap: true });
  const tableNames = Object.keys(schema);
  const chainStatus = repository.verifyAuditLedgerIntegrity();
  const pgStats = await repository.getPostgresLiveStats();

  const status =
    repository.storageMode === "postgres"
      ? "MIGRATED_POSTGRES"
      : "INITIALIZED_IN_MEMORY_LEDGER";

  console.log(
    JSON.stringify(
      {
        status,
        storageMode: repository.storageMode,
        databaseHost: pgStats.databaseHost,
        tablesRegistered: tableNames.length,
        tableRowCounts: pgStats.tableRowCounts,
        auditChainVerified: chainStatus.valid,
        auditChainHead: chainStatus.headHash,
      },
      null,
      2
    )
  );

  return {
    status,
    tablesRegistered: tableNames.length,
    auditChainVerified: chainStatus.valid,
  };
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("migrate.ts") ||
  process.argv[1]?.endsWith("migrate.js")
) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Database migration error:", err);
      process.exit(1);
    });
}
