/**
 * Roda os testes de integração (arquivos *.integration.test.ts) contra o HOMOL de Preview.
 * Nunca contra `.env.local`/Production. Veja scripts/lib/homol-env.mjs.
 *
 * Uso: node scripts/preview-test.mjs [padrão-do-vitest]
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { buildHomolEnv } from "./lib/homol-env.mjs";

const { env, targetHostHash } = buildHomolEnv();
console.log(JSON.stringify({ phase: "preflight", databaseEnv: "preview", targetHostHash }));

const pattern = process.argv[2] ?? "integration";
const result = spawnSync("npx", ["vitest", "run", pattern], {
  stdio: "inherit",
  shell: true,
  env,
  cwd: resolve("."),
});
process.exit(result.status ?? 1);
