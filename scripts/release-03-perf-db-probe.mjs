/**
 * Probe RO de latência HOMOL (sem secrets no stdout).
 */
import { createHash } from "node:crypto";
import pg from "pg";
import { buildHomolEnv } from "./lib/homol-env.mjs";
import {
  EXPECTED_HOST_HASH,
  EXPECTED_INSTANCE_ID,
  computeInstanceId,
} from "./lib/homol-11b4-migrate-plan.mjs";

if (process.env.DATABASE_ENV?.trim().toLowerCase() !== "preview") {
  console.error(JSON.stringify({ ok: false, reason: "DATABASE_ENV=preview" }));
  process.exit(1);
}

const { env, targetHostHash } = buildHomolEnv();
const raw = env.POSTGRES_URL || env.RUNTIME_DATABASE_URL || env.HOMOL_DATABASE_URL_POOLED;
const url = new URL(raw);
const host = url.hostname;
const hostHash = createHash("sha256").update(host).digest("hex").slice(0, 12);
const regionGuess =
  (host.match(/([a-z]{2}-[a-z]+-\d)/i) ||
    host.match(/\b(iad1|sfo1|gru1|cdg1|cle1)\b/i) ||
    [])[1] || null;

const client = new pg.Client({
  connectionString: raw,
  connectionTimeoutMillis: 90_000,
});

const t0 = Date.now();
await client.connect();
const connectMs = Date.now() - t0;

const id = await client.query(`
  SELECT current_database() AS database,
         (SELECT system_identifier::text FROM pg_control_system()) AS sid
`);
const instanceId = computeInstanceId(
  String(id.rows[0].sid),
  String(id.rows[0].database),
);

const samples = [];
for (let i = 0; i < 8; i++) {
  const start = Date.now();
  await client.query("SELECT 1");
  samples.push(Date.now() - start);
}

// Simula carga tipica de getAuthenticatedUser (session-ish + user roles)
const tLoad = Date.now();
await client.query(`
  SELECT u.id
  FROM "user" u
  WHERE u."isActive" = true
  LIMIT 1
`);
const userLookupMs = Date.now() - tLoad;

const tRoles = Date.now();
await client.query(`
  SELECT u.id, r.code, p.key
  FROM "user" u
  JOIN user_role ur ON ur."userId" = u.id
  JOIN role r ON r.id = ur."roleId"
  JOIN role_permission rp ON rp."roleId" = r.id
  JOIN permission p ON p.id = rp."permissionId"
  WHERE u.email = $1
`, ["diretoria@servsam.com"]);
const rolesJoinMs = Date.now() - tRoles;

await client.end();

const sorted = [...samples].sort((a, b) => a - b);
const median = sorted[Math.floor(sorted.length / 2)];

console.log(
  JSON.stringify(
    {
      ok:
        hostHash === EXPECTED_HOST_HASH || targetHostHash === EXPECTED_HOST_HASH,
      hostHash: targetHostHash,
      hostHashFromUrl: hostHash,
      instanceId,
      instanceOk: instanceId === EXPECTED_INSTANCE_ID,
      regionGuess,
      hostHints: {
        neon: /neon/i.test(host),
        aws: /aws|amazonaws/i.test(host),
        vercel: /vercel/i.test(host),
        pooledPort: url.port === "6543" || /pooler/i.test(host),
      },
      connectMs,
      querySamplesMs: samples,
      queryMedianMs: median,
      queryMaxMs: Math.max(...samples),
      userLookupMs,
      rolesJoinMs,
      note: "Latência medida a partir da máquina local, não da Vercel iad1.",
    },
    null,
    2,
  ),
);
