/**
 * Identidade real de instância PostgreSQL (sem I/O).
 * Material: system_identifier + current_database.
 */
import { createHash } from "node:crypto";

export const EXPECTED_HOMOL_HOST_HASH = "22e5c2dd2d93";
export const HOMOL_APPROVED_INSTANCE_ENV = "HOMOL_APPROVED_INSTANCE_ID";

/**
 * Marcadores independentes do Gate 0 / Sprint 11A (documentados, não derivados
 * só da conexão candidata). Validam que a base aprovada é o HOMOL e não o legado.
 */
export const HOMOL_INDEPENDENT_MARKERS = {
  organizationSlug: "servsam",
  requiredMigration: "20261118160000_customers_proposals",
  /** Fundação do store legado — se a conexão tiver só essa, não é HOMOL. */
  legacyFoundationMigration: "20261022140103_platform_foundation",
} as const;

export function evaluateIndependentHomolMarkers(input: {
  organizationSlug: string | null | undefined;
  migrationNames: readonly string[];
}): { ok: true } | { ok: false; reason: string } {
  if (input.organizationSlug !== HOMOL_INDEPENDENT_MARKERS.organizationSlug) {
    return { ok: false, reason: "independent_org_slug_mismatch" };
  }
  const onlyLegacyFoundation =
    input.migrationNames.length === 1 &&
    input.migrationNames[0] === HOMOL_INDEPENDENT_MARKERS.legacyFoundationMigration;
  if (onlyLegacyFoundation) {
    return { ok: false, reason: "independent_looks_like_legacy_foundation_only" };
  }
  if (!input.migrationNames.includes(HOMOL_INDEPENDENT_MARKERS.requiredMigration)) {
    return { ok: false, reason: "independent_required_migration_missing" };
  }
  return { ok: true };
}

export function refuseIfSameInstanceAsLegacy(
  liveInstanceId: string,
  legacyInstanceId: string | null | undefined,
): { ok: true; legacyCompared: boolean } | { ok: false; reason: string } {
  if (!legacyInstanceId) {
    return { ok: true, legacyCompared: false };
  }
  if (liveInstanceId === legacyInstanceId) {
    return { ok: false, reason: "live_instance_matches_legacy_instance" };
  }
  return { ok: true, legacyCompared: true };
}

export function sha12(value: string): string {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

export function sha24(value: string): string {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 24);
}

export function buildInstanceId(
  systemIdentifier: string,
  databaseName: string,
): string {
  if (!systemIdentifier || !databaseName) {
    throw new Error("instance_material_incomplete");
  }
  return sha24(`${systemIdentifier}:${databaseName}`);
}

export function compareInstanceId(
  liveId: string | null | undefined,
  approvedId: string | null | undefined,
): { ok: true } | { ok: false; reason: string; liveInstanceId?: string; approvedInstanceId?: string } {
  if (!approvedId || !String(approvedId).trim()) {
    return { ok: false, reason: "approved_instance_id_missing" };
  }
  if (!liveId || !String(liveId).trim()) {
    return { ok: false, reason: "live_instance_id_missing" };
  }
  if (String(liveId).trim() !== String(approvedId).trim()) {
    return {
      ok: false,
      reason: "instance_id_mismatch",
      liveInstanceId: String(liveId).trim(),
      approvedInstanceId: String(approvedId).trim(),
    };
  }
  return { ok: true };
}

export function compareHostHash(
  liveHostHash: string | null | undefined,
  expected: string = EXPECTED_HOMOL_HOST_HASH,
): { ok: true } | { ok: false; reason: string; targetHostHash?: string; expected?: string } {
  if (!liveHostHash) return { ok: false, reason: "host_hash_missing" };
  if (liveHostHash !== expected) {
    return {
      ok: false,
      reason: "unexpected_homol_host_hash",
      targetHostHash: liveHostHash,
      expected,
    };
  }
  return { ok: true };
}

export function evaluateIdentityGuards(input: {
  hostHash: string;
  liveInstanceId: string;
  approvedInstanceId: string;
  targetUrl?: string;
  legacyRuntimeUrl?: string;
  expectedHostHash?: string;
}): {
  ok: boolean;
  failures: Array<{ ok: false; reason: string; [key: string]: unknown }>;
  passedChecks: {
    hostHash: boolean;
    instanceId: boolean;
    notLegacyRuntime: boolean;
  };
} {
  const failures: Array<{ ok: false; reason: string; [key: string]: unknown }> = [];
  const hostCheck = compareHostHash(
    input.hostHash,
    input.expectedHostHash ?? EXPECTED_HOMOL_HOST_HASH,
  );
  if (!hostCheck.ok) failures.push(hostCheck);

  if (input.targetUrl && input.legacyRuntimeUrl && !input.legacyRuntimeUrl.includes("[SENSITIVE]")) {
    // Pathname Prisma é genérico; só a URL completa distingue stores.
    if (sha12(input.targetUrl) === sha12(input.legacyRuntimeUrl)) {
      failures.push({ ok: false, reason: "target_matches_legacy_runtime_url" });
    }
  }

  const idCheck = compareInstanceId(input.liveInstanceId, input.approvedInstanceId);
  if (!idCheck.ok) failures.push(idCheck);

  return {
    ok: failures.length === 0,
    failures,
    passedChecks: {
      hostHash: hostCheck.ok,
      instanceId: idCheck.ok,
      notLegacyRuntime: !failures.some(
        (item) => item.reason === "target_matches_legacy_runtime_url",
      ),
    },
  };
}
