/**
 * Preflight idempotente dos grants service_order.view|create|update no HOMOL.
 * Padrão: somente leitura. Escrita exige:
 *   CONFIRM=YES GRANT_AUTHORIZE=YES GRANT_ACTOR_EMAIL=<email>
 */
import pg from "pg";
import { buildHomolEnv } from "./lib/homol-env.mjs";

const TARGET_KEYS = [
  "service_order.view",
  "service_order.create",
  "service_order.update",
];
const ROLE_CODES = ["ADMINISTRATIVO", "GERENCIA", "FINANCEIRO", "DIRETORIA"];

const writeRequested =
  process.env.CONFIRM === "YES" &&
  process.env.GRANT_AUTHORIZE === "YES" &&
  Boolean(process.env.GRANT_ACTOR_EMAIL?.trim());

const { env, targetHostHash } = buildHomolEnv();
const client = new pg.Client({ connectionString: env.RUNTIME_DATABASE_URL });

await client.connect();
try {
  const org = await client.query(
    `SELECT id, slug FROM organization WHERE slug = 'servsam' LIMIT 1`,
  );
  if (org.rowCount !== 1) {
    console.error(JSON.stringify({ phase: "blocked", reason: "organization servsam missing" }));
    process.exit(1);
  }
  const organizationId = org.rows[0].id;

  const permissions = await client.query(
    `SELECT id, key FROM permission WHERE key = ANY($1::text[])`,
    [TARGET_KEYS],
  );
  const permissionByKey = new Map(permissions.rows.map((row) => [row.key, row]));

  const roles = await client.query(
    `SELECT id, code, name FROM role
     WHERE "organizationId" = $1 AND code = ANY($2::text[])`,
    [organizationId, ROLE_CODES],
  );

  const plan = [];
  for (const role of roles.rows) {
    for (const key of TARGET_KEYS) {
      const permission = permissionByKey.get(key);
      if (!permission) {
        plan.push({
          role: role.code,
          permission: key,
          action: "missing_permission_row",
          wouldGrant: true,
        });
        continue;
      }
      const existing = await client.query(
        `SELECT id FROM role_permission
         WHERE "roleId" = $1 AND "permissionId" = $2 LIMIT 1`,
        [role.id, permission.id],
      );
      plan.push({
        role: role.code,
        permission: key,
        action: existing.rowCount > 0 ? "already_granted" : "needs_grant",
        wouldGrant: existing.rowCount === 0,
        roleId: role.id,
        permissionId: permission.id,
      });
    }
  }

  const needsGrant = plan.filter((item) => item.action === "needs_grant");
  const report = {
    phase: "preflight-11b2-service-order-grants",
    databaseEnv: "preview",
    targetHostHash,
    organizationSlug: "servsam",
    writeRequested,
    writeExecuted: false,
    summary: {
      alreadyGranted: plan.filter((item) => item.action === "already_granted")
        .length,
      needsGrant: needsGrant.length,
      missingPermissionRow: plan.filter(
        (item) => item.action === "missing_permission_row",
      ).length,
    },
    plan: plan.map((item) => ({
      role: item.role,
      permission: item.permission,
      action: item.action,
      wouldGrant: item.wouldGrant,
    })),
    authorizationRequired:
      needsGrant.length > 0
        ? "CONFIRM=YES GRANT_AUTHORIZE=YES GRANT_ACTOR_EMAIL=<ator>"
        : null,
  };

  if (!writeRequested) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  console.error(
    JSON.stringify({
      phase: "blocked",
      reason:
        "Escrita de grants 11B.2 não executada neste fechamento — aguarde autorização explícita",
    }),
  );
  process.exit(2);
} finally {
  await client.end();
}
