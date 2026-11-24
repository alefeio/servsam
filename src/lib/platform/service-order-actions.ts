"use server";

import { runGuarded, type ActionState } from "@/lib/platform/action-helpers";
import {
  cancelServiceOrder,
  createServiceOrder,
} from "@/lib/platform/service-orders";

const LIST = "/sistema/ordens-servico";
const detail = (id: string) => `${LIST}/${id}`;
const field = (form: FormData, name: string) => String(form.get(name) ?? "");

export async function createServiceOrderAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("service_order.create", async (actor) => {
    const result = await createServiceOrder(actor, {
      engagementId: field(formData, "engagementId"),
      engagementItemId: field(formData, "engagementItemId"),
      scopeNotes: field(formData, "scopeNotes") || undefined,
      observations: field(formData, "observations") || undefined,
    });
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(result.data.id) };
  });
}

export async function cancelServiceOrderAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("service_order.update", async (actor) => {
    const serviceOrderId = field(formData, "serviceOrderId");
    const result = await cancelServiceOrder(actor, {
      serviceOrderId,
      reason: field(formData, "reason") || undefined,
    });
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(serviceOrderId) };
  });
}
