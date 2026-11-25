/**
 * Preflight + plano idempotente: conceder `employee.manage` ao papel ADMINISTRATIVO.
 * Não concede a FINANCEIRO. Não executa escrita sem AUTHORIZE.
 *
 *   node scripts/homol-grant-employee-manage-admin.mjs plan
 *   CONFIRM=YES GRANT_EMPLOYEE_MANAGE_ADMIN_AUTHORIZE=YES DATABASE_ENV=preview \
 *     HOMOL_APPROVED_INSTANCE_ID=0786bd682d75 \
 *     node scripts/homol-grant-employee-manage-admin.mjs apply
 */
import pg from "pg";
import { buildHomolEnv, parseEnvFile, HOMOL_ENV_FILE } from "./lib/homol-env.mjs";
import {
  EXPECTED_HOST_HASH,
  EXPECTED_INSTANCE_ID,
  EXPECTED_ORG_SLUG,
  computeInstanceId,
  hostHashFromUrl,
} from "./lib/homol-11b3-migrate-plan.mjs";

const mode = process.argv[2] ?? "plan";
const PERMISSION_KEY = "employee.manage";
const ROLE_CODE = "ADMINISTRATIVO";

function blocked(reason, extra = {}) {
  console.error(JSON.stringify({ phase: "blocked", reason, ...extra }, null, 2));
  process.exit(1);
}

if (mode !== "plan" && mode !== "apply") {
  blocked("uso: node scripts/homol-grant-employee-manage-admin.mjs [plan|apply]");
}

if (mode === "apply") {
  if (process.env.CONFIRM !== "YES") blocked("CONFIRM=YES obrigatório");
  if (process.env.GRANT_EMPLOYEE_MANAGE_ADMIN_AUTHORIZE !== "YES") {
    blocked("GRANT_EMPLOYEE_MANAGE_ADMIN_AUTHORIZE=YES obrigatório");
  }
}

if (process.env.DATABASE_ENV?.trim().toLowerCase() !== "preview") {
  blocked("DATABASE_ENV=preview obrigatório");
}
if (process.env.VERCEL_ENV === "production") blocked("VERCEL_ENV=production");

const { env, targetHostHash } = buildHomolEnv();
if (targetHostHash !== EXPECTED_HOST_HASH) {
  blocked(`hostHash ${targetHostHash} ≠ ${EXPECTED_HOST_HASH}`);
}

const gate0 = parseEnvFile(HOMOL_ENV_FILE);
const approved =
  process.env.HOMOL_APPROVED_INSTANCE_ID?.trim() ||
  gate0.HOMOL_APPROVED_INSTANCE_ID?.trim() ||
  "";
if (approved !== EXPECTED_INSTANCE_ID) {
  blocked("HOMOL_APPROVED_INSTANCE_ID inválido");
}

const url = env.POSTGRES_URL || env.RUNTIME_DATABASE_URL;
if (!url) blocked("URL HOMOL ausente");

const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  const identity = await client.query(`
    SELECT
      current_database() AS database,
      (SELECT system_identifier::text FROM pg_control_system()) AS system_identifier
  `);
  const instanceId = computeInstanceId(
    identity.rows[0].system_identifier,
    identity.rows[0].database,
  );
  if (instanceId !== EXPECTED_INSTANCE_ID) {
    blocked(`instanceId ${instanceId} ≠ ${EXPECTED_INSTANCE_ID}`);
  }

  const org = await client.query(
    `SELECT id, slug FROM organization WHERE slug = $1 LIMIT 1`,
    [EXPECTED_ORG_SLUG],
  );
  if (!org.rows[0]) blocked("organização servsam ausente");

  const role = await client.query(
    `SELECT id, code FROM role WHERE "organizationId" = $1 AND code = $2 LIMIT 1`,
    [org.rows[0].id, ROLE_CODE],
  );
  const permission = await client.query(
    `SELECT id, key FROM permission WHERE key = $1 LIMIT 1`,
    [PERMISSION_KEY],
  );

  if (!role.rows[0]) blocked("papel ADMINISTRATIVO ausente");
  if (!permission.rows[0]) blocked("permission employee.manage ausente");

  const existing = await client.query(
    `SELECT id FROM role_permission WHERE "roleId" = $1 AND "permissionId" = $2 LIMIT 1`,
    [role.rows[0].id, permission.rows[0].id],
  );

  const financeiro = await client.query(
    `
    SELECT 1
    FROM role_permission rp
    JOIN role r ON r.id = rp."roleId"
    JOIN permission p ON p.id = rp."permissionId"
    WHERE r."organizationId" = $1 AND r.code = 'FINANCEIRO' AND p.key = $2
    LIMIT 1
  `,
    [org.rows[0].id, PERMISSION_KEY],
  );

  const report = {
    phase: mode === "plan" ? "plan-grant-employee-manage-admin" : "apply-grant",
    readOnly: mode === "plan",
    identity: {
      hostHash: hostHashFromUrl(url),
      instanceId,
      organizationId: org.rows[0].id,
    },
    grant: {
      role: ROLE_CODE,
      permission: PERMISSION_KEY,
      alreadyPresent: existing.rows.length > 0,
      financeHasEmployeeManage: financeiro.rows.length > 0,
      willGrantFinanceiro: false,
      note: "FINANCEIRO permanece sem employee.manage por decisão de acesso.",
    },
    writeAuthorized: false,
  };

  if (mode === "plan") {
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  // apply bloqueado nesta etapa de aceite — exige nova autorização explícita do operador.
  blocked(
    "Escrita de grant bloqueada nesta entrega de aceite. Reexecute com autorização após revisão.",
    { report },
  );
} finally {
  await client.end();
}
