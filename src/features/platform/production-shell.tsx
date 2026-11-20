import { SiteLogo } from "@/components/layout/site-logo";
import { Button } from "@/components/ui/button";
import { ProductionNavLink } from "@/features/platform/production-nav-link";
import { logoutAction } from "@/lib/platform/actions";
import type { AuthenticatedUser } from "@/lib/platform/access";
import { getNavItems } from "@/lib/platform/nav";

export function ProductionShell({
  user,
  children,
}: {
  user: AuthenticatedUser;
  children: React.ReactNode;
}) {
  const items = getNavItems(user.permissions);
  const roleLabel = user.roleNames.join(", ") || user.roleCodes.join(", ") || "Sem perfil";

  return (
    <div className="flex min-h-screen bg-muted">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-navy text-primary-foreground lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-xs tracking-wide text-teal uppercase">Sistema</p>
          <SiteLogo unlinked surface="dark" className="mt-3" />
          <p className="mt-3 text-xs text-primary-foreground/70">
            Operação real · Homologação
          </p>
        </div>
        <nav aria-label="Sistema" className="flex-1 p-3">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <ProductionNavLink href={item.href} label={item.label} />
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
            <p className="text-xs text-muted-foreground">
              {user.email} · {roleLabel}
            </p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost">
              Sair
            </Button>
          </form>
        </header>
        <nav
          aria-label="Sistema (compacto)"
          className="border-b border-border bg-background px-4 py-2 lg:hidden"
        >
          <ul className="flex flex-wrap gap-2">
            {items.map((item) => (
              <li key={item.href}>
                <ProductionNavLink href={item.href} label={item.label} compact />
              </li>
            ))}
          </ul>
        </nav>
        <main id="conteudo-principal" className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
