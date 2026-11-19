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

const suffix = crypto.randomUUID();
const activeEmail = `reset-active-${suffix}@servsam.local`;
const inactiveEmail = `reset-inactive-${suffix}@servsam.local`;
const initialPassword = "senha-inicial-homol-01";
const nextPassword = "senha-nova-homol-01";
let activeUserId = "";
let inactiveUserId = "";
let organizationId = "";
let roleId = "";

describe.skipIf(!integrationDatabaseGuard().allowed)(
  "password reset (HOMOL)",
  () => {
    beforeAll(async () => {
      if (
        process.env.VERCEL_ENV === "production" ||
        process.env.DATABASE_ENV === "production"
      ) {
        throw new Error("Recusando teste de integração contra production");
      }

      process.env.EMAIL_TEST_MODE = "true";
      process.env.VITEST = "true";

      const { getPrisma } = await import("@/lib/db/prisma");
      const { auth } = await import("@/lib/platform/auth");
      const { clearTestEmailOutbox } = await import("@/lib/platform/email");
      clearTestEmailOutbox();

      const context = await auth.$context;
      const passwordHash = await context.password.hash(initialPassword);
      const prisma = getPrisma();
      const organization = await prisma.organization.findUnique({
        where: { slug: "servsam" },
      });
      if (!organization) throw new Error("Organização SERVSAM ausente. Rode o seed.");
      organizationId = organization.id;

      const role = await prisma.role.findUnique({
        where: {
          organizationId_code: {
            organizationId: organization.id,
            code: "GERENCIA",
          },
        },
      });
      if (!role) throw new Error("Papel GERENCIA ausente.");
      roleId = role.id;

      const now = new Date();
      activeUserId = crypto.randomUUID();
      inactiveUserId = crypto.randomUUID();

      await prisma.user.create({
        data: {
          id: activeUserId,
          name: "Reset Ativo",
          email: activeEmail,
          emailVerified: true,
          organizationId,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          accounts: {
            create: {
              id: crypto.randomUUID(),
              accountId: activeUserId,
              providerId: "credential",
              password: passwordHash,
              createdAt: now,
              updatedAt: now,
            },
          },
          userRoles: { create: { id: crypto.randomUUID(), roleId } },
        },
      });

      await prisma.user.create({
        data: {
          id: inactiveUserId,
          name: "Reset Inativo",
          email: inactiveEmail,
          emailVerified: true,
          organizationId,
          isActive: false,
          createdAt: now,
          updatedAt: now,
          accounts: {
            create: {
              id: crypto.randomUUID(),
              accountId: inactiveUserId,
              providerId: "credential",
              password: passwordHash,
              createdAt: now,
              updatedAt: now,
            },
          },
          userRoles: { create: { id: crypto.randomUUID(), roleId } },
        },
      });
    });

    afterAll(async () => {
      const { getPrisma } = await import("@/lib/db/prisma");
      const prisma = getPrisma();
      const ids = [activeUserId, inactiveUserId].filter(Boolean);
      await prisma.auditLog.deleteMany({ where: { entityId: { in: ids } } });
      await prisma.session.deleteMany({ where: { userId: { in: ids } } });
      await prisma.verification.deleteMany({
        where: {
          OR: ids.map((id) => ({ value: id })),
        },
      });
      for (const id of ids) {
        await prisma.user.delete({ where: { id } }).catch(() => undefined);
      }
      await prisma.$disconnect();
    });

    it("returns the same public ack for unknown email and does not leak existence", async () => {
      const { auth } = await import("@/lib/platform/auth");
      const unknown = await auth.api.requestPasswordReset({
        body: {
          email: `nao-existe-${suffix}@example.com`,
          redirectTo: "/sistema/redefinir-senha",
        },
        headers: new Headers({ origin: "http://localhost:3000" }),
      });
      expect(unknown).toMatchObject({ status: true });
      expect(String(JSON.stringify(unknown)).toLowerCase()).not.toContain("token");
    });

    it("denies reset email for inactive users and removes the token", async () => {
      const { auth } = await import("@/lib/platform/auth");
      const { getPrisma } = await import("@/lib/db/prisma");
      const prisma = getPrisma();

      const response = await auth.api.requestPasswordReset({
        body: {
          email: inactiveEmail,
          redirectTo: "/sistema/redefinir-senha",
        },
        headers: new Headers({ origin: "http://localhost:3000" }),
      });
      expect(response).toMatchObject({ status: true });

      const remaining = await prisma.verification.findMany({
        where: { value: inactiveUserId },
      });
      expect(remaining).toHaveLength(0);

      const denied = await prisma.auditLog.findFirst({
        where: {
          entityId: inactiveUserId,
          action: "PASSWORD_RESET_DENIED_INACTIVE",
        },
      });
      expect(denied).not.toBeNull();
      expect(JSON.stringify(denied?.metadata ?? {})).not.toMatch(/reset-password:/);
    });

    it("resets password with a one-time token, revokes sessions, and keeps roles", async () => {
      const { auth } = await import("@/lib/platform/auth");
      const { getPrisma } = await import("@/lib/db/prisma");
      const { authenticate, endSession } = await import("@/lib/platform/authenticate");
      const { getTestEmailOutbox } = await import("@/lib/platform/email");
      const prisma = getPrisma();

      const loginBefore = await authenticate(activeEmail, initialPassword);
      expect(loginBefore.ok).toBe(true);
      const sessionsBefore = await prisma.session.count({ where: { userId: activeUserId } });
      expect(sessionsBefore).toBeGreaterThan(0);

      const rolesBefore = await prisma.userRole.findMany({
        where: { userId: activeUserId },
        select: { roleId: true },
      });

      const requested = await auth.api.requestPasswordReset({
        body: {
          email: activeEmail,
          redirectTo: "/sistema/redefinir-senha",
        },
        headers: new Headers({ origin: "http://localhost:3000" }),
      });
      expect(requested).toMatchObject({ status: true });

      const outbox = getTestEmailOutbox();
      expect(outbox.some((item) => item.to === activeEmail)).toBe(true);
      expect(JSON.stringify(outbox)).not.toContain("token=");

      const verification = await prisma.verification.findFirst({
        where: {
          value: activeUserId,
          identifier: { startsWith: "reset-password:" },
        },
      });
      expect(verification).not.toBeNull();
      const token = verification!.identifier.replace("reset-password:", "");
      expect(token.length).toBeGreaterThan(8);

      const weak = auth.api.resetPassword({
        body: { newPassword: "curta", token },
      });
      await expect(weak).rejects.toBeTruthy();

      const reset = await auth.api.resetPassword({
        body: { newPassword: nextPassword, token },
      });
      expect(reset).toMatchObject({ status: true });

      const reused = auth.api.resetPassword({
        body: { newPassword: "outra-senha-valida-99", token },
      });
      await expect(reused).rejects.toBeTruthy();

      const sessionsAfter = await prisma.session.count({ where: { userId: activeUserId } });
      expect(sessionsAfter).toBe(0);

      const completed = await prisma.auditLog.findFirst({
        where: { entityId: activeUserId, action: "PASSWORD_RESET_COMPLETED" },
      });
      expect(completed).not.toBeNull();

      const rolesAfter = await prisma.userRole.findMany({
        where: { userId: activeUserId },
        select: { roleId: true },
      });
      expect(rolesAfter).toEqual(rolesBefore);

      const userAfter = await prisma.user.findUnique({
        where: { id: activeUserId },
        select: { organizationId: true, isActive: true },
      });
      expect(userAfter).toMatchObject({
        organizationId,
        isActive: true,
      });

      const oldLogin = await authenticate(activeEmail, initialPassword);
      expect(oldLogin.ok).toBe(false);

      const newLogin = await authenticate(activeEmail, nextPassword);
      expect(newLogin.ok).toBe(true);
      await endSession();
    });

    it("rejects an expired reset token", async () => {
      const { auth } = await import("@/lib/platform/auth");
      const { getPrisma } = await import("@/lib/db/prisma");
      const prisma = getPrisma();
      const expiredToken = `expired-${crypto.randomUUID()}`;
      await prisma.verification.create({
        data: {
          id: crypto.randomUUID(),
          identifier: `reset-password:${expiredToken}`,
          value: activeUserId,
          expiresAt: new Date(Date.now() - 60_000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await expect(
        auth.api.resetPassword({
          body: { newPassword: "senha-expirada-teste-1", token: expiredToken },
        }),
      ).rejects.toBeTruthy();
    });
  },
);
