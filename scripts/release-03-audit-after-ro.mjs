/**
 * Auditoria RO pós-provisionamento RELEASE-03.
 */
import { writeFileSync } from "node:fs";
import pg from "pg";
import { createHash } from "node:crypto";
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

const TARGET = [
  "diretoria@servsam.com",
  "administrativo@servsam.com",
  "financeiro@servsam.com",
];
const sha = (v) => createHash("sha256").update(String(v)).digest("hex").slice(0, 12);

const { env, targetHostHash } = buildHomolEnv();
const client = new pg.Client({
  connectionString: env.POSTGRES_URL || env.RUNTIME_DATABASE_URL,
});
await client.connect();
try {
  const id = await client.query(`
    SELECT current_database() AS database,
           (SELECT system_identifier::text FROM pg_control_system()) AS sid
  `);
  const database = String(id.rows[0].database);
  const instanceId = computeInstanceId(String(id.rows[0].sid), database);
  const migrations = await client.query(`
    SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"
    ORDER BY finished_at ASC NULLS LAST, migration_name ASC
  `);
  const history = classifyMigrationHistory(
    migrations.rows,
    listLocalMigrationNames(defaultMigrationsDir()),
  );
  const counts = await client.query(`
    SELECT
      (SELECT count(*)::int FROM customer) AS customers_total,
      (SELECT count(*)::int FROM customer WHERE "deletedAt" IS NULL) AS customers_active,
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
  const pilots = await client.query(
    `SELECT u.email, u.name, u."isActive",
            coalesce(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles,
            EXISTS (
              SELECT 1 FROM account a
              WHERE a."userId" = u.id AND a."providerId" = 'credential' AND a.password IS NOT NULL
            ) AS has_credential
     FROM "user" u
     LEFT JOIN user_role ur ON ur."userId" = u.id
     LEFT JOIN role r ON r.id = ur."roleId"
     WHERE lower(u.email) = ANY($1::text[])
     GROUP BY u.id
     ORDER BY u.email`,
    [TARGET],
  );
  const preexisting = await client.query(`
    SELECT split_part(u.email,'@',2) AS domain,
           CASE WHEN split_part(u.email,'@',2)='gmail.com' THEN '[redacted-operator]' ELSE u.name END AS name,
           u."isActive",
           coalesce(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
    FROM "user" u
    LEFT JOIN user_role ur ON ur."userId" = u.id
    LEFT JOIN role r ON r.id = ur."roleId"
    WHERE lower(u.email) NOT IN ('diretoria@servsam.com','administrativo@servsam.com','financeiro@servsam.com')
    GROUP BY u.id
    ORDER BY u."createdAt"
  `);
  const grants = await client.query(`
    SELECT r.code AS role, count(*)::int AS permission_count
    FROM role r
    JOIN role_permission rp ON rp."roleId" = r.id
    WHERE r.code IN ('ADMINISTRATIVO','GERENCIA','FINANCEIRO','DIRETORIA')
    GROUP BY r.code
    ORDER BY r.code
  `);
  const audits = await client.query(`
    SELECT action, count(*)::int AS n
    FROM audit_log
    WHERE action IN ('USER_CREATED','ROLE_ASSIGNED')
      AND "createdAt" > NOW() - interval '2 hours'
    GROUP BY action
  `);
  const grantKeys = await client.query(`
    SELECT r.code AS role, p.key
    FROM role r
    JOIN role_permission rp ON rp."roleId" = r.id
    JOIN permission p ON p.id = rp."permissionId"
    WHERE r.code IN ('ADMINISTRATIVO','FINANCEIRO')
      AND p.key IN ('finance.manage','finance.view','employee.manage','user.manage','role.manage')
    ORDER BY r.code, p.key
  `);

  const report = {
    phase: "release-03-audit-after-ro",
    readOnly: true,
    capturedAt: new Date().toISOString(),
    identity: {
      hostHash: targetHostHash,
      hostOk: targetHostHash === EXPECTED_HOST_HASH,
      database,
      instanceId,
      instanceOk: instanceId === EXPECTED_INSTANCE_ID,
    },
    migrations: {
      total: history.applied.length,
      pending: history.pending,
      failed: history.failed,
    },
    counts: counts.rows[0],
    pilots: pilots.rows.map((p) => ({
      email: p.email,
      name: p.name,
      isActive: p.isActive,
      roles: p.roles,
      hasCredential: p.has_credential,
      emailHash: sha(p.email),
    })),
    preexistingUsers: preexisting.rows,
    grantCounts: grants.rows,
    sensitiveGrantSample: grantKeys.rows,
    recentProvisionAudits: audits.rows,
    checks: {
      usersNow5: counts.rows[0].users_total === 5,
      threePilots: pilots.rows.length === 3,
      rolesExact: pilots.rows.every((p) => {
        const expected = {
          "diretoria@servsam.com": "DIRETORIA",
          "administrativo@servsam.com": "ADMINISTRATIVO",
          "financeiro@servsam.com": "FINANCEIRO",
        }[p.email];
        return p.roles.length === 1 && p.roles[0] === expected && p.isActive && p.has_credential;
      }),
      adminNoFinanceManage: !grantKeys.rows.some(
        (r) => r.role === "ADMINISTRATIVO" && r.key === "finance.manage",
      ),
      adminNoEmployeeManage: !grantKeys.rows.some(
        (r) => r.role === "ADMINISTRATIVO" && r.key === "employee.manage",
      ),
      financeiroHasFinanceManage: grantKeys.rows.some(
        (r) => r.role === "FINANCEIRO" && r.key === "finance.manage",
      ),
      financeiroNoUserManage: !grantKeys.rows.some(
        (r) => r.role === "FINANCEIRO" && r.key === "user.manage",
      ),
      businessUnchangedHint:
        counts.rows[0].customers_total === 30 &&
        counts.rows[0].proposals_active === 23 &&
        counts.rows[0].engagements_active === 9 &&
        counts.rows[0].billing_requests === 1 &&
        counts.rows[0].receipt_entries === 1,
    },
  };
  report.ok = Object.values(report.checks).every(Boolean);
  writeFileSync(
    "docs/release/release-03-audit-after.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 2);
} finally {
  await client.end();
}
