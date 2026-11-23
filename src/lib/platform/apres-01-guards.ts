/**
 * Guardas APRES-01.1: ator explícito, permissões e retomada (puro / testável).
 */

export const APRES_REQUIRED_PERMISSIONS = [
  "customer.create",
  "customer.update",
  "proposal.create",
  "proposal.send",
  "proposal.approve",
] as const;

export type ApresActorCandidate = {
  email: string;
  isActive: boolean;
  organizationSlug: string;
  permissions: ReadonlySet<string> | readonly string[];
  roleCodes: readonly string[];
};

export type ApresActorCheck =
  | { ok: true; email: string }
  | { ok: false; reason: string; details?: Record<string, unknown> };

function permissionSet(
  permissions: ReadonlySet<string> | readonly string[],
): Set<string> {
  return permissions instanceof Set ? permissions : new Set(permissions);
}

/** Modo escrita exige e-mail explícito; dry-run pode omitir. */
export function requireActorEmail(
  emailRaw: string | undefined | null,
  mode: "dry-run" | "execute",
): ApresActorCheck {
  const email = (emailRaw ?? "").trim().toLowerCase();
  if (!email) {
    if (mode === "execute") {
      return {
        ok: false,
        reason: "apres_actor_email_required",
        details: { env: "APRES_ACTOR_EMAIL" },
      };
    }
    return { ok: false, reason: "apres_actor_email_absent_dry_run" };
  }
  if (!email.includes("@")) {
    return { ok: false, reason: "apres_actor_email_invalid" };
  }
  return { ok: true, email };
}

export function refuseSeedActor(
  email: string,
  seedAdminEmail: string | undefined | null,
): ApresActorCheck {
  const seed = (seedAdminEmail ?? "").trim().toLowerCase();
  if (seed && email.trim().toLowerCase() === seed) {
    return {
      ok: false,
      reason: "refusing_seed_admin_actor",
      details: { hint: "Use a conta administrativa autorizada, não a seed." },
    };
  }
  return { ok: true, email: email.trim().toLowerCase() };
}

export function validateApresActor(
  candidate: ApresActorCandidate | null | undefined,
  expectedEmail: string,
): ApresActorCheck {
  const email = expectedEmail.trim().toLowerCase();
  if (!candidate) {
    return { ok: false, reason: "actor_not_found", details: { emailHashHint: email.slice(0, 3) } };
  }
  if (candidate.email.trim().toLowerCase() !== email) {
    return { ok: false, reason: "actor_email_mismatch" };
  }
  if (candidate.organizationSlug !== "servsam") {
    return {
      ok: false,
      reason: "actor_wrong_organization",
      details: { organizationSlug: candidate.organizationSlug },
    };
  }
  if (!candidate.isActive) {
    return { ok: false, reason: "actor_inactive" };
  }
  const perms = permissionSet(candidate.permissions);
  const missing = APRES_REQUIRED_PERMISSIONS.filter((key) => !perms.has(key));
  if (missing.length > 0) {
    return {
      ok: false,
      reason: "actor_missing_permissions",
      details: { missing },
    };
  }
  return { ok: true, email };
}

/** Chave estável para advisory lock PostgreSQL (dois int32). */
export const APRES_ADVISORY_LOCK = {
  classId: 0x41505245, // 'APRE'
  objectId: 0x00000001,
} as const;

export type ScenarioWriteFootprint = {
  scenarioKey: string;
  creates: number;
  transitions: number;
  conflicts: number;
  noops: number;
};

export function classifyScenarioProgress(footprints: readonly ScenarioWriteFootprint[]): {
  pending: string[];
  complete: string[];
  blocked: string[];
} {
  const pending: string[] = [];
  const complete: string[] = [];
  const blocked: string[] = [];
  for (const item of footprints) {
    if (item.conflicts > 0) {
      blocked.push(item.scenarioKey);
    } else if (item.creates === 0 && item.transitions === 0) {
      complete.push(item.scenarioKey);
    } else {
      pending.push(item.scenarioKey);
    }
  }
  return { pending, complete, blocked };
}

/**
 * Simula falha parcial: após N ações bem-sucedidas, o restante permanece no plano
 * na reexecução (idempotência). Testável sem banco.
 */
export function applyPartialActionCursor<T extends { type: string }>(
  actions: readonly T[],
  completedCount: number,
): { done: T[]; remaining: T[] } {
  const safe = Math.max(0, Math.min(completedCount, actions.length));
  return {
    done: actions.slice(0, safe) as T[],
    remaining: actions.slice(safe) as T[],
  };
}
