/**
 * Executor controlado — somente migration `20261125120000_finance_f0`.
 *
 *   node scripts/homol-migrate-11b4.mjs plan
 *   CONFIRM=YES MIGRATION_11B4_AUTHORIZE=YES DATABASE_ENV=preview \
 *     HOMOL_APPROVED_INSTANCE_ID=0786bd682d75 \
 *     node scripts/homol-migrate-11b4.mjs deploy
 *
 * Nunca seed/reset/rollback/grants. Não executar deploy sem autorização explícita.
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import pg from "pg";
import { buildHomolEnv, parseEnvFile, HOMOL_ENV_FILE } from "./lib/homol-env.mjs";
import {
  MIGRATION_11B4,
  EXPECTED_HOST_HASH,
  EXPECTED_INSTANCE_ID,
  EXPECTED_ORG_SLUG,
  assertDeployAuthorization,
  computeInstanceId,
  defaultMigrationsDir,
  evaluateHomol11b4DeployPlan,
  hostHashFromUrl,
  listLocalMigrationNames,
  classifyMigrationHistory,
} from "./lib/homol-11b4-migrate-plan.mjs";

const mode = process.argv[2] ?? "plan";
if (mode !== "plan" && mode !== "deploy") {
  console.error(
    JSON.stringify({
      phase: "blocked",
      reason: "uso: node scripts/homol-migrate-11b4.mjs [plan|deploy]",
    }),
  );
  process.exit(1);
}

function blocked(reason, extra = {}) {
  console.error(JSON.stringify({ phase: "blocked", reason, ...extra }, null, 2));
  process.exit(1);
}

if (mode === "deploy") {
  const auth = assertDeployAuthorization(process.env);
  if (!auth.ok) blocked(auth.blockers.join("; "));
}

if (process.env.DATABASE_ENV?.trim().toLowerCase() !== "preview") {
  blocked("DATABASE_ENV=preview obrigatório no processo");
}
if (process.env.VERCEL_ENV === "production") blocked("VERCEL_ENV=production");

const { env, targetHostHash } = buildHomolEnv();
if (targetHostHash !== EXPECTED_HOST_HASH) {
  blocked(`hostHash ${targetHostHash} ≠ ${EXPECTED_HOST_HASH}`);
}

const gate0 = parseEnvFile(HOMOL_ENV_FILE);
const approvedInstanceId =
  process.env.HOMOL_APPROVED_INSTANCE_ID?.trim() ||
  gate0.HOMOL_APPROVED_INSTANCE_ID?.trim() ||
  "";

const url = env.POSTGRES_URL || env.RUNTIME_DATABASE_URL;
if (!url) blocked("URL HOMOL ausente");

async function gatherState(connectionString) {
  const client = new pg.Client({ connectionString });
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
      `SELECT slug FROM organization WHERE slug = $1 LIMIT 1`,
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
        (SELECT count(*)::int FROM customer) AS customers_total,
        (SELECT count(*)::int FROM customer WHERE "deletedAt" IS NULL) AS customers_active,
        (SELECT count(*)::int FROM proposal WHERE "deletedAt" IS NULL) AS proposals_active,
        (SELECT count(*)::int FROM engagement WHERE "deletedAt" IS NULL) AS engagements_active,
        (SELECT count(*)::int FROM service_order WHERE "deletedAt" IS NULL) AS service_orders_active
    `);
    return {
      instanceId,
      hostHash: hostHashFromUrl(connectionString),
      organizationSlug: org.rows[0]?.slug ?? null,
      migrationRows: migrations.rows,
      appointmentTablePresent: Boolean(tables.rows[0].service_appointment),
      billingTablePresent: Boolean(tables.rows[0].billing_request),
      receiptTablePresent: Boolean(tables.rows[0].receipt_entry),
      commercialCounts: counts.rows[0],
    };
  } finally {
    await client.end();
  }
}

const state = await gatherState(url);
const localMigrations = listLocalMigrationNames(defaultMigrationsDir());
const evaluation = evaluateHomol11b4DeployPlan({
  vercelEnv: process.env.VERCEL_ENV,
  databaseEnv: "preview",
  homolUrl: url,
  hostHash: targetHostHash,
  approvedInstanceId,
  liveInstanceId: state.instanceId,
  organizationSlug: state.organizationSlug,
  migrationRows: state.migrationRows,
  localMigrations,
  appointmentTablePresent: state.appointmentTablePresent,
  billingTablePresent: state.billingTablePresent,
  receiptTablePresent: state.receiptTablePresent,
});

const report = {
  phase: mode === "plan" ? "plan-11b4-homol" : "deploy-11b4-homol",
  readOnly: mode === "plan",
  identity: {
    hostHash: targetHostHash,
    instanceId: state.instanceId,
    expectedInstanceId: EXPECTED_INSTANCE_ID,
    organizationSlug: state.organizationSlug,
  },
  commercialCounts: state.commercialCounts,
  evaluation,
  deployAuthorized: false,
  note:
    mode === "plan"
      ? "Somente leitura. Não aplica migration."
      : "Deploy exige autorização e revalidação.",
};

if (mode === "plan") {
  console.log(JSON.stringify(report, null, 2));
  process.exit(evaluation.ok ? 0 : 2);
}

if (!evaluation.ok) blocked(evaluation.blockers.join("; "), { evaluation });

const pendingBefore = classifyMigrationHistory(
  state.migrationRows,
  localMigrations,
).pending;
if (pendingBefore.length !== 1 || pendingBefore[0] !== MIGRATION_11B4) {
  blocked("exatamente uma migration pendente exigida", { pendingBefore });
}

const migrate = spawnSync(
  "npx",
  ["tsx", "scripts/run-prisma.ts", "migrate", "deploy"],
  {
    cwd: resolve("."),
    env,
    shell: true,
    stdio: "inherit",
  },
);
if (migrate.status !== 0) {
  blocked("migrate deploy falhou", { status: migrate.status });
}

const after = await gatherState(url);
const historyAfter = classifyMigrationHistory(after.migrationRows, localMigrations);
report.deployAuthorized = true;
report.appliedMigration = MIGRATION_11B4;
report.postAudit = {
  ok:
    after.billingTablePresent &&
    after.receiptTablePresent &&
    historyAfter.pending.length === 0 &&
    after.instanceId === state.instanceId,
  pendingAfter: historyAfter.pending,
  billingTablePresent: after.billingTablePresent,
  receiptTablePresent: after.receiptTablePresent,
  countsBefore: state.commercialCounts,
  countsAfter: after.commercialCounts,
};
report.note = report.postAudit.ok
  ? "Migration aplicada. Sem seed/grants/reset."
  : "Migration aparentemente aplicada; revisar auditoria.";
console.log(JSON.stringify(report, null, 2));
process.exit(report.postAudit.ok ? 0 : 3);
