/**
 * Plano fail-closed para aplicar somente `20261124010000_service_orders` no HOMOL.
 * Sem seed, reset, rollback ou limpeza.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const MIGRATION_11B2 = "20261124010000_service_orders";
export const EXPECTED_HOST_HASH = "22e5c2dd2d93";
export const EXPECTED_INSTANCE_ID = "0786bd682d75";
export const EXPECTED_ORG_SLUG = "servsam";

export const REQUIRED_APPLIED = [
  "20261022140103_platform_foundation",
  "20261118160000_customers_proposals",
  "20261118193000_customer_document_active_unique",
  "20261123140000_engagements_purchase_orders",
];

export function sha12(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

export function hostHashFromUrl(url) {
  try {
    return sha12(new URL(url).host);
  } catch {
    return "invalid";
  }
}

export function computeInstanceId(systemIdentifier, database) {
  return sha12(`${systemIdentifier}:${database}`);
}

export function listLocalMigrationNames(migrationsDir) {
  if (!existsSync(migrationsDir)) return [];
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => /^\d{14}_/.test(name))
    .sort();
}

/**
 * Classifica histórico Prisma vs pastas locais.
 * @param {{ migration_name: string, finished_at: unknown, rolled_back_at: unknown }[]} rows
 * @param {string[]} localNames
 */
export function classifyMigrationHistory(rows, localNames) {
  const failed = [];
  const applied = [];
  for (const row of rows) {
    if (row.rolled_back_at) {
      failed.push({
        migration: row.migration_name,
        reason: "rolled_back",
      });
      continue;
    }
    if (!row.finished_at) {
      failed.push({
        migration: row.migration_name,
        reason: "unfinished",
      });
      continue;
    }
    applied.push(row.migration_name);
  }

  const appliedSet = new Set(applied);
  const pending = localNames.filter((name) => !appliedSet.has(name));
  const orphanApplied = applied.filter((name) => !localNames.includes(name));

  return { applied, pending, failed, orphanApplied };
}

/**
 * Avalia se o destino está apto a receber exatamente a migration 11B.2.
 * Não executa migrate.
 */
export function evaluateHomol11b2DeployPlan(input) {
  const blockers = [];

  if (input.vercelEnv === "production") {
    blockers.push("VERCEL_ENV=production");
  }
  if (input.databaseEnv !== "preview") {
    blockers.push("DATABASE_ENV deve ser preview");
  }
  if (!input.homolUrl || String(input.homolUrl).includes("[SENSITIVE]")) {
    blockers.push("credencial HOMOL ausente ou sensível");
  }

  const hostHash = input.hostHash ?? hostHashFromUrl(input.homolUrl ?? "");
  if (hostHash !== EXPECTED_HOST_HASH) {
    blockers.push(
      `hostHash ${hostHash} ≠ esperado ${EXPECTED_HOST_HASH}`,
    );
  }

  const approved = input.approvedInstanceId?.trim();
  if (!approved) {
    blockers.push("HOMOL_APPROVED_INSTANCE_ID ausente na configuração externa");
  } else if (approved !== EXPECTED_INSTANCE_ID) {
    blockers.push(
      `HOMOL_APPROVED_INSTANCE_ID ${approved} ≠ esperado ${EXPECTED_INSTANCE_ID}`,
    );
  }

  if (!input.liveInstanceId) {
    blockers.push("instanceId real não lido");
  } else if (input.liveInstanceId !== EXPECTED_INSTANCE_ID) {
    blockers.push(
      `instanceId real ${input.liveInstanceId} ≠ esperado ${EXPECTED_INSTANCE_ID}`,
    );
  } else if (approved && input.liveInstanceId !== approved) {
    blockers.push("instanceId real diverge de HOMOL_APPROVED_INSTANCE_ID");
  }

  if (input.cliTargetInstanceId && input.cliTargetInstanceId !== input.liveInstanceId) {
    blockers.push(
      "destino da CLI Prisma diverge da identidade verificada no preflight",
    );
  }

  if (input.organizationSlug !== EXPECTED_ORG_SLUG) {
    blockers.push(`organização esperada ${EXPECTED_ORG_SLUG}`);
  }

  const history = classifyMigrationHistory(
    input.migrationRows ?? [],
    input.localMigrations ?? [],
  );

  for (const name of REQUIRED_APPLIED) {
    if (!history.applied.includes(name)) {
      blockers.push(`migration requerida ausente: ${name}`);
    }
  }

  if (history.failed.length > 0) {
    blockers.push(
      `histórico com falha/inconsistência: ${history.failed
        .map((item) => `${item.migration}(${item.reason})`)
        .join(", ")}`,
    );
  }

  if (history.orphanApplied.length > 0) {
    blockers.push(
      `migrations aplicadas sem pasta local: ${history.orphanApplied.join(", ")}`,
    );
  }

  if (history.pending.length === 0) {
    blockers.push("nenhuma migration pendente (11B.2 já aplicada?)");
  } else if (
    history.pending.length !== 1 ||
    history.pending[0] !== MIGRATION_11B2
  ) {
    blockers.push(
      `pendentes inesperadas: [${history.pending.join(", ")}] — só ${MIGRATION_11B2} é permitida`,
    );
  }

  if (input.serviceOrderTablePresent) {
    blockers.push("tabela service_order já existe antes da migration");
  }

  for (const table of input.requiredTablesMissing ?? []) {
    blockers.push(`tabela core ausente: ${table}`);
  }

  const ok = blockers.length === 0;
  return {
    ok,
    blockers,
    plan: {
      migration: MIGRATION_11B2,
      pendingCount: history.pending.length,
      pending: history.pending,
      appliedCount: history.applied.length,
      hostHash,
      instanceId: input.liveInstanceId ?? null,
      organizationSlug: input.organizationSlug ?? null,
      willSeed: false,
      willReset: false,
      willRollback: false,
    },
    history,
  };
}

/**
 * @param {Record<string, string | undefined>} [env]
 */
export function assertDeployAuthorization(env) {
  const source = env ?? process.env;
  const blockers = [];
  if (source.CONFIRM !== "YES") blockers.push("CONFIRM=YES obrigatório");
  if (source.MIGRATION_11B2_AUTHORIZE !== "YES") {
    blockers.push("MIGRATION_11B2_AUTHORIZE=YES obrigatório");
  }
  if (source.DATABASE_ENV?.trim().toLowerCase() !== "preview") {
    blockers.push("DATABASE_ENV=preview obrigatório");
  }
  if (source.VERCEL_ENV === "production") {
    blockers.push("VERCEL_ENV=production");
  }
  return { ok: blockers.length === 0, blockers };
}

export function defaultMigrationsDir(cwd = process.cwd()) {
  return join(cwd, "prisma", "migrations");
}
