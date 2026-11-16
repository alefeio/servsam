import { demoNavItems } from "@/data/demo/planned-modules";

export function matchesDemoHref(pathname: string, href: string): boolean {
  if (href === "/demonstracao") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isDemoNavActive(pathname: string, href: string): boolean {
  if (!matchesDemoHref(pathname, href)) return false;
  return !demoNavItems.some(
    (other) => other.href.length > href.length && matchesDemoHref(pathname, other.href),
  );
}
