import { createHash } from "node:crypto";

export type DbInstanceIdentity = {
  database: string;
  hostHash: string;
  instanceId: string;
};

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

/** Fingerprint anonimizado: sha256(system_identifier:current_database)[:12] */
export function computeInstanceId(
  systemIdentifier: string,
  database: string,
): string {
  return sha(`${systemIdentifier}:${database}`);
}

export function hostHashFromUrl(url: string): string {
  return sha(hostOf(url));
}

export type PgQueryable = {
  query: (
    text: string,
  ) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

/** Lê a identidade real da conexão aberta (não confia só na URL). */
export async function readDbInstanceIdentity(
  client: PgQueryable,
  connectionUrl: string,
): Promise<DbInstanceIdentity> {
  const result = await client.query(`
    SELECT
      current_database() AS database,
      (SELECT system_identifier::text FROM pg_control_system()) AS system_identifier
  `);
  const row = result.rows[0];
  const database = String(row?.database ?? "");
  const systemIdentifier = String(row?.system_identifier ?? "");
  if (!database || !systemIdentifier) {
    throw new Error("Não foi possível ler system_identifier/current_database");
  }
  return {
    database,
    hostHash: hostHashFromUrl(connectionUrl),
    instanceId: computeInstanceId(systemIdentifier, database),
  };
}
