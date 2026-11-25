import pg from "pg";
import { parseEnvFile, buildHomolEnv, HOMOL_ENV_FILE } from "./lib/homol-env.mjs";

if (process.env.DATABASE_ENV?.trim().toLowerCase() !== "preview") {
  console.error(JSON.stringify({ ok: false, reason: "DATABASE_ENV=preview" }));
  process.exit(1);
}

const local = parseEnvFile(".env.local");
const email = (local.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
if (!email) {
  console.error(JSON.stringify({ ok: false, reason: "SEED_ADMIN_EMAIL ausente" }));
  process.exit(1);
}

const { env, targetHostHash } = buildHomolEnv();
const client = new pg.Client({
  connectionString: env.POSTGRES_URL || env.RUNTIME_DATABASE_URL,
});
await client.connect();
try {
  const result = await client.query(
    `SELECT array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL) AS roles
     FROM "user" u
     LEFT JOIN user_role ur ON ur."userId" = u.id
     LEFT JOIN role r ON r.id = ur."roleId"
     WHERE lower(u.email) = $1
     GROUP BY u.id`,
    [email],
  );
  const roles = result.rows[0]?.roles ?? [];
  const ok = roles.includes("DIRETORIA") || roles.includes("GERENCIA");
  console.log(
    JSON.stringify({
      ok,
      seedUserFound: result.rows.length === 1,
      roles,
      hostHash: targetHostHash,
      envFile: HOMOL_ENV_FILE,
    }),
  );
  process.exit(ok ? 0 : 2);
} finally {
  await client.end();
}
