/**
 * Remove a migração 20261118160000_customers_proposals do banco LEGADO
 * apontado por RUNTIME_DATABASE_URL em .env.local (fundação 22/10/2026).
 * Recusa HOMOL (fundação 18/11/2026) e qualquer banco com linhas nas tabelas novas.
 * Nunca imprime URL/segredo.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

function parse(path) {
  const map = {};
  if (!existsSync(path)) return map;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    let value = match[2] ?? "";
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map[match[1]] = value;
  }
  return map;
}

function sha(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

const local = parse(".env.local");
const url = local.RUNTIME_DATABASE_URL;
if (!url || url.includes("[SENSITIVE]")) {
  console.error(JSON.stringify({ ok: false, reason: "missing RUNTIME_DATABASE_URL in .env.local" }));
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

const foundation = await client.query(
  `select finished_at from "_prisma_migrations" where migration_name = '20261022140103_platform_foundation'`,
);
const finished = foundation.rows[0]?.finished_at
  ? new Date(foundation.rows[0].finished_at).toISOString()
  : null;

if (!finished || !finished.startsWith("2026-10-22")) {
  console.error(
    JSON.stringify({
      ok: false,
      reason: "refusing rollback: foundation is not the 2026-10-22 legacy store",
      foundationFinishedAt: finished,
    }),
  );
  await client.end();
  process.exit(1);
}

const targetMigration = await client.query(
  `select migration_name from "_prisma_migrations" where migration_name = '20261118160000_customers_proposals'`,
);
if (targetMigration.rowCount === 0) {
  console.log(JSON.stringify({ ok: true, alreadyClean: true, hostHash: sha(new URL(url).host) }));
  await client.end();
  process.exit(0);
}

const tables = ["customer", "customer_contact", "customer_unit", "proposal", "proposal_item", "document_sequence"];
const counts = {};
for (const table of tables) {
  const exists = await client.query(
    `select to_regclass($1) as reg`,
    [`public.${table}`],
  );
  if (!exists.rows[0].reg) {
    counts[table] = null;
    continue;
  }
  const result = await client.query(`select count(*)::int as c from "${table}"`);
  counts[table] = result.rows[0].c;
  if (result.rows[0].c > 0) {
    console.error(
      JSON.stringify({
        ok: false,
        reason: `refusing rollback: table ${table} is not empty`,
        counts,
      }),
    );
    await client.end();
    process.exit(1);
  }
}

await client.query("BEGIN");
await client.query(`DROP TABLE IF EXISTS "proposal_item" CASCADE`);
await client.query(`DROP TABLE IF EXISTS "proposal" CASCADE`);
await client.query(`DROP TABLE IF EXISTS "customer_unit" CASCADE`);
await client.query(`DROP TABLE IF EXISTS "customer_contact" CASCADE`);
await client.query(`DROP TABLE IF EXISTS "customer" CASCADE`);
await client.query(`DROP TABLE IF EXISTS "document_sequence" CASCADE`);
await client.query(`DROP TYPE IF EXISTS "ProposalStatus"`);
await client.query(
  `DELETE FROM "_prisma_migrations" WHERE migration_name = '20261118160000_customers_proposals'`,
);
await client.query("COMMIT");

const remaining = await client.query(
  `select migration_name from "_prisma_migrations" order by started_at`,
);
console.log(
  JSON.stringify({
    ok: true,
    rolledBack: "20261118160000_customers_proposals",
    hostHash: sha(new URL(url).host),
    foundationFinishedAt: finished,
    remainingMigrations: remaining.rows.map((row) => row.migration_name),
    emptiedTables: counts,
  }),
);
await client.end();
