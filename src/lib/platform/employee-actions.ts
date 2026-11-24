"use server";

import { runGuarded, type ActionState } from "@/lib/platform/action-helpers";
import {
  createEmployee,
  updateEmployee,
} from "@/lib/platform/employees";

const LIST = "/sistema/colaboradores";
const detail = (id: string) => `${LIST}/${id}`;
const field = (form: FormData, name: string) => String(form.get(name) ?? "");

function parseEmployeeForm(form: FormData) {
  const isActiveRaw = field(form, "isActive");
  return {
    fullName: field(form, "fullName"),
    jobTitle: field(form, "jobTitle"),
    phone: field(form, "phone") || undefined,
    email: field(form, "email") || undefined,
    notes: field(form, "notes") || undefined,
    isActive:
      isActiveRaw === ""
        ? true
        : isActiveRaw === "1" || isActiveRaw === "true",
  };
}

export async function createEmployeeAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("employee.manage", async (actor) => {
    const result = await createEmployee(actor, parseEmployeeForm(formData));
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(result.data.id) };
  });
}

export async function updateEmployeeAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("employee.manage", async (actor) => {
    const employeeId = field(formData, "employeeId");
    const result = await updateEmployee(
      actor,
      employeeId,
      parseEmployeeForm(formData),
    );
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(employeeId) };
  });
}
