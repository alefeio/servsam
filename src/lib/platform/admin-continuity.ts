import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db/prisma";

export const LAST_ADMIN_MESSAGE =
  "A organização precisa manter ao menos um usuário ativo com permissão de administrar contas.";

/**
 * Classe de advisory lock (int4) exclusiva da continuidade administrativa.
 * Combinada com `hashtext(organizationId)` serializa checagens e mutações por org.
 */
export const ADMIN_CONTINUITY_LOCK_NS = 872_014_501;

export type ContinuityClient = PrismaClient | Prisma.TransactionClient;

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
  client: ContinuityClient,
  organizationId: string,
  roleIds: string[],
): Promise<boolean> {
  if (roleIds.length === 0) return false;
  const roles = await client.role.findMany({
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
 * - `client`: deve ser o `tx` da mesma transação que muta (nunca o global fora do lock).
 */
export async function countActiveUserManagers(
  organizationId: string,
  options?: {
    treatUserAsInactive?: string;
    roleOverride?: { userId: string; roleIds: string[] };
    client?: ContinuityClient;
  },
): Promise<number> {
  const client = options?.client ?? getPrisma();
  const users = await client.user.findMany({
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
      client,
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
  client?: ContinuityClient,
): Promise<boolean> {
  const remaining = await countActiveUserManagers(organizationId, {
    roleOverride: { userId, roleIds: nextRoleIds },
    client,
  });
  return remaining >= 1;
}

export async function wouldRetainManagerAfterRolePermissionChange(
  organizationId: string,
  roleId: string,
  nextPermissionKeys: string[],
  client?: ContinuityClient,
): Promise<boolean> {
  const nextHasManage = permissionKeysIncludeUserManage(nextPermissionKeys);
  const db = client ?? getPrisma();
  const users = await db.user.findMany({
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

/** Serializa continuidade administrativa da org até o fim da transação. */
export async function lockOrganizationAdminContinuity(
  tx: Prisma.TransactionClient,
  organizationId: string,
): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${ADMIN_CONTINUITY_LOCK_NS}, hashtext(${organizationId}))`;
}

/**
 * Transação interativa com advisory lock por organização.
 * Leituras de continuidade e mutações devem usar o `tx` recebido.
 *
 * `timeout` acima do default (5s) para permitir espera no advisory lock
 * quando duas mutações administrativas da mesma org chegam juntas.
 */
export async function withOrganizationAdminContinuity<T>(
  organizationId: string,
  run: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return getPrisma().$transaction(
    async (tx) => {
      await lockOrganizationAdminContinuity(tx, organizationId);
      return run(tx);
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
}
