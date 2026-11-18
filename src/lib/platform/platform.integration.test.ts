/**
 * @vitest-environment node
 */
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { integrationDatabaseGuard } from "@/lib/db/test-guard";

loadEnv({ path: ".env.local" });

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({
    set: () => undefined,
    get: () => undefined,
    delete: () => undefined,
  }),
}));

const email = `sprint9-${crypto.randomUUID()}@servsam.local`;
const password = "teste-sprint9-senha";
let userId = "";
let organizationId = "";

// Só roda com DATABASE_ENV=preview|test e URL HOMOL_*. Ver `npm run test:integration`.
describe.skipIf(!integrationDatabaseGuard().allowed)(
  "platform database",
  () => {
    beforeAll(async () => {
      if (
        process.env.VERCEL_ENV === "production" ||
        process.env.DATABASE_ENV === "production"
      ) {
        throw new Error("Recusando teste de integração contra production");
      }
      const { getPrisma } = await import("@/lib/db/prisma");
      const { auth } = await import("@/lib/platform/auth");
      const context = await auth.$context;
      const passwordHash = await context.password.hash(password);
      const prisma = getPrisma();
      const organization = await prisma.organization.findUnique({
        where: { slug: "servsam" },
      });
      if (!organization)
        throw new Error("Organização SERVSAM ausente. Rode o seed.");
      organizationId = organization.id;
      const role = await prisma.role.findUnique({
        where: {
          organizationId_code: {
            organizationId: organization.id,
            code: "DIRETORIA",
          },
        },
      });
      if (!role) throw new Error("Papel DIRETORIA ausente.");
      const now = new Date();
      userId = crypto.randomUUID();
      await prisma.user.create({
        data: {
          id: userId,
          name: "Teste Sprint 9",
          email,
          emailVerified: true,
          organizationId: organization.id,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          accounts: {
            create: {
              id: crypto.randomUUID(),
              accountId: userId,
              providerId: "credential",
              password: passwordHash,
              createdAt: now,
              updatedAt: now,
            },
          },
          userRoles: { create: { id: crypto.randomUUID(), roleId: role.id } },
        },
      });
    });

    afterAll(async () => {
      const { getPrisma } = await import("@/lib/db/prisma");
      const prisma = getPrisma();
      await prisma.auditLog.deleteMany({ where: { entityId: userId } });
      await prisma.session.deleteMany({ where: { userId } });
      await prisma.user
        .delete({ where: { id: userId } })
        .catch(() => undefined);
      await prisma.$disconnect();
    });

    it("rejects an unknown password without creating a session", async () => {
      const { authenticate } = await import("@/lib/platform/authenticate");
      const { getPrisma } = await import("@/lib/db/prisma");
      const result = await authenticate(email, "senha-errada-123");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toBe("E-mail ou senha inválidos.");
      const sessions = await getPrisma().session.count({ where: { userId } });
      expect(sessions).toBe(0);
      const failure = await getPrisma().auditLog.findFirst({
        where: { entityId: userId, action: "LOGIN_FAILURE" },
      });
      expect(failure?.metadata).toMatchObject({ reason: "rejected" });
    });

    it("signs in an active user and records the audit", async () => {
      const { authenticate, endSession } =
        await import("@/lib/platform/authenticate");
      const { getPrisma } = await import("@/lib/db/prisma");
      const result = await authenticate(email, password);
      expect(result.ok).toBe(true);
      const success = await getPrisma().auditLog.findFirst({
        where: { entityId: userId, action: "LOGIN_SUCCESS" },
      });
      expect(success?.organizationId).toBe(organizationId);
      await endSession();
    });

    it("blocks an inactive user with the same message", async () => {
      const { authenticate } = await import("@/lib/platform/authenticate");
      const { getPrisma } = await import("@/lib/db/prisma");
      await getPrisma().user.update({
        where: { id: userId },
        data: { isActive: false },
      });
      const result = await authenticate(email, password);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toBe("E-mail ou senha inválidos.");
      const failure = await getPrisma().auditLog.findFirst({
        where: {
          entityId: userId,
          action: "LOGIN_FAILURE",
          metadata: { path: ["reason"], equals: "inactive" },
        },
      });
      expect(failure).not.toBeNull();
      await getPrisma().user.update({
        where: { id: userId },
        data: { isActive: true },
      });
    });

    it("authorizes by permission key, not by the role code", async () => {
      const { getPrisma } = await import("@/lib/db/prisma");
      const { hasPermission } = await import("@/lib/platform/permissions");
      const prisma = getPrisma();
      const customRole = await prisma.role.create({
        data: {
          id: crypto.randomUUID(),
          organizationId,
          code: `TESTE_${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          name: "Teste",
          description: "Papel sem permissão de usuário",
          isSystem: false,
        },
      });
      const holderId = crypto.randomUUID();
      const now = new Date();
      await prisma.user.create({
        data: {
          id: holderId,
          name: "Sem gestão",
          email: `sem-gestao-${holderId}@servsam.local`,
          emailVerified: true,
          organizationId,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          userRoles: {
            create: { id: crypto.randomUUID(), roleId: customRole.id },
          },
        },
      });
      const links = await prisma.userRole.findMany({
        where: { userId: holderId },
        include: {
          role: {
            include: { rolePermissions: { include: { permission: true } } },
          },
        },
      });
      const granted = new Set(
        links.flatMap((link) =>
          link.role.rolePermissions.map((item) => item.permission.key),
        ),
      );
      expect(links[0]?.role.code.startsWith("TESTE_")).toBe(true);
      expect(hasPermission(granted, "user.manage")).toBe(false);

      const actor = {
        id: userId,
        name: "Teste Sprint 9",
        email,
        organizationId,
        isActive: true,
        permissions: new Set(["user.manage", "role.manage"]),
        roleCodes: ["DIRETORIA"],
      };
      const { createPlatformRole, updateRolePermissions } =
        await import("@/lib/platform/roles");
      const { createPlatformUser, setPlatformUserActive } =
        await import("@/lib/platform/accounts");
      const refused = await setPlatformUserActive(
        { ...actor, permissions: new Set<string>(), roleCodes: ["DIRETORIA"] },
        holderId,
        false,
      );
      expect(refused.ok).toBe(false);

      const grantedResult = await updateRolePermissions(actor, customRole.id, [
        "dashboard.view",
      ]);
      expect(grantedResult.ok).toBe(true);
      const disabled = await setPlatformUserActive(actor, holderId, false);
      expect(disabled.ok).toBe(true);
      const stored = await prisma.user.findUnique({ where: { id: holderId } });
      expect(stored?.isActive).toBe(false);
      const disabledAudit = await prisma.auditLog.findFirst({
        where: { entityId: holderId, action: "USER_DISABLED" },
      });
      expect(disabledAudit).not.toBeNull();
      const audit = await prisma.auditLog.findFirst({
        where: { entityId: customRole.id, action: "PERMISSION_GRANTED" },
      });
      expect(audit?.metadata).toMatchObject({ permission: "dashboard.view" });

      const extraCode = `EXTRA_${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const createdRole = await createPlatformRole(actor, {
        name: "Papel teste",
        code: extraCode,
        description: "Criado pelo teste de plataforma",
      });
      expect(createdRole.ok).toBe(true);
      const extraRole = await prisma.role.findUnique({
        where: { organizationId_code: { organizationId, code: extraCode } },
      });
      expect(extraRole).not.toBeNull();

      const createdEmail = `criado-${crypto.randomUUID()}@servsam.local`;
      const created = await createPlatformUser(actor, {
        name: "Criado no teste",
        email: createdEmail,
        password: "teste-sprint9-senha",
        roleIds: [customRole.id],
      });
      expect(created.ok).toBe(true);
      const createdUser = await prisma.user.findUnique({
        where: { email: createdEmail },
      });
      const assigned = await prisma.auditLog.findFirst({
        where: { entityId: createdUser?.id, action: "ROLE_ASSIGNED" },
      });
      expect(assigned).not.toBeNull();

      await prisma.auditLog.deleteMany({
        where: {
          OR: [
            { entityId: holderId },
            { entityId: customRole.id },
            { entityId: extraRole?.id ?? "missing" },
            { entityId: createdUser?.id ?? "missing" },
          ],
        },
      });
      if (createdUser)
        await prisma.user.delete({ where: { id: createdUser.id } });
      await prisma.user.delete({ where: { id: holderId } });
      if (extraRole) await prisma.role.delete({ where: { id: extraRole.id } });
      await prisma.role.delete({ where: { id: customRole.id } });
    });
  },
);
