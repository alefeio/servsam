/**
 * E2E de /sistema.
 *
 * - Specs de autenticação/leitura podem usar Preview/HOMOL.
 * - Specs de escrita 11B (`sistema-11b1`, `sistema-11b2`) exigem banco isolado
 *   (DATABASE_ENV=test + E2E_ISOLATED_*). Sem isso, o Playwright faz skip.
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
    note: "specs de escrita 11B exigem banco isolado; caso contrário skip",
  }),
);

const targets = process.argv.slice(2);
const files =
  targets.length > 0
    ? targets
    : [
        "e2e/production-auth.spec.ts",
        "e2e/password-recovery.spec.ts",
        // sistema-core e 11b* escrevem dados: só seguros com banco isolado.
        // Mantidos na lista para evidenciar skip consciente no Gate 0.
        "e2e/sistema-core.spec.ts",
        "e2e/sistema-11b1.spec.ts",
        "e2e/sistema-11b2.spec.ts",
      ];

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
