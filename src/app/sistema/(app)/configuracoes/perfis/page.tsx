import type { Metadata } from "next";
import { RolesAdmin } from "@/features/platform/roles-admin";
import { requireAuthenticatedUser, userHasPermission } from "@/lib/platform/access";
import { getPrisma } from "@/lib/db/prisma";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Perfis"),
  robots: { index: false, follow: false },
};

export default async function RolesPage() {
  const actor = await requireAuthenticatedUser();
  const canManage = userHasPermission(actor, "role.manage");
  if (!canManage && !userHasPermission(actor, "role.view")) {
    return <p className="text-sm">Você não tem permissão para ver papéis.</p>;
  }
  const prisma = getPrisma();
  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      where: { organizationId: actor.organizationId },
      orderBy: { name: "asc" },
      include: { rolePermissions: { include: { permission: true } } },
    }),
    prisma.permission.findMany({ orderBy: { key: "asc" } }),
  ]);

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold text-navy">Perfis e permissões</h1>
      <p className="text-sm text-muted-foreground">
        O acesso é a união das permissões dos papéis. O nome do papel não libera módulo por si só.
      </p>
      <RolesAdmin
        canManage={canManage}
        permissions={permissions.map((permission) => ({
          key: permission.key,
          description: permission.description,
        }))}
        roles={roles.map((role) => ({
          id: role.id,
          code: role.code,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          permissionKeys: role.rolePermissions.map((link) => link.permission.key),
        }))}
      />
    </section>
  );
}
