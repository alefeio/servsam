"use client";

import { useActionState, useId } from "react";
import {
  BILLING_REQUEST_STATUS_LABELS,
  RECEIPT_KIND_LABELS,
  RECEIPT_PAYMENT_METHOD_LABELS,
  RECEIPT_STATUS_LABELS,
} from "@/data/platform/labels";
import {
  cancelBillingRequestAction,
  cancelReceiptAction,
  confirmReceiptAction,
  createBillingRequestAction,
  createReceiptEntryAction,
  processBillingRequestAction,
  rejectReceiptAction,
  reverseReceiptAction,
  type FinanceActionState,
} from "@/lib/platform/finance-actions";
import { formatCents } from "@/lib/platform/money";

const initial: FinanceActionState = { ok: false };

function Feedback({ state }: { state: FinanceActionState }) {
  if (!state.message) return null;
  return (
    <p
      role="status"
      className={
        state.ok
          ? "text-sm text-emerald-800"
          : "text-sm text-rose-700"
      }
    >
      {state.message}
    </p>
  );
}

export function RequestBillingForm({
  engagementId,
  defaultReferenceReais,
}: {
  engagementId: string;
  defaultReferenceReais?: string;
}) {
  const [state, action, pending] = useActionState(
    createBillingRequestAction,
    initial,
  );
  const idem = useId().replace(/:/g, "");
  return (
    <form action={action} className="space-y-3 rounded-xl border border-border bg-background p-4">
      <h3 className="text-sm font-semibold text-navy">
        Solicitar providências de nota
      </h3>
      <p className="text-xs text-muted-foreground">
        O Comercial solicita; a emissão fiscal ocorre fora do sistema. O
        Financeiro registra o processamento.
      </p>
      <input type="hidden" name="engagementId" value={engagementId} />
      <input type="hidden" name="idempotencyKey" value={`bill-${idem}-${engagementId.slice(0, 8)}`} />
      <label className="block space-y-1 text-sm">
        <span>Descrição</span>
        <input
          name="description"
          required
          defaultValue="Solicitar emissão de nota fiscal da contratação"
          className="block w-full rounded-lg border border-input bg-background px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Valor de referência (R$), opcional</span>
        <input
          name="referenceAmountReais"
          defaultValue={defaultReferenceReais}
          placeholder="0,00"
          className="block w-full rounded-lg border border-input bg-background px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Observações</span>
        <textarea
          name="notes"
          rows={2}
          className="block w-full rounded-lg border border-input bg-background px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-navy px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Solicitar providências"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function InformReceiptForm({ engagementId }: { engagementId: string }) {
  const [state, action, pending] = useActionState(
    createReceiptEntryAction,
    initial,
  );
  const idem = useId().replace(/:/g, "");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Belem",
  }).format(new Date());
  return (
    <form action={action} className="space-y-3 rounded-xl border border-border bg-background p-4">
      <h3 className="text-sm font-semibold text-navy">
        Informar recebimento para conferência
      </h3>
      <p className="text-xs text-muted-foreground">
        Não confirma pagamento. O Financeiro valida o valor efetivamente
        recebido.
      </p>
      <input type="hidden" name="engagementId" value={engagementId} />
      <input type="hidden" name="idempotencyKey" value={`rcpt-${idem}-${engagementId.slice(0, 8)}`} />
      <label className="block space-y-1 text-sm">
        <span>Tipo</span>
        <select
          name="kind"
          defaultValue="signal"
          className="block w-full rounded-lg border border-input bg-background px-3 py-2"
        >
          {Object.entries(RECEIPT_KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        <span>Valor (R$)</span>
        <input
          name="amountReais"
          required
          placeholder="0,00"
          className="block w-full rounded-lg border border-input bg-background px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Data de referência</span>
        <input
          type="date"
          name="referenceDate"
          required
          defaultValue={today}
          className="block w-full rounded-lg border border-input bg-background px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Forma declarada</span>
        <select
          name="paymentMethod"
          defaultValue="pix"
          className="block w-full rounded-lg border border-input bg-background px-3 py-2"
        >
          {Object.entries(RECEIPT_PAYMENT_METHOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        <span>Referência textual (opcional)</span>
        <input
          name="proofReference"
          placeholder="Ex.: protocolo interno, sem dados bancários"
          className="block w-full rounded-lg border border-input bg-background px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Observações</span>
        <textarea
          name="notes"
          rows={2}
          className="block w-full rounded-lg border border-input bg-background px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar para conferência"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function ProcessBillingForm({
  billingRequestId,
  engagementId,
}: {
  billingRequestId: string;
  engagementId: string;
}) {
  const [state, action, pending] = useActionState(
    processBillingRequestAction,
    initial,
  );
  return (
    <form action={action} className="mt-2 space-y-2 rounded-lg border border-border/80 p-3 text-sm">
      <input type="hidden" name="billingRequestId" value={billingRequestId} />
      <input type="hidden" name="engagementId" value={engagementId} />
      <label className="flex items-center gap-2">
        <input type="checkbox" name="markUnderReview" value="1" />
        <span>Marcar em análise (sem processar)</span>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="invoiceIssuedExternally" value="1" />
        <span>Nota emitida externamente</span>
      </label>
      <input
        name="externalDocumentRef"
        placeholder="Referência do documento externo"
        className="block w-full rounded-lg border border-input px-2 py-1.5"
      />
      <textarea
        name="notes"
        rows={2}
        placeholder="Observações do processamento"
        className="block w-full rounded-lg border border-input px-2 py-1.5"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-navy px-3 py-1.5 text-white disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Registrar processamento"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function ConfirmReceiptForm({
  receiptEntryId,
  engagementId,
  amountCents,
}: {
  receiptEntryId: string;
  engagementId: string;
  amountCents: number;
}) {
  const [state, action, pending] = useActionState(confirmReceiptAction, initial);
  return (
    <form action={action} className="mt-2 flex flex-wrap items-end gap-2 text-sm">
      <input type="hidden" name="receiptEntryId" value={receiptEntryId} />
      <input type="hidden" name="engagementId" value={engagementId} />
      <input type="hidden" name="confirmedAmountCents" value={String(amountCents)} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-navy px-3 py-1.5 text-white disabled:opacity-60"
      >
        {pending ? "Confirmando…" : `Confirmar ${formatCents(amountCents)}`}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function RejectReceiptForm({
  receiptEntryId,
  engagementId,
}: {
  receiptEntryId: string;
  engagementId: string;
}) {
  const [state, action, pending] = useActionState(rejectReceiptAction, initial);
  return (
    <form action={action} className="mt-2 space-y-2 text-sm">
      <input type="hidden" name="receiptEntryId" value={receiptEntryId} />
      <input type="hidden" name="engagementId" value={engagementId} />
      <input
        name="reason"
        required
        placeholder="Motivo da rejeição"
        className="block w-full rounded-lg border border-input px-2 py-1.5"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-rose-300 px-3 py-1.5 text-rose-800 disabled:opacity-60"
      >
        {pending ? "…" : "Rejeitar"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function ReverseReceiptForm({
  receiptEntryId,
  engagementId,
}: {
  receiptEntryId: string;
  engagementId: string;
}) {
  const [state, action, pending] = useActionState(reverseReceiptAction, initial);
  return (
    <form action={action} className="mt-2 space-y-2 text-sm">
      <input type="hidden" name="receiptEntryId" value={receiptEntryId} />
      <input type="hidden" name="engagementId" value={engagementId} />
      <input
        name="reason"
        required
        placeholder="Motivo da reversão"
        className="block w-full rounded-lg border border-input px-2 py-1.5"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-amber-400 px-3 py-1.5 text-amber-950 disabled:opacity-60"
      >
        {pending ? "…" : "Reverter confirmação"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function CancelPendingReceiptForm({
  receiptEntryId,
  engagementId,
}: {
  receiptEntryId: string;
  engagementId: string;
}) {
  const [state, action, pending] = useActionState(cancelReceiptAction, initial);
  return (
    <form action={action} className="mt-2 space-y-2 text-sm">
      <input type="hidden" name="receiptEntryId" value={receiptEntryId} />
      <input type="hidden" name="engagementId" value={engagementId} />
      <input
        name="reason"
        required
        placeholder="Motivo do cancelamento"
        className="block w-full rounded-lg border border-input px-2 py-1.5"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-60"
      >
        {pending ? "…" : "Cancelar pendente"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function CancelBillingForm({
  billingRequestId,
  engagementId,
}: {
  billingRequestId: string;
  engagementId: string;
}) {
  const [state, action, pending] = useActionState(
    cancelBillingRequestAction,
    initial,
  );
  return (
    <form action={action} className="mt-2 space-y-2 text-sm">
      <input type="hidden" name="billingRequestId" value={billingRequestId} />
      <input type="hidden" name="engagementId" value={engagementId} />
      <input
        name="reason"
        required
        placeholder="Motivo do cancelamento"
        className="block w-full rounded-lg border border-input px-2 py-1.5"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-60"
      >
        {pending ? "…" : "Cancelar solicitação"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function FinanceStatusBadge({
  kind,
  status,
}: {
  kind: "billing" | "receipt";
  status: string;
}) {
  const label =
    kind === "billing"
      ? BILLING_REQUEST_STATUS_LABELS[
          status as keyof typeof BILLING_REQUEST_STATUS_LABELS
        ]
      : RECEIPT_STATUS_LABELS[status as keyof typeof RECEIPT_STATUS_LABELS];
  return (
    <span className="inline-flex rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs">
      {label ?? status}
    </span>
  );
}
