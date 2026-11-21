/**
 * @vitest-environment node
 *
 * Concorrência real no PostgreSQL: serialização por advisory lock da org.
 * Usa organização descartável — não altera usuários/seed da SERVSAM.
 */
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { integrationDatabaseGuard } from "@/lib/db/test-guard";
import type { AuthenticatedUser } from "@/lib/platform/access";

loadEnv({ path: ".env.local" });

const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
const orgId = `sec-p0-org-${suffix}`;
const orgSlug = `sec-p0-${suffix}`;

let adminRoleId = "";
let viewerRoleId = "";
let altAdminRoleId = "";
let userAId = "";
let userBId = "";
let outsiderOrgId = "";
let outsiderUserId = "";
let outsiderAdminRoleId = "";
let outsiderViewerRoleId = "";

function actorFor(userId: string, organizationId: string): AuthenticatedUser {
  return {
    id: userId,
    name: "SEC-P0 Actor",
    email: `actor-${userId}@servsam.local`,
    organizationId,
    isActive: true,
    permissions: new Set(["user.manage", "role.manage"]),
    roleCodes: ["ADMIN_SEC"],
    roleNames: ["Admin SEC"],
  };
}

async function countManagers(organizationId: string): Promise<number> {
  const { countActiveUserManagers } = await import(
    "@/lib/platform/admin-continuity"
  );
  return countActiveUserManagers(organizationId);
}

async function cleanupOrg(organizationId: string): Promise<void> {
  const { getPrisma } = await import("@/lib/db/prisma");
  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    where: { organizationId },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);
  if (userIds.length > 0) {
    await prisma.auditLog.deleteMany({
      where: {
        OR: [{ organizationId }, { actorUserId: { in: userIds } }, { entityId: { in: userIds } }],
      },
    });
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.account.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { organizationId } });
  } else {
    await prisma.auditLog.deleteMany({ where: { organizationId } });
  }
  const roles = await prisma.role.findMany({
    where: { organizationId },
    select: { id: true },
  });
  const roleIds = roles.map((role) => role.id);
  if (roleIds.length > 0) {
    await prisma.rolePermission.deleteMany({ where: { roleId: { in: roleIds } } });
    await prisma.role.deleteMany({ where: { organizationId } });
  }
  await prisma.organization.delete({ where: { id: organizationId } }).catch(() => undefined);
}

describe.skipIf(!integrationDatabaseGuard().allowed)(
  "admin continuity concurrency",
  () => {
    beforeAll(async () => {
      if (
        process.env.VERCEL_ENV === "production" ||
        process.env.DATABASE_ENV === "production"
      ) {
        throw new Error("Recusando teste de concorrência contra production");
      }

      const { getPrisma } = await import("@/lib/db/prisma");
      const prisma = getPrisma();
      const now = new Date();

      const manage = await prisma.permission.findUnique({
        where: { key: "user.manage" },
      });
      const roleManage = await prisma.permission.findUnique({
        where: { key: "role.manage" },
      });
      const dashboard = await prisma.permission.findUnique({
        where: { key: "dashboard.view" },
      });
      if (!manage || !roleManage || !dashboard) {
        throw new Error("Permissões seed ausentes.");
      }

      await prisma.organization.create({
        data: {
          id: orgId,
          name: "SEC-P0 Continuity",
          slug: orgSlug,
          createdAt: now,
          updatedAt: now,
        },
      });

      adminRoleId = crypto.randomUUID();
      viewerRoleId = crypto.randomUUID();
      altAdminRoleId = crypto.randomUUID();

      await prisma.role.createMany({
        data: [
          {
            id: adminRoleId,
            organizationId: orgId,
            code: "ADMIN_SEC",
            name: "Admin SEC",
            description: "Admin temporário SEC-P0",
            isSystem: false,
          },
          {
            id: viewerRoleId,
            organizationId: orgId,
            code: "VIEWER_SEC",
            name: "Viewer SEC",
            description: "Sem user.manage",
            isSystem: false,
          },
          {
            id: altAdminRoleId,
            organizationId: orgId,
            code: "ALT_ADMIN_SEC",
            name: "Alt Admin SEC",
            description: "Segundo papel com user.manage",
            isSystem: false,
          },
        ],
      });

      await prisma.rolePermission.createMany({
        data: [
          {
            id: crypto.randomUUID(),
            roleId: adminRoleId,
            permissionId: manage.id,
          },
          {
            id: crypto.randomUUID(),
            roleId: adminRoleId,
            permissionId: roleManage.id,
          },
          {
            id: crypto.randomUUID(),
            roleId: altAdminRoleId,
            permissionId: manage.id,
          },
          {
            id: crypto.randomUUID(),
            roleId: viewerRoleId,
            permissionId: dashboard.id,
          },
        ],
      });

      userAId = crypto.randomUUID();
      userBId = crypto.randomUUID();
      await prisma.user.createMany({
        data: [
          {
            id: userAId,
            name: "Admin A",
            email: `sec-p0-a-${suffix}@servsam.local`,
            emailVerified: true,
            organizationId: orgId,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: userBId,
            name: "Admin B",
            email: `sec-p0-b-${suffix}@servsam.local`,
            emailVerified: true,
            organizationId: orgId,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          },
        ],
      });
      await prisma.userRole.createMany({
        data: [
          { id: crypto.randomUUID(), userId: userAId, roleId: adminRoleId },
          { id: crypto.randomUUID(), userId: userBId, roleId: adminRoleId },
        ],
      });

      outsiderOrgId = `sec-p0-out-${suffix}`;
      await prisma.organization.create({
        data: {
          id: outsiderOrgId,
          name: "SEC-P0 Outsider",
          slug: `sec-p0-out-${suffix}`,
          createdAt: now,
          updatedAt: now,
        },
      });
      outsiderAdminRoleId = crypto.randomUUID();
      outsiderViewerRoleId = crypto.randomUUID();
      await prisma.role.createMany({
        data: [
          {
            id: outsiderAdminRoleId,
            organizationId: outsiderOrgId,
            code: "ADMIN_OUT",
            name: "Admin Out",
            description: "Isolamento",
            isSystem: false,
          },
          {
            id: outsiderViewerRoleId,
            organizationId: outsiderOrgId,
            code: "VIEWER_OUT",
            name: "Viewer Out",
            description: "Isolamento",
            isSystem: false,
          },
        ],
      });
      await prisma.rolePermission.createMany({
        data: [
          {
            id: crypto.randomUUID(),
            roleId: outsiderAdminRoleId,
            permissionId: manage.id,
          },
          {
            id: crypto.randomUUID(),
            roleId: outsiderViewerRoleId,
            permissionId: dashboard.id,
          },
        ],
      });
      outsiderUserId = crypto.randomUUID();
      await prisma.user.create({
        data: {
          id: outsiderUserId,
          name: "Outsider Admin",
          email: `sec-p0-out-${suffix}@servsam.local`,
          emailVerified: true,
          organizationId: outsiderOrgId,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          userRoles: {
            create: {
              id: crypto.randomUUID(),
              roleId: outsiderAdminRoleId,
            },
          },
        },
      });
    });

    afterAll(async () => {
      const { getPrisma } = await import("@/lib/db/prisma");
      await cleanupOrg(orgId);
      await cleanupOrg(outsiderOrgId);
      await getPrisma().$disconnect();
    });

    it("serializes concurrent demotions so at least one admin remains", async () => {
      const { updatePlatformUser } = await import("@/lib/platform/accounts");
      const { LAST_ADMIN_MESSAGE } = await import(
        "@/lib/platform/admin-continuity"
      );

      expect(await countManagers(orgId)).toBe(2);

      const [resultA, resultB] = await Promise.all([
        updatePlatformUser(actorFor(userAId, orgId), {
          userId: userAId,
          name: "Admin A",
          roleIds: [viewerRoleId],
        }),
        updatePlatformUser(actorFor(userBId, orgId), {
          userId: userBId,
          name: "Admin B",
          roleIds: [viewerRoleId],
        }),
      ]);

      const successes = [resultA, resultB].filter((result) => result.ok).length;
      const failures = [resultA, resultB].filter((result) => !result.ok);
      expect(successes).toBe(1);
      expect(failures).toHaveLength(1);
      expect(failures[0]?.ok).toBe(false);
      if (!failures[0]?.ok) {
        expect(failures[0].message).toBe(LAST_ADMIN_MESSAGE);
      }
      expect(await countManagers(orgId)).toBe(1);

      // Restaura dois admins para os próximos cenários.
      const { getPrisma } = await import("@/lib/db/prisma");
      const prisma = getPrisma();
      await prisma.userRole.deleteMany({
        where: { userId: { in: [userAId, userBId] } },
      });
      await prisma.userRole.createMany({
        data: [
          { id: crypto.randomUUID(), userId: userAId, roleId: adminRoleId },
          { id: crypto.randomUUID(), userId: userBId, roleId: adminRoleId },
        ],
      });
      await prisma.user.updateMany({
        where: { id: { in: [userAId, userBId] } },
        data: { isActive: true },
      });
      expect(await countManagers(orgId)).toBe(2);
    });

    it("serializes demotion vs deactivation without zeroing admins", async () => {
      const { updatePlatformUser, setPlatformUserActive } = await import(
        "@/lib/platform/accounts"
      );
      const { LAST_ADMIN_MESSAGE } = await import(
        "@/lib/platform/admin-continuity"
      );

      const [demoteA, disableB] = await Promise.all([
        updatePlatformUser(actorFor(userBId, orgId), {
          userId: userAId,
          name: "Admin A",
          roleIds: [viewerRoleId],
        }),
        setPlatformUserActive(actorFor(userAId, orgId), userBId, false),
      ]);

      const outcomes = [demoteA, disableB];
      expect(outcomes.filter((result) => result.ok)).toHaveLength(1);
      const failed = outcomes.find((result) => !result.ok);
      expect(failed).toBeDefined();
      if (failed && !failed.ok) {
        expect(failed.message).toBe(LAST_ADMIN_MESSAGE);
      }
      expect(await countManagers(orgId)).toBe(1);

      const { getPrisma } = await import("@/lib/db/prisma");
      const prisma = getPrisma();
      await prisma.user.updateMany({
        where: { id: { in: [userAId, userBId] } },
        data: { isActive: true },
      });
      await prisma.userRole.deleteMany({
        where: { userId: { in: [userAId, userBId] } },
      });
      await prisma.userRole.createMany({
        data: [
          { id: crypto.randomUUID(), userId: userAId, roleId: adminRoleId },
          { id: crypto.randomUUID(), userId: userBId, roleId: altAdminRoleId },
        ],
      });
      expect(await countManagers(orgId)).toBe(2);
    });

    it("serializes concurrent role permission strips across distinct admin roles", async () => {
      const { updateRolePermissions } = await import("@/lib/platform/roles");
      const { LAST_ADMIN_MESSAGE } = await import(
        "@/lib/platform/admin-continuity"
      );
      const { getPrisma } = await import("@/lib/db/prisma");

      const [stripAdmin, stripAlt] = await Promise.all([
        updateRolePermissions(actorFor(userAId, orgId), adminRoleId, [
          "dashboard.view",
        ]),
        updateRolePermissions(actorFor(userBId, orgId), altAdminRoleId, [
          "dashboard.view",
        ]),
      ]);

      const okCount = [stripAdmin, stripAlt].filter((result) => result.ok).length;
      expect(okCount).toBe(1);
      const failed = [stripAdmin, stripAlt].find((result) => !result.ok);
      expect(failed && !failed.ok && failed.message).toBe(LAST_ADMIN_MESSAGE);
      expect(await countManagers(orgId)).toBe(1);

      const audits = await getPrisma().auditLog.count({
        where: {
          organizationId: orgId,
          action: { in: ["PERMISSION_REVOKED", "ROLE_UPDATED"] },
        },
      });
      expect(audits).toBeGreaterThan(0);

      // Restaura grants para limpeza previsível.
      const manage = await getPrisma().permission.findUnique({
        where: { key: "user.manage" },
      });
      const roleManage = await getPrisma().permission.findUnique({
        where: { key: "role.manage" },
      });
      if (!manage || !roleManage) throw new Error("Permissões ausentes.");
      await getPrisma().rolePermission.deleteMany({
        where: { roleId: { in: [adminRoleId, altAdminRoleId] } },
      });
      await getPrisma().rolePermission.createMany({
        data: [
          {
            id: crypto.randomUUID(),
            roleId: adminRoleId,
            permissionId: manage.id,
          },
          {
            id: crypto.randomUUID(),
            roleId: adminRoleId,
            permissionId: roleManage.id,
          },
          {
            id: crypto.randomUUID(),
            roleId: altAdminRoleId,
            permissionId: manage.id,
          },
        ],
      });
      await getPrisma().userRole.deleteMany({
        where: { userId: { in: [userAId, userBId] } },
      });
      await getPrisma().userRole.createMany({
        data: [
          { id: crypto.randomUUID(), userId: userAId, roleId: adminRoleId },
          { id: crypto.randomUUID(), userId: userBId, roleId: adminRoleId },
        ],
      });
      expect(await countManagers(orgId)).toBe(2);
    });

    it("keeps outsider organization managers untouched by concurrent ops", async () => {
      expect(await countManagers(outsiderOrgId)).toBe(1);

      const { updatePlatformUser } = await import("@/lib/platform/accounts");
      await Promise.all([
        updatePlatformUser(actorFor(userAId, orgId), {
          userId: userAId,
          name: "Admin A renamed",
          roleIds: [adminRoleId],
        }),
        updatePlatformUser(actorFor(userBId, orgId), {
          userId: userBId,
          name: "Admin B renamed",
          roleIds: [adminRoleId],
        }),
      ]);

      expect(await countManagers(outsiderOrgId)).toBe(1);
      expect(await countManagers(orgId)).toBe(2);
    });
  },
);
