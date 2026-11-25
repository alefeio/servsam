/**
 * Preflight somente leitura — Sprint 11B.4 FIN-F0.
 * Uso: DATABASE_ENV=preview node scripts/preflight-11b4-homol.mjs
 */
import pg from "pg";
import { buildHomolEnv } from "./lib/homol-env.mjs";
import {
  EXPECTED_HOST_HASH,
  EXPECTED_INSTANCE_ID,
  EXPECTED_ORG_SLUG,
  MIGRATION_11B3,
  MIGRATION_11B4,
  MIGRATION_11B4_QA,
  REQUIRED_APPLIED,
  computeInstanceId,
  defaultMigrationsDir,
  expectedAuthorizedPending,
  hostHashFromUrl,
  listLocalMigrationNames,
  classifyMigrationHistory,
} from "./lib/homol-11b4-migrate-plan.mjs";

if (process.env.DATABASE_ENV?.trim().toLowerCase() !== "preview") {
  console.error(JSON.stringify({ ok: false, reason: "DATABASE_ENV=preview" }));
  process.exit(1);
}

const { env, targetHostHash } = buildHomolEnv();
const url = env.POSTGRES_URL || env.RUNTIME_DATABASE_URL;
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const identity = await client.query(`
    SELECT current_database() AS database,
           (SELECT system_identifier::text FROM pg_control_system()) AS system_identifier
  `);
  const database = String(identity.rows[0].database);
  const instanceId = computeInstanceId(
    String(identity.rows[0].system_identifier),
    database,
  );
  const org = await client.query(
    `SELECT id, name, slug FROM organization WHERE slug = $1 LIMIT 1`,
    [EXPECTED_ORG_SLUG],
  );
  const migrations = await client.query(`
    SELECT migration_name, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    ORDER BY finished_at ASC NULLS LAST, migration_name ASC
  `);
  const tables = await client.query(`
    SELECT
      to_regclass('public.service_appointment') AS service_appointment,
      to_regclass('public.billing_request') AS billing_request,
      to_regclass('public.receipt_entry') AS receipt_entry
  `);
  const counts = await client.query(`
    SELECT
      (SELECT count(*)::int FROM customer WHERE "deletedAt" IS NULL) AS customers,
      (SELECT count(*)::int FROM proposal WHERE "deletedAt" IS NULL) AS proposals,
      (SELECT count(*)::int FROM engagement WHERE "deletedAt" IS NULL) AS engagements,
      (SELECT count(*)::int FROM service_order WHERE "deletedAt" IS NULL) AS service_orders,
      (SELECT count(*)::int FROM "user") AS users,
      (SELECT count(*)::int FROM audit_log) AS audit_logs
  `);

  let billingRequests = null;
  let receiptEntries = null;
  if (tables.rows[0].billing_request) {
    billingRequests = (
      await client.query(`SELECT count(*)::int AS n FROM billing_request`)
    ).rows[0].n;
  }
  if (tables.rows[0].receipt_entry) {
    receiptEntries = (
      await client.query(`SELECT count(*)::int AS n FROM receipt_entry`)
    ).rows[0].n;
  }

  const grants = await client.query(`
    SELECT r.code AS role, p.key
    FROM role r
    JOIN role_permission rp ON rp."roleId" = r.id
    JOIN permission p ON p.id = rp."permissionId"
    WHERE r.code IN ('ADMINISTRATIVO','GERENCIA','FINANCEIRO','DIRETORIA')
      AND p.key IN ('finance.view','finance.manage','contract.view','contract.manage')
    ORDER BY r.code, p.key
  `);
  const byRole = {};
  for (const row of grants.rows) {
    byRole[row.role] = byRole[row.role] ?? [];
    byRole[row.role].push(row.key);
  }

  const local = listLocalMigrationNames(defaultMigrationsDir());
  const history = classifyMigrationHistory(migrations.rows, local);
  const appliedSet = new Set(history.applied);

  const report = {
    phase: "preflight-11b4-homol",
    readOnly: true,
    databaseEnv: "preview",
    targetHostHash,
    identity: {
      database,
      hostHash: hostHashFromUrl(url),
      hostHashMatches: targetHostHash === EXPECTED_HOST_HASH,
      instanceId,
      instanceIdMatches: instanceId === EXPECTED_INSTANCE_ID,
      organization: org.rows[0]
        ? { id: org.rows[0].id, name: org.rows[0].name, slug: org.rows[0].slug }
        : null,
    },
    migrations: {
      totalApplied: history.applied.length,
      requiredPresent: REQUIRED_APPLIED.every((name) => appliedSet.has(name)),
      migration11b3Recorded: appliedSet.has(MIGRATION_11B3),
      migration11b4Recorded: appliedSet.has(MIGRATION_11B4),
      migration11b4QaRecorded: appliedSet.has(MIGRATION_11B4_QA),
      migration11b4Pending: history.pending.includes(MIGRATION_11B4),
      migration11b4QaPending: history.pending.includes(MIGRATION_11B4_QA),
      expectedAuthorizedPending: expectedAuthorizedPending(history.applied),
      pending: history.pending,
    },
    tables: {
      service_appointment: Boolean(tables.rows[0].service_appointment),
      billing_request: Boolean(tables.rows[0].billing_request),
      receipt_entry: Boolean(tables.rows[0].receipt_entry),
    },
    commercialCounts: {
      customers: counts.rows[0].customers,
      proposals: counts.rows[0].proposals,
      engagements: counts.rows[0].engagements,
      serviceOrders: counts.rows[0].service_orders,
      users: counts.rows[0].users,
      auditLogs: counts.rows[0].audit_logs,
      billingRequests,
      receiptEntries,
    },
    grants: {
      byRole,
      note: "Não executar seed/grants nesta sprint. finance.* já previsto no catálogo.",
    },
    deployAuthorized: false,
    note: "Somente leitura. Não migrar HOMOL nesta entrega.",
  };

  console.log(JSON.stringify(report, null, 2));
  const expectedPending = report.migrations.expectedAuthorizedPending;
  const pendingMatch =
    JSON.stringify(report.migrations.pending) ===
    JSON.stringify(expectedPending);
  const ok =
    report.identity.hostHashMatches &&
    report.identity.instanceIdMatches &&
    report.migrations.requiredPresent &&
    pendingMatch &&
    expectedPending.length > 0 &&
    !report.tables.billing_request &&
    !report.tables.receipt_entry;
  process.exit(ok ? 0 : 2);
} finally {
  await client.end();
}
