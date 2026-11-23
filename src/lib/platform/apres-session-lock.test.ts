import { describe, expect, it } from "vitest";
import { pickLockConnectionUrl } from "@/lib/platform/apres-session-lock";
import {
  evaluateIndependentHomolMarkers,
  HOMOL_INDEPENDENT_MARKERS,
  refuseIfSameInstanceAsLegacy,
} from "@/lib/platform/homol-instance-identity";

describe("APRES-01.1a lock URL selection", () => {
  it("prefers direct HOMOL URL over pooled", () => {
    const chosen = pickLockConnectionUrl({
      HOMOL_DATABASE_URL_POOLED:
        "postgres://u:p@db.prisma.io:5432/postgres?pgbouncer=true",
      HOMOL_POSTGRES_URL: "postgres://u:p@db.prisma.io:5432/postgres",
    });
    expect(chosen.source).toBe("HOMOL_POSTGRES_URL");
    expect(chosen.poolerSuspected).toBe(false);
  });

  it("rejects when only transaction pooler is available", () => {
    expect(() =>
      pickLockConnectionUrl({
        HOMOL_DATABASE_URL_POOLED:
          "postgres://u:p@pooler.prisma.io:5432/postgres?pgbouncer=true",
      }),
    ).toThrow(/lock_requires_direct_homol_url/);
  });
});

describe("APRES-01.1a independent HOMOL markers", () => {
  it("requires servsam org and 11A migration", () => {
    expect(
      evaluateIndependentHomolMarkers({
        organizationSlug: "servsam",
        migrationNames: [HOMOL_INDEPENDENT_MARKERS.requiredMigration],
      }).ok,
    ).toBe(true);

    expect(
      evaluateIndependentHomolMarkers({
        organizationSlug: "outra",
        migrationNames: [HOMOL_INDEPENDENT_MARKERS.requiredMigration],
      }),
    ).toMatchObject({ ok: false, reason: "independent_org_slug_mismatch" });

    expect(
      evaluateIndependentHomolMarkers({
        organizationSlug: "servsam",
        migrationNames: [HOMOL_INDEPENDENT_MARKERS.legacyFoundationMigration],
      }),
    ).toMatchObject({
      ok: false,
      reason: "independent_looks_like_legacy_foundation_only",
    });
  });

  it("refuses when live instance id equals legacy instance id", () => {
    expect(refuseIfSameInstanceAsLegacy("abc", "abc")).toMatchObject({
      ok: false,
      reason: "live_instance_matches_legacy_instance",
    });
    expect(refuseIfSameInstanceAsLegacy("abc", "def")).toEqual({
      ok: true,
      legacyCompared: true,
    });
  });
});
