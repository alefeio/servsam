import { PLATFORM_NAV } from "@/data/platform/labels";

export type PlatformNavItem = { href: string; label: string };

/** Entradas de navegação que a conta pode ver. A regra é por chave, nunca pelo nome do papel. */
export function getNavItems(
  permissions: ReadonlySet<string>,
): PlatformNavItem[] {
  return PLATFORM_NAV.filter((item) =>
    item.anyOf.some((key) => permissions.has(key)),
  ).map(({ href, label }) => ({ href, label }));
}
