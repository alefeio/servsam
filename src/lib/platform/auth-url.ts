function isPreviewAuthEnv(env: Record<string, string | undefined>): boolean {
  return (
    env.DATABASE_ENV?.trim().toLowerCase() === "preview" ||
    env.VERCEL_ENV === "preview"
  );
}

/**
 * Em Preview, ignora BETTER_AUTH_URL compartilhado com Production e usa o host
 * do deployment (VERCEL_URL). Production continua com BETTER_AUTH_URL.
 */
export function getAuthBaseURL(
  env: Record<string, string | undefined> = process.env,
): string {
  if (isPreviewAuthEnv(env) && env.VERCEL_URL?.trim()) {
    return `https://${env.VERCEL_URL.trim()}`.replace(/\/$/, "");
  }

  const configured = env.BETTER_AUTH_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function getTrustedOrigins(
  env: Record<string, string | undefined> = process.env,
): string[] {
  const origins = new Set<string>([getAuthBaseURL(env)]);

  if (isPreviewAuthEnv(env)) {
    const vercelHost = env.VERCEL_URL?.trim();
    if (vercelHost) {
      origins.add(`https://${vercelHost}`.replace(/\/$/, ""));
    }
    const branchHost = env.VERCEL_BRANCH_URL?.trim();
    if (branchHost) {
      origins.add(`https://${branchHost}`.replace(/\/$/, ""));
    }
  }

  return [...origins];
}
