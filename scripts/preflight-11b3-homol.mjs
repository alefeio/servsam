/**
 * Gate 11B.3 — preflight somente leitura no HOMOL (não migra, não seed).
 *
 * Uso: node scripts/preflight-11b3-homol.mjs
 */
import { createHash } from "node:crypto";
import pg from "pg";
import { buildHomolEnv } from "./lib/homol-env.mjs";

function sha(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

const EXPECTED_HOST_HASH = "22e5c2dd2d93";
const EXPECTED_INSTANCE_ID = "0786bd682d75";
const MIGRATION_11B2 = "20261124010000_service_orders";
const MIGRATION_11B3 = "20261124180000_employees_appointments";

const SCHEDULE_KEYS = [
  "employee.view",
  "employee.manage",
  "schedule.view",
  "schedule.create",
  "schedule.update",
];

const { env, targetHostHash } = buildHomolEnv();
const url = env.RUNTIME_DATABASE_URL || env.HOMOL_POSTGRES_URL;
if (!url) {
  console.error(JSON.stringify({ ok: false, reason: "URL HOMOL ausente" }));
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  const identity = await client.query(`
    SELECT
      current_database() AS database,
      inet_server_addr()::text AS server_addr,
      (SELECT system_identifier::text FROM pg_control_system()) AS system_identifier
  `);
  const database = identity.rows[0].database;
  const systemIdentifier = identity.rows[0].system_identifier;
  const instanceId = sha(`${systemIdentifier}:${database}`);

  const org = await client.query(`
    SELECT id, name, slug FROM organization WHERE slug = 'servsam' LIMIT 1
  `);

  const migrations = await client.query(`
    SELECT migration_name, finished_at
    FROM "_prisma_migrations"
    WHERE rolled_back_at IS NULL
    ORDER BY finished_at ASC NULLS LAST, migration_name ASC
  `);
  const names = migrations.rows.map((row) => row.migration_name);

  const tableChecks = {};
  for (const table of [
    "customer",
    "proposal",
    "engagement",
    "service_order",
    "employee",
    "service_appointment",
  ]) {
    const result = await client.query(`SELECT to_regclass($1) AS reg`, [
      `public.${table}`,
    ]);
    tableChecks[table] = Boolean(result.rows[0]?.reg);
  }

  const counts = {};
  for (const [key, sql] of Object.entries({
    customers: `SELECT count(*)::int AS n FROM customer WHERE "deletedAt" IS NULL`,
    proposals: `SELECT count(*)::int AS n FROM proposal WHERE "deletedAt" IS NULL`,
    engagements: `SELECT count(*)::int AS n FROM engagement WHERE "deletedAt" IS NULL`,
    serviceOrders: `SELECT count(*)::int AS n FROM service_order WHERE "deletedAt" IS NULL`,
    users: `SELECT count(*)::int AS n FROM "user" WHERE "isActive" = true`,
    auditLogs: `SELECT count(*)::int AS n FROM "audit_log"`,
  })) {
    if (
      (key === "customers" && !tableChecks.customer) ||
      (key === "proposals" && !tableChecks.proposal) ||
      (key === "engagements" && !tableChecks.engagement) ||
      (key === "serviceOrders" && !tableChecks.service_order)
    ) {
      counts[key] = null;
      continue;
    }
    const result = await client.query(sql);
    counts[key] = result.rows[0].n;
  }

  const grants = await client.query(
    `
    SELECT r.code AS role_code, p.key AS permission_key
    FROM role_permission rp
    JOIN role r ON r.id = rp."roleId"
    JOIN permission p ON p.id = rp."permissionId"
    WHERE p.key = ANY($1::text[])
    ORDER BY r.code, p.key
  `,
    [SCHEDULE_KEYS],
  );

  const byRole = {};
  for (const row of grants.rows) {
    byRole[row.role_code] ??= [];
    byRole[row.role_code].push(row.permission_key);
  }

  const missingByRole = {};
  for (const role of ["ADMINISTRATIVO", "GERENCIA", "DIRETORIA", "FINANCEIRO"]) {
    const have = new Set(byRole[role] ?? []);
    missingByRole[role] = SCHEDULE_KEYS.filter((key) => !have.has(key));
  }

  const hostOk = targetHostHash === EXPECTED_HOST_HASH;
  const instanceOk = instanceId === EXPECTED_INSTANCE_ID;
  const has11b2 = names.includes(MIGRATION_11B2);
  const has11b3 = names.includes(MIGRATION_11B3);

  const report = {
    phase: "preflight-11b3-homol",
    readOnly: true,
    databaseEnv: "preview",
    targetHostHash,
    identity: {
      database,
      hostHash: targetHostHash,
      hostHashMatches: hostOk,
      instanceId,
      instanceIdMatches: instanceOk,
      organization: org.rows[0] ?? null,
    },
    migrations: {
      totalApplied: names.length,
      sampleRecent: names.slice(-8),
      migration11b2Recorded: has11b2,
      migration11b3Recorded: has11b3,
      migration11b3Pending: !has11b3,
    },
    tables: tableChecks,
    commercialCounts: counts,
    grants: {
      keysChecked: SCHEDULE_KEYS,
      byRole,
      missingByRole,
      note:
        "Não executar seed para corrigir grants. Preparar procedimento idempotente separado se faltar chave.",
    },
    additiveCompatibility: {
      ok:
        tableChecks.service_order &&
        !tableChecks.employee &&
        !tableChecks.service_appointment,
      note: "11B.3 é aditiva: cria employee + service_appointment sem alterar 11B.2.",
    },
    deployAuthorized: false,
    note: "Somente leitura. Não migrar HOMOL nesta entrega.",
  };

  console.log(JSON.stringify(report, null, 2));
  const ok =
    hostOk &&
    instanceOk &&
    has11b2 &&
    !has11b3 &&
    report.additiveCompatibility.ok &&
    Boolean(org.rows[0]);
  process.exit(ok ? 0 : 2);
} finally {
  await client.end();
}
