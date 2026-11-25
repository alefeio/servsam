/**
 * Sobe Next local apontando ao HOMOL Preview (aceite operacional).
 * Não migrate/seed/grant. Porta padrão 3463.
 */
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { buildHomolEnv } from "./lib/homol-env.mjs";

const port = process.env.PORT || "3463";
const { env, targetHostHash } = buildHomolEnv();

const childEnv = {
  ...env,
  DATABASE_ENV: "preview",
  PORT: port,
  BETTER_AUTH_URL: `http://127.0.0.1:${port}`,
  NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${port}`,
};

console.log(
  JSON.stringify({
    phase: "homol-local-ui",
    hostHash: targetHostHash,
    port,
    note: "runtime HOMOL preview — sem seed/migrate",
  }),
);

const child = spawn("npx", ["next", "dev", "--hostname", "127.0.0.1", "--port", port], {
  cwd: resolve("."),
  env: childEnv,
  shell: true,
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 1));
