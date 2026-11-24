/**
 * Sprint 11A: aplica migrations e/ou seed no HOMOL de Preview.
 * Exige subcomando explícito — sem argumento, bloqueia (evita migrate+seed acidental).
 *
 * Para a migration 11B.2 (`service_orders`), use o executor dedicado:
 *   node scripts/homol-migrate-11b2.mjs plan|deploy
 *
 * Uso: node scripts/preview-migrate.mjs [migrate|seed|all]
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { buildHomolEnv } from "./lib/homol-env.mjs";

const mode = process.argv[2];
if (mode !== "migrate" && mode !== "seed" && mode !== "all") {
  console.error(
    JSON.stringify({
      phase: "blocked",
      reason:
        "preview-migrate.mjs exige subcomando migrate|seed|all. Para 11B.2 use scripts/homol-migrate-11b2.mjs",
    }),
  );
  process.exit(1);
}

const { env, targetHostHash } = buildHomolEnv();

console.log(JSON.stringify({ phase: "preflight", databaseEnv: "preview", targetHostHash, mode }));

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: true, env, cwd: resolve(".") });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (mode === "all" || mode === "migrate") run("npx", ["tsx", "scripts/run-prisma.ts", "migrate", "deploy"]);
if (mode === "all" || mode === "seed") run("npx", ["tsx", "prisma/seed.ts"]);

console.log(JSON.stringify({ phase: "done", databaseEnv: "preview", targetHostHash, mode }));

