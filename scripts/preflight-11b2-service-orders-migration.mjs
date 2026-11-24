/**
 * Preflight somente leitura da migration 11B.2 no HOMOL de Preview.
 * Não aplica nem reverte migrations.
 */
import pg from "pg";
import { buildHomolEnv } from "./lib/homol-env.mjs";

const MIGRATION = "20261124010000_service_orders";
const { env, targetHostHash } = buildHomolEnv();
const client = new pg.Client({ connectionString: env.RUNTIME_DATABASE_URL });

await client.connect();
try {
  const recorded = await client.query(
    `SELECT migration_name, finished_at, rolled_back_at
     FROM "_prisma_migrations"
     WHERE migration_name = $1`,
    [MIGRATION],
  );
  const table = await client.query(
    `SELECT to_regclass('public.service_order') AS reg`,
  );
  const report = {
    phase: "preflight-11b2-service-orders-migration",
    readOnly: true,
    databaseEnv: "preview",
    targetHostHash,
    migration: MIGRATION,
    recorded: recorded.rowCount > 0,
    finishedAt: recorded.rows[0]?.finished_at ?? null,
    rolledBackAt: recorded.rows[0]?.rolled_back_at ?? null,
    serviceOrderTablePresent: Boolean(table.rows[0]?.reg),
    deployAuthorized: false,
    note: "Aplicação no HOMOL compartilhado exige autorização explícita do Gate 11B.2G.",
  };
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
} finally {
  await client.end();
}
