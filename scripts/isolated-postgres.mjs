/**
 * Sobe PostgreSQL descartável local via Docker (sem custo adicional).
 * Uso:
 *   node scripts/isolated-postgres.mjs up
 *   node scripts/isolated-postgres.mjs env
 *   node scripts/isolated-postgres.mjs down
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import pg from "pg";

const CONTAINER = "servsam-e2e-pg";
const PORT = process.env.E2E_PG_PORT || "55432";
const USER = "servsam";
const PASSWORD = "servsam_e2e_local";
const DATABASE = "servsam_e2e";
const IMAGE = "postgres:16-alpine";

export function isolatedUrl() {
  return `postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DATABASE}`;
}

function sha(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    encoding: "utf8",
    shell: true,
    ...opts,
  });
  return result;
}

function dockerReady() {
  const result = run("docker", ["info"], { stdio: "pipe" });
  return result.status === 0;
}

async function waitHealthy(url, attempts = 90) {
  for (let i = 0; i < attempts; i += 1) {
    const client = new pg.Client({ connectionString: url });
    try {
      await client.connect();
      const identity = await client.query(`
        SELECT
          current_database() AS database,
          (SELECT system_identifier::text FROM pg_control_system()) AS system_identifier
      `);
      await client.end();
      const database = identity.rows[0].database;
      const systemIdentifier = identity.rows[0].system_identifier;
      return {
        url,
        database,
        hostHash: sha("127.0.0.1:" + PORT),
        instanceId: sha(`${systemIdentifier}:${database}`),
      };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("PostgreSQL isolado não ficou saudável a tempo");
}

async function up() {
  if (!dockerReady()) {
    console.error(
      JSON.stringify({
        ok: false,
        reason: "Docker daemon indisponível — inicie o Docker Desktop local",
      }),
    );
    process.exit(1);
  }

  const existing = run("docker", ["inspect", CONTAINER], { stdio: "pipe" });
  if (existing.status === 0) {
    run("docker", ["start", CONTAINER], { stdio: "inherit" });
  } else {
    const created = run(
      "docker",
      [
        "run",
        "-d",
        "--name",
        CONTAINER,
        "-e",
        `POSTGRES_USER=${USER}`,
        "-e",
        `POSTGRES_PASSWORD=${PASSWORD}`,
        "-e",
        `POSTGRES_DB=${DATABASE}`,
        "-p",
        `${PORT}:5432`,
        IMAGE,
      ],
      { stdio: "inherit" },
    );
    if (created.status !== 0) process.exit(created.status ?? 1);
  }

  const identity = await waitHealthy(isolatedUrl());
  console.log(
    JSON.stringify({
      ok: true,
      phase: "up",
      container: CONTAINER,
      port: PORT,
      database: identity.database,
      hostHash: identity.hostHash,
      instanceId: identity.instanceId,
      urlRedacted: `postgresql://${USER}:***@127.0.0.1:${PORT}/${DATABASE}`,
    }),
  );
}

function printEnv() {
  // Lê identidade se possível; senão só imprime URL template.
  console.log(`E2E_ISOLATED_DATABASE_URL=${isolatedUrl()}`);
  console.log(`DATABASE_ENV=test`);
  console.log(`RUNTIME_DATABASE_URL=${isolatedUrl()}`);
  console.log(`POSTGRES_URL=${isolatedUrl()}`);
}

function down() {
  run("docker", ["rm", "-f", CONTAINER], { stdio: "inherit" });
  console.log(JSON.stringify({ ok: true, phase: "down", container: CONTAINER }));
}

const cmd = process.argv[2] ?? "up";
if (cmd === "up") {
  await up();
} else if (cmd === "env") {
  printEnv();
} else if (cmd === "down") {
  down();
} else {
  console.error("Uso: node scripts/isolated-postgres.mjs [up|env|down]");
  process.exit(1);
}
