/**
 * Gate 0: migrate + seed only the Preview HOMOL database.
 * Never prints connection strings or seed credentials.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

function parseEnvFile(path) {
  const map = {};
  if (!existsSync(path)) return map;
  for (const line of readFileSync(path, "utf8").split(/\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    let value = match[2] ?? "";
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map[match[1]] = value.replace(/\\n/g, "\n");
  }
  return map;
}

function sha(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return "invalid";
  }
}

const previewEnv = parseEnvFile(".env.gate0.preview.local");
const localEnv = parseEnvFile(".env.local");

const env = {
  ...process.env,
  ...previewEnv,
  ...localEnv,
  DATABASE_ENV: "preview",
  // Prefer HOMOL for both roles; strip shared placeholders that are [SENSITIVE]
  RUNTIME_DATABASE_URL:
    previewEnv.HOMOL_DATABASE_URL_POOLED ||
    previewEnv.HOMOL_DATABASE_URL ||
    previewEnv.HOMOL_POSTGRES_URL,
  POSTGRES_URL: previewEnv.HOMOL_POSTGRES_URL || previewEnv.HOMOL_DATABASE_URL,
};

if (!env.POSTGRES_URL || env.POSTGRES_URL.includes("[SENSITIVE]")) {
  console.error("Gate0 migrate blocked: HOMOL_POSTGRES_URL missing");
  process.exit(1);
}

if (env.VERCEL_ENV === "production") {
  console.error("Gate0 migrate blocked: VERCEL_ENV=production");
  process.exit(1);
}

console.log(
  JSON.stringify({
    phase: "preflight",
    databaseEnv: env.DATABASE_ENV,
    targetHostHash: sha(hostOf(env.POSTGRES_URL)),
    hasSeedEmail: Boolean(env.SEED_ADMIN_EMAIL),
    hasSeedPassword: Boolean(env.SEED_ADMIN_PASSWORD),
  }),
);

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    env,
    cwd: resolve("."),
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npx", ["tsx", "scripts/run-prisma.ts", "migrate", "deploy"]);
run("npx", ["tsx", "prisma/seed.ts"]);

console.log(
  JSON.stringify({
    phase: "done",
    databaseEnv: "preview",
    targetHostHash: sha(hostOf(env.POSTGRES_URL)),
    migrated: true,
    seeded: true,
  }),
);

try {
  unlinkSync(".env.gate0.preview.local");
} catch {
  /* ignore */
}
