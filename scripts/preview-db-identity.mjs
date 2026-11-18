/**
 * Somente leitura. Mostra quando as migrations foram aplicadas e contagens agregadas
 * do banco apontado por RUNTIME_DATABASE_URL (.env.local). Nunca imprime URL ou segredo.
 * Serve para distinguir o HOMOL (migrado no Gate 0, 18/11/2026) do store legado.
 */
import { readFileSync } from "node:fs";
import pg from "pg";

function readKey(file, keys) {
  const found = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) found[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  for (const key of keys) {
    if (found[key] && !found[key].includes("[SENSITIVE]")) return found[key];
  }
  return undefined;
}

/** `homol` (padrão): chaves HOMOL_* de .env.gate0.preview.local. `local`: RUNTIME_DATABASE_URL de .env.local. */
function readRuntimeUrl() {
  if (process.argv[2] === "local") return readKey(".env.local", ["RUNTIME_DATABASE_URL"]);
  return readKey(".env.gate0.preview.local", [
    "HOMOL_POSTGRES_URL",
    "HOMOL_DATABASE_URL",
    "HOMOL_DATABASE_URL_POOLED",
  ]);
}

const url = readRuntimeUrl();
if (!url) {
  console.error(JSON.stringify({ ok: false, reason: "no runtime url" }));
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
const migrations = await client.query(
  'select migration_name, finished_at from "_prisma_migrations" order by started_at',
);
const counts = {};
for (const table of ["organization", "user", "audit_log", "session"]) {
  const result = await client.query(`select count(*)::int as c from "${table}"`);
  counts[table] = result.rows[0].c;
}
const firstOrg = await client.query('select min("createdAt") as created from "organization"');
console.log(
  JSON.stringify({
    ok: true,
    migrations: migrations.rows.map((row) => ({
      name: row.migration_name,
      finishedAt: row.finished_at,
    })),
    counts,
    organizationCreatedAt: firstOrg.rows[0].created,
  }),
);
await client.end();
