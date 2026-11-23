"use client";

import { Button } from "@/components/ui/button";
import { FormError } from "@/features/platform/form-parts";
import { useGuardedForm } from "@/features/platform/use-guarded-form";
import {
  createEngagementFromProposalAction,
  createEngagementFromPurchaseOrderAction,
} from "@/lib/platform/engagement-actions";

export function CreateEngagementFromProposalButton({
  proposalId,
}: {
  proposalId: string;
}) {
  const { state, onSubmit, pending } = useGuardedForm(
    createEngagementFromProposalAction,
    {
      confirmMessage:
        "Gerar contratação a partir deste orçamento aceito? Esta ação não pode ser duplicada.",
    },
  );
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="proposalId" value={proposalId} />
      <FormError message={state?.error} />
      <Button type="submit" disabled={pending}>
        {pending ? "Gerando..." : "Gerar contratação"}
      </Button>
    </form>
  );
}

export function CreateEngagementFromPurchaseOrderButton({
  purchaseOrderId,
}: {
  purchaseOrderId: string;
}) {
  const { state, onSubmit, pending } = useGuardedForm(
    createEngagementFromPurchaseOrderAction,
    {
      confirmMessage:
        "Gerar contratação a partir desta O.C. recebida? Esta ação não pode ser duplicada.",
    },
  );
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="purchaseOrderId" value={purchaseOrderId} />
      <FormError message={state?.error} />
      <Button type="submit" disabled={pending}>
        {pending ? "Gerando..." : "Gerar contratação"}
      </Button>
    </form>
  );
}
