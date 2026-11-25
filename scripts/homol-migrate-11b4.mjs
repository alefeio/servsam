/**
 * Executor controlado — migrations FIN-F0 autorizadas.
 *
 *   node scripts/homol-migrate-11b4.mjs plan
 *   CONFIRM=YES MIGRATION_11B4_AUTHORIZE=YES MIGRATION_11B4_QA_AUTHORIZE=YES \
 *     DATABASE_ENV=preview HOMOL_APPROVED_INSTANCE_ID=0786bd682d75 \
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
  MIGRATION_11B4_QA,
  AUTHORIZED_11B4_MIGRATIONS,
  EXPECTED_HOST_HASH,
  EXPECTED_INSTANCE_ID,
  EXPECTED_ORG_SLUG,
  assertDeployAuthorization,
  computeInstanceId,
  defaultMigrationsDir,
  evaluateHomol11b4DeployPlan,
  expectedAuthorizedPending,
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

function auditFailed(reason, extra = {}) {
  console.error(
    JSON.stringify({ phase: "audit-failed", reason, ...extra }, null, 2),
  );
  process.exit(3);
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

function assertPrismaCliTargetsApprovedBank(processEnv, approvedUrl) {
  const probe = spawnSync(
    "npx",
    ["tsx", "scripts/print-migration-url-host-hash.ts"],
    {
      cwd: resolve("."),
      env: processEnv,
      shell: true,
      encoding: "utf8",
    },
  );
  if (probe.status !== 0) {
    blocked("CLI Prisma sem URL de migration resolvível", {
      status: probe.status,
      stderr: (probe.stderr || "").slice(0, 500),
    });
  }
  const resolvedHash = String(probe.stdout || "").trim();
  if (!/^[a-f0-9]{12}$/.test(resolvedHash)) {
    blocked("probe da CLI Prisma não retornou hostHash", {
      preview: resolvedHash.slice(0, 32),
    });
  }
  const approvedHash = hostHashFromUrl(approvedUrl);
  if (resolvedHash !== approvedHash || resolvedHash !== EXPECTED_HOST_HASH) {
    blocked("CLI Prisma não aponta ao banco HOMOL aprovado no preflight", {
      resolvedHostHash: resolvedHash,
      approvedHostHash: approvedHash,
      expectedHostHash: EXPECTED_HOST_HASH,
    });
  }
  return { resolvedHostHash: resolvedHash };
}

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
    const enums = await client.query(`
      SELECT t.typname
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
        AND t.typname IN (
          'BillingRequestStatus',
          'BillingRequestType',
          'ReceiptKind',
          'ReceiptStatus',
          'ReceiptPaymentMethod'
        )
      ORDER BY t.typname
    `);
    const fks = await client.query(`
      SELECT c.conname
      FROM pg_constraint c
      WHERE c.contype = 'f'
        AND c.conrelid = ANY (ARRAY[
          to_regclass('public.billing_request'),
          to_regclass('public.receipt_entry')
        ]::oid[])
      ORDER BY c.conname
    `);
    const uniquePartial = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND (
          indexname LIKE '%billing_request%idempotency%'
          OR indexname LIKE '%receipt_entry%idempotency%'
          OR indexdef ILIKE '%idempotencyKey%'
        )
      ORDER BY indexname
    `);
    const requestedAmountCol = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'receipt_entry'
          AND column_name = 'requestedAmountCents'
      ) AS present
    `);
    const counts = await client.query(`
      SELECT
        (SELECT count(*)::int FROM customer) AS customers_total,
        (SELECT count(*)::int FROM customer WHERE "deletedAt" IS NULL) AS customers_active,
        (SELECT count(*)::int FROM customer WHERE "deletedAt" IS NOT NULL) AS customers_archived,
        (SELECT count(*)::int FROM proposal WHERE "deletedAt" IS NULL) AS proposals_active,
        (SELECT count(*)::int FROM engagement WHERE "deletedAt" IS NULL) AS engagements_active,
        (SELECT count(*)::int FROM service_order WHERE "deletedAt" IS NULL) AS service_orders_active,
        (SELECT count(*)::int FROM "user") AS users_total,
        (SELECT count(*)::int FROM audit_log) AS audit_logs_total
    `);

    const migrationRows = migrations.rows;
    const migration11b4 = migrationRows.find(
      (row) => row.migration_name === MIGRATION_11B4,
    );
    const migration11b4Qa = migrationRows.find(
      (row) => row.migration_name === MIGRATION_11B4_QA,
    );

    return {
      instanceId,
      hostHash: hostHashFromUrl(connectionString),
      organizationSlug: org.rows[0]?.slug ?? null,
      migrationRows,
      appointmentTablePresent: Boolean(tables.rows[0].service_appointment),
      billingTablePresent: Boolean(tables.rows[0].billing_request),
      receiptTablePresent: Boolean(tables.rows[0].receipt_entry),
      financeEnums: enums.rows.map((row) => row.typname),
      foreignKeys: fks.rows.map((row) => row.conname),
      idempotencyIndexes: uniquePartial.rows.map((row) => ({
        name: row.indexname,
        definition: row.indexdef,
      })),
      requestedAmountColumnPresent: Boolean(
        requestedAmountCol.rows[0]?.present,
      ),
      migration11b4: migration11b4
        ? {
            name: migration11b4.migration_name,
            finishedAt: migration11b4.finished_at,
            rolledBackAt: migration11b4.rolled_back_at,
          }
        : null,
      migration11b4Qa: migration11b4Qa
        ? {
            name: migration11b4Qa.migration_name,
            finishedAt: migration11b4Qa.finished_at,
            rolledBackAt: migration11b4Qa.rolled_back_at,
          }
        : null,
      commercialCounts: counts.rows[0],
    };
  } finally {
    await client.end();
  }
}

function assertPostMigrateAudit(before, after, localMigrations, appliedPending) {
  const issues = [];
  if (after.instanceId !== before.instanceId) {
    issues.push("instanceId mudou após migrate");
  }
  if (after.hostHash !== EXPECTED_HOST_HASH) {
    issues.push(`hostHash pós ≠ ${EXPECTED_HOST_HASH}`);
  }
  if (!after.billingTablePresent) issues.push("tabela billing_request ausente");
  if (!after.receiptTablePresent) issues.push("tabela receipt_entry ausente");
  if (!after.requestedAmountColumnPresent) {
    issues.push("coluna requestedAmountCents ausente");
  }
  for (const name of [
    "BillingRequestStatus",
    "ReceiptKind",
    "ReceiptStatus",
  ]) {
    if (!after.financeEnums.includes(name)) {
      issues.push(`enum ausente: ${name}`);
    }
  }
  for (const name of appliedPending) {
    const row =
      name === MIGRATION_11B4 ? after.migration11b4 : after.migration11b4Qa;
    if (!row?.finishedAt) {
      issues.push(`${name} sem finished_at`);
    }
    if (row?.rolledBackAt) {
      issues.push(`${name} marcada como rolled_back`);
    }
  }
  if (after.foreignKeys.length < 4) {
    issues.push("FKs financeiras insuficientes");
  }
  if (after.idempotencyIndexes.length < 1) {
    issues.push("índices de idempotência ausentes");
  }

  const history = classifyMigrationHistory(after.migrationRows, localMigrations);
  if (history.pending.length > 0) {
    issues.push(`migrations pendentes após deploy: ${history.pending.join(",")}`);
  }
  if (history.failed.length > 0) {
    issues.push(
      `migrations falhas/incompletas: ${history.failed.map((row) => row.migration).join(",")}`,
    );
  }

  const beforeC = before.commercialCounts;
  const afterC = after.commercialCounts;
  for (const key of [
    "customers_total",
    "customers_active",
    "customers_archived",
    "proposals_active",
    "engagements_active",
    "service_orders_active",
    "users_total",
  ]) {
    if (Number(beforeC[key]) !== Number(afterC[key])) {
      issues.push(`contagem ${key} mudou: ${beforeC[key]} → ${afterC[key]}`);
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    countsBefore: beforeC,
    countsAfter: afterC,
    pendingAfter: history.pending,
    seedExecuted: false,
    grantsExecuted: false,
    foreignKeys: after.foreignKeys,
    idempotencyIndexes: after.idempotencyIndexes,
    appliedPending,
  };
}

const cliTarget = assertPrismaCliTargetsApprovedBank(env, url);
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

const expectedPending = expectedAuthorizedPending(
  classifyMigrationHistory(state.migrationRows, localMigrations).applied,
);

if (mode === "deploy") {
  const auth = assertDeployAuthorization(process.env, expectedPending);
  if (!auth.ok) blocked(auth.blockers.join("; "));
}

const report = {
  phase: mode === "plan" ? "plan-11b4-homol" : "deploy-11b4-homol",
  readOnly: mode === "plan",
  identity: {
    hostHash: targetHostHash,
    instanceId: state.instanceId,
    expectedInstanceId: EXPECTED_INSTANCE_ID,
    organizationSlug: state.organizationSlug,
    prismaCliHostHash: cliTarget.resolvedHostHash,
  },
  commercialCounts: state.commercialCounts,
  schemaProbe: {
    billingTablePresent: state.billingTablePresent,
    receiptTablePresent: state.receiptTablePresent,
    requestedAmountColumnPresent: state.requestedAmountColumnPresent,
    financeEnums: state.financeEnums,
    foreignKeys: state.foreignKeys,
    idempotencyIndexes: state.idempotencyIndexes,
    migration11b4: state.migration11b4,
    migration11b4Qa: state.migration11b4Qa,
  },
  evaluation,
  deployAuthorized: false,
  authorizedMigrations: AUTHORIZED_11B4_MIGRATIONS,
  expectedPending,
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
if (JSON.stringify(pendingBefore) !== JSON.stringify(expectedPending)) {
  blocked("pendentes divergem do conjunto autorizado", {
    pendingBefore,
    expectedPending,
  });
}
if (pendingBefore.length === 0) {
  blocked("nenhuma migration pendente para aplicar");
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
  blocked("migrate deploy falhou", {
    status: migrate.status,
    phase: "migrate-failed",
  });
}

let after;
try {
  after = await gatherState(url);
} catch (error) {
  auditFailed("falha ao auditar estado pós-migrate", {
    detail: error instanceof Error ? error.message : String(error),
  });
}

const audit = assertPostMigrateAudit(
  state,
  after,
  localMigrations,
  pendingBefore,
);
report.deployAuthorized = true;
report.appliedMigrations = pendingBefore;
report.postAudit = audit;
report.readOnly = false;
report.note = audit.ok
  ? "Migration(s) aplicada(s) e auditoria pós-migrate OK. Sem seed/grants/reset."
  : "Migration aparentemente aplicada, mas auditoria pós-migrate falhou.";

console.log(JSON.stringify(report, null, 2));
if (!audit.ok) {
  auditFailed(audit.issues.join("; "), { audit });
}
process.exit(0);
