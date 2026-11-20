import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/platform/auth";
import { getPrisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/platform/permissions";

import { PermissionError } from "@/lib/platform/permission-error";

export { PermissionError };

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  isActive: boolean;
  permissions: Set<string>;
  roleCodes: string[];
  roleNames: string[];
};

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await getPrisma().user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: { rolePermissions: { include: { permission: true } } },
          },
        },
      },
    },
  });

  if (!user || !user.isActive) return null;

  const permissions = new Set<string>();
  const roleCodes: string[] = [];
  const roleNames: string[] = [];
  for (const link of user.userRoles) {
    roleCodes.push(link.role.code);
    roleNames.push(link.role.name);
    for (const grant of link.role.rolePermissions) {
      permissions.add(grant.permission.key);
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    organizationId: user.organizationId,
    isActive: user.isActive,
    permissions,
    roleCodes,
    roleNames,
  };
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sistema/login");
  return user;
}

export async function requirePermission(
  permission: string,
): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser();
  if (!hasPermission(user.permissions, permission)) {
    throw new PermissionError();
  }
  return user;
}

export function userHasPermission(
  user: AuthenticatedUser,
  permission: string,
): boolean {
  return hasPermission(user.permissions, permission);
}
