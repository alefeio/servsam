/**
 * Auditoria somente leitura da migration 11B.1 no HOMOL de Preview.
 * Não aplica, reverte nem edita migrations.
 *
 * Uso: node scripts/audit-11b1-migration.mjs
 */
import { createHash } from "node:crypto";
import pg from "pg";
import { buildHomolEnv, parseEnvFile, HOMOL_ENV_FILE } from "./lib/homol-env.mjs";

const MIGRATION = "20261123140000_engagements_purchase_orders";
const EXPECTED_TABLES_11A = [
  "customer",
  "customer_contact",
  "customer_unit",
  "proposal",
  "proposal_item",
  "document_sequence",
];
const EXPECTED_TABLES_11B1 = [
  "received_purchase_order",
  "received_purchase_order_item",
  "engagement",
  "engagement_item",
];

function sha(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return "invalid";
  }
}

const { env, targetHostHash } = buildHomolEnv();
const local = parseEnvFile(".env.local");
const runtimeLegacy = local.RUNTIME_DATABASE_URL;
const legacyHostHash = runtimeLegacy ? sha(hostOf(runtimeLegacy)) : null;
const sameAsLegacy =
  Boolean(runtimeLegacy) && sha(hostOf(env.RUNTIME_DATABASE_URL)) === legacyHostHash;

const client = new pg.Client({ connectionString: env.RUNTIME_DATABASE_URL });

await client.connect();
try {
  const identity = await client.query(
    "SELECT current_database() AS db, inet_server_addr()::text AS addr, current_setting('server_version') AS version",
  );
  const org = await client.query(
    `SELECT id, slug, name FROM organization WHERE slug = 'servsam' LIMIT 1`,
  );
  const migrations = await client.query(
    `SELECT migration_name, finished_at, rolled_back_at, applied_steps_count
     FROM "_prisma_migrations"
     ORDER BY finished_at NULLS LAST, migration_name`,
  );
  const targetMigration = migrations.rows.find(
    (row) => row.migration_name === MIGRATION,
  );

  const tables = await client.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
  );
  const tableSet = new Set(tables.rows.map((row) => row.table_name));

  const indexes = await client.query(
    `SELECT indexname, indexdef
     FROM pg_indexes
     WHERE schemaname = 'public'
       AND (
         tablename IN ('engagement', 'received_purchase_order', 'engagement_item', 'received_purchase_order_item')
         OR indexname LIKE '%engagement%'
         OR indexname LIKE '%purchase_order%'
       )
     ORDER BY indexname`,
  );

  const counts11a = {};
  for (const table of EXPECTED_TABLES_11A) {
    if (!tableSet.has(table)) {
      counts11a[table] = null;
      continue;
    }
    const result = await client.query(`SELECT COUNT(*)::int AS n FROM "${table}"`);
    counts11a[table] = result.rows[0].n;
  }

  const counts11b1 = {};
  for (const table of EXPECTED_TABLES_11B1) {
    if (!tableSet.has(table)) {
      counts11b1[table] = null;
      continue;
    }
    const result = await client.query(`SELECT COUNT(*)::int AS n FROM "${table}"`);
    counts11b1[table] = result.rows[0].n;
  }

  const report = {
    phase: "audit-11b1-migration",
    readOnly: true,
    databaseEnv: "preview",
    targetHostHash,
    legacyRuntimeHostHash: legacyHostHash,
    sameHostAsLegacyRuntimeUrl: sameAsLegacy,
    productionTouched: false,
    database: identity.rows[0]?.db ?? null,
    organizationServsam: org.rows[0]
      ? { idPresent: true, slug: org.rows[0].slug, name: org.rows[0].name }
      : null,
    migration: {
      name: MIGRATION,
      recorded: Boolean(targetMigration),
      finishedAt: targetMigration?.finished_at ?? null,
      rolledBackAt: targetMigration?.rolled_back_at ?? null,
      appliedStepsCount: targetMigration?.applied_steps_count ?? null,
      earlyApplicationNote:
        "Aplicada antecipadamente em 23/11/2026 via npm run db:preview:migrate para QA do Gate 11B.1. Não reaplicar.",
    },
    prismaMigrations: migrations.rows.map((row) => ({
      name: row.migration_name,
      finishedAt: row.finished_at,
      rolledBackAt: row.rolled_back_at,
    })),
    tables11aPresent: EXPECTED_TABLES_11A.every((name) => tableSet.has(name)),
    tables11b1Present: EXPECTED_TABLES_11B1.every((name) => tableSet.has(name)),
    rowCounts11a: counts11a,
    rowCounts11b1: counts11b1,
    indexes: indexes.rows.map((row) => row.indexname),
    uniqueConstraintsExpected: [
      "received_purchase_order_organizationId_code_key",
      "received_purchase_order_active_external_unique",
      "engagement_organizationId_code_key",
      "engagement_proposalId_key",
      "engagement_purchaseOrderId_key",
    ],
    uniqueConstraintsPresent: [
      "received_purchase_order_organizationId_code_key",
      "received_purchase_order_active_external_unique",
      "engagement_organizationId_code_key",
      "engagement_proposalId_key",
      "engagement_purchaseOrderId_key",
    ].filter((name) => indexes.rows.some((row) => row.indexname === name)),
    driftHint:
      "Comparar schema.prisma local com tabelas/índices acima. Sem migrate diff automático neste script.",
  };

  console.log(JSON.stringify(report, null, 2));

  const ok =
    report.migration.recorded &&
    report.tables11aPresent &&
    report.tables11b1Present &&
    report.uniqueConstraintsPresent.length ===
      report.uniqueConstraintsExpected.length;

  process.exit(ok ? 0 : 2);
} finally {
  await client.end();
}
