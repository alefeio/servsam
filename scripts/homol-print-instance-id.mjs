/**
 * Somente leitura: imprime o instanceId do banco HOMOL apontado por
 * `.env.gate0.preview.local`, sem URL/segredo. Use o valor para preencher
 * HOMOL_APPROVED_INSTANCE_ID fora do código (mesmo arquivo de env).
 */
import pg from "pg";
import { buildHomolEnv, HOMOL_ENV_FILE } from "./lib/homol-env.mjs";
import {
  buildInstanceId,
  HOMOL_APPROVED_INSTANCE_ENV,
} from "../src/lib/platform/homol-instance-identity.ts";

const { env, targetHostHash } = buildHomolEnv();
const url =
  env.HOMOL_POSTGRES_URL || env.HOMOL_DATABASE_URL || env.HOMOL_DATABASE_URL_POOLED;
if (!url) {
  console.error(JSON.stringify({ ok: false, reason: "no_homol_url", source: HOMOL_ENV_FILE }));
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
const result = await client.query(`
  select
    current_database() as db,
    (select system_identifier::text from pg_control_system()) as sysid
`);
await client.end();

const row = result.rows[0];
const instanceId = buildInstanceId(row.sysid, row.db);

console.log(
  JSON.stringify(
    {
      ok: true,
      source: HOMOL_ENV_FILE,
      hostHash: targetHostHash,
      instanceId,
      envKey: HOMOL_APPROVED_INSTANCE_ENV,
      note: `Grave instanceId em ${HOMOL_APPROVED_INSTANCE_ENV} no arquivo de env (fora do repositório).`,
    },
    null,
    2,
  ),
);
