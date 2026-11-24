const BUILD_PLACEHOLDER = "postgresql://build:build@127.0.0.1:5432/build";

/**
 * Em Preview, exigir URLs HOMOL_* (homologação isolada).
 * Fail-closed: sem HOMOL não há fallback para RUNTIME/POSTGRES legado/Production.
 */
function getHomolDatabaseUrl(
  env: Record<string, string | undefined>,
  preferPooled: boolean,
): string | undefined {
  if (readDatabaseEnvLabel(env) !== "preview") return undefined;

  const candidates = preferPooled
    ? [
        env.HOMOL_DATABASE_URL_POOLED,
        env.HOMOL_DATABASE_URL,
        env.HOMOL_POSTGRES_URL,
        env.HOMOL_PRISMA_DATABASE_URL,
      ]
    : [
        env.HOMOL_POSTGRES_URL,
        env.HOMOL_DATABASE_URL,
        env.HOMOL_DATABASE_URL_POOLED,
        env.HOMOL_PRISMA_DATABASE_URL,
      ];

  for (const candidate of candidates) {
    const url = candidate?.trim();
    if (url) return url;
  }
  return undefined;
}

/**
 * Banco descartável de testes/E2E. Fail-closed: em DATABASE_ENV=test exige
 * E2E_ISOLATED_DATABASE_URL e não aceita HOMOL_* ou legado implícito.
 */
function getIsolatedTestDatabaseUrl(
  env: Record<string, string | undefined>,
): string | undefined {
  if (readDatabaseEnvLabel(env) !== "test") return undefined;
  const url = env.E2E_ISOLATED_DATABASE_URL?.trim();
  return url || undefined;
}

/**
 * Runtime do Next.js.
 * Em DATABASE_ENV=preview exige HOMOL_*.
 * Em DATABASE_ENV=test exige E2E_ISOLATED_DATABASE_URL (banco descartável).
 * Caso contrário RUNTIME_DATABASE_URL.
 * DATABASE_URL e PRISMA_DATABASE_URL ficam no ambiente e este módulo não as lê.
 */
export function getRuntimeDatabaseUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  if (readDatabaseEnvLabel(env) === "preview") {
    const homol = getHomolDatabaseUrl(env, true);
    if (!homol) {
      throw new Error(
        "DATABASE_ENV=preview requires HOMOL_DATABASE_URL_POOLED, HOMOL_DATABASE_URL, or HOMOL_POSTGRES_URL",
      );
    }
    return homol;
  }

  if (readDatabaseEnvLabel(env) === "test") {
    const isolated = getIsolatedTestDatabaseUrl(env);
    if (!isolated) {
      throw new Error(
        "DATABASE_ENV=test requires E2E_ISOLATED_DATABASE_URL (banco descartável isolado)",
      );
    }
    return isolated;
  }

  const url = env.RUNTIME_DATABASE_URL?.trim();
  if (url) return url;

  if (env.NEXT_PHASE === "phase-production-build") {
    return BUILD_PLACEHOLDER;
  }

  throw new Error("RUNTIME_DATABASE_URL is not set");
}

/**
 * Prisma CLI e seed: migrations, generate e carga inicial.
 * Em DATABASE_ENV=preview exige HOMOL_*.
 * Em DATABASE_ENV=test exige E2E_ISOLATED_DATABASE_URL.
 * Caso contrário POSTGRES_URL.
 * PRISMA_DATABASE_URL não entra neste caminho.
 */
export function getMigrationDatabaseUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  if (readDatabaseEnvLabel(env) === "preview") {
    const homol = getHomolDatabaseUrl(env, false);
    if (!homol) {
      throw new Error(
        "DATABASE_ENV=preview requires HOMOL_POSTGRES_URL, HOMOL_DATABASE_URL, or HOMOL_DATABASE_URL_POOLED",
      );
    }
    return homol;
  }

  if (readDatabaseEnvLabel(env) === "test") {
    const isolated = getIsolatedTestDatabaseUrl(env);
    if (!isolated) {
      throw new Error(
        "DATABASE_ENV=test requires E2E_ISOLATED_DATABASE_URL (banco descartável isolado)",
      );
    }
    return isolated;
  }

  const url = env.POSTGRES_URL?.trim();
  if (url) return url;

  const command = process.argv.join(" ");
  if (command.includes("generate") || env.NEXT_PHASE === "phase-production-build") {
    return BUILD_PLACEHOLDER;
  }

  throw new Error("POSTGRES_URL is not set");
}

export function readDatabaseEnvLabel(
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  const explicit = env.DATABASE_ENV?.trim().toLowerCase();
  return explicit || undefined;
}

/** Migrations alteram o schema. Recusa o runtime de production da Vercel. */
export function assertMigrationTargetAllowed(
  env: Record<string, string | undefined> = process.env,
): void {
  if (env.VERCEL_ENV === "production") {
    throw new Error("Refusing to migrate while VERCEL_ENV=production");
  }

  const label = readDatabaseEnvLabel(env);
  if (label === "development" || label === "preview" || label === "test") {
    return;
  }

  throw new Error("Refusing to migrate without DATABASE_ENV=development, preview, or test");
}
