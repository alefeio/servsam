"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { SiteLogo } from "@/components/layout/site-logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { publicNavItems } from "@/data/official/navigation";
import { cn } from "@/lib/utils";

function NavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <ul className={cn("flex flex-col gap-1 md:flex-row md:items-center md:gap-1", className)}>
      {publicNavItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium text-navy/80 hover:bg-muted hover:text-navy",
                isActive && "bg-muted text-navy",
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

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <SiteLogo priority />
        <nav aria-label="Principal" className="hidden lg:block">
          <NavLinks />
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href="/contato" className="hidden sm:inline-flex">
            Solicitar orçamento
          </ButtonLink>
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Abrir menu"
                >
                  <Menu />
                </Button>
              }
            />
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Navegação</SheetTitle>
              </SheetHeader>
              <nav aria-label="Principal" className="px-2">
                <NavLinks />
              </nav>
              <div className="p-4">
                <ButtonLink href="/contato" className="w-full">
                  Solicitar orçamento
                </ButtonLink>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
