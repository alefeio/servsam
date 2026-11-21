import { z } from "zod";
import { userHasPermission, type AuthenticatedUser } from "@/lib/platform/access";
import {
  LAST_ADMIN_MESSAGE,
  withOrganizationAdminContinuity,
  wouldRetainManagerAfterRolePermissionChange,
} from "@/lib/platform/admin-continuity";
import { writeAudit } from "@/lib/platform/audit";
import { getPrisma } from "@/lib/db/prisma";
import { DIRETORIA_LOCKED_PERMISSIONS } from "@/lib/platform/permissions";

const createRoleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9_]+$/, "Use letras maiúsculas, números e _."),
  description: z.string().trim().min(2).max(240),
});

export type RoleResult = { ok: true } | { ok: false; message: string };

const DENIED = "Você não tem permissão para esta ação.";

function denyWithout(actor: AuthenticatedUser, permission: string): RoleResult | null {
  if (userHasPermission(actor, permission)) return null;
  return { ok: false, message: DENIED };
}

export async function createPlatformRole(
  actor: AuthenticatedUser,
  input: z.infer<typeof createRoleSchema>,
): Promise<RoleResult> {
  const denied = denyWithout(actor, "role.manage");
  if (denied) return denied;

  const parsed = createRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Revise o papel." };

  const prisma = getPrisma();
  const code = parsed.data.code.toUpperCase();
  const existing = await prisma.role.findUnique({
    where: { organizationId_code: { organizationId: actor.organizationId, code } },
    select: { id: true },
  });
  if (existing) return { ok: false, message: "Já existe um papel com este código." };

  const role = await prisma.role.create({
    data: {
      id: crypto.randomUUID(),
      organizationId: actor.organizationId,
      code,
      name: parsed.data.name,
      description: parsed.data.description,
      isSystem: false,
    },
  });

  await writeAudit({
    organizationId: actor.organizationId,
    actorUserId: actor.id,
    action: "ROLE_CREATED",
    entityType: "Role",
    entityId: role.id,
    metadata: { code },
  });

  return { ok: true };
}

export async function updateRolePermissions(
  actor: AuthenticatedUser,
  roleId: string,
  permissionKeys: string[],
): Promise<RoleResult> {
  const denied = denyWithout(actor, "role.manage");
  if (denied) return denied;

  const uniqueKeys = [...new Set(permissionKeys)];

  return withOrganizationAdminContinuity(actor.organizationId, async (tx) => {
    const role = await tx.role.findFirst({
      where: { id: roleId, organizationId: actor.organizationId },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) return { ok: false, message: "Papel não encontrado." };

    const permissions = await tx.permission.findMany({
      where: { key: { in: uniqueKeys } },
      select: { id: true, key: true },
    });
    if (permissions.length !== uniqueKeys.length) {
      return { ok: false, message: "Há permissão desconhecida na lista." };
    }

    if (role.code === "DIRETORIA") {
      const missing = DIRETORIA_LOCKED_PERMISSIONS.filter(
        (key) => !uniqueKeys.includes(key),
      );
      if (missing.length > 0) {
        return {
          ok: false,
          message:
            "Diretoria precisa manter a administração de usuários, papéis e auditoria.",
        };
      }
    }

    const currentlyHasManage = role.rolePermissions.some(
      (link) => link.permission.key === "user.manage",
    );
    const nextHasManage = uniqueKeys.includes("user.manage");
    if (currentlyHasManage && !nextHasManage) {
      const retains = await wouldRetainManagerAfterRolePermissionChange(
        actor.organizationId,
        role.id,
        uniqueKeys,
        tx,
      );
      if (!retains) {
        return { ok: false, message: LAST_ADMIN_MESSAGE };
      }
    }

    const nextIds = new Set(permissions.map((permission) => permission.id));
    const current = new Map(
      role.rolePermissions.map((link) => [link.permissionId, link]),
    );

    for (const link of role.rolePermissions) {
      if (nextIds.has(link.permissionId)) continue;
      await tx.rolePermission.delete({ where: { id: link.id } });
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "PERMISSION_REVOKED",
          entityType: "RolePermission",
          entityId: role.id,
          metadata: { permission: link.permission.key },
        },
        tx,
      );
    }

    for (const permission of permissions) {
      if (current.has(permission.id)) continue;
      await tx.rolePermission.create({
        data: {
          id: crypto.randomUUID(),
          roleId: role.id,
          permissionId: permission.id,
          grantedById: actor.id,
        },
      });
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "PERMISSION_GRANTED",
          entityType: "RolePermission",
          entityId: role.id,
          metadata: { permission: permission.key },
        },
        tx,
      );
    }

    await writeAudit(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "ROLE_UPDATED",
        entityType: "Role",
        entityId: role.id,
        metadata: { permissionCount: permissions.length },
      },
      tx,
    );

    return { ok: true };
  });
}
