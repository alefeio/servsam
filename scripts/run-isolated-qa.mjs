/**
 * Prepara banco descartável, aplica migrations, seed mínimo e roda testes.
 * Nunca aponta para HOMOL compartilhado.
 *
 * Uso: node scripts/run-isolated-qa.mjs [integration|e2e|all]
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import pg from "pg";

loadEnv({ path: ".env.local" });

function sha(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function run(command, args, env) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    cwd: resolve("."),
    env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function readIdentity(url) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const result = await client.query(`
      SELECT
        current_database() AS database,
        (SELECT system_identifier::text FROM pg_control_system()) AS system_identifier
    `);
    const database = result.rows[0].database;
    const systemIdentifier = result.rows[0].system_identifier;
    return {
      database,
      instanceId: sha(`${systemIdentifier}:${database}`),
      hostHash: sha(new URL(url).host),
    };
  } finally {
    await client.end();
  }
}

run("node", ["scripts/isolated-postgres.mjs", "up"], process.env);

const url = `postgresql://servsam:servsam_e2e_local@127.0.0.1:${process.env.E2E_PG_PORT || "55432"}/servsam_e2e`;
const identity = await readIdentity(url);

const env = {
  ...process.env,
  DATABASE_ENV: "test",
  E2E_ISOLATED_DATABASE_URL: url,
  E2E_ISOLATED_INSTANCE_ID: identity.instanceId,
  E2E_APPROVED_INSTANCE_ID: identity.instanceId,
  RUNTIME_DATABASE_URL: url,
  POSTGRES_URL: url,
  HOMOL_SHARED_HOST_HASH: "22e5c2dd2d93",
  HOMOL_POSTGRES_URL: "",
  HOMOL_DATABASE_URL: "",
  HOMOL_DATABASE_URL_POOLED: "",
  HOMOL_APPROVED_INSTANCE_ID: process.env.HOMOL_APPROVED_INSTANCE_ID || "",
  CI: "1",
  PORT: process.env.PORT || "3462",
};

console.log(
  JSON.stringify({
    phase: "isolated-ready",
    database: identity.database,
    hostHash: identity.hostHash,
    instanceId: identity.instanceId,
  }),
);

run("npx", ["tsx", "scripts/run-prisma.ts", "migrate", "deploy"], env);
run("npx", ["tsx", "prisma/seed.ts"], env);

const table = spawnSync(
  "node",
  [
    "-e",
    `import pg from "pg"; const c=new pg.Client({connectionString:process.env.E2E_ISOLATED_DATABASE_URL}); await c.connect(); const r=await c.query("select to_regclass('public.service_order') as reg"); console.log(JSON.stringify({serviceOrder:Boolean(r.rows[0].reg)})); await c.end();`,
  ],
  { encoding: "utf8", shell: true, env, cwd: resolve(".") },
);
if (table.status !== 0) {
  console.error(table.stderr || table.stdout);
  process.exit(table.status ?? 1);
}
console.log(table.stdout.trim());

const mode = process.argv[2] ?? "all";
if (mode === "integration" || mode === "all") {
  run(
    "npx",
    ["vitest", "run", "src/lib/platform/service-orders.integration.test.ts"],
    env,
  );
}
if (mode === "e2e" || mode === "all") {
  run("npm", ["run", "build"], env);
  run(
    "npx",
    ["playwright", "test", "e2e/sistema-11b2.spec.ts", "--project=chromium"],
    env,
  );
}

console.log(
  JSON.stringify({
    phase: "done",
    database: identity.database,
    hostHash: identity.hostHash,
    instanceId: identity.instanceId,
    migration11b2AppliedOnDisposable: true,
  }),
);
