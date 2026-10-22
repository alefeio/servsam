import type { Metadata } from "next";
import { UsersAdmin } from "@/features/platform/users-admin";
import { requireAuthenticatedUser, userHasPermission } from "@/lib/platform/access";
import { getPrisma } from "@/lib/db/prisma";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Usuários"),
  robots: { index: false, follow: false },
};

export default async function UsersPage() {
  const actor = await requireAuthenticatedUser();
  const canManage = userHasPermission(actor, "user.manage");
  if (!canManage && !userHasPermission(actor, "user.view")) {
    return <p className="text-sm">Você não tem permissão para ver usuários.</p>;
  }
  const prisma = getPrisma();
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: actor.organizationId },
      orderBy: { name: "asc" },
      include: { userRoles: true },
    }),
    prisma.role.findMany({
      where: { organizationId: actor.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold text-navy">Usuários</h1>
      <p className="text-sm text-muted-foreground">
        Contas ativas entram no sistema. Desativar encerra a sessão e preserva o histórico.
      </p>
      <UsersAdmin
        canManage={canManage}
        roles={roles}
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          roleIds: user.userRoles.map((link) => link.roleId),
        }))}
      />
    </section>
  );
}
