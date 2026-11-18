import pg from "pg";
import { createHash } from "node:crypto";

const dbUrl = process.env.GATE0_DB;
if (!dbUrl) {
  console.error(JSON.stringify({ ok: false, reason: "missing GATE0_DB" }));
  process.exit(1);
}

function sha(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

const client = new pg.Client({ connectionString: dbUrl });
await client.connect();
const users = await client.query('select count(*)::int as c from "user"');
const orgs = await client.query('select count(*)::int as c from "organization"');
const roles = await client.query('select count(*)::int as c from "role"');
const tables = await client.query(
  "select count(*)::int as c from information_schema.tables where table_schema='public'",
);
console.log(
  JSON.stringify({
    ok: true,
    userCount: users.rows[0].c,
    orgCount: orgs.rows[0].c,
    roleCount: roles.rows[0].c,
    publicTableCount: tables.rows[0].c,
    hostHash: sha(new URL(dbUrl).host),
  }),
);
await client.end();
