import { createHash } from "node:crypto";
import pg from "pg";

const url =
  process.env.E2E_ISOLATED_DATABASE_URL ||
  "postgresql://servsam:servsam_e2e_local@127.0.0.1:55432/servsam_e2e";

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const result = await client.query(`
    SELECT
      current_database() AS database,
      (SELECT system_identifier::text FROM pg_control_system()) AS system_identifier
  `);
  const database = result.rows[0].database;
  const systemIdentifier = result.rows[0].system_identifier;
  const instanceId = createHash("sha256")
    .update(`${systemIdentifier}:${database}`)
    .digest("hex")
    .slice(0, 12);
  const hostHash = createHash("sha256")
    .update(new URL(url).host)
    .digest("hex")
    .slice(0, 12);
  console.log(
    JSON.stringify({
      database,
      hostHash,
      instanceId,
      urlRedacted: url.replace(/:[^:@/]+@/, ":***@"),
    }),
  );
} finally {
  await client.end();
}
