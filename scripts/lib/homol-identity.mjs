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
  evaluateIndependentHomolMarkers,
  EXPECTED_HOMOL_HOST_HASH,
  HOMOL_APPROVED_INSTANCE_ENV,
  refuseIfSameInstanceAsLegacy,
  sha12,
} from "../../src/lib/platform/homol-instance-identity.ts";

export {
  buildInstanceId,
  compareHostHash,
  compareInstanceId,
  evaluateIdentityGuards,
  evaluateIndependentHomolMarkers,
  EXPECTED_HOMOL_HOST_HASH,
  HOMOL_APPROVED_INSTANCE_ENV,
  HOMOL_INDEPENDENT_MARKERS,
  refuseIfSameInstanceAsLegacy,
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

async function readInstanceIdFromUrl(connectionUrl) {
  const client = new pg.Client({ connectionString: connectionUrl });
  await client.connect();
  try {
    const result = await client.query(`
      select
        current_database() as db,
        (select system_identifier::text from pg_control_system()) as sysid
    `);
    const row = result.rows[0];
    return buildInstanceId(row.sysid, row.db);
  } finally {
    await client.end();
  }
}

async function readIndependentMarkers(connectionUrl) {
  const client = new pg.Client({ connectionString: connectionUrl });
  await client.connect();
  try {
    const org = await client.query(
      `select slug from organization where slug = 'servsam' limit 1`,
    );
    const migrations = await client.query(
      `select migration_name from "_prisma_migrations" order by started_at`,
    );
    return {
      organizationSlug: org.rows[0]?.slug ?? null,
      migrationNames: migrations.rows.map((row) => row.migration_name),
    };
  } finally {
    await client.end();
  }
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

  const legacyUrlCheck = refuseIfSameAsLegacyRuntime(connectionUrl);
  if (!legacyUrlCheck.ok) {
    console.error(JSON.stringify({ ok: false, phase: "identity", ...legacyUrlCheck }));
    process.exit(1);
  }

  if (!approvedInstanceId) {
    console.error(
      JSON.stringify({
        ok: false,
        phase: "identity",
        reason: "approved_instance_id_missing",
        envKey: HOMOL_APPROVED_INSTANCE_ENV,
        hint: "Rode npx tsx scripts/homol-print-instance-id.mjs e grave o instanceId no env local após cruzar com Gate 0.",
      }),
    );
    process.exit(1);
  }

  const liveId = await readInstanceIdFromUrl(connectionUrl);
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

  // Validação independente: migração 11A + org servsam (evidência Gate 0), não só o hash impresso.
  const markers = await readIndependentMarkers(connectionUrl);
  const markerCheck = evaluateIndependentHomolMarkers(markers);
  if (!markerCheck.ok) {
    console.error(JSON.stringify({ ok: false, phase: "identity", ...markerCheck }));
    process.exit(1);
  }

  // Cruzamento com o store legado: instanceId live não pode ser o do RUNTIME_DATABASE_URL.
  let legacyInstanceCompared = false;
  if (existsSync(".env.local")) {
    const local = parseEnvFile(".env.local");
    const legacyUrl = local.RUNTIME_DATABASE_URL;
    if (legacyUrl && !legacyUrl.includes("[SENSITIVE]") && sha12(legacyUrl) !== sha12(connectionUrl)) {
      try {
        const legacyId = await readInstanceIdFromUrl(legacyUrl);
        const cross = refuseIfSameInstanceAsLegacy(liveId, legacyId);
        if (!cross.ok) {
          console.error(JSON.stringify({ ok: false, phase: "identity", ...cross }));
          process.exit(1);
        }
        legacyInstanceCompared = cross.legacyCompared;
      } catch {
        // Legado inacessível: não bloqueia se URL distinta e marcadores HOMOL ok.
        legacyInstanceCompared = false;
      }
    }
  }

  return {
    ok: true,
    instanceId: liveId,
    hostHash,
    legacyUrlCompared: legacyUrlCheck.legacyCompared === true,
    legacyInstanceCompared,
    independentMarkers: {
      organizationSlug: markers.organizationSlug,
      requiredMigrationPresent: true,
    },
  };
}
