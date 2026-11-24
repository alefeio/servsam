import { readDatabaseEnvLabel } from "@/lib/db/urls";

export type IntegrationGuard =
  { allowed: true } | { allowed: false; reason: string };

/**
 * Testes de integração escrevem no banco. Só rodam com rótulo `preview` ou `test`.
 * Em `preview`, exigem uma URL HOMOL_* para o runtime não cair no banco compartilhado
 * (`RUNTIME_DATABASE_URL`), que em 18/11/2026 ainda é o store legado ligado a Production.
 * Rótulo `development` não basta: o `.env.local` aponta para esse store legado.
 */
export function integrationDatabaseGuard(
  env: Record<string, string | undefined> = process.env,
): IntegrationGuard {
  if (env.VERCEL_ENV === "production") {
    return { allowed: false, reason: "VERCEL_ENV=production" };
  }

  const label = readDatabaseEnvLabel(env);
  if (label === "production") {
    return { allowed: false, reason: "DATABASE_ENV=production" };
  }
  if (label !== "preview" && label !== "test") {
    return {
      allowed: false,
      reason: "DATABASE_ENV precisa ser preview ou test",
    };
  }

  if (label === "preview") {
    const hasHomol = [
      env.HOMOL_DATABASE_URL_POOLED,
      env.HOMOL_DATABASE_URL,
      env.HOMOL_POSTGRES_URL,
      env.HOMOL_PRISMA_DATABASE_URL,
    ].some(
      (value) => Boolean(value?.trim()) && !value?.includes("[SENSITIVE]"),
    );
    if (!hasHomol) {
      return { allowed: false, reason: "preview sem URL HOMOL_*" };
    }
  }

  if (label === "test") {
    const isolated = env.E2E_ISOLATED_DATABASE_URL?.trim();
    if (!isolated || isolated.includes("[SENSITIVE]")) {
      return {
        allowed: false,
        reason: "test sem E2E_ISOLATED_DATABASE_URL (banco descartável)",
      };
    }
  }

  return { allowed: true };
}
