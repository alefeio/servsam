/**
 * RELEASE-03 Gate 2 — preflight SOMENTE LEITURA no HOMOL.
 * Não cria usuários, não altera grants, não migra.
 */
import { writeFileSync } from "node:fs";
import pg from "pg";
import { buildHomolEnv } from "./lib/homol-env.mjs";
import {
  EXPECTED_HOST_HASH,
  EXPECTED_INSTANCE_ID,
  computeInstanceId,
  listLocalMigrationNames,
  defaultMigrationsDir,
  classifyMigrationHistory,
} from "./lib/homol-11b4-migrate-plan.mjs";

if (process.env.DATABASE_ENV?.trim().toLowerCase() !== "preview") {
  console.error(JSON.stringify({ ok: false, reason: "DATABASE_ENV=preview" }));
  process.exit(1);
}

const TARGET_EMAILS = [
  "diretoria@servsam.com",
  "administrativo@servsam.com",
  "financeiro@servsam.com",
];

const { env, targetHostHash } = buildHomolEnv();
const client = new pg.Client({
  connectionString: env.POSTGRES_URL || env.RUNTIME_DATABASE_URL,
});
await client.connect();

try {
  const id = await client.query(`
    SELECT current_database() AS database,
           (SELECT system_identifier::text FROM pg_control_system()) AS sid
  `);
  const database = String(id.rows[0].database);
  const instanceId = computeInstanceId(String(id.rows[0].sid), database);
  const migrations = await client.query(`
    SELECT migration_name, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    ORDER BY finished_at ASC NULLS LAST, migration_name ASC
  `);
  const history = classifyMigrationHistory(
    migrations.rows,
    listLocalMigrationNames(defaultMigrationsDir()),
  );
  const tables = await client.query(`
    SELECT
      to_regclass('public.billing_request') AS billing_request,
      to_regclass('public.receipt_entry') AS receipt_entry,
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='receipt_entry' AND column_name='requestedAmountCents'
          AND is_nullable='NO'
      ) AS requested_amount_ok
  `);
  const counts = await client.query(`
    SELECT
      (SELECT count(*)::int FROM customer) AS customers_total,
      (SELECT count(*)::int FROM customer WHERE "deletedAt" IS NULL) AS customers_active,
      (SELECT count(*)::int FROM proposal WHERE "deletedAt" IS NULL) AS proposals_active,
      (SELECT count(*)::int FROM engagement WHERE "deletedAt" IS NULL) AS engagements_active,
      (SELECT count(*)::int FROM received_purchase_order WHERE "deletedAt" IS NULL) AS purchase_orders_active,
      (SELECT count(*)::int FROM service_order WHERE "deletedAt" IS NULL) AS service_orders_active,
      (SELECT count(*)::int FROM employee WHERE "deletedAt" IS NULL) AS employees_active,
      (SELECT count(*)::int FROM service_appointment WHERE "deletedAt" IS NULL) AS appointments_active,
      (SELECT count(*)::int FROM "user") AS users_total,
      (SELECT count(*)::int FROM audit_log) AS audit_logs_total,
      (SELECT count(*)::int FROM billing_request) AS billing_requests,
      (SELECT count(*)::int FROM receipt_entry) AS receipt_entries
  `);
  const users = await client.query(`
    SELECT u.id,
           split_part(u.email, '@', 2) AS "emailDomain",
           CASE
             WHEN split_part(u.email, '@', 2) = 'gmail.com' THEN '[redacted-operator]'
             ELSE u.name
           END AS name,
           u."isActive",
           coalesce(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
    FROM "user" u
    LEFT JOIN user_role ur ON ur."userId" = u.id
    LEFT JOIN role r ON r.id = ur."roleId"
    GROUP BY u.id
    ORDER BY u."createdAt"
  `);
  const grants = await client.query(`
    SELECT r.code AS role, p.key
    FROM role r
    JOIN role_permission rp ON rp."roleId" = r.id
    JOIN permission p ON p.id = rp."permissionId"
    WHERE r.code IN ('ADMINISTRATIVO','GERENCIA','FINANCEIRO','DIRETORIA')
    ORDER BY r.code, p.key
  `);
  const byRole = {};
  for (const row of grants.rows) {
    byRole[row.role] = byRole[row.role] ?? [];
    byRole[row.role].push(row.key);
  }
  const existing = await client.query(
    `SELECT lower(email) AS email, "isActive",
            CASE WHEN split_part(email,'@',2)='gmail.com' THEN '[redacted]' ELSE name END AS name
     FROM "user"
     WHERE lower(email) = ANY($1::text[])`,
    [TARGET_EMAILS],
  );

  const report = {
    phase: "release-03-preflight-ro",
    readOnly: true,
    capturedAt: new Date().toISOString(),
    identity: {
      hostHash: targetHostHash,
      hostHashMatches: targetHostHash === EXPECTED_HOST_HASH,
      database,
      instanceId,
      instanceIdMatches: instanceId === EXPECTED_INSTANCE_ID,
    },
    migrations: {
      total: history.applied.length,
      pending: history.pending,
      failed: history.failed,
      applied: history.applied,
      allFinished: migrations.rows.every((r) => r.finished_at && !r.rolled_back_at),
    },
    tables: {
      billing_request: Boolean(tables.rows[0].billing_request),
      receipt_entry: Boolean(tables.rows[0].receipt_entry),
      requestedAmountOk: Boolean(tables.rows[0].requested_amount_ok),
    },
    counts: counts.rows[0],
    users: users.rows,
    grants: { byRole },
    targetPilotEmails: {
      requested: TARGET_EMAILS,
      alreadyPresent: existing.rows,
      missing: TARGET_EMAILS.filter(
        (email) => !existing.rows.some((row) => row.email === email),
      ),
    },
  };

  const ok =
    report.identity.hostHashMatches &&
    report.identity.instanceIdMatches &&
    report.migrations.pending.length === 0 &&
    report.migrations.failed.length === 0 &&
    report.migrations.allFinished &&
    report.tables.billing_request &&
    report.tables.receipt_entry &&
    report.tables.requestedAmountOk;

  writeFileSync(
    "docs/release/release-03-preflight-before.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify({ ok, ...report }, null, 2));
  process.exit(ok ? 0 : 2);
} finally {
  await client.end();
}
