import { getPrisma } from "@/lib/db/prisma";

export const LAST_ADMIN_MESSAGE =
  "A organização precisa manter ao menos um usuário ativo com permissão de administrar contas.";

type PermissionGrant = { permission: { key: string } };

export function permissionKeysIncludeUserManage(
  keys: Iterable<string>,
): boolean {
  for (const key of keys) {
    if (key === "user.manage") return true;
  }
  return false;
}

export function grantsIncludeUserManage(grants: PermissionGrant[]): boolean {
  return grants.some((grant) => grant.permission.key === "user.manage");
}

async function roleIdsGrantUserManage(
  organizationId: string,
  roleIds: string[],
): Promise<boolean> {
  if (roleIds.length === 0) return false;
  const roles = await getPrisma().role.findMany({
    where: { organizationId, id: { in: roleIds } },
    select: {
      rolePermissions: { select: { permission: { select: { key: true } } } },
    },
  });
  return roles.some((role) => grantsIncludeUserManage(role.rolePermissions));
}

/**
 * Conta usuários ativos com `user.manage`.
 * - `treatUserAsInactive`: simula desativação (não conta o usuário).
 * - `roleOverride`: simula novos papéis para um usuário ativo.
 */
export async function countActiveUserManagers(
  organizationId: string,
  options?: {
    treatUserAsInactive?: string;
    roleOverride?: { userId: string; roleIds: string[] };
  },
): Promise<number> {
  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    where: { organizationId, isActive: true },
    select: {
      id: true,
      userRoles: {
        select: {
          roleId: true,
          role: {
            select: {
              rolePermissions: {
                select: { permission: { select: { key: true } } },
              },
            },
          },
        },
      },
    },
  });

  let overrideManages: boolean | null = null;
  if (options?.roleOverride) {
    overrideManages = await roleIdsGrantUserManage(
      organizationId,
      options.roleOverride.roleIds,
    );
  }

  let count = 0;
  for (const user of users) {
    if (options?.treatUserAsInactive === user.id) continue;

    if (options?.roleOverride?.userId === user.id) {
      if (overrideManages) count += 1;
      continue;
    }

    const manages = user.userRoles.some((link) =>
      grantsIncludeUserManage(link.role.rolePermissions),
    );
    if (manages) count += 1;
  }

  return count;
}

export async function wouldRetainManagerAfterUserRoleChange(
  organizationId: string,
  userId: string,
  nextRoleIds: string[],
): Promise<boolean> {
  const remaining = await countActiveUserManagers(organizationId, {
    roleOverride: { userId, roleIds: nextRoleIds },
  });
  return remaining >= 1;
}

export async function wouldRetainManagerAfterRolePermissionChange(
  organizationId: string,
  roleId: string,
  nextPermissionKeys: string[],
): Promise<boolean> {
  const nextHasManage = permissionKeysIncludeUserManage(nextPermissionKeys);
  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    where: { organizationId, isActive: true },
    select: {
      userRoles: {
        select: {
          roleId: true,
          role: {
            select: {
              rolePermissions: {
                select: { permission: { select: { key: true } } },
              },
            },
          },
        },
      },
    },
  });

  let count = 0;
  for (const user of users) {
    const manages = user.userRoles.some((link) => {
      if (link.roleId === roleId) return nextHasManage;
      return grantsIncludeUserManage(link.role.rolePermissions);
    });
    if (manages) count += 1;
  }
  return count >= 1;
}
