/**
 * Executor controlado — somente migration `20261124180000_employees_appointments`.
 *
 *   node scripts/homol-migrate-11b3.mjs plan
 *   CONFIRM=YES MIGRATION_11B3_AUTHORIZE=YES DATABASE_ENV=preview \
 *     HOMOL_APPROVED_INSTANCE_ID=0786bd682d75 \
 *     node scripts/homol-migrate-11b3.mjs deploy
 *
 * Nunca seed/reset/rollback/grants. Não executar deploy sem autorização explícita.
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import pg from "pg";
import { buildHomolEnv, parseEnvFile, HOMOL_ENV_FILE } from "./lib/homol-env.mjs";
import {
  MIGRATION_11B3,
  EXPECTED_HOST_HASH,
  EXPECTED_INSTANCE_ID,
  EXPECTED_ORG_SLUG,
  assertDeployAuthorization,
  computeInstanceId,
  defaultMigrationsDir,
  evaluateHomol11b3DeployPlan,
  hostHashFromUrl,
  listLocalMigrationNames,
  classifyMigrationHistory,
} from "./lib/homol-11b3-migrate-plan.mjs";

const mode = process.argv[2] ?? "plan";
if (mode !== "plan" && mode !== "deploy") {
  console.error(
    JSON.stringify({
      phase: "blocked",
      reason: "uso: node scripts/homol-migrate-11b3.mjs [plan|deploy]",
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
    JSON.stringify(
      { phase: "audit-failed", reason, migrationLikelyApplied: true, ...extra },
      null,
      2,
    ),
  );
  process.exit(3);
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

/**
 * Confirma que `getMigrationDatabaseUrl` (mesmo caminho da CLI Prisma via
 * scripts/run-prisma.ts) resolve o banco aprovado no preflight.
 * O probe imprime apenas hostHash — nunca a URL.
 */
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
      SELECT
        current_database() AS database,
        (SELECT system_identifier::text FROM pg_control_system()) AS system_identifier
    `);
    const database = String(identity.rows[0].database);
    const systemIdentifier = String(identity.rows[0].system_identifier);
    const instanceId = computeInstanceId(systemIdentifier, database);

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
        to_regclass('public.service_order') AS service_order,
        to_regclass('public.employee') AS employee,
        to_regclass('public.service_appointment') AS service_appointment
    `);

    const enumRow = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'ServiceAppointmentStatus'
      ) AS present
    `);

    const fks = await client.query(`
      SELECT c.conname
      FROM pg_constraint c
      WHERE c.contype = 'f'
        AND c.conrelid = ANY (ARRAY[
          to_regclass('public.employee'),
          to_regclass('public.service_appointment')
        ]::oid[])
      ORDER BY c.conname
    `);

    const uniquePartial = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = 'service_appointment_active_service_order_unique'
    `);

    const counts = await client.query(`
      SELECT
        (SELECT count(*)::int FROM customer) AS customers_total,
        (SELECT count(*)::int FROM customer WHERE "deletedAt" IS NULL) AS customers_active,
        (SELECT count(*)::int FROM customer WHERE "deletedAt" IS NOT NULL) AS customers_archived,
        (SELECT count(*)::int FROM proposal WHERE "deletedAt" IS NULL) AS proposals_active,
        (SELECT count(*)::int FROM engagement WHERE "deletedAt" IS NULL) AS engagements_active,
        (SELECT count(*)::int FROM service_order WHERE "deletedAt" IS NULL) AS service_orders_active
    `);

    let employeesTotal = null;
    let appointmentsTotal = null;
    if (tables.rows[0].employee) {
      const empCount = await client.query(
        `SELECT count(*)::int AS n FROM employee`,
      );
      employeesTotal = empCount.rows[0].n;
    }
    if (tables.rows[0].service_appointment) {
      const apptCount = await client.query(
        `SELECT count(*)::int AS n FROM service_appointment`,
      );
      appointmentsTotal = apptCount.rows[0].n;
    }

    const migration11b3 = migrations.rows.find(
      (row) => row.migration_name === MIGRATION_11B3,
    );

    return {
      instanceId,
      hostHash: hostHashFromUrl(connectionString),
      organizationSlug: org.rows[0]?.slug ?? null,
      migrationRows: migrations.rows,
      serviceOrderTablePresent: Boolean(tables.rows[0].service_order),
      employeeTablePresent: Boolean(tables.rows[0].employee),
      appointmentTablePresent: Boolean(tables.rows[0].service_appointment),
      appointmentStatusEnumPresent: Boolean(enumRow.rows[0]?.present),
      foreignKeys: fks.rows.map((row) => row.conname),
      uniquePartialIndex: uniquePartial.rows[0]
        ? {
            name: uniquePartial.rows[0].indexname,
            definition: uniquePartial.rows[0].indexdef,
          }
        : null,
      migration11b3: migration11b3
        ? {
            name: migration11b3.migration_name,
            finishedAt: migration11b3.finished_at,
            rolledBackAt: migration11b3.rolled_back_at,
          }
        : null,
      commercialCounts: {
        ...counts.rows[0],
        employees_total: employeesTotal,
        appointments_total: appointmentsTotal,
      },
    };
  } finally {
    await client.end();
  }
}

function assertPostMigrateAudit(before, after, localMigrations) {
  const issues = [];
  if (after.instanceId !== before.instanceId) {
    issues.push("instanceId mudou após migrate");
  }
  if (after.hostHash !== EXPECTED_HOST_HASH) {
    issues.push(`hostHash pós ≠ ${EXPECTED_HOST_HASH}`);
  }
  if (!after.employeeTablePresent) issues.push("tabela employee ausente");
  if (!after.appointmentTablePresent) {
    issues.push("tabela service_appointment ausente");
  }
  if (!after.appointmentStatusEnumPresent) {
    issues.push("enum ServiceAppointmentStatus ausente");
  }
  if (!after.migration11b3?.finishedAt) {
    issues.push(`${MIGRATION_11B3} sem finished_at em _prisma_migrations`);
  }
  if (after.migration11b3?.rolledBackAt) {
    issues.push(`${MIGRATION_11B3} marcada como rolled_back`);
  }
  const requiredFks = [
    "employee_organizationId_fkey",
    "service_appointment_organizationId_fkey",
    "service_appointment_serviceOrderId_fkey",
    "service_appointment_employeeId_fkey",
  ];
  for (const name of requiredFks) {
    if (!after.foreignKeys.includes(name)) issues.push(`FK ausente: ${name}`);
  }
  if (!after.uniquePartialIndex?.name) {
    issues.push("índice único parcial service_appointment_active_service_order_unique ausente");
  } else if (
    !String(after.uniquePartialIndex.definition).includes("scheduled") ||
    !String(after.uniquePartialIndex.definition).includes("deletedAt")
  ) {
    issues.push("definição do índice único parcial inesperada");
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
  const countKeys = [
    "customers_total",
    "customers_active",
    "customers_archived",
    "proposals_active",
    "engagements_active",
    "service_orders_active",
  ];
  for (const key of countKeys) {
    if (Number(beforeC[key]) !== Number(afterC[key])) {
      issues.push(`contagem ${key} mudou: ${beforeC[key]} → ${afterC[key]}`);
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    countsBefore: {
      customersTotal: beforeC.customers_total,
      customersActive: beforeC.customers_active,
      customersArchived: beforeC.customers_archived,
      proposalsActive: beforeC.proposals_active,
      engagementsActive: beforeC.engagements_active,
      serviceOrdersActive: beforeC.service_orders_active,
      employeesTotal: beforeC.employees_total,
      appointmentsTotal: beforeC.appointments_total,
    },
    countsAfter: {
      customersTotal: afterC.customers_total,
      customersActive: afterC.customers_active,
      customersArchived: afterC.customers_archived,
      proposalsActive: afterC.proposals_active,
      engagementsActive: afterC.engagements_active,
      serviceOrdersActive: afterC.service_orders_active,
      employeesTotal: afterC.employees_total,
      appointmentsTotal: afterC.appointments_total,
    },
    pendingAfter: history.pending,
    migration11b3: after.migration11b3,
    foreignKeys: after.foreignKeys,
    uniquePartialIndex: after.uniquePartialIndex,
  };
}

const cliTarget = assertPrismaCliTargetsApprovedBank(env, url);
const state = await gatherState(url);
const localMigrations = listLocalMigrationNames(defaultMigrationsDir());
const evaluation = evaluateHomol11b3DeployPlan({
  vercelEnv: process.env.VERCEL_ENV,
  databaseEnv: "preview",
  homolUrl: url,
  hostHash: targetHostHash,
  approvedInstanceId,
  liveInstanceId: state.instanceId,
  organizationSlug: state.organizationSlug,
  migrationRows: state.migrationRows,
  localMigrations,
  serviceOrderTablePresent: state.serviceOrderTablePresent,
  employeeTablePresent: state.employeeTablePresent,
  appointmentTablePresent: state.appointmentTablePresent,
});

const report = {
  phase: mode === "plan" ? "plan-11b3-homol" : "deploy-11b3-homol",
  readOnly: mode === "plan",
  identity: {
    hostHash: targetHostHash,
    instanceId: state.instanceId,
    expectedInstanceId: EXPECTED_INSTANCE_ID,
    organizationSlug: state.organizationSlug,
    prismaCliHostHash: cliTarget.resolvedHostHash,
  },
  commercialCounts: {
    customersTotal: state.commercialCounts.customers_total,
    customersActive: state.commercialCounts.customers_active,
    customersArchived: state.commercialCounts.customers_archived,
    proposalsActive: state.commercialCounts.proposals_active,
    engagementsActive: state.commercialCounts.engagements_active,
    serviceOrdersActive: state.commercialCounts.service_orders_active,
    employeesTotal: state.commercialCounts.employees_total,
    appointmentsTotal: state.commercialCounts.appointments_total,
  },
  schemaProbe: {
    employeeTablePresent: state.employeeTablePresent,
    appointmentTablePresent: state.appointmentTablePresent,
    appointmentStatusEnumPresent: state.appointmentStatusEnumPresent,
    foreignKeys: state.foreignKeys,
    uniquePartialIndex: state.uniquePartialIndex,
    migration11b3: state.migration11b3,
  },
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
if (pendingBefore.length !== 1 || pendingBefore[0] !== MIGRATION_11B3) {
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

const audit = assertPostMigrateAudit(state, after, localMigrations);
report.deployAuthorized = true;
report.appliedMigration = MIGRATION_11B3;
report.postAudit = audit;
report.readOnly = false;
report.note = audit.ok
  ? "Migration aplicada e auditoria pós-migrate OK. Sem seed/grants/reset."
  : "Migration aparentemente aplicada, mas auditoria pós-migrate falhou.";

console.log(JSON.stringify(report, null, 2));
if (!audit.ok) {
  auditFailed(audit.issues.join("; "), { audit });
}
process.exit(0);
