/**
 * I/O de identidade HOMOL. Funções puras: src/lib/platform/homol-instance-identity.ts
 */
import { existsSync } from "node:fs";
import pg from "pg";
import { HOMOL_ENV_FILE, parseEnvFile } from "./homol-env.mjs";
import {
  buildInstanceId,
  compareHostHash,
  compareInstanceId,
  EXPECTED_HOMOL_HOST_HASH,
  HOMOL_APPROVED_INSTANCE_ENV,
  sha12,
} from "../../src/lib/platform/homol-instance-identity.ts";

export {
  buildInstanceId,
  compareHostHash,
  compareInstanceId,
  evaluateIdentityGuards,
  EXPECTED_HOMOL_HOST_HASH,
  HOMOL_APPROVED_INSTANCE_ENV,
  sha12,
  sha24,
} from "../../src/lib/platform/homol-instance-identity.ts";

export function readApprovedInstanceId(env = process.env) {
  const fromEnv = (env[HOMOL_APPROVED_INSTANCE_ENV] ?? "").trim();
  if (fromEnv) return fromEnv;
  const file = parseEnvFile(HOMOL_ENV_FILE);
  return (file[HOMOL_APPROVED_INSTANCE_ENV] ?? "").trim();
}

export function refuseIfSameAsLegacyRuntime(targetUrl, localEnvPath = ".env.local") {
  if (!targetUrl) return { ok: false, reason: "target_url_missing" };
  if (!existsSync(localEnvPath)) return { ok: true, legacyCompared: false };
  const local = parseEnvFile(localEnvPath);
  const legacy = local.RUNTIME_DATABASE_URL;
  if (!legacy || legacy.includes("[SENSITIVE]")) {
    return { ok: true, legacyCompared: false };
  }
  // Em Prisma Postgres o pathname costuma ser genérico; a distinção está na
  // URL completa (credencial/query). Comparar só host+path gera falso positivo.
  const targetHash = sha12(targetUrl);
  const legacyHash = sha12(legacy);
  if (targetHash === legacyHash) {
    return {
      ok: false,
      reason: "target_matches_legacy_runtime_url",
      targetUrlHash: targetHash,
      legacyUrlHash: legacyHash,
    };
  }
  return {
    ok: true,
    legacyCompared: true,
    targetUrlHash: targetHash,
    legacyUrlHash: legacyHash,
    urlsDistinct: true,
  };
}

export async function assertHomolInstanceIdentity({
  connectionUrl,
  hostHash,
  approvedInstanceId = readApprovedInstanceId(),
  expectedHostHash = EXPECTED_HOMOL_HOST_HASH,
}) {
  const hostCheck = compareHostHash(hostHash, expectedHostHash);
  if (!hostCheck.ok) {
    console.error(JSON.stringify({ ok: false, phase: "identity", ...hostCheck }));
    process.exit(1);
  }

  const legacyCheck = refuseIfSameAsLegacyRuntime(connectionUrl);
  if (!legacyCheck.ok) {
    console.error(JSON.stringify({ ok: false, phase: "identity", ...legacyCheck }));
    process.exit(1);
  }

  if (!approvedInstanceId) {
    console.error(
      JSON.stringify({
        ok: false,
        phase: "identity",
        reason: "approved_instance_id_missing",
        envKey: HOMOL_APPROVED_INSTANCE_ENV,
        hint: "Rode npx tsx scripts/homol-print-instance-id.mjs e grave o instanceId no env local.",
      }),
    );
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: connectionUrl });
  await client.connect();
  let liveId;
  try {
    const result = await client.query(`
      select
        current_database() as db,
        (select system_identifier::text from pg_control_system()) as sysid
    `);
    const row = result.rows[0];
    liveId = buildInstanceId(row.sysid, row.db);
  } finally {
    await client.end();
  }

  const idCheck = compareInstanceId(liveId, approvedInstanceId);
  if (!idCheck.ok) {
    console.error(
      JSON.stringify({
        ok: false,
        phase: "identity",
        ...idCheck,
        hostHash,
        source: HOMOL_ENV_FILE,
      }),
    );
    process.exit(1);
  }

  return {
    ok: true,
    instanceId: liveId,
    hostHash,
    legacyCompared: legacyCheck.legacyCompared === true,
  };
}
