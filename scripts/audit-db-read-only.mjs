/**
 * Gate A/B — inspeção somente leitura dos bancos legado (.env.local) e HOMOL.
 * Nunca imprime URL/segredo. Não altera nada.
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

async function inspect(label, url) {
  if (!url || url.includes("[SENSITIVE]")) {
    return { label, ok: false, reason: "missing-or-sensitive-url" };
  }
  const client = new pg.Client({ connectionString: url });
  await client.connect();

  const migrations = await client.query(
    `select migration_name, finished_at, rolled_back_at, applied_steps_count
     from "_prisma_migrations" order by started_at`,
  );

  const foundationTables = [
    "organization",
    "user",
    "session",
    "account",
    "verification",
    "role",
    "permission",
    "role_permission",
    "user_role",
    "audit_log",
  ];
  const sprint11Tables = [
    "customer",
    "customer_contact",
    "customer_unit",
    "proposal",
    "proposal_item",
    "document_sequence",
  ];

  const tablePresence = {};
  const tableCounts = {};
  for (const table of [...foundationTables, ...sprint11Tables]) {
    const exists = await client.query(`select to_regclass($1) as reg`, [`public.${table}`]);
    const present = Boolean(exists.rows[0].reg);
    tablePresence[table] = present;
    if (present) {
      const count = await client.query(`select count(*)::int as c from "${table}"`);
      tableCounts[table] = count.rows[0].c;
    } else {
      tableCounts[table] = null;
    }
  }

  const residualTypes = await client.query(
    `select t.typname
     from pg_type t
     join pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'public' and t.typname = 'ProposalStatus'`,
  );

  const residualIndexes = await client.query(
    `select indexname from pg_indexes
     where schemaname = 'public'
       and indexname ~* '(customer|proposal|document_sequence)'
     order by indexname`,
  );

  const residualConstraints = await client.query(
    `select conname
     from pg_constraint c
     join pg_namespace n on n.oid = c.connamespace
     where n.nspname = 'public'
       and conname ~* '(customer|proposal|document_sequence|ProposalStatus)'
     order by conname`,
  );

  const publicTables = await client.query(
    `select tablename from pg_tables where schemaname = 'public' order by tablename`,
  );

  const orgCreated = await client.query(`select min("createdAt") as created from "organization"`);

  const report = {
    label,
    ok: true,
    hostHash: sha(new URL(url).host),
    migrations: migrations.rows.map((row) => ({
      name: row.migration_name,
      finishedAt: row.finished_at ? new Date(row.finished_at).toISOString() : null,
      rolledBackAt: row.rolled_back_at ? new Date(row.rolled_back_at).toISOString() : null,
      appliedSteps: row.applied_steps_count,
    })),
    organizationCreatedAt: orgCreated.rows[0].created
      ? new Date(orgCreated.rows[0].created).toISOString()
      : null,
    foundationTablesPresent: foundationTables.every((t) => tablePresence[t]),
    sprint11TablesPresent: sprint11Tables.filter((t) => tablePresence[t]),
    sprint11TablesAbsent: sprint11Tables.filter((t) => !tablePresence[t]),
    tableCounts,
    residualProposalStatusType: residualTypes.rows.map((r) => r.typname),
    residualIndexes: residualIndexes.rows.map((r) => r.indexname),
    residualConstraints: residualConstraints.rows.map((r) => r.conname),
    publicTables: publicTables.rows.map((r) => r.tablename),
  };

  await client.end();
  return report;
}

const local = parse(".env.local");
if (!existsSync(".env.gate0.preview.local")) {
  console.error(JSON.stringify({ ok: false, reason: "missing .env.gate0.preview.local — pull preview env first" }));
  process.exit(1);
}
const preview = parse(".env.gate0.preview.local");

const legacyUrl = local.RUNTIME_DATABASE_URL;
const homolUrl =
  preview.HOMOL_POSTGRES_URL || preview.HOMOL_DATABASE_URL || preview.HOMOL_DATABASE_URL_POOLED;

const legacy = await inspect("legacy-local-RUNTIME", legacyUrl);
const homol = await inspect("homol-preview", homolUrl);

const legacyClean =
  legacy.ok &&
  legacy.sprint11TablesAbsent?.length === 6 &&
  legacy.residualProposalStatusType?.length === 0 &&
  legacy.residualIndexes?.length === 0 &&
  legacy.residualConstraints?.length === 0 &&
  legacy.migrations?.length === 1 &&
  legacy.migrations?.[0]?.name === "20261022140103_platform_foundation" &&
  legacy.foundationTablesPresent;

const homolReady =
  homol.ok &&
  homol.sprint11TablesPresent?.length === 6 &&
  homol.migrations?.some((m) => m.name === "20261118160000_customers_proposals") &&
  homol.foundationTablesPresent;

console.log(
  JSON.stringify(
    {
      legacy,
      homol,
      gateA: {
        legacyClean,
        homolReady,
        verdict: legacyClean && homolReady ? "PASS" : "BLOCKED",
      },
    },
    null,
    2,
  ),
);
