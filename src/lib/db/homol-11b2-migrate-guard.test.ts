import { describe, expect, it } from "vitest";
import {
  MIGRATION_11B2,
  EXPECTED_HOST_HASH,
  EXPECTED_INSTANCE_ID,
  assertDeployAuthorization,
  classifyMigrationHistory,
  evaluateHomol11b2DeployPlan,
} from "../../../scripts/lib/homol-11b2-migrate-plan.mjs";

const baseLocal = [
  "20261022140103_platform_foundation",
  "20261118160000_customers_proposals",
  "20261118193000_customer_document_active_unique",
  "20261123140000_engagements_purchase_orders",
  MIGRATION_11B2,
];

const appliedRows = baseLocal.slice(0, 4).map((migration_name) => ({
  migration_name,
  finished_at: new Date().toISOString(),
  rolled_back_at: null,
}));

function approvedInput(
  overrides: Record<string, unknown> = {},
): Parameters<typeof evaluateHomol11b2DeployPlan>[0] {
  return {
    vercelEnv: undefined,
    databaseEnv: "preview",
    homolUrl: "postgresql://u:p@db.prisma.io:5432/postgres",
    hostHash: EXPECTED_HOST_HASH,
    approvedInstanceId: EXPECTED_INSTANCE_ID,
    liveInstanceId: EXPECTED_INSTANCE_ID,
    cliTargetInstanceId: EXPECTED_INSTANCE_ID,
    organizationSlug: "servsam",
    migrationRows: appliedRows,
    localMigrations: baseLocal,
    serviceOrderTablePresent: false,
    requiredTablesMissing: [],
    ...overrides,
  };
}

describe("assertDeployAuthorization", () => {
  it("bloqueia autorização ausente", () => {
    expect(
      assertDeployAuthorization({
        DATABASE_ENV: "preview",
      }).ok,
    ).toBe(false);
    expect(
      assertDeployAuthorization({
        CONFIRM: "YES",
        DATABASE_ENV: "preview",
      }).ok,
    ).toBe(false);
  });

  it("aceita CONFIRM + AUTHORIZE + preview", () => {
    expect(
      assertDeployAuthorization({
        CONFIRM: "YES",
        MIGRATION_11B2_AUTHORIZE: "YES",
        DATABASE_ENV: "preview",
      }).ok,
    ).toBe(true);
  });

  it("bloqueia Production", () => {
    expect(
      assertDeployAuthorization({
        CONFIRM: "YES",
        MIGRATION_11B2_AUTHORIZE: "YES",
        DATABASE_ENV: "preview",
        VERCEL_ENV: "production",
      }).ok,
    ).toBe(false);
  });
});

describe("evaluateHomol11b2DeployPlan", () => {
  it("plano de uma única migration no HOMOL aprovado", () => {
    const result = evaluateHomol11b2DeployPlan(approvedInput());
    expect(result.ok).toBe(true);
    expect(result.plan.migration).toBe(MIGRATION_11B2);
    expect(result.plan.pendingCount).toBe(1);
    expect(result.plan.willSeed).toBe(false);
  });

  it("bloqueia instanceId divergente", () => {
    const result = evaluateHomol11b2DeployPlan(
      approvedInput({ liveInstanceId: "deadbeef0000" }),
    );
    expect(result.ok).toBe(false);
    expect(result.blockers.some((item) => item.includes("instanceId"))).toBe(
      true,
    );
  });

  it("bloqueia migration adicional pendente", () => {
    const result = evaluateHomol11b2DeployPlan(
      approvedInput({
        localMigrations: [...baseLocal, "20261201000000_extra"],
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.blockers.some((item) => item.includes("pendentes"))).toBe(
      true,
    );
  });

  it("bloqueia banco legado / host errado", () => {
    const result = evaluateHomol11b2DeployPlan(
      approvedInput({ hostHash: "000000000000" }),
    );
    expect(result.ok).toBe(false);
    expect(result.blockers.some((item) => item.includes("hostHash"))).toBe(
      true,
    );
  });

  it("bloqueia Production via VERCEL_ENV", () => {
    const result = evaluateHomol11b2DeployPlan(
      approvedInput({ vercelEnv: "production" }),
    );
    expect(result.ok).toBe(false);
  });

  it("bloqueia histórico inconsistente", () => {
    const history = classifyMigrationHistory(
      [
        ...appliedRows,
        {
          migration_name: MIGRATION_11B2,
          finished_at: null,
          rolled_back_at: null,
        },
      ],
      baseLocal,
    );
    expect(history.failed).toHaveLength(1);
    const result = evaluateHomol11b2DeployPlan(
      approvedInput({
        migrationRows: [
          ...appliedRows,
          {
            migration_name: MIGRATION_11B2,
            finished_at: null,
            rolled_back_at: null,
          },
        ],
      }),
    );
    expect(result.ok).toBe(false);
  });
});
