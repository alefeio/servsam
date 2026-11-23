"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FormError,
  TextAreaField,
  TextField,
} from "@/features/platform/form-parts";
import { useGuardedForm } from "@/features/platform/use-guarded-form";
import { createPurchaseOrderAction } from "@/lib/platform/purchase-order-actions";
import { MAX_PURCHASE_ORDER_ITEMS } from "@/lib/platform/purchase-order-schemas";

export type CustomerOption = {
  id: string;
  label: string;
  units: { id: string; name: string }[];
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

export function PurchaseOrderForm({
  customers,
}: {
  customers: CustomerOption[];
}) {
  const { state, onSubmit, pending } = useGuardedForm(createPurchaseOrderAction);
  const uid = useId();
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([emptyItem(`${uid}-0`)]);
  const units = customers.find((c) => c.id === customerId)?.units ?? [];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor={`${uid}-customer`} className="text-sm font-medium">
            Cliente
          </label>
          <select
            id={`${uid}-customer`}
            name="customerId"
            required
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Selecione</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${uid}-unit`} className="text-sm font-medium">
            Unidade (opcional)
          </label>
          <select
            id={`${uid}-unit`}
            name="customerUnitId"
            className={SELECT_CLASS}
            disabled={!customerId}
          >
            <option value="">Sem unidade</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>
        <TextField
          label="Número da O.C. do cliente"
          name="externalNumber"
          required
          maxLength={80}
        />
        <TextField
          label="Data de recebimento"
          name="receivedAt"
          type="date"
          required
        />
        <TextField
          label="Referência do documento"
          name="documentReference"
          maxLength={300}
          placeholder="Ex.: e-mail, protocolo, pasta"
        />
        <TextField
          label="Valor acordado (opcional)"
          name="agreedAmount"
          placeholder="Se vazio, usa a soma dos itens"
        />
        <div className="sm:col-span-2">
          <TextAreaField
            label="Descrição"
            name="description"
            maxLength={500}
          />
        </div>
        <div className="sm:col-span-2">
          <TextAreaField
            label="Observações"
            name="observations"
            maxLength={2000}
          />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Itens dos serviços</legend>
        {items.map((item, index) => (
          <div
            key={item.key}
            className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-12"
          >
            <div className="sm:col-span-6">
              <label className="text-xs text-muted-foreground">Descrição</label>
              <input
                name="itemDescription"
                value={item.description}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = { ...item, description: event.target.value };
                  setItems(next);
                }}
                className={SELECT_CLASS}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Qtd.</label>
              <input
                name="itemQuantity"
                value={item.quantity}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = { ...item, quantity: event.target.value };
                  setItems(next);
                }}
                className={SELECT_CLASS}
                required
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs text-muted-foreground">
                Preço unitário
              </label>
              <input
                name="itemUnitPrice"
                value={item.unitPrice}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = { ...item, unitPrice: event.target.value };
                  setItems(next);
                }}
                className={SELECT_CLASS}
                required
                placeholder="0,00"
              />
            </div>
            <div className="flex items-end sm:col-span-1">
              <Button
                type="button"
                variant="outline"
                disabled={items.length <= 1}
                onClick={() =>
                  setItems(items.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                Remover
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={items.length >= MAX_PURCHASE_ORDER_ITEMS}
          onClick={() =>
            setItems([...items, emptyItem(`${uid}-${items.length}`)])
          }
        >
          Adicionar item
        </Button>
      </fieldset>

      <FormError message={state?.error} />
      <Button type="submit" disabled={pending}>
        {pending ? "Registrando..." : "Registrar O.C. recebida"}
      </Button>
    </form>
  );
}
