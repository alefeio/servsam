"use server";

import { runGuarded, type ActionState } from "@/lib/platform/action-helpers";
import {
  cancelAppointment,
  createAppointment,
  rescheduleAppointment,
} from "@/lib/platform/appointments";

const OS_DETAIL = (id: string) => `/sistema/ordens-servico/${id}`;
const AGENDA_DETAIL = (id: string) => `/sistema/agenda/${id}`;
const field = (form: FormData, name: string) => String(form.get(name) ?? "");

function acceptConflict(form: FormData): boolean {
  const raw = field(form, "acceptConflict");
  return raw === "1" || raw === "true" || raw === "on";
}

export async function createAppointmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("schedule.create", async (actor) => {
    const serviceOrderId = field(formData, "serviceOrderId");
    const result = await createAppointment(actor, {
      serviceOrderId,
      startsAtLocal: field(formData, "startsAtLocal"),
      endsAtLocal: field(formData, "endsAtLocal"),
      employeeId: field(formData, "employeeId") || undefined,
      notes: field(formData, "notes") || undefined,
      acceptConflict: acceptConflict(formData),
    });
    if (!result.ok) return result;
    const redirectTo =
      field(formData, "redirectTo") || OS_DETAIL(serviceOrderId);
    return { ok: true, redirectTo };
  });
}

export async function rescheduleAppointmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("schedule.update", async (actor) => {
    const appointmentId = field(formData, "appointmentId");
    const result = await rescheduleAppointment(actor, {
      appointmentId,
      startsAtLocal: field(formData, "startsAtLocal"),
      endsAtLocal: field(formData, "endsAtLocal"),
      employeeId: field(formData, "employeeId") || undefined,
      reason: field(formData, "reason"),
      notes: field(formData, "notes") || undefined,
      acceptConflict: acceptConflict(formData),
    });
    if (!result.ok) return result;
    const redirectTo =
      field(formData, "redirectTo") || AGENDA_DETAIL(result.data.id);
    return { ok: true, redirectTo };
  });
}

export async function cancelAppointmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("schedule.update", async (actor) => {
    const appointmentId = field(formData, "appointmentId");
    const serviceOrderId = field(formData, "serviceOrderId");
    const result = await cancelAppointment(actor, {
      appointmentId,
      reason: field(formData, "reason"),
    });
    if (!result.ok) return result;
    const redirectTo =
      field(formData, "redirectTo") ||
      (serviceOrderId ? OS_DETAIL(serviceOrderId) : "/sistema/agenda");
    return { ok: true, redirectTo };
  });
}
