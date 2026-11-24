/**
 * Auditoria somente leitura pós-migration 11B.2 no HOMOL.
 * Não escreve, não seed, não rollback.
 */
import pg from "pg";
import { buildHomolEnv } from "./lib/homol-env.mjs";
import {
  MIGRATION_11B2,
  EXPECTED_HOST_HASH,
  EXPECTED_INSTANCE_ID,
  computeInstanceId,
  hostHashFromUrl,
} from "./lib/homol-11b2-migrate-plan.mjs";

const { env, targetHostHash } = buildHomolEnv();
const url = env.RUNTIME_DATABASE_URL;
const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  const identity = await client.query(`
    SELECT
      current_database() AS database,
      (SELECT system_identifier::text FROM pg_control_system()) AS system_identifier
  `);
  const database = identity.rows[0].database;
  const instanceId = computeInstanceId(
    identity.rows[0].system_identifier,
    database,
  );

  const migration = await client.query(
    `SELECT migration_name, finished_at, rolled_back_at, logs
     FROM "_prisma_migrations"
     WHERE migration_name = $1`,
    [MIGRATION_11B2],
  );

  const pendingLocal = [
    "20261022140103_platform_foundation",
    "20261118160000_customers_proposals",
    "20261118193000_customer_document_active_unique",
    "20261123140000_engagements_purchase_orders",
    MIGRATION_11B2,
  ];
  const applied = await client.query(
    `SELECT migration_name FROM "_prisma_migrations"
     WHERE rolled_back_at IS NULL AND finished_at IS NOT NULL`,
  );
  const appliedSet = new Set(applied.rows.map((r) => r.migration_name));
  const pending = pendingLocal.filter((name) => !appliedSet.has(name));

  const enumExists = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'ServiceOrderStatus' AND n.nspname = 'public'
    ) AS ok
  `);

  const table = await client.query(
    `SELECT to_regclass('public.service_order') AS reg`,
  );

  const indexes = await client.query(`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'service_order'
    ORDER BY indexname
  `);

  const uniquePartial = await client.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'service_order_active_engagement_item_unique'
  `);

  const fks = await client.query(`
    SELECT conname
    FROM pg_constraint
    WHERE contype = 'f'
      AND conrelid = 'public.service_order'::regclass
    ORDER BY conname
  `);

  const counts = {};
  for (const tableName of [
    "customer",
    "proposal",
    "engagement",
    "received_purchase_order",
    "service_order",
    "user",
    "role_permission",
  ]) {
    const result = await client.query(
      `SELECT count(*)::int AS n FROM "${tableName}"`,
    );
    counts[tableName] = result.rows[0].n;
  }

  const report = {
    phase: "postaudit-11b2-homol",
    readOnly: true,
    identity: {
      database,
      hostHash: targetHostHash,
      instanceId,
      hostHashMatches: targetHostHash === EXPECTED_HOST_HASH,
      instanceIdMatches: instanceId === EXPECTED_INSTANCE_ID,
      urlHostHash: hostHashFromUrl(url),
    },
    migration: {
      name: MIGRATION_11B2,
      recorded: migration.rowCount > 0,
      finishedAt: migration.rows[0]?.finished_at ?? null,
      rolledBackAt: migration.rows[0]?.rolled_back_at ?? null,
      hasFinishedAt: Boolean(migration.rows[0]?.finished_at),
      rolledBackAbsent: migration.rows[0]?.rolled_back_at == null,
    },
    schema: {
      serviceOrderTablePresent: Boolean(table.rows[0]?.reg),
      serviceOrderStatusEnum: Boolean(enumExists.rows[0]?.ok),
      indexes: indexes.rows.map((r) => r.indexname),
      uniquePartialPresent: uniquePartial.rowCount > 0,
      uniquePartialDef: uniquePartial.rows[0]?.indexdef ?? null,
      foreignKeys: fks.rows.map((r) => r.conname),
    },
    pendingMigrations: pending,
    counts,
    seedExecuted: false,
  };

  console.log(JSON.stringify(report, null, 2));
  const ok =
    report.identity.hostHashMatches &&
    report.identity.instanceIdMatches &&
    report.migration.recorded &&
    report.migration.hasFinishedAt &&
    report.migration.rolledBackAbsent &&
    report.schema.serviceOrderTablePresent &&
    report.schema.serviceOrderStatusEnum &&
    report.schema.uniquePartialPresent &&
    pending.length === 0;
  process.exit(ok ? 0 : 2);
} finally {
  await client.end();
}
