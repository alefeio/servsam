import Link from "next/link";
import { SiteLogo } from "@/components/layout/site-logo";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/platform/actions";
import { userHasPermission, type AuthenticatedUser } from "@/lib/platform/access";

const NAV = [
  { href: "/sistema", label: "Início", permission: "dashboard.view" },
  { href: "/sistema/configuracoes/usuarios", label: "Usuários", permission: "user.view" },
  { href: "/sistema/configuracoes/perfis", label: "Perfis", permission: "role.view" },
] as const;

export function ProductionShell({
  user,
  children,
}: {
  user: AuthenticatedUser;
  children: React.ReactNode;
}) {
  const items = NAV.filter((item) => {
    if (item.href === "/sistema") return userHasPermission(user, "dashboard.view");
    if (item.href.endsWith("/usuarios")) {
      return userHasPermission(user, "user.view") || userHasPermission(user, "user.manage");
    }
    return userHasPermission(user, "role.view") || userHasPermission(user, "role.manage");
  });

  return (
    <div className="flex min-h-screen bg-muted">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-navy text-primary-foreground lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-xs tracking-wide text-teal uppercase">Sistema</p>
          <SiteLogo unlinked surface="dark" className="mt-3" />
        </div>
        <nav aria-label="Sistema" className="flex-1 p-3">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm text-primary-foreground/80 hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-14 items-center justify-between gap-4 border-b border-border bg-background px-4 py-3 md:px-6">
          <div>
            <p className="text-xs text-muted-foreground">Conta</p>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost">
              Sair
            </Button>
          </form>
        </header>
        <main id="conteudo-principal" className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
