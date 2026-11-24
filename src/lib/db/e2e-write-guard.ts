import { createHash } from "node:crypto";
import {
  hostHashFromUrl,
  readDbInstanceIdentity,
  type DbInstanceIdentity,
} from "@/lib/db/db-instance-identity";
import { readDatabaseEnvLabel } from "@/lib/db/urls";

export type E2eWriteGuard =
  | { allowed: true; identity: DbInstanceIdentity }
  | { allowed: false; reason: string };

/** Host hash conhecido do HOMOL compartilhado de Preview (não usar em E2E de escrita). */
export const SHARED_HOMOL_HOST_HASH = "22e5c2dd2d93";

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
 * Guard síncrono (env): usado nos specs Playwright para skip rápido.
 * A prova de identidade real fica em `proveE2eWriteIsolation`.
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

  const sharedHomolHash =
    env.HOMOL_SHARED_HOST_HASH?.trim() || SHARED_HOMOL_HOST_HASH;
  const targetHostHash = hostHashFromUrl(isolatedUrl);
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

  // Runtime do Next/Prisma deve apontar para a mesma URL isolada.
  const runtime = env.RUNTIME_DATABASE_URL?.trim();
  const postgres = env.POSTGRES_URL?.trim();
  if (runtime && runtime !== isolatedUrl) {
    return {
      allowed: false,
      reason: "RUNTIME_DATABASE_URL diverge de E2E_ISOLATED_DATABASE_URL",
    };
  }
  if (postgres && postgres !== isolatedUrl) {
    return {
      allowed: false,
      reason: "POSTGRES_URL diverge de E2E_ISOLATED_DATABASE_URL",
    };
  }

  return {
    allowed: true,
    identity: {
      database: "(pending-probe)",
      hostHash: targetHostHash,
      instanceId: expectedInstance,
    },
  };
}

type PgClientLike = {
  connect: () => Promise<unknown>;
  end: () => Promise<unknown>;
  query: (
    text: string,
  ) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

/**
 * Fail-closed: abre a conexão e comprova instanceId real.
 * Recusa HOMOL compartilhado, legado e qualquer divergência de fingerprint.
 */
export async function proveE2eWriteIsolation(
  env: Record<string, string | undefined> = process.env,
  createClient?: (url: string) => PgClientLike,
): Promise<E2eWriteGuard> {
  const sync = e2eWriteDatabaseGuard(env);
  if (!sync.allowed) return sync;

  const isolatedUrl = env.E2E_ISOLATED_DATABASE_URL!.trim();
  const expectedInstance = env.E2E_ISOLATED_INSTANCE_ID!.trim();
  const sharedHomolHash =
    env.HOMOL_SHARED_HOST_HASH?.trim() || SHARED_HOMOL_HOST_HASH;
  const blockedInstance = env.HOMOL_APPROVED_INSTANCE_ID?.trim();

  let client: PgClientLike;
  try {
    if (createClient) {
      client = createClient(isolatedUrl);
    } else {
      const pg = await import("pg");
      client = new pg.default.Client({ connectionString: isolatedUrl });
    }
  } catch (error) {
    return {
      allowed: false,
      reason: `Falha ao criar cliente Postgres: ${error instanceof Error ? error.message : "erro"}`,
    };
  }

  try {
    await client.connect();
    const identity = await readDbInstanceIdentity(client, isolatedUrl);
    if (identity.hostHash === sharedHomolHash) {
      return {
        allowed: false,
        reason: "Conexão real aponta para host hash do HOMOL compartilhado",
      };
    }
    if (blockedInstance && identity.instanceId === blockedInstance) {
      return {
        allowed: false,
        reason: "Conexão real é a instância HOMOL aprovada (não isolada)",
      };
    }
    if (identity.instanceId !== expectedInstance) {
      return {
        allowed: false,
        reason: `instanceId real ${identity.instanceId} ≠ E2E_ISOLATED_INSTANCE_ID`,
      };
    }
    return { allowed: true, identity };
  } catch (error) {
    return {
      allowed: false,
      reason: `Não foi possível comprovar isolamento: ${error instanceof Error ? error.message : "erro"}`,
    };
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}

/** @deprecated helper for tests that still import sha of host */
export function e2eHostHash(url: string): string {
  return sha(hostOf(url));
}
