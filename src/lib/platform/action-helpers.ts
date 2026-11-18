import { redirect } from "next/navigation";
import {
  PermissionError,
  requirePermission,
  type AuthenticatedUser,
} from "@/lib/platform/access";
import { DENIED_MESSAGE } from "@/lib/platform/service-result";

export type ActionState = { error: string } | null;

export type GuardedOutcome =
  { ok: true; redirectTo: string } | { ok: false; message: string };

/**
 * Executa uma Server Action de forma segura: permissão por chave no servidor
 * (`requirePermission`), erro tipado para o formulário e redirecionamento só no sucesso.
 * Não é uma Server Action: não exporta nada para o cliente.
 */
export async function runGuarded(
  permission: string,
  work: (actor: AuthenticatedUser) => Promise<GuardedOutcome>,
): Promise<ActionState> {
  let target: string;
  try {
    const actor = await requirePermission(permission);
    const outcome = await work(actor);
    if (!outcome.ok) return { error: outcome.message };
    target = outcome.redirectTo;
  } catch (error) {
    if (error instanceof PermissionError) return { error: DENIED_MESSAGE };
    throw error;
  }
  redirect(target);
}
