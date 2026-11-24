import { createHash } from "node:crypto";
import { readDatabaseEnvLabel } from "@/lib/db/urls";

export type E2eWriteGuard =
  | { allowed: true; targetHostHash: string; instanceId: string }
  | { allowed: false; reason: string };

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "invalid";
  }
}

/**
 * E2E de escrita não pode usar HOMOL compartilhado, legado nem Production.
 * Exige banco isolado explícito:
 * - DATABASE_ENV=test
 * - E2E_ISOLATED_DATABASE_URL
 * - E2E_ISOLATED_INSTANCE_ID (fingerprint aprovado do banco de teste)
 *
 * Sem esse trio, os specs devem ser ignorados (skip), não executados no HOMOL.
 */
export function e2eWriteDatabaseGuard(
  env: Record<string, string | undefined> = process.env,
): E2eWriteGuard {
  if (env.VERCEL_ENV === "production") {
    return { allowed: false, reason: "VERCEL_ENV=production" };
  }

  const label = readDatabaseEnvLabel(env);
  if (label === "production") {
    return { allowed: false, reason: "DATABASE_ENV=production" };
  }
  if (label !== "test") {
    return {
      allowed: false,
      reason:
        "E2E de escrita exige DATABASE_ENV=test e banco isolado (não HOMOL compartilhado)",
    };
  }

  const isolatedUrl = env.E2E_ISOLATED_DATABASE_URL?.trim();
  if (!isolatedUrl || isolatedUrl.includes("[SENSITIVE]")) {
    return {
      allowed: false,
      reason: "E2E_ISOLATED_DATABASE_URL ausente — banco isolado não provisionado",
    };
  }

  const expectedInstance = env.E2E_ISOLATED_INSTANCE_ID?.trim();
  if (!expectedInstance) {
    return {
      allowed: false,
      reason: "E2E_ISOLATED_INSTANCE_ID ausente — identificação explícita obrigatória",
    };
  }

  const sharedHomolHash = env.HOMOL_SHARED_HOST_HASH?.trim() || "22e5c2dd2d93";
  const targetHostHash = sha(hostOf(isolatedUrl));
  if (targetHostHash === sharedHomolHash) {
    return {
      allowed: false,
      reason: "URL isolada coincide com o host hash do HOMOL compartilhado",
    };
  }

  const approved = env.E2E_APPROVED_INSTANCE_ID?.trim() || expectedInstance;
  if (expectedInstance !== approved) {
    return {
      allowed: false,
      reason: "E2E_ISOLATED_INSTANCE_ID não confere com o fingerprint aprovado",
    };
  }

  return {
    allowed: true,
    targetHostHash,
    instanceId: expectedInstance,
  };
}
