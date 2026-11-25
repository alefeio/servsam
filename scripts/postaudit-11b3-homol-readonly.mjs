/**
 * Auditoria somente leitura pós-migrate 11B.3 no HOMOL.
 * Não escreve, não seed, não grant.
 */
import pg from "pg";
import { buildHomolEnv } from "./lib/homol-env.mjs";
import {
  EXPECTED_HOST_HASH,
  EXPECTED_INSTANCE_ID,
  EXPECTED_ORG_SLUG,
  MIGRATION_11B3,
  computeInstanceId,
  hostHashFromUrl,
} from "./lib/homol-11b3-migrate-plan.mjs";

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
  const hostHash = hostHashFromUrl(url);

  const org = await client.query(
    `SELECT slug FROM organization WHERE slug = $1 LIMIT 1`,
    [EXPECTED_ORG_SLUG],
  );
  const mig = await client.query(
    `SELECT migration_name, finished_at, rolled_back_at
     FROM "_prisma_migrations" WHERE migration_name = $1`,
    [MIGRATION_11B3],
  );
  const tables = await client.query(`
    SELECT to_regclass('public.employee') AS employee,
           to_regclass('public.service_appointment') AS service_appointment
  `);
  const enumRow = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typname = 'ServiceAppointmentStatus'
    ) AS present
  `);
  const fks = await client.query(`
    SELECT c.conname FROM pg_constraint c
    WHERE c.contype = 'f'
      AND c.conrelid = ANY (ARRAY[
        to_regclass('public.employee'),
        to_regclass('public.service_appointment')
      ]::oid[])
    ORDER BY c.conname
  `);
  const idx = await client.query(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'service_appointment_active_service_order_unique'
  `);
  const emp = await client.query(`SELECT count(*)::int AS n FROM employee`);
  const appt = await client.query(
    `SELECT count(*)::int AS n FROM service_appointment`,
  );
  const counts = await client.query(`
    SELECT
      (SELECT count(*)::int FROM customer) AS customers_total,
      (SELECT count(*)::int FROM customer WHERE "deletedAt" IS NULL) AS customers_active,
      (SELECT count(*)::int FROM customer WHERE "deletedAt" IS NOT NULL) AS customers_archived,
      (SELECT count(*)::int FROM proposal WHERE "deletedAt" IS NULL) AS proposals_active,
      (SELECT count(*)::int FROM engagement WHERE "deletedAt" IS NULL) AS engagements_active,
      (SELECT count(*)::int FROM received_purchase_order WHERE "deletedAt" IS NULL) AS purchase_orders_active,
      (SELECT count(*)::int FROM service_order WHERE "deletedAt" IS NULL) AS service_orders_active,
      (SELECT count(*)::int FROM "user") AS users,
      (SELECT count(*)::int FROM audit_log) AS audit_logs
  `);
  const unfinished = await client.query(`
    SELECT migration_name FROM "_prisma_migrations"
    WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL
  `);

  const report = {
    phase: "postaudit-11b3-homol-readonly",
    readOnly: true,
    identity: {
      hostHash,
      targetHostHash,
      instanceId,
      expectedHostHash: EXPECTED_HOST_HASH,
      expectedInstanceId: EXPECTED_INSTANCE_ID,
      organizationSlug: org.rows[0]?.slug ?? null,
      hostHashMatches: hostHash === EXPECTED_HOST_HASH,
      instanceIdMatches: instanceId === EXPECTED_INSTANCE_ID,
    },
    migration: mig.rows[0] ?? null,
    schema: {
      employee: Boolean(tables.rows[0].employee),
      serviceAppointment: Boolean(tables.rows[0].service_appointment),
      enumServiceAppointmentStatus: Boolean(enumRow.rows[0].present),
      foreignKeys: fks.rows.map((r) => r.conname),
      uniquePartialIndex: idx.rows[0]?.indexname ?? null,
    },
    emptyDomainTables: {
      employees: emp.rows[0].n,
      appointments: appt.rows[0].n,
    },
    commercialCounts: counts.rows[0],
    unfinishedMigrations: unfinished.rows.map((r) => r.migration_name),
  };

  const ok =
    report.identity.hostHashMatches &&
    report.identity.instanceIdMatches &&
    report.identity.organizationSlug === EXPECTED_ORG_SLUG &&
    report.migration?.finished_at &&
    !report.migration?.rolled_back_at &&
    report.schema.employee &&
    report.schema.serviceAppointment &&
    report.schema.enumServiceAppointmentStatus &&
    report.schema.foreignKeys.length >= 4 &&
    report.schema.uniquePartialIndex ===
      "service_appointment_active_service_order_unique" &&
    report.unfinishedMigrations.length === 0;

  console.log(JSON.stringify({ ok, ...report }, null, 2));
  process.exit(ok ? 0 : 2);
} finally {
  await client.end();
}
