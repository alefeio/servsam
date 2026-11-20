"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGuardedForm } from "@/features/platform/use-guarded-form";
import {
  archiveProposalAction,
  createProposalAction,
  reviseProposalAction,
  transitionProposalAction,
  updateProposalAction,
} from "@/lib/platform/proposal-actions";
import { MAX_PROPOSAL_ITEMS } from "@/lib/platform/proposal-schemas";
import {
  centsToInputValue,
  computeProposalTotals,
  formatCents,
  parseBrlToCents,
} from "@/lib/platform/money";
import {
  FormError,
  TextAreaField,
  TextField,
} from "@/features/platform/form-parts";

export type CustomerOption = {
  id: string;
  label: string;
  units: { id: string; name: string }[];
};

export type ProposalFormValues = {
  id?: string;
  customerId?: string;
  customerUnitId?: string | null;
  title?: string;
  validUntil?: string;
  paymentTerms?: string | null;
  commercialConditions?: string | null;
  observations?: string | null;
  discountCents?: number;
  items?: { description: string; quantity: string; unitPriceCents: number }[];
};

type ItemDraft = {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

function emptyItem(key: string): ItemDraft {
  return { key, description: "", quantity: "1", unitPrice: "" };
}

function toQuantityNumber(raw: string): number | null {
  const normalized = raw.trim().replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,3})?$/.test(normalized)) return null;
  return Number(normalized);
}

export function ProposalForm({
  customers,
  proposal,
}: {
  customers: CustomerOption[];
  proposal?: ProposalFormValues;
}) {
  const isEdit = Boolean(proposal?.id);
  const { state, onSubmit, pending } = useGuardedForm(
    isEdit ? updateProposalAction : createProposalAction,
  );
  const uid = useId();
  const [customerId, setCustomerId] = useState(proposal?.customerId ?? "");
  // Chaves determinísticas: o formulário renderiza no servidor e hidrata no cliente.
  const nextKey = useRef(proposal?.items?.length ?? 1);
  const [items, setItems] = useState<ItemDraft[]>(() =>
    proposal?.items?.length
      ? proposal.items.map((item, index) => ({
          key: `item-${index}`,
          description: item.description,
          quantity: item.quantity.replace(".", ","),
          unitPrice: centsToInputValue(item.unitPriceCents),
        }))
      : [emptyItem("item-0")],
  );
  const [discount, setDiscount] = useState(
    proposal?.discountCents ? centsToInputValue(proposal.discountCents) : "",
  );

  const units =
    customers.find((customer) => customer.id === customerId)?.units ?? [];

  const totals = useMemo(() => {
    const lines: { quantity: number; unitPriceCents: number }[] = [];
    for (const item of items) {
      if (!item.description.trim() && !item.unitPrice.trim()) continue;
      const quantity = toQuantityNumber(item.quantity);
      const price = parseBrlToCents(item.unitPrice);
      if (quantity === null || !price.ok) return null;
      lines.push({ quantity, unitPriceCents: price.cents });
    }
    const discountValue = discount.trim()
      ? parseBrlToCents(discount)
      : { ok: true as const, cents: 0 };
    if (!discountValue.ok) return null;
    const result = computeProposalTotals(lines, discountValue.cents);
    return result.ok ? result : null;
  }, [items, discount]);

  function updateItem(key: string, patch: Partial<ItemDraft>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {proposal?.id ? (
        <input type="hidden" name="proposalId" value={proposal.id} />
      ) : null}

      <section className="space-y-4 rounded-xl border border-border bg-background p-4">
        <h2 className="text-lg font-semibold text-navy">Dados do orçamento</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${uid}-customer`}>Cliente</Label>
            <select
              id={`${uid}-customer`}
              name="customerId"
              required
              className={SELECT_CLASS}
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            >
              <option value="">Selecione o cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${uid}-unit`}>Unidade (opcional)</Label>
            <select
              id={`${uid}-unit`}
              name="customerUnitId"
              className={SELECT_CLASS}
              defaultValue={proposal?.customerUnitId ?? ""}
              key={customerId}
            >
              <option value="">Sem unidade específica</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
          <TextField
            label="Título"
            name="title"
            defaultValue={proposal?.title}
            required
            maxLength={160}
          />
          <TextField
            label="Válido até"
            name="validUntil"
            type="date"
            defaultValue={proposal?.validUntil}
            hint="Vale até o fim do dia. Sem data, o orçamento não expira."
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-background p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-navy">Itens</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={items.length >= MAX_PROPOSAL_ITEMS}
            onClick={() => {
              const key = `item-${nextKey.current}`;
              nextKey.current += 1;
              setItems((current) => [...current, emptyItem(key)]);
            }}
          >
            Adicionar item
          </Button>
        </div>
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={item.key}
              className="grid items-end gap-3 md:grid-cols-[1fr_7rem_9rem_auto]"
            >
              <div className="space-y-2">
                <Label htmlFor={`${uid}-d-${item.key}`}>
                  Descrição {index + 1}
                </Label>
                <Input
                  id={`${uid}-d-${item.key}`}
                  name="itemDescription"
                  value={item.description}
                  onChange={(event) =>
                    updateItem(item.key, { description: event.target.value })
                  }
                  maxLength={300}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${uid}-q-${item.key}`}>Quantidade</Label>
                <Input
                  id={`${uid}-q-${item.key}`}
                  name="itemQuantity"
                  inputMode="decimal"
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(item.key, { quantity: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${uid}-p-${item.key}`}>
                  Valor unitário (R$)
                </Label>
                <Input
                  id={`${uid}-p-${item.key}`}
                  name="itemUnitPrice"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={item.unitPrice}
                  onChange={(event) =>
                    updateItem(item.key, { unitPrice: event.target.value })
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={items.length === 1}
                onClick={() =>
                  setItems((current) =>
                    current.filter((row) => row.key !== item.key),
                  )
                }
              >
                Remover
              </Button>
            </li>
          ))}
        </ul>
        <div className="grid gap-4 md:grid-cols-[12rem_1fr] md:items-end">
          <div className="space-y-2">
            <Label htmlFor={`${uid}-discount`}>Desconto (R$)</Label>
            <Input
              id={`${uid}-discount`}
              name="discount"
              inputMode="decimal"
              placeholder="0,00"
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
            />
          </div>
          <dl className="space-y-1 text-sm md:text-right" aria-live="polite">
            {totals ? (
              <>
                <div>
                  <dt className="inline text-muted-foreground">Subtotal: </dt>
                  <dd className="inline">
                    {formatCents(totals.subtotalCents)}
                  </dd>
                </div>
                <div>
                  <dt className="inline text-muted-foreground">Total: </dt>
                  <dd className="inline text-base font-semibold text-navy">
                    {formatCents(totals.totalCents)}
                  </dd>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                Revise quantidades, valores e desconto para ver o total.
              </p>
            )}
          </dl>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-background p-4">
        <h2 className="text-lg font-semibold text-navy">Condições</h2>
        <TextAreaField
          label="Condições de pagamento"
          name="paymentTerms"
          defaultValue={proposal?.paymentTerms}
          maxLength={500}
        />
        <TextAreaField
          label="Condições comerciais"
          name="commercialConditions"
          defaultValue={proposal?.commercialConditions}
          maxLength={2000}
        />
        <TextAreaField
          label="Observações"
          name="observations"
          defaultValue={proposal?.observations}
          maxLength={2000}
        />
      </section>

      <FormError message={state?.error} />
      <Button type="submit" disabled={pending}>
        {pending
          ? "Salvando..."
          : isEdit
            ? "Salvar orçamento"
            : "Criar rascunho"}
      </Button>
    </form>
  );
}

/* ------------------------------------------------------- transições da proposta */

export function TransitionButton({
  proposalId,
  to,
  label,
  variant = "default",
  withReason = false,
}: {
  proposalId: string;
  to: "sent" | "accepted" | "rejected" | "expired";
  label: string;
  variant?: "default" | "outline" | "destructive";
  withReason?: boolean;
}) {
  const confirmByStatus: Record<typeof to, string | undefined> = {
    sent: "Marcar este orçamento como enviado ao cliente?",
    accepted: "Registrar o aceite do cliente? Esta decisão alimenta o fluxo comercial.",
    rejected: "Registrar a recusa deste orçamento?",
    expired: "Marcar este orçamento como expirado?",
  };
  const { state, onSubmit, pending } = useGuardedForm(transitionProposalAction, {
    confirmMessage: confirmByStatus[to],
  });
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="to" value={to} />
      {withReason ? (
        <TextField label="Motivo (opcional)" name="reason" maxLength={500} />
      ) : null}
      <FormError message={state?.error} />
      <Button type="submit" variant={variant} disabled={pending}>
        {pending ? "Processando..." : label}
      </Button>
    </form>
  );
}

export function ArchiveProposalButton({ proposalId }: { proposalId: string }) {
  const { state, onSubmit, pending } = useGuardedForm(archiveProposalAction, {
    confirmMessage: "Arquivar este rascunho de orçamento?",
  });
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="proposalId" value={proposalId} />
      <FormError message={state?.error} />
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Arquivando..." : "Arquivar rascunho"}
      </Button>
    </form>
  );
}

export function ReviseProposalButton({ proposalId }: { proposalId: string }) {
  const { state, onSubmit, pending } = useGuardedForm(reviseProposalAction);
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="proposalId" value={proposalId} />
      <FormError message={state?.error} />
      <Button type="submit" variant="outline" disabled={pending}>
        Criar nova proposta a partir desta
      </Button>
    </form>
  );
}
