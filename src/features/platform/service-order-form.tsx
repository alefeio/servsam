"use client";

import { Button } from "@/components/ui/button";
import { FormError, TextField } from "@/features/platform/form-parts";
import { useGuardedForm } from "@/features/platform/use-guarded-form";
import {
  cancelServiceOrderAction,
  createServiceOrderAction,
} from "@/lib/platform/service-order-actions";

export function EmitServiceOrderButton({
  engagementId,
  engagementItemId,
  label = "Emitir OS",
  priorCancelledCodes = [],
}: {
  engagementId: string;
  engagementItemId: string;
  label?: string;
  /** OS canceladas do mesmo item — reemissão exige confirmação explícita. */
  priorCancelledCodes?: string[];
}) {
  const isReissue = priorCancelledCodes.length > 0;
  const confirmMessage = isReissue
    ? `Já existe OS cancelada (${priorCancelledCodes.join(", ")}). Emitir nova OS com número distinto? O histórico cancelado permanece visível.`
    : "Emitir ordem de serviço para este item contratado? Não gera visitas automaticamente.";

  const { state, onSubmit, pending } = useGuardedForm(createServiceOrderAction, {
    confirmMessage,
  });
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="engagementId" value={engagementId} />
      <input type="hidden" name="engagementItemId" value={engagementItemId} />
      {isReissue ? (
        <p className="text-xs text-muted-foreground">
          Reemissão após cancelamento de {priorCancelledCodes.join(", ")}.
        </p>
      ) : null}
      <FormError message={state?.error} />
      <Button type="submit" disabled={pending}>
        {pending ? "Emitindo..." : isReissue ? "Reemitir OS" : label}
      </Button>
    </form>
  );
}

export function CancelServiceOrderButton({
  serviceOrderId,
}: {
  serviceOrderId: string;
}) {
  const { state, onSubmit, pending } = useGuardedForm(cancelServiceOrderAction, {
    confirmMessage:
      "Cancelar esta OS emitida? O histórico permanece e a reemissão exige nova ação explícita.",
  });
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="serviceOrderId" value={serviceOrderId} />
      <TextField label="Motivo (opcional)" name="reason" maxLength={500} />
      <FormError message={state?.error} />
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Cancelando..." : "Cancelar OS"}
      </Button>
    </form>
  );
}
