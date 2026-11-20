"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProductionNavLink({
  href,
  label,
  compact = false,
}: {
  href: string;
  label: string;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const active =
    href === "/sistema"
      ? pathname === "/sistema"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        compact
          ? "block rounded-md px-3 py-1.5 text-sm"
          : "block rounded-md px-3 py-2 text-sm",
        compact
          ? active
            ? "bg-muted font-medium text-navy"
            : "text-navy hover:bg-muted"
          : active
            ? "bg-white/15 font-medium text-white"
            : "text-primary-foreground/80 hover:bg-white/10 hover:text-white",
      )}
    >
      {label}
    </Link>
  );
}
