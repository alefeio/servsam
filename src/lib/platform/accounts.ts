import { z } from "zod";
import { auth } from "@/lib/platform/auth";
import { userHasPermission, type AuthenticatedUser } from "@/lib/platform/access";
import { writeAudit } from "@/lib/platform/audit";
import { getPrisma } from "@/lib/db/prisma";

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  password: z.string().min(8).max(128),
  roleIds: z.array(z.string().min(1)).min(1),
});

const updateUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  roleIds: z.array(z.string().min(1)).min(1),
});

export type AccountResult = { ok: true } | { ok: false; message: string };

const DENIED = "Você não tem permissão para esta ação.";

function denyWithout(actor: AuthenticatedUser, permission: string): AccountResult | null {
  if (userHasPermission(actor, permission)) return null;
  return { ok: false, message: DENIED };
}

export async function createPlatformUser(
  actor: AuthenticatedUser,
  input: z.infer<typeof createUserSchema>,
): Promise<AccountResult> {
  const denied = denyWithout(actor, "user.manage");
  if (denied) return denied;

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Revise os dados do usuário." };

  const email = parsed.data.email.toLowerCase();
  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { ok: false, message: "Não foi possível criar este usuário." };

  const roles = await prisma.role.findMany({
    where: { id: { in: parsed.data.roleIds }, organizationId: actor.organizationId },
    select: { id: true },
  });
  if (roles.length !== parsed.data.roleIds.length) {
    return { ok: false, message: "Papel inválido para esta organização." };
  }

  const context = await auth.$context;
  const passwordHash = await context.password.hash(parsed.data.password);
  const now = new Date();
  const userId = crypto.randomUUID();

  await prisma.user.create({
    data: {
      id: userId,
      name: parsed.data.name,
      email,
      emailVerified: true,
      organizationId: actor.organizationId,
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
      userRoles: {
        create: roles.map((role) => ({
          id: crypto.randomUUID(),
          roleId: role.id,
          assignedById: actor.id,
        })),
      },
    },
  });

  await writeAudit({
    organizationId: actor.organizationId,
    actorUserId: actor.id,
    action: "USER_CREATED",
    entityType: "User",
    entityId: userId,
    metadata: { email },
  });
  for (const role of roles) {
    await writeAudit({
      organizationId: actor.organizationId,
      actorUserId: actor.id,
      action: "ROLE_ASSIGNED",
      entityType: "UserRole",
      entityId: userId,
      metadata: { roleId: role.id },
    });
  }

  return { ok: true };
}

export async function updatePlatformUser(
  actor: AuthenticatedUser,
  input: z.infer<typeof updateUserSchema>,
): Promise<AccountResult> {
  const denied = denyWithout(actor, "user.manage");
  if (denied) return denied;

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Revise os dados do usuário." };

  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: { id: parsed.data.userId, organizationId: actor.organizationId },
    include: { userRoles: true },
  });
  if (!user) return { ok: false, message: "Usuário não encontrado." };

  const roles = await prisma.role.findMany({
    where: { id: { in: parsed.data.roleIds }, organizationId: actor.organizationId },
    select: { id: true },
  });
  if (roles.length !== new Set(parsed.data.roleIds).size) {
    return { ok: false, message: "Papel inválido para esta organização." };
  }

  const nextRoleIds = new Set(roles.map((role) => role.id));
  const currentRoleIds = new Set(user.userRoles.map((link) => link.roleId));

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, updatedAt: new Date() },
  });
  await writeAudit({
    organizationId: actor.organizationId,
    actorUserId: actor.id,
    action: "USER_UPDATED",
    entityType: "User",
    entityId: user.id,
    metadata: { name: parsed.data.name },
  });

  for (const link of user.userRoles) {
    if (nextRoleIds.has(link.roleId)) continue;
    await prisma.userRole.delete({ where: { id: link.id } });
    await writeAudit({
      organizationId: actor.organizationId,
      actorUserId: actor.id,
      action: "ROLE_REMOVED",
      entityType: "UserRole",
      entityId: user.id,
      metadata: { roleId: link.roleId },
    });
  }

  for (const role of roles) {
    if (currentRoleIds.has(role.id)) continue;
    await prisma.userRole.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        roleId: role.id,
        assignedById: actor.id,
      },
    });
    await writeAudit({
      organizationId: actor.organizationId,
      actorUserId: actor.id,
      action: "ROLE_ASSIGNED",
      entityType: "UserRole",
      entityId: user.id,
      metadata: { roleId: role.id },
    });
  }

  return { ok: true };
}

async function countActiveUserManagers(
  organizationId: string,
  excludingUserId?: string,
): Promise<number> {
  const prisma = getPrisma();
  const managers = await prisma.user.findMany({
    where: {
      organizationId,
      isActive: true,
      ...(excludingUserId ? { id: { not: excludingUserId } } : {}),
    },
    select: {
      userRoles: {
        select: {
          role: {
            select: {
              rolePermissions: { select: { permission: { select: { key: true } } } },
            },
          },
        },
      },
    },
  });
  return managers.filter((user) =>
    user.userRoles.some((link) =>
      link.role.rolePermissions.some((grant) => grant.permission.key === "user.manage"),
    ),
  ).length;
}

export async function setPlatformUserActive(
  actor: AuthenticatedUser,
  userId: string,
  isActive: boolean,
): Promise<AccountResult> {
  const denied = denyWithout(actor, "user.manage");
  if (denied) return denied;

  if (actor.id === userId && !isActive) {
    return { ok: false, message: "Você não pode desativar a própria conta." };
  }

  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId: actor.organizationId },
    select: {
      id: true,
      isActive: true,
      userRoles: {
        select: {
          role: {
            select: {
              rolePermissions: { select: { permission: { select: { key: true } } } },
            },
          },
        },
      },
    },
  });
  if (!user) return { ok: false, message: "Usuário não encontrado." };
  if (user.isActive === isActive) return { ok: true };

  if (!isActive) {
    const managesUsers = user.userRoles.some((link) =>
      link.role.rolePermissions.some((grant) => grant.permission.key === "user.manage"),
    );
    if (managesUsers) {
      const remaining = await countActiveUserManagers(actor.organizationId, user.id);
      if (remaining < 1) {
        return {
          ok: false,
          message:
            "Não é possível desativar o último usuário com permissão de administrar contas.",
        };
      }
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isActive, updatedAt: new Date() },
  });
  if (!isActive) {
    await prisma.session.deleteMany({ where: { userId: user.id } });
  }

  await writeAudit({
    organizationId: actor.organizationId,
    actorUserId: actor.id,
    action: isActive ? "USER_ACTIVATED" : "USER_DISABLED",
    entityType: "User",
    entityId: user.id,
    metadata: {},
  });

  return { ok: true };
}
