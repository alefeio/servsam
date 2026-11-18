import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { DEMO_SESSION_STORAGE_KEY } from "@/data/demo/auth";
import {
  hasPermission,
  seedGrantsFor,
  unionPermissions,
} from "@/lib/platform/permissions";
import { sanitizeAuditMetadata } from "@/lib/platform/audit";
import { getMigrationDatabaseUrl, getRuntimeDatabaseUrl } from "@/lib/db/urls";
import { getAuthBaseURL, getTrustedOrigins } from "@/lib/platform/auth-url";

describe("permission keys", () => {
  it("unions role grants and ignores the role name", () => {
    const granted = unionPermissions([["customer.view"], ["finance.view"]]);
    expect(hasPermission(granted, "finance.view")).toBe(true);
    expect(hasPermission(granted, "user.manage")).toBe(false);
    expect(hasPermission(new Set(["DIRETORIA"]), "user.manage")).toBe(false);
  });

  it("keeps finance out of gerencia and administrativo", () => {
    const gerencia = new Set(
      seedGrantsFor("GERENCIA").map((grant) => grant.key),
    );
    const administrativo = new Set(
      seedGrantsFor("ADMINISTRATIVO").map((grant) => grant.key),
    );
    expect(gerencia.has("finance.manage")).toBe(false);
    expect(gerencia.has("finance.view")).toBe(false);
    expect(administrativo.has("finance.view")).toBe(false);
    expect(administrativo.has("user.manage")).toBe(false);
  });

  it("gives diretoria the provisional administration keys", () => {
    const diretoria = new Set(
      seedGrantsFor("DIRETORIA").map((grant) => grant.key),
    );
    expect(diretoria.has("user.manage")).toBe(true);
    expect(diretoria.has("role.manage")).toBe(true);
    expect(diretoria.has("audit.view")).toBe(true);
  });

  it("marks administrativo schedule access as inferred", () => {
    const schedule = seedGrantsFor("ADMINISTRATIVO").find(
      (grant) => grant.key === "schedule.view",
    );
    expect(schedule?.basis).toBe("inferred");
  });
});

describe("audit metadata", () => {
  it("drops secrets and keeps the reason", () => {
    const clean = sanitizeAuditMetadata({
      reason: "rejected",
      password: "segredo",
      token: "abc",
      nested: { hash: "xyz", email: "a@b.c" },
    });
    expect(clean).toEqual({ reason: "rejected", nested: { email: "a@b.c" } });
  });
});

describe("database url roles", () => {
  it("reads runtime and migration from different variables", () => {
    const env = {
      RUNTIME_DATABASE_URL: "postgresql://runtime",
      POSTGRES_URL: "postgresql://migrate",
      DATABASE_URL: "postgresql://ignored",
      PRISMA_DATABASE_URL: "postgresql://also-ignored",
    };
    expect(getRuntimeDatabaseUrl(env)).toBe("postgresql://runtime");
    expect(getMigrationDatabaseUrl(env)).toBe("postgresql://migrate");
  });

  it("prefers HOMOL urls when DATABASE_ENV is preview", () => {
    const env = {
      DATABASE_ENV: "preview",
      RUNTIME_DATABASE_URL: "postgresql://shared-runtime",
      POSTGRES_URL: "postgresql://shared-migrate",
      HOMOL_DATABASE_URL_POOLED: "postgresql://homol-pooled",
      HOMOL_POSTGRES_URL: "postgresql://homol-migrate",
      HOMOL_DATABASE_URL: "postgresql://homol-direct",
    };
    expect(getRuntimeDatabaseUrl(env)).toBe("postgresql://homol-pooled");
    expect(getMigrationDatabaseUrl(env)).toBe("postgresql://homol-migrate");
  });

  it("fails closed on preview without HOMOL urls", () => {
    const env = {
      DATABASE_ENV: "preview",
      RUNTIME_DATABASE_URL: "postgresql://shared-runtime",
      POSTGRES_URL: "postgresql://shared-migrate",
    };
    expect(() => getRuntimeDatabaseUrl(env)).toThrow(/HOMOL_/);
    expect(() => getMigrationDatabaseUrl(env)).toThrow(/HOMOL_/);
  });
});

describe("preview auth origins", () => {
  it("ignores shared BETTER_AUTH_URL on preview and trusts the deployment host", () => {
    const env = {
      DATABASE_ENV: "preview",
      VERCEL_ENV: "preview",
      VERCEL_URL: "servsam-preview-abc.vercel.app",
      VERCEL_BRANCH_URL: "servsam-git-branch.vercel.app",
      BETTER_AUTH_URL: "https://servsam.vercel.app",
    };
    expect(getAuthBaseURL(env)).toBe("https://servsam-preview-abc.vercel.app");
    expect(getTrustedOrigins(env)).toEqual(
      expect.arrayContaining([
        "https://servsam-preview-abc.vercel.app",
        "https://servsam-git-branch.vercel.app",
      ]),
    );
    expect(getTrustedOrigins(env)).not.toContain("https://servsam.vercel.app");
  });
});

describe("demo and production stay apart", () => {
  it("does not reuse the demo session key or the demo password in production code", () => {
    expect(DEMO_SESSION_STORAGE_KEY).toBe("servsam.demo.session");
    const files = listSource([
      "src/lib/platform",
      "src/app/sistema",
      "src/features/platform",
    ]);
    const combined = files.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(combined.includes("localStorage")).toBe(false);
    expect(combined.includes("servsam-demo")).toBe(false);
    expect(combined.includes("servsam.demo.session")).toBe(false);
    expect(combined.includes("@/lib/demo/session")).toBe(false);
    expect(combined.includes("requireAuthenticatedUser")).toBe(true);
    expect(combined.includes("requirePermission")).toBe(true);
  });
});

function listSource(directories: string[]): string[] {
  const found: string[] = [];
  for (const directory of directories) {
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry);
      const stat = statSync(path);
      if (stat.isDirectory()) {
        found.push(...listSource([path]));
      } else if (
        (path.endsWith(".ts") || path.endsWith(".tsx")) &&
        !path.endsWith(".test.ts") &&
        !path.endsWith(".test.tsx") &&
        !path.endsWith(".spec.ts") &&
        !path.endsWith(".spec.tsx")
      ) {
        found.push(path);
      }
    }
  }
  return found;
}
