/**
 * Inventário SOMENTE LEITURA — RELEASE-01.
 * Não escreve no HOMOL.
 */
import pg from "pg";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
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

const { env, targetHostHash } = buildHomolEnv();
const url = env.POSTGRES_URL || env.RUNTIME_DATABASE_URL;
const client = new pg.Client({ connectionString: url });
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
  const local = listLocalMigrationNames(defaultMigrationsDir());
  const history = classifyMigrationHistory(migrations.rows, local);
  const tables = await client.query(`
    SELECT
      to_regclass('public.billing_request') AS billing_request,
      to_regclass('public.receipt_entry') AS receipt_entry,
      to_regclass('public.service_order') AS service_order,
      to_regclass('public.service_appointment') AS service_appointment
  `);
  const schemaOk = await client.query(`
    SELECT
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='receipt_entry' AND column_name='requestedAmountCents'
          AND is_nullable='NO'
      ) AS requested_amount_ok,
      EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname='receipt_entry_organizationId_confirmedAt_idx'
      ) AS confirmed_at_idx
  `);
  const counts = await client.query(`
    SELECT
      (SELECT count(*)::int FROM customer) AS customers_total,
      (SELECT count(*)::int FROM customer WHERE "deletedAt" IS NULL) AS customers_active,
      (SELECT count(*)::int FROM customer WHERE "deletedAt" IS NOT NULL) AS customers_archived,
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
    SELECT u.id, u.email, u.name, u."isActive",
           coalesce(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
    FROM "user" u
    LEFT JOIN user_role ur ON ur."userId" = u.id
    LEFT JOIN role r ON r.id = ur."roleId"
    GROUP BY u.id, u.email, u.name, u."isActive"
    ORDER BY u.email
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
  const fictional = await client.query(`
    SELECT 'customer' AS kind, id, "legalName" AS label
    FROM customer
    WHERE "legalName" ILIKE '%HOMOL-QA%' OR "legalName" ILIKE '%E2E%' OR "legalName" ILIKE '%GATEF%' OR "legalName" ILIKE '%APRES%'
    UNION ALL
    SELECT 'proposal', id, title
    FROM proposal
    WHERE title ILIKE '%HOMOL-QA%' OR title ILIKE '%E2E%' OR title ILIKE '%GATEF%' OR title ILIKE '%APRES%'
    UNION ALL
    SELECT 'engagement', id, title
    FROM engagement
    WHERE title ILIKE '%HOMOL-QA%' OR title ILIKE '%E2E%' OR title ILIKE '%GATEF%' OR title ILIKE '%APRES%'
    ORDER BY kind, label
  `);

  const report = {
    phase: "release-01-inventory-ro",
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
      total: migrations.rows.length,
      pending: history.pending,
      failed: history.failed,
      applied: history.applied,
      allFinished: migrations.rows.every((r) => r.finished_at && !r.rolled_back_at),
    },
    tables: {
      billing_request: Boolean(tables.rows[0].billing_request),
      receipt_entry: Boolean(tables.rows[0].receipt_entry),
      service_order: Boolean(tables.rows[0].service_order),
      service_appointment: Boolean(tables.rows[0].service_appointment),
      requestedAmountOk: Boolean(schemaOk.rows[0].requested_amount_ok),
      confirmedAtIdx: Boolean(schemaOk.rows[0].confirmed_at_idx),
    },
    counts: counts.rows[0],
    users: users.rows.map((u) => ({
      id: u.id,
      emailDomain: String(u.email).split("@")[1] ?? null,
      name: u.name,
      isActive: u.isActive,
      roles: u.roles,
    })),
    grants: { byRole },
    fictionalInventory: fictional.rows,
  };

  const out =
    "docs/architecture/v1/release-01-inventory-before.json";
  writeFileSync(out, JSON.stringify(report, null, 2));
  const ok =
    report.identity.hostHashMatches &&
    report.identity.instanceIdMatches &&
    report.migrations.pending.length === 0 &&
    report.migrations.failed.length === 0 &&
    report.migrations.allFinished &&
    report.tables.billing_request &&
    report.tables.receipt_entry &&
    report.tables.requestedAmountOk;

  console.log(JSON.stringify({ ok, written: out, ...report }, null, 2));
  process.exit(ok ? 0 : 2);
} finally {
  await client.end();
}
