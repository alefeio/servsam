/**
 * Probe da URL de migration resolvida pela CLI (getMigrationDatabaseUrl).
 * Imprime JSON sem URL/segredo: hostHash, database, instanceId.
 */
import { createHash } from "node:crypto";
import pg from "pg";
import { getMigrationDatabaseUrl } from "../src/lib/db/urls";

function sha12(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function hostHashFromUrl(url: string): string {
  try {
    return sha12(new URL(url).host);
  } catch {
    return "invalid";
  }
}

function databaseFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname.replace(/^\//, "");
    return decodeURIComponent(path.split("/")[0] ?? "") || "";
  } catch {
    return "";
  }
}

async function main(): Promise<void> {
  const resolved = getMigrationDatabaseUrl(process.env);
  const hostHash = hostHashFromUrl(resolved);
  const databaseFromPath = databaseFromUrl(resolved);

  const client = new pg.Client({ connectionString: resolved });
  await client.connect();
  try {
    const identity = await client.query(`
      SELECT current_database() AS database,
             (SELECT system_identifier::text FROM pg_control_system()) AS system_identifier
    `);
    const database = String(identity.rows[0].database);
    const instanceId = sha12(
      `${String(identity.rows[0].system_identifier)}:${database}`,
    );
    process.stdout.write(
      JSON.stringify({
        hostHash,
        database,
        databaseFromPath,
        instanceId,
      }),
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
