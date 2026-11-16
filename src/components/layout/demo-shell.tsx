"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLogo } from "@/components/layout/site-logo";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DEMO_ENVIRONMENT_BANNER } from "@/lib/content/constants";
import { demoNavItems } from "@/data/demo/planned-modules";
import { isDemoNavActive } from "@/lib/demo/demo-nav";
import { clearDemoSession, getDemoSessionRaw, parseDemoSession, subscribeToDemoSession } from "@/lib/demo/session-core";
import { restoreDemoData } from "@/lib/demo/dataset-store";
import { cn } from "@/lib/utils";

function useDemoSessionSnapshot() {
  const rawSession = useSyncExternalStore(
    subscribeToDemoSession,
    getDemoSessionRaw,
    () => null,
  );
  return parseDemoSession(rawSession);
}

type DemoNavLinksProps = {
  onNavigate?: () => void;
  className?: string;
};

export function DemoNavLinks({ onNavigate, className }: DemoNavLinksProps) {
  const pathname = usePathname();

  return (
    <ul className={cn("space-y-1", className)}>
      {demoNavItems.map((item, index) => {
        const isActive = isDemoNavActive(pathname, item.href);
        const previous = index > 0 ? demoNavItems[index - 1] : undefined;
        const showSection = item.section !== previous?.section;
        return (
          <li key={item.href}>
            {showSection ? (
              <p className="px-3 pt-3 pb-1 text-[11px] tracking-wide text-teal uppercase">
                {item.section}
              </p>
            ) : null}
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "block rounded-md px-3 py-2 text-sm text-primary-foreground/80 hover:bg-white/10 hover:text-white",
                isActive && "bg-white/15 text-white",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function DemoSidebar() {
  return (
    <aside
      data-testid="demo-desktop-sidebar"
      className="hidden w-64 shrink-0 border-r border-white/10 bg-navy text-primary-foreground lg:flex lg:flex-col"
    >
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs tracking-wide text-teal uppercase">Sistema demonstrativo</p>
        <SiteLogo unlinked surface="dark" className="mt-3" />
      </div>
      <nav aria-label="Módulos da demonstração" className="flex-1 overflow-y-auto p-3">
        <DemoNavLinks />
      </nav>
    </aside>
  );
}

export function DemoTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useDemoSessionSnapshot();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = [...demoNavItems]
    .filter((item) => isDemoNavActive(pathname, item.href))
    .sort((left, right) => right.href.length - left.href.length)[0];

  function handleLogout() {
    setMenuOpen(false);
    clearDemoSession();
    router.push("/demonstracao/login");
  }

  function handleRestore() {
    setMenuOpen(false);
    restoreDemoData();
    router.refresh();
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  data-testid="demo-mobile-nav-trigger"
                  className="size-11 min-h-11 min-w-11 shrink-0 lg:hidden"
                  aria-label="Abrir menu de navegação"
                >
                  <Menu className="size-5" />
                </Button>
              }
            />
            <SheetContent
              side="left"
              className="w-[min(100%,20rem)] gap-0 overflow-hidden bg-navy p-0 text-primary-foreground"
              showCloseButton={false}
            >
              <SheetHeader className="border-b border-white/10 px-4 py-4 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs tracking-wide text-teal uppercase">Sistema demonstrativo</p>
                    <SheetTitle className="mt-2 text-white">Navegação</SheetTitle>
                  </div>
                  <SheetClose
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11 min-h-11 min-w-11 text-white hover:bg-white/10 hover:text-white"
                        aria-label="Fechar menu"
                      />
                    }
                  >
                    <span aria-hidden="true" className="text-lg leading-none">
                      ×
                    </span>
                  </SheetClose>
                </div>
                <SiteLogo unlinked surface="dark" className="mt-3" />
              </SheetHeader>
              <nav
                aria-label="Módulos da demonstração"
                className="min-h-0 flex-1 overflow-y-auto px-2 py-3"
              >
                <DemoNavLinks onNavigate={closeMenu} />
              </nav>
              <div className="mt-auto space-y-2 border-t border-white/10 p-4">
                <p className="text-xs text-primary-foreground/70">
                  Ações da sessão. Separadas do menu para evitar toque acidental.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={handleRestore}
                >
                  Restaurar dados demonstrativos
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-white hover:bg-white/10 hover:text-white"
                  onClick={handleLogout}
                >
                  Sair da demonstração
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Você está em</p>
            <p className="truncate font-medium">{current?.label ?? "Demonstração"}</p>
            {session ? (
              <p className="truncate text-xs text-muted-foreground">
                Perfil demo: {session.roleLabel}
              </p>
            ) : null}
          </div>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Button type="button" variant="outline" onClick={handleRestore}>
            Restaurar dados demonstrativos
          </Button>
          <Button type="button" variant="ghost" onClick={handleLogout}>
            Sair da demonstração
          </Button>
        </div>
      </div>
      <p role="status" className="bg-secondary px-4 py-2 text-sm text-secondary-foreground md:px-6">
        {DEMO_ENVIRONMENT_BANNER}
      </p>
    </header>
  );
}
