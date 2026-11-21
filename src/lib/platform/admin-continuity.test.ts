import { describe, expect, it } from "vitest";
import {
  ADMIN_CONTINUITY_LOCK_NS,
  grantsIncludeUserManage,
  permissionKeysIncludeUserManage,
} from "@/lib/platform/admin-continuity";
import { getRuntimeEnvironmentLabel } from "@/lib/platform/runtime-environment";

describe("admin continuity helpers", () => {
  it("detects user.manage in permission key lists", () => {
    expect(permissionKeysIncludeUserManage(["customer.view"])).toBe(false);
    expect(permissionKeysIncludeUserManage(["user.manage", "role.manage"])).toBe(true);
  });

  it("detects user.manage in role grant structures", () => {
    expect(
      grantsIncludeUserManage([
        { permission: { key: "customer.view" } },
        { permission: { key: "proposal.view" } },
      ]),
    ).toBe(false);
    expect(
      grantsIncludeUserManage([{ permission: { key: "user.manage" } }]),
    ).toBe(true);
  });

  it("exposes a stable advisory lock namespace for org serialization", () => {
    expect(ADMIN_CONTINUITY_LOCK_NS).toBe(872_014_501);
  });
});

describe("runtime environment label", () => {
  it("labels preview and production from env without hardcoding copy in callers", () => {
    expect(getRuntimeEnvironmentLabel({ DATABASE_ENV: "preview" }).shortLabel).toBe(
      "Homologação",
    );
    expect(
      getRuntimeEnvironmentLabel({ VERCEL_ENV: "production" }).shortLabel,
    ).toBe("Produção");
    expect(getRuntimeEnvironmentLabel({ DATABASE_ENV: "development" }).code).toBe(
      "development",
    );
  });
});
