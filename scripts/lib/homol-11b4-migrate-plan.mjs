/**
 * Plano fail-closed para aplicar somente `20261125120000_finance_f0` no HOMOL.
 * Sem seed, reset, rollback, limpeza ou grants.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const MIGRATION_11B4 = "20261125120000_finance_f0";
export const MIGRATION_11B3 = "20261124180000_employees_appointments";
export const EXPECTED_HOST_HASH = "22e5c2dd2d93";
export const EXPECTED_INSTANCE_ID = "0786bd682d75";
export const EXPECTED_ORG_SLUG = "servsam";

export const REQUIRED_APPLIED = [
  "20261022140103_platform_foundation",
  "20261118160000_customers_proposals",
  "20261118193000_customer_document_active_unique",
  "20261123140000_engagements_purchase_orders",
  "20261124010000_service_orders",
  MIGRATION_11B3,
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

export function classifyMigrationHistory(rows, localNames) {
  const failed = [];
  const applied = [];
  for (const row of rows) {
    if (row.rolled_back_at) {
      failed.push({ migration: row.migration_name, reason: "rolled_back" });
      continue;
    }
    if (!row.finished_at) {
      failed.push({ migration: row.migration_name, reason: "unfinished" });
      continue;
    }
    applied.push(row.migration_name);
  }
  const appliedSet = new Set(applied);
  const pending = localNames.filter((name) => !appliedSet.has(name));
  return { applied, pending, failed };
}

export function evaluateHomol11b4DeployPlan(input) {
  const blockers = [];
  if (input.vercelEnv === "production") blockers.push("VERCEL_ENV=production");
  if (input.databaseEnv !== "preview") {
    blockers.push("DATABASE_ENV deve ser preview");
  }
  const hostHash = input.hostHash ?? hostHashFromUrl(input.homolUrl ?? "");
  if (hostHash !== EXPECTED_HOST_HASH) {
    blockers.push(`hostHash ${hostHash} ≠ esperado ${EXPECTED_HOST_HASH}`);
  }
  const approved = input.approvedInstanceId?.trim();
  if (!approved) blockers.push("HOMOL_APPROVED_INSTANCE_ID ausente");
  else if (approved !== EXPECTED_INSTANCE_ID) {
    blockers.push(
      `HOMOL_APPROVED_INSTANCE_ID ${approved} ≠ ${EXPECTED_INSTANCE_ID}`,
    );
  }
  if (input.liveInstanceId !== EXPECTED_INSTANCE_ID) {
    blockers.push(
      `instanceId real ${input.liveInstanceId} ≠ ${EXPECTED_INSTANCE_ID}`,
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
      `histórico com falha: ${history.failed
        .map((item) => `${item.migration}(${item.reason})`)
        .join(", ")}`,
    );
  }
  if (history.pending.length !== 1 || history.pending[0] !== MIGRATION_11B4) {
    blockers.push(
      `pendentes inesperadas: [${history.pending.join(", ")}] — só ${MIGRATION_11B4}`,
    );
  }
  if (input.billingTablePresent || input.receiptTablePresent) {
    blockers.push("tabelas 11B.4 já existem antes da migration");
  }
  if (!input.appointmentTablePresent) {
    blockers.push("service_appointment ausente (11B.3)");
  }

  return {
    ok: blockers.length === 0,
    blockers,
    plan: {
      migration: MIGRATION_11B4,
      pending: history.pending,
      hostHash,
      instanceId: input.liveInstanceId ?? null,
      willSeed: false,
      willReset: false,
      willGrant: false,
    },
    history,
  };
}

export function assertDeployAuthorization(env) {
  const source = env ?? process.env;
  const blockers = [];
  if (source.CONFIRM !== "YES") blockers.push("CONFIRM=YES obrigatório");
  if (source.MIGRATION_11B4_AUTHORIZE !== "YES") {
    blockers.push("MIGRATION_11B4_AUTHORIZE=YES obrigatório");
  }
  if (source.DATABASE_ENV?.trim().toLowerCase() !== "preview") {
    blockers.push("DATABASE_ENV=preview obrigatório");
  }
  if (source.VERCEL_ENV === "production") blockers.push("VERCEL_ENV=production");
  return { ok: blockers.length === 0, blockers };
}

export function defaultMigrationsDir(cwd = process.cwd()) {
  return join(cwd, "prisma", "migrations");
}
