"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SiteLogo } from "@/components/layout/site-logo";
import { DEMO_ENVIRONMENT_BANNER } from "@/lib/content/constants";
import { demoNavItems } from "@/data/demo/planned-modules";
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

export function DemoSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-navy text-primary-foreground lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs tracking-wide text-teal uppercase">Sistema demonstrativo</p>
        <SiteLogo
          unlinked
          surface="dark"
          className="mt-3"
        />
      </div>
      <nav aria-label="Módulos da demonstração" className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {demoNavItems.map((item) => {
            const isActive =
              item.href === "/demonstracao"
                ? pathname === "/demonstracao"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
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
      </nav>
    </aside>
  );
}

export function DemoTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useDemoSessionSnapshot();
  const current = demoNavItems.find((item) =>
    item.href === "/demonstracao"
      ? pathname === "/demonstracao"
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  function handleLogout() {
    clearDemoSession();
    router.push("/demonstracao/login");
  }

  function handleRestore() {
    restoreDemoData();
    router.refresh();
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div>
          <p className="text-xs text-muted-foreground">Você está em</p>
          <p className="font-medium">{current?.label ?? "Demonstração"}</p>
          {session ? (
            <p className="text-xs text-muted-foreground">
              Perfil demo: {session.roleLabel}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
