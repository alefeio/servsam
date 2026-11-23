"use server";

import { runGuarded, type ActionState } from "@/lib/platform/action-helpers";
import { parsePurchaseOrderForm } from "@/lib/platform/form-parsers";
import { createPurchaseOrder } from "@/lib/platform/purchase-orders";

const LIST = "/sistema/ordens-compra";
const detail = (id: string) => `${LIST}/${id}`;

export async function createPurchaseOrderAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("contract.manage", async (actor) => {
    const parsed = parsePurchaseOrderForm(formData);
    if (!parsed.ok) return parsed;
    const result = await createPurchaseOrder(actor, parsed.input);
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(result.data.id) };
  });
}
