/**
 * Gate F — preflight somente leitura no HOMOL (não migra).
 * Confirma migrations 11A/11B.1, pendência 11B.2, identidade, grants e tabelas.
 *
 * Uso: node scripts/preflight-11b2-qa-homol.mjs
 */
import { createHash } from "node:crypto";
import pg from "pg";
import { buildHomolEnv } from "./lib/homol-env.mjs";

function sha(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

const MIGRATION_11B2 = "20261124010000_service_orders";

const TABLES_11A = ["customer", "proposal", "proposal_item"];
const TABLES_11B1 = ["engagement", "engagement_item", "received_purchase_order"];

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

  const migrations = await client.query(`
    SELECT migration_name, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    WHERE rolled_back_at IS NULL
    ORDER BY finished_at ASC NULLS LAST, migration_name ASC
  `);

  const names = migrations.rows.map((row) => row.migration_name);
  const has11b2 = names.includes(MIGRATION_11B2);

  const tableChecks = {};
  for (const table of [...TABLES_11A, ...TABLES_11B1, "service_order"]) {
    const result = await client.query(
      `SELECT to_regclass($1) AS reg`,
      [`public.${table}`],
    );
    tableChecks[table] = Boolean(result.rows[0]?.reg);
  }

  const grants = await client.query(`
    SELECT r.code AS role_code, p.key AS permission_key
    FROM role_permission rp
    JOIN role r ON r.id = rp."roleId"
    JOIN permission p ON p.id = rp."permissionId"
    WHERE p.key IN ('service_order.view', 'service_order.create', 'service_order.update')
    ORDER BY r.code, p.key
  `);

  const grantKeys = new Set(grants.rows.map((row) => row.permission_key));
  const additiveSafe =
    !tableChecks.service_order &&
    tableChecks.customer &&
    tableChecks.proposal &&
    tableChecks.engagement;

  const report = {
    phase: "preflight-11b2-qa-homol",
    readOnly: true,
    databaseEnv: "preview",
    targetHostHash,
    identity: {
      database,
      hostHash: targetHostHash,
      instanceId,
      serverAddrPresent: Boolean(identity.rows[0].server_addr),
    },
    migrations: {
      totalApplied: names.length,
      sampleRecent: names.slice(-8),
      migration11b2Recorded: has11b2,
      migration11b2Pending: !has11b2,
    },
    tables: tableChecks,
    integrity: {
      core11aPresent: TABLES_11A.every((t) => tableChecks[t]),
      core11b1Present: TABLES_11B1.every((t) => tableChecks[t]),
      serviceOrderAbsentAsExpected: !tableChecks.service_order,
    },
    grants: {
      rows: grants.rows,
      hasView: grantKeys.has("service_order.view"),
      hasCreate: grantKeys.has("service_order.create"),
      hasUpdate: grantKeys.has("service_order.update"),
    },
    additiveCompatibility: {
      ok: additiveSafe,
      note: additiveSafe
        ? "Migration 11B.2 é aditiva (cria service_order sem alterar tabelas 11A/11B.1)."
        : "Revisar estado: service_order já existe ou core ausente.",
    },
    deployAuthorized: false,
    deployCommandDocumented:
      "CONFIRM=YES MIGRATION_11B2_AUTHORIZE=YES DATABASE_ENV=preview HOMOL_APPROVED_INSTANCE_ID=0786bd682d75 node scripts/homol-migrate-11b2.mjs deploy",
    note: "Usar scripts/homol-migrate-11b2.mjs (nunca preview-migrate sem subcomando / sem seed).",
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(additiveSafe && report.integrity.core11aPresent && report.integrity.core11b1Present ? 0 : 2);
} finally {
  await client.end();
}
