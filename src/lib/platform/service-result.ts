import type { AuthenticatedUser } from "@/lib/platform/access";
import { hasPermission } from "@/lib/platform/permissions";

export type ServiceResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; message: string };

export const DENIED_MESSAGE = "Você não tem permissão para esta ação.";
export const NOT_FOUND_MESSAGE = "Registro não encontrado.";

export function fail(message: string): { ok: false; message: string } {
  return { ok: false, message };
}

/** Retorna a falha padrão quando o ator não tem a chave. `null` quando pode seguir. */
export function denyWithout(
  actor: Pick<AuthenticatedUser, "permissions">,
  permission: string,
): { ok: false; message: string } | null {
  if (hasPermission(actor.permissions, permission)) return null;
  return fail(DENIED_MESSAGE);
}
