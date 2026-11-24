/**
 * E2E de /sistema.
 *
 * - Specs de autenticação/leitura podem usar Preview/HOMOL.
 * - Specs de escrita (`sistema-core`, `sistema-11b1`, `sistema-11b2`)
 *   exigem banco isolado via `scripts/run-isolated-qa.mjs`.
 *   Aqui eles são omitidos por padrão para não escrever no HOMOL.
 *
 * Uso: node scripts/preview-e2e.mjs [arquivos...]
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { buildHomolEnv } from "./lib/homol-env.mjs";

const { env, targetHostHash } = buildHomolEnv();
console.log(
  JSON.stringify({
    phase: "preflight",
    databaseEnv: "preview",
    targetHostHash,
    note: "specs de escrita 11B omitidos — use run-isolated-qa.mjs",
  }),
);

const targets = process.argv.slice(2);
const files =
  targets.length > 0
    ? targets
    : ["e2e/production-auth.spec.ts", "e2e/password-recovery.spec.ts"];

const result = spawnSync(
  "npx",
  ["playwright", "test", ...files, "--project=chromium"],
  {
    stdio: "inherit",
    shell: true,
    env: { ...env, CI: "1", PORT: process.env.PORT || "3461" },
    cwd: resolve("."),
  },
);
process.exit(result.status ?? 1);
