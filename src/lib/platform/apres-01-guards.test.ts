import { describe, expect, it } from "vitest";
import {
  APRES_01_SCENARIOS,
  buildApresProvisionPlan,
} from "@/lib/platform/apres-01-plan";
import {
  APRES_REQUIRED_PERMISSIONS,
  applyPartialActionCursor,
  classifyScenarioProgress,
  refuseSeedActor,
  requireActorEmail,
  validateApresActor,
} from "@/lib/platform/apres-01-guards";
import {
  buildInstanceId,
  evaluateIdentityGuards,
} from "@/lib/platform/homol-instance-identity";

describe("APRES-01.1 identity guards", () => {
  it("builds a stable instance id from system id + database name", () => {
    const a = buildInstanceId("111", "homol_db");
    const b = buildInstanceId("111", "homol_db");
    const c = buildInstanceId("111", "legacy_db");
    const d = buildInstanceId("222", "homol_db");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toBe(d);
    expect(a).toHaveLength(24);
  });

  it("blocks wrong or missing approved instance id", () => {
    const live = buildInstanceId("999", "servsam_homol");
    expect(
      evaluateIdentityGuards({
        hostHash: "22e5c2dd2d93",
        liveInstanceId: live,
        approvedInstanceId: "",
        targetUrl: "postgres://u:p@db.prisma.io:5432/homol",
        legacyRuntimeUrl: "postgres://u:p@db.prisma.io:5432/legacy",
      }).ok,
    ).toBe(false);

    expect(
      evaluateIdentityGuards({
        hostHash: "22e5c2dd2d93",
        liveInstanceId: live,
        approvedInstanceId: buildInstanceId("999", "other"),
        targetUrl: "postgres://u:p@db.prisma.io:5432/homol",
        legacyRuntimeUrl: "postgres://u:p@db.prisma.io:5432/legacy",
      }).failures.some((item) => item.reason === "instance_id_mismatch"),
    ).toBe(true);
  });

  it("blocks wrong host hash even with matching instance id", () => {
    const live = buildInstanceId("1", "db");
    const result = evaluateIdentityGuards({
      hostHash: "deadbeef0000",
      liveInstanceId: live,
      approvedInstanceId: live,
      targetUrl: "postgres://u:p@host/db",
      legacyRuntimeUrl: "postgres://u:p@other/legacy",
    });
    expect(result.ok).toBe(false);
    expect(result.failures.some((item) => item.reason === "unexpected_homol_host_hash")).toBe(
      true,
    );
  });

  it("blocks target URL identical to legacy runtime", () => {
    const live = buildInstanceId("1", "db");
    const url = "postgres://u:p@db.prisma.io:5432/same";
    const result = evaluateIdentityGuards({
      hostHash: "22e5c2dd2d93",
      liveInstanceId: live,
      approvedInstanceId: live,
      targetUrl: url,
      legacyRuntimeUrl: url,
    });
    expect(result.ok).toBe(false);
    expect(
      result.failures.some((item) => item.reason === "target_matches_legacy_runtime_url"),
    ).toBe(true);
  });

  it("passes when host, instance and legacy separation align", () => {
    const live = buildInstanceId("42", "homol");
    const result = evaluateIdentityGuards({
      hostHash: "22e5c2dd2d93",
      liveInstanceId: live,
      approvedInstanceId: live,
      targetUrl: "postgres://u:p@db.prisma.io:5432/homol",
      legacyRuntimeUrl: "postgres://u:p@db.prisma.io:5432/legacy",
    });
    expect(result.ok).toBe(true);
    expect(result.passedChecks.hostHash).toBe(true);
    expect(result.passedChecks.instanceId).toBe(true);
    expect(result.passedChecks.notLegacyRuntime).toBe(true);
  });
});

describe("APRES-01.1 actor guards", () => {
  it("requires APRES_ACTOR_EMAIL on execute and allows absent only as dry-run signal", () => {
    expect(requireActorEmail(undefined, "execute")).toMatchObject({
      ok: false,
      reason: "apres_actor_email_required",
    });
    expect(requireActorEmail("", "execute")).toMatchObject({
      ok: false,
      reason: "apres_actor_email_required",
    });
    expect(requireActorEmail(undefined, "dry-run")).toMatchObject({
      ok: false,
      reason: "apres_actor_email_absent_dry_run",
    });
    expect(requireActorEmail("alexandrefpenha@gmail.com", "execute")).toEqual({
      ok: true,
      email: "alexandrefpenha@gmail.com",
    });
  });

  it("refuses the seed admin as actor", () => {
    expect(refuseSeedActor("seed@example.com", "seed@example.com")).toMatchObject({
      ok: false,
      reason: "refusing_seed_admin_actor",
    });
    expect(refuseSeedActor("alexandrefpenha@gmail.com", "seed@example.com").ok).toBe(
      true,
    );
  });

  it("validates org, active flag and required permissions", () => {
    expect(validateApresActor(null, "alexandrefpenha@gmail.com")).toMatchObject({
      ok: false,
      reason: "actor_not_found",
    });

    expect(
      validateApresActor(
        {
          email: "alexandrefpenha@gmail.com",
          isActive: true,
          organizationSlug: "outra",
          permissions: APRES_REQUIRED_PERMISSIONS,
          roleCodes: ["DIRETORIA"],
        },
        "alexandrefpenha@gmail.com",
      ),
    ).toMatchObject({ ok: false, reason: "actor_wrong_organization" });

    expect(
      validateApresActor(
        {
          email: "alexandrefpenha@gmail.com",
          isActive: false,
          organizationSlug: "servsam",
          permissions: APRES_REQUIRED_PERMISSIONS,
          roleCodes: ["DIRETORIA"],
        },
        "alexandrefpenha@gmail.com",
      ),
    ).toMatchObject({ ok: false, reason: "actor_inactive" });

    expect(
      validateApresActor(
        {
          email: "alexandrefpenha@gmail.com",
          isActive: true,
          organizationSlug: "servsam",
          permissions: ["customer.view"],
          roleCodes: ["ADMINISTRATIVO"],
        },
        "alexandrefpenha@gmail.com",
      ),
    ).toMatchObject({ ok: false, reason: "actor_missing_permissions" });

    expect(
      validateApresActor(
        {
          email: "alexandrefpenha@gmail.com",
          isActive: true,
          organizationSlug: "servsam",
          permissions: APRES_REQUIRED_PERMISSIONS,
          roleCodes: ["DIRETORIA"],
        },
        "alexandrefpenha@gmail.com",
      ).ok,
    ).toBe(true);
  });
});

describe("APRES-01.1 recoverable progress", () => {
  it("classifies complete vs pending vs blocked scenarios", () => {
    const result = classifyScenarioProgress([
      { scenarioKey: "APRES-A", creates: 0, transitions: 0, conflicts: 0, noops: 3 },
      { scenarioKey: "APRES-B", creates: 2, transitions: 1, conflicts: 0, noops: 0 },
      { scenarioKey: "APRES-C", creates: 0, transitions: 0, conflicts: 1, noops: 0 },
    ]);
    expect(result.complete).toEqual(["APRES-A"]);
    expect(result.pending).toEqual(["APRES-B"]);
    expect(result.blocked).toEqual(["APRES-C"]);
  });

  it("supports partial failure cursor and idempotent resume via plan rebuild", () => {
    const plan = buildApresProvisionPlan(APRES_01_SCENARIOS, [], []);
    const actions = plan.scenarios[0].actions;
    const { done, remaining } = applyPartialActionCursor(actions, 2);
    expect(done).toHaveLength(2);
    expect(remaining.length).toBe(actions.length - 2);

    // Após "criar" cliente+contato no snapshot, o plano remanescente não recria o cliente.
    const scenario = APRES_01_SCENARIOS[0];
    const resumed = buildApresProvisionPlan(
      [scenario],
      [
        {
          id: "cust-a",
          legalName: scenario.customer.legalName,
          deletedAt: null,
          contacts: [],
          units: [],
        },
      ],
      [],
    );
    expect(resumed.summary.createCustomers).toBe(0);
    expect(resumed.summary.createContacts).toBe(1);
    expect(resumed.summary.createUnits).toBe(1);
    expect(resumed.summary.createProposals).toBe(1);
  });
});
