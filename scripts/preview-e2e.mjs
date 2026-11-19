/**
 * Roda os testes e2e de /sistema contra o HOMOL de Preview (servidor dev local com URL HOMOL).
 * Veja scripts/lib/homol-env.mjs. Uso: node scripts/preview-e2e.mjs [arquivos...]
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { buildHomolEnv } from "./lib/homol-env.mjs";

const { env, targetHostHash } = buildHomolEnv();
console.log(JSON.stringify({ phase: "preflight", databaseEnv: "preview", targetHostHash }));

const targets = process.argv.slice(2);
const files =
  targets.length > 0
    ? targets
    : [
        "e2e/production-auth.spec.ts",
        "e2e/sistema-core.spec.ts",
        "e2e/password-recovery.spec.ts",
      ];
const result = spawnSync("npx", ["playwright", "test", ...files, "--project=chromium"], {
  stdio: "inherit",
  shell: true,
  env: { ...env, CI: "1" },
  cwd: resolve("."),
});
process.exit(result.status ?? 1);
