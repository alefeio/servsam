/**
 * Preflight idempotente dos grants contract.view / contract.manage no HOMOL.
 * Padrão: somente leitura. Escrita exige:
 *   CONFIRM=YES GRANT_AUTHORIZE=YES GRANT_ACTOR_EMAIL=<email>
 *
 * Não recria papéis, não altera usuários, não revoga grants existentes.
 *
 * Uso:
 *   node scripts/preflight-11b1-contract-grants.mjs
 *   CONFIRM=YES GRANT_AUTHORIZE=YES GRANT_ACTOR_EMAIL=... node scripts/preflight-11b1-contract-grants.mjs
 */
import pg from "pg";
import { buildHomolEnv } from "./lib/homol-env.mjs";

const TARGET_KEYS = ["contract.view", "contract.manage"];
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
          wouldCreatePermission: true,
          wouldGrant: true,
        });
        continue;
      }
      const existing = await client.query(
        `SELECT id FROM role_permission
         WHERE "roleId" = $1 AND "permissionId" = $2
         LIMIT 1`,
        [role.id, permission.id],
      );
      if (existing.rowCount > 0) {
        plan.push({
          role: role.code,
          permission: key,
          action: "already_granted",
          wouldCreatePermission: false,
          wouldGrant: false,
        });
      } else {
        plan.push({
          role: role.code,
          permission: key,
          action: "needs_grant",
          wouldCreatePermission: false,
          wouldGrant: true,
          roleId: role.id,
          permissionId: permission.id,
        });
      }
    }
  }

  const missingPermissionRows = TARGET_KEYS.filter((key) => !permissionByKey.has(key));
  const needsGrant = plan.filter((item) => item.action === "needs_grant");
  const report = {
    phase: "preflight-11b1-contract-grants",
    databaseEnv: "preview",
    targetHostHash,
    organizationSlug: "servsam",
    writeRequested,
    writeExecuted: false,
    missingPermissionRows,
    summary: {
      alreadyGranted: plan.filter((item) => item.action === "already_granted").length,
      needsGrant: needsGrant.length,
      missingPermissionRow: plan.filter((item) => item.action === "missing_permission_row")
        .length,
    },
    plan: plan.map(({ roleId, permissionId, ...rest }) => rest),
    authorizationRequired:
      needsGrant.length > 0 || missingPermissionRows.length > 0
        ? "CONFIRM=YES GRANT_AUTHORIZE=YES GRANT_ACTOR_EMAIL=<ator> para aplicar grants faltantes"
        : null,
  };

  if (!writeRequested) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  // Escrita controlada — só cria permission/grant faltantes.
  const actorEmail = process.env.GRANT_ACTOR_EMAIL.trim().toLowerCase();
  const actor = await client.query(
    `SELECT id, email FROM "user"
     WHERE lower(email) = $1 AND "organizationId" = $2 AND "isActive" = true
     LIMIT 1`,
    [actorEmail, organizationId],
  );
  if (actor.rowCount !== 1) {
    console.error(
      JSON.stringify({
        phase: "blocked",
        reason: "GRANT_ACTOR_EMAIL not an active user in servsam",
      }),
    );
    process.exit(1);
  }

  await client.query("BEGIN");
  try {
    for (const key of missingPermissionRows) {
      const id = crypto.randomUUID();
      const description =
        key === "contract.view"
          ? "Ver contratos"
          : "Criar e alterar contratos";
      await client.query(
        `INSERT INTO permission (id, key, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO NOTHING`,
        [id, key, description],
      );
    }
    const refreshed = await client.query(
      `SELECT id, key FROM permission WHERE key = ANY($1::text[])`,
      [TARGET_KEYS],
    );
    const refreshedMap = new Map(refreshed.rows.map((row) => [row.key, row]));

    let granted = 0;
    for (const item of needsGrant) {
      const permission = refreshedMap.get(item.permission);
      const role = roles.rows.find((row) => row.code === item.role);
      if (!permission || !role) continue;
      const id = crypto.randomUUID();
      const inserted = await client.query(
        `INSERT INTO role_permission (id, "roleId", "permissionId")
         SELECT $1, $2, $3
         WHERE NOT EXISTS (
           SELECT 1 FROM role_permission
           WHERE "roleId" = $2 AND "permissionId" = $3
         )
         RETURNING id`,
        [id, role.id, permission.id],
      );
      if (inserted.rowCount > 0) {
        granted += 1;
        await client.query(
          `INSERT INTO audit_log (id, "organizationId", "actorUserId", action, "entityType", "entityId", metadata, "createdAt")
           VALUES ($1, $2, $3, 'PERMISSION_GRANTED', 'RolePermission', $4, $5::jsonb, NOW())`,
          [
            crypto.randomUUID(),
            organizationId,
            actor.rows[0].id,
            role.id,
            JSON.stringify({
              permission: item.permission,
              basis: "11b1-preflight",
              source: "preflight-11b1-contract-grants",
            }),
          ],
        );
      }
    }
    await client.query("COMMIT");
    report.writeExecuted = true;
    report.grantedNow = granted;
    report.actorEmail = actorEmail;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }

  console.log(JSON.stringify(report, null, 2));
} finally {
  await client.end();
}
