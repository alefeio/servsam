"use server";

import { redirect } from "next/navigation";
import { PermissionError, requirePermission } from "@/lib/platform/access";
import { createPlatformUser, setPlatformUserActive, updatePlatformUser } from "@/lib/platform/accounts";
import { authenticate, endSession } from "@/lib/platform/authenticate";
import { createPlatformRole, updateRolePermissions } from "@/lib/platform/roles";

export type ActionState = { error: string } | null;

function denied(): ActionState {
  return { error: "Você não tem permissão para esta ação." };
}

export async function loginAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await authenticate(email, password);
  if (!result.ok) return { error: result.message };
  redirect("/sistema");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/sistema/login");
}

export async function createUserAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const actor = await requirePermission("user.manage");
    const result = await createPlatformUser(actor, {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      roleIds: formData.getAll("roleId").map(String),
    });
    if (!result.ok) return { error: result.message };
  } catch (error) {
    if (error instanceof PermissionError) return denied();
    throw error;
  }
  redirect("/sistema/configuracoes/usuarios");
}

export async function updateUserAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const actor = await requirePermission("user.manage");
    const result = await updatePlatformUser(actor, {
      userId: String(formData.get("userId") ?? ""),
      name: String(formData.get("name") ?? ""),
      roleIds: formData.getAll("roleId").map(String),
    });
    if (!result.ok) return { error: result.message };
  } catch (error) {
    if (error instanceof PermissionError) return denied();
    throw error;
  }
  redirect("/sistema/configuracoes/usuarios");
}

export async function setUserActiveAction(formData: FormData): Promise<void> {
  const actor = await requirePermission("user.manage");
  await setPlatformUserActive(
    actor,
    String(formData.get("userId") ?? ""),
    formData.get("isActive") === "true",
  );
  redirect("/sistema/configuracoes/usuarios");
}

export async function createRoleAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const actor = await requirePermission("role.manage");
    const result = await createPlatformRole(actor, {
      name: String(formData.get("name") ?? ""),
      code: String(formData.get("code") ?? ""),
      description: String(formData.get("description") ?? ""),
    });
    if (!result.ok) return { error: result.message };
  } catch (error) {
    if (error instanceof PermissionError) return denied();
    throw error;
  }
  redirect("/sistema/configuracoes/perfis");
}

export async function updateRolePermissionsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const actor = await requirePermission("role.manage");
    const result = await updateRolePermissions(
      actor,
      String(formData.get("roleId") ?? ""),
      formData.getAll("permission").map(String),
    );
    if (!result.ok) return { error: result.message };
  } catch (error) {
    if (error instanceof PermissionError) return denied();
    throw error;
  }
  redirect("/sistema/configuracoes/perfis");
}
