"use server";

import { runGuarded, type ActionState } from "@/lib/platform/action-helpers";
import {
  createEngagementFromProposal,
  createEngagementFromPurchaseOrder,
} from "@/lib/platform/engagements";

const ENGAGEMENT_LIST = "/sistema/contratacoes";
const detail = (id: string) => `${ENGAGEMENT_LIST}/${id}`;
const field = (form: FormData, name: string) => String(form.get(name) ?? "");

export async function createEngagementFromProposalAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("contract.manage", async (actor) => {
    const result = await createEngagementFromProposal(actor, {
      proposalId: field(formData, "proposalId"),
      notes: field(formData, "notes") || undefined,
    });
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(result.data.id) };
  });
}

export async function createEngagementFromPurchaseOrderAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runGuarded("contract.manage", async (actor) => {
    const result = await createEngagementFromPurchaseOrder(actor, {
      purchaseOrderId: field(formData, "purchaseOrderId"),
      notes: field(formData, "notes") || undefined,
    });
    if (!result.ok) return result;
    return { ok: true, redirectTo: detail(result.data.id) };
  });
}
