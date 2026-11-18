/**
 * Monta o ambiente de um processo filho que só enxerga o banco HOMOL de Preview.
 * Nunca imprime URL, host ou segredo. Só o fingerprint (sha256 do host) para auditoria.
 *
 * A URL vem somente de `.env.gate0.preview.local`, gerado por
 *   npx vercel env pull .env.gate0.preview.local --environment=preview --yes
 * `RUNTIME_DATABASE_URL` de `.env.local` NÃO é aceita: em 18/11/2026 ela apontou para o
 * store legado (migration de 22/10), ligado a Production. Host sozinho não distingue
 * bancos Prisma Postgres (todos em db.prisma.io:5432).
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

export const HOMOL_ENV_FILE = ".env.gate0.preview.local";

export function parseEnvFile(path) {
  const map = {};
  if (!existsSync(path)) return map;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
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

function usable(value) {
  return Boolean(value) && !value.includes("[SENSITIVE]");
}

export function blocked(reason) {
  console.error(JSON.stringify({ phase: "blocked", reason }));
  process.exit(1);
}

export function buildHomolEnv() {
  if (process.env.VERCEL_ENV === "production") blocked("VERCEL_ENV=production");

  const previewEnv = parseEnvFile(HOMOL_ENV_FILE);
  const target = [
    previewEnv.HOMOL_POSTGRES_URL,
    previewEnv.HOMOL_DATABASE_URL,
    previewEnv.HOMOL_DATABASE_URL_POOLED,
  ].find(usable);
  if (!target) blocked(`no HOMOL url in ${HOMOL_ENV_FILE}`);

  // .env.local fornece segredos de app (BETTER_AUTH_SECRET, SEED_*). Variáveis de banco dele
  // são descartadas e substituídas pelo HOMOL abaixo.
  const localEnv = parseEnvFile(".env.local");
  const env = { ...process.env, ...localEnv };
  for (const key of ["DATABASE_URL", "PRISMA_DATABASE_URL", "VERCEL_ENV"]) delete env[key];

  Object.assign(env, {
    DATABASE_ENV: "preview",
    HOMOL_POSTGRES_URL: target,
    HOMOL_DATABASE_URL: target,
    HOMOL_DATABASE_URL_POOLED: target,
    POSTGRES_URL: target,
    RUNTIME_DATABASE_URL: target,
  });

  return { env, targetHostHash: sha(hostOf(target)) };
}
