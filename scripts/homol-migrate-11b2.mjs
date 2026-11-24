/**
 * Executor controlado — somente migration `20261124010000_service_orders` no HOMOL.
 *
 * Modos:
 *   node scripts/homol-migrate-11b2.mjs plan
 *     Preflight + plano. Nunca migra. Não exige AUTHORIZE.
 *
 *   CONFIRM=YES MIGRATION_11B2_AUTHORIZE=YES DATABASE_ENV=preview \
 *     node scripts/homol-migrate-11b2.mjs deploy
 *     Exige autorização, revalida identidade e aplica migrate deploy.
 *     Nunca executa seed/reset/rollback.
 *
 * Credenciais: somente `.env.gate0.preview.local` (via buildHomolEnv).
 * Identidade aprovada: HOMOL_APPROVED_INSTANCE_ID (config externa / env).
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import pg from "pg";
import { buildHomolEnv, parseEnvFile, HOMOL_ENV_FILE } from "./lib/homol-env.mjs";
import {
  MIGRATION_11B2,
  EXPECTED_HOST_HASH,
  EXPECTED_INSTANCE_ID,
  EXPECTED_ORG_SLUG,
  assertDeployAuthorization,
  computeInstanceId,
  defaultMigrationsDir,
  evaluateHomol11b2DeployPlan,
  hostHashFromUrl,
  listLocalMigrationNames,
} from "./lib/homol-11b2-migrate-plan.mjs";

const mode = process.argv[2] ?? "plan";
if (mode !== "plan" && mode !== "deploy") {
  console.error(
    JSON.stringify({
      phase: "blocked",
      reason: "uso: node scripts/homol-migrate-11b2.mjs [plan|deploy]",
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

// buildHomolEnv força DATABASE_ENV=preview no env filho; ainda assim exigimos no processo.
if (process.env.DATABASE_ENV?.trim().toLowerCase() !== "preview") {
  blocked("DATABASE_ENV=preview obrigatório no processo");
}
if (process.env.VERCEL_ENV === "production") {
  blocked("VERCEL_ENV=production");
}

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
if (!url) blocked("URL HOMOL ausente após buildHomolEnv");

async function readIdentity(connectionString) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const identity = await client.query(`
      SELECT
        current_database() AS database,
        (SELECT system_identifier::text FROM pg_control_system()) AS system_identifier
    `);
    const database = String(identity.rows[0].database);
    const systemIdentifier = String(identity.rows[0].system_identifier);
    return {
      database,
      systemIdentifier,
      instanceId: computeInstanceId(systemIdentifier, database),
      hostHash: hostHashFromUrl(connectionString),
    };
  } finally {
    await client.end();
  }
}

async function gatherState(connectionString) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const identity = await client.query(`
      SELECT
        current_database() AS database,
        (SELECT system_identifier::text FROM pg_control_system()) AS system_identifier
    `);
    const database = String(identity.rows[0].database);
    const systemIdentifier = String(identity.rows[0].system_identifier);
    const liveInstanceId = computeInstanceId(systemIdentifier, database);

    const org = await client.query(
      `SELECT id, slug FROM organization WHERE slug = $1 LIMIT 1`,
      [EXPECTED_ORG_SLUG],
    );

    const migrations = await client.query(`
      SELECT migration_name, finished_at, rolled_back_at
      FROM "_prisma_migrations"
      ORDER BY migration_name ASC
    `);

    const requiredTables = [
      "customer",
      "proposal",
      "proposal_item",
      "engagement",
      "engagement_item",
      "received_purchase_order",
      "service_order",
    ];
    const tablePresent = {};
    for (const table of requiredTables) {
      const result = await client.query(`SELECT to_regclass($1) AS reg`, [
        `public.${table}`,
      ]);
      tablePresent[table] = Boolean(result.rows[0]?.reg);
    }

    const counts = {};
    for (const table of [
      "customer",
      "proposal",
      "engagement",
      "received_purchase_order",
    ]) {
      if (!tablePresent[table]) {
        counts[table] = null;
        continue;
      }
      const result = await client.query(
        `SELECT count(*)::int AS n FROM "${table}"`,
      );
      counts[table] = result.rows[0].n;
    }

    return {
      liveInstanceId,
      database,
      organizationSlug: org.rows[0]?.slug ?? null,
      organizationId: org.rows[0]?.id ?? null,
      migrationRows: migrations.rows,
      tablePresent,
      counts,
      requiredTablesMissing: [
        "customer",
        "proposal",
        "proposal_item",
        "engagement",
        "engagement_item",
        "received_purchase_order",
      ].filter((table) => !tablePresent[table]),
      serviceOrderTablePresent: tablePresent.service_order,
    };
  } finally {
    await client.end();
  }
}

const liveIdentity = await readIdentity(url);
// Confirma que a URL usada pela CLI (POSTGRES_URL / RUNTIME) é a mesma identidade.
const cliIdentity = await readIdentity(env.POSTGRES_URL);
const runtimeIdentity = await readIdentity(env.RUNTIME_DATABASE_URL);
if (
  cliIdentity.instanceId !== liveIdentity.instanceId ||
  runtimeIdentity.instanceId !== liveIdentity.instanceId
) {
  blocked("destino Prisma (POSTGRES_URL/RUNTIME) diverge da URL HOMOL verificada", {
    live: liveIdentity.instanceId,
    cli: cliIdentity.instanceId,
    runtime: runtimeIdentity.instanceId,
  });
}

const state = await gatherState(url);
const localMigrations = listLocalMigrationNames(defaultMigrationsDir());

const evaluation = evaluateHomol11b2DeployPlan({
  vercelEnv: process.env.VERCEL_ENV,
  databaseEnv: "preview",
  homolUrl: url,
  hostHash: targetHostHash,
  approvedInstanceId,
  liveInstanceId: state.liveInstanceId,
  cliTargetInstanceId: cliIdentity.instanceId,
  organizationSlug: state.organizationSlug,
  migrationRows: state.migrationRows,
  localMigrations,
  serviceOrderTablePresent: state.serviceOrderTablePresent,
  requiredTablesMissing: state.requiredTablesMissing,
});

const report = {
  phase: mode === "plan" ? "homol-11b2-plan" : "homol-11b2-deploy-preflight",
  mode,
  readOnly: mode === "plan",
  migration: MIGRATION_11B2,
  expected: {
    hostHash: EXPECTED_HOST_HASH,
    instanceId: EXPECTED_INSTANCE_ID,
    organizationSlug: EXPECTED_ORG_SLUG,
  },
  identity: {
    database: state.database,
    hostHash: targetHostHash,
    instanceId: state.liveInstanceId,
    approvedInstanceId: approvedInstanceId || null,
    cliMatchesPreflight: true,
  },
  organization: {
    slug: state.organizationSlug,
    found: Boolean(state.organizationId),
  },
  tables: state.tablePresent,
  rowCountsBefore: state.counts,
  evaluation: {
    ok: evaluation.ok,
    blockers: evaluation.blockers,
    plan: evaluation.plan,
  },
  seed: false,
  reset: false,
  rollback: false,
  deployAuthorized: mode === "deploy",
  deployExecuted: false,
};

console.log(JSON.stringify(report, null, 2));

if (!evaluation.ok) {
  process.exit(2);
}

if (mode === "plan") {
  console.log(
    JSON.stringify({
      phase: "ready-for-authorization",
      safeCommand:
        "CONFIRM=YES MIGRATION_11B2_AUTHORIZE=YES DATABASE_ENV=preview HOMOL_APPROVED_INSTANCE_ID=0786bd682d75 node scripts/homol-migrate-11b2.mjs deploy",
      pendingCount: evaluation.plan.pendingCount,
      migration: MIGRATION_11B2,
    }),
  );
  process.exit(0);
}

// --- deploy: somente migrate deploy, sem seed ---
console.log(
  JSON.stringify({
    phase: "migrate-start",
    migration: MIGRATION_11B2,
    pendingCount: evaluation.plan.pendingCount,
  }),
);

const migrate = spawnSync(
  "npx",
  ["tsx", "scripts/run-prisma.ts", "migrate", "deploy"],
  {
    stdio: "inherit",
    shell: true,
    cwd: resolve("."),
    env,
  },
);

if (migrate.status !== 0) {
  blocked("prisma migrate deploy falhou", { exitCode: migrate.status });
}

const after = await gatherState(url);
const afterEval = evaluateHomol11b2DeployPlan({
  vercelEnv: process.env.VERCEL_ENV,
  databaseEnv: "preview",
  homolUrl: url,
  hostHash: targetHostHash,
  approvedInstanceId,
  liveInstanceId: after.liveInstanceId,
  cliTargetInstanceId: after.liveInstanceId,
  organizationSlug: after.organizationSlug,
  migrationRows: after.migrationRows,
  localMigrations,
  serviceOrderTablePresent: false, // pós-deploy a tabela deve existir; validamos abaixo
  requiredTablesMissing: after.requiredTablesMissing,
});

const recorded = after.migrationRows.some(
  (row) =>
    row.migration_name === MIGRATION_11B2 &&
    row.finished_at &&
    !row.rolled_back_at,
);

const post = {
  phase: "homol-11b2-deploy-done",
  migration: MIGRATION_11B2,
  recordedInPrismaMigrations: recorded,
  serviceOrderTablePresent: after.tablePresent.service_order,
  pendingAfter: afterEval.history.pending,
  rowCountsAfter: after.counts,
  rowCountsPreserved: Object.fromEntries(
    Object.entries(state.counts).map(([table, before]) => [
      table,
      before === after.counts[table],
    ]),
  ),
  seed: false,
  deployExecuted: true,
};

console.log(JSON.stringify(post, null, 2));

if (!recorded || !after.tablePresent.service_order) {
  process.exit(3);
}
if (afterEval.history.pending.length > 0) {
  process.exit(4);
}

process.exit(0);
