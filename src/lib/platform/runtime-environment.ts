/**
 * Rótulo de ambiente para a UI de /sistema — derivado de env, sem hardcode de HOMOL.
 */
export function getRuntimeEnvironmentLabel(
  env: Record<string, string | undefined> = process.env,
): {
  code: "preview" | "production" | "development" | "test" | "unknown";
  label: string;
  shortLabel: string;
} {
  const databaseEnv = env.DATABASE_ENV?.trim().toLowerCase();
  const vercelEnv = env.VERCEL_ENV?.trim().toLowerCase();

  if (databaseEnv === "preview" || vercelEnv === "preview") {
    return {
      code: "preview",
      label: "Homologação (Preview)",
      shortLabel: "Homologação",
    };
  }
  if (databaseEnv === "production" || vercelEnv === "production") {
    return {
      code: "production",
      label: "Produção",
      shortLabel: "Produção",
    };
  }
  if (databaseEnv === "test") {
    return { code: "test", label: "Teste automatizado", shortLabel: "Teste" };
  }
  if (databaseEnv === "development" || (!databaseEnv && !vercelEnv)) {
    return {
      code: "development",
      label: "Desenvolvimento local",
      shortLabel: "Desenvolvimento",
    };
  }
  return { code: "unknown", label: "Sistema", shortLabel: "Sistema" };
}
