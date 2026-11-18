/**
 * Sprint 11A: aplica migrations e seed SOMENTE no banco HOMOL de Preview.
 * Mesmo padrão do gate0-migrate-preview.mjs. Veja scripts/lib/homol-env.mjs para a
 * origem da URL e por que `.env.local` não serve.
 *
 * Uso: node scripts/preview-migrate.mjs [all|migrate|seed]
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { buildHomolEnv } from "./lib/homol-env.mjs";

const { env, targetHostHash } = buildHomolEnv();

console.log(JSON.stringify({ phase: "preflight", databaseEnv: "preview", targetHostHash }));

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: true, env, cwd: resolve(".") });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const mode = process.argv[2] ?? "all";
if (mode === "all" || mode === "migrate") run("npx", ["tsx", "scripts/run-prisma.ts", "migrate", "deploy"]);
if (mode === "all" || mode === "seed") run("npx", ["tsx", "prisma/seed.ts"]);

console.log(JSON.stringify({ phase: "done", databaseEnv: "preview", targetHostHash, mode }));
