"use server";

import { runGuarded, type ActionState } from "@/lib/platform/action-helpers";
import {
  appointmentCancelRedirect,
  appointmentCreateRedirect,
  appointmentDetailRedirect,
} from "@/lib/platform/appointment-redirect";
import {
  cancelAppointment,
  createAppointment,
  rescheduleAppointment,
} from "@/lib/platform/appointments";

const field = (form: FormData, name: string) => String(form.get(name) ?? "");

function acceptConflict(form: FormData): boolean {
  const raw = field(form, "acceptConflict");
  return raw === "1" || raw === "true" || raw === "on";
}

/**
 * undefined = campo ausente; null = "Sem atribuição"; string = id.
 */
function parseEmployeeField(form: FormData): string | null | undefined {
  if (!form.has("employeeId")) return undefined;
  const value = String(form.get("employeeId") ?? "").trim();
  return value === "" ? null : value;
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
      employeeId: parseEmployeeField(formData),
      notes: field(formData, "notes") || undefined,
      acceptConflict: acceptConflict(formData),
      acceptConflictKeys: field(formData, "acceptConflictKeys") || undefined,
    });
    if (!result.ok) return result;
    return {
      ok: true,
      redirectTo: appointmentCreateRedirect(serviceOrderId),
    };
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
      employeeId: parseEmployeeField(formData),
      reason: field(formData, "reason"),
      notes: field(formData, "notes") || undefined,
      acceptConflict: acceptConflict(formData),
      acceptConflictKeys: field(formData, "acceptConflictKeys") || undefined,
    });
    if (!result.ok) return result;
    return {
      ok: true,
      redirectTo: appointmentDetailRedirect(result.data.id),
    };
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
    return {
      ok: true,
      redirectTo: serviceOrderId
        ? appointmentCancelRedirect(serviceOrderId)
        : "/sistema/agenda",
    };
  });
}
