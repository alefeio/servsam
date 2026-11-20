"use client";

import { Button } from "@/components/ui/button";
import { formatBrDocument } from "@/lib/platform/br-document";
import { useGuardedForm } from "@/features/platform/use-guarded-form";
import {
  addContactAction,
  addUnitAction,
  archiveContactAction,
  archiveCustomerAction,
  archiveUnitAction,
  createCustomerAction,
  restoreCustomerAction,
  updateContactAction,
  updateCustomerAction,
  updateUnitAction,
} from "@/lib/platform/customer-actions";
import {
  FormError,
  TextAreaField,
  TextField,
} from "@/features/platform/form-parts";

export type CustomerFormValues = {
  id?: string;
  legalName?: string;
  tradeName?: string | null;
  document?: string | null;
  segment?: string | null;
  notes?: string | null;
};

export function CustomerForm({ customer }: { customer?: CustomerFormValues }) {
  const isEdit = Boolean(customer?.id);
  const { state, onSubmit, pending } = useGuardedForm(
    isEdit ? updateCustomerAction : createCustomerAction,
  );
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-border bg-background p-4"
    >
      {customer?.id ? (
        <input type="hidden" name="customerId" value={customer.id} />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Nome ou razão social"
          name="legalName"
          defaultValue={customer?.legalName}
          required
          maxLength={160}
        />
        <TextField
          label="Nome fantasia"
          name="tradeName"
          defaultValue={customer?.tradeName}
          maxLength={160}
        />
        <TextField
          label="CPF ou CNPJ"
          name="document"
          defaultValue={formatBrDocument(customer?.document)}
          inputMode="numeric"
          hint="Opcional para prospecção. Se informado, precisa ser válido."
        />
        <TextField
          label="Segmento"
          name="segment"
          defaultValue={customer?.segment}
          maxLength={80}
        />
      </div>
      <TextAreaField
        label="Observações"
        name="notes"
        defaultValue={customer?.notes}
        maxLength={2000}
      />
      <FormError message={state?.error} />
      <Button type="submit" disabled={pending}>
        {pending
          ? "Salvando..."
          : isEdit
            ? "Salvar cliente"
            : "Cadastrar cliente"}
      </Button>
    </form>
  );
}

export function ArchiveCustomerForm({ customerId }: { customerId: string }) {
  const { state, onSubmit, pending } = useGuardedForm(archiveCustomerAction, {
    confirmMessage:
      "Arquivar este cliente? Ele sai das listagens ativas, mas o histórico permanece. Orçamentos em andamento podem bloquear a ação.",
  });
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="customerId" value={customerId} />
      <FormError message={state?.error} />
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Arquivando..." : "Arquivar cliente"}
      </Button>
    </form>
  );
}

export function RestoreCustomerForm({ customerId }: { customerId: string }) {
  const { state, onSubmit, pending } = useGuardedForm(restoreCustomerAction);
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="customerId" value={customerId} />
      <FormError message={state?.error} />
      <Button type="submit" variant="outline" disabled={pending}>
        Restaurar cliente
      </Button>
    </form>
  );
}

/* ----------------------------------------------------------------- contatos */

export type ContactRow = {
  id: string;
  name: string;
  roleTitle: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
};

export function ContactForm({
  customerId,
  contact,
}: {
  customerId: string;
  contact?: ContactRow;
}) {
  const { state, onSubmit, pending } = useGuardedForm(
    contact ? updateContactAction : addContactAction,
  );
  const suffix = contact?.id ?? "new";
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="customerId" value={customerId} />
      {contact ? (
        <input type="hidden" name="contactId" value={contact.id} />
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        <TextField
          label="Nome"
          name="name"
          defaultValue={contact?.name}
          required
          key={`n-${suffix}`}
        />
        <TextField
          label="Cargo"
          name="roleTitle"
          defaultValue={contact?.roleTitle}
          key={`r-${suffix}`}
        />
        <TextField
          label="E-mail"
          name="email"
          type="email"
          defaultValue={contact?.email}
          key={`e-${suffix}`}
        />
        <TextField
          label="Telefone"
          name="phone"
          inputMode="tel"
          defaultValue={contact?.phone}
          key={`p-${suffix}`}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPrimary"
          defaultChecked={contact?.isPrimary ?? false}
        />
        Contato principal
      </label>
      <FormError message={state?.error} />
      <Button
        type="submit"
        variant={contact ? "outline" : "default"}
        disabled={pending}
      >
        {contact ? "Salvar contato" : "Adicionar contato"}
      </Button>
    </form>
  );
}

export function ArchiveContactForm({ contactId }: { contactId: string }) {
  const { state, onSubmit, pending } = useGuardedForm(archiveContactAction, {
    confirmMessage: "Remover este contato da ficha do cliente?",
  });
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="contactId" value={contactId} />
      <FormError message={state?.error} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        {pending ? "Removendo..." : "Remover"}
      </Button>
    </form>
  );
}

/* ----------------------------------------------------------------- unidades */

export type UnitRow = {
  id: string;
  name: string;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  notes: string | null;
};

export function UnitForm({
  customerId,
  unit,
}: {
  customerId: string;
  unit?: UnitRow;
}) {
  const { state, onSubmit, pending } = useGuardedForm(
    unit ? updateUnitAction : addUnitAction,
  );
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="customerId" value={customerId} />
      {unit ? <input type="hidden" name="unitId" value={unit.id} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <TextField
          label="Nome da unidade"
          name="name"
          defaultValue={unit?.name}
          required
        />
        <TextField
          label="Endereço"
          name="addressLine"
          defaultValue={unit?.addressLine}
        />
        <TextField label="Cidade" name="city" defaultValue={unit?.city} />
        <TextField
          label="UF"
          name="state"
          defaultValue={unit?.state}
          maxLength={2}
        />
        <TextField
          label="CEP"
          name="postalCode"
          inputMode="numeric"
          defaultValue={unit?.postalCode}
        />
      </div>
      <TextAreaField
        label="Observações"
        name="notes"
        defaultValue={unit?.notes}
        rows={2}
      />
      <FormError message={state?.error} />
      <Button
        type="submit"
        variant={unit ? "outline" : "default"}
        disabled={pending}
      >
        {unit ? "Salvar unidade" : "Adicionar unidade"}
      </Button>
    </form>
  );
}

export function ArchiveUnitForm({ unitId }: { unitId: string }) {
  const { state, onSubmit, pending } = useGuardedForm(archiveUnitAction, {
    confirmMessage: "Remover esta unidade da ficha do cliente?",
  });
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="unitId" value={unitId} />
      <FormError message={state?.error} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        {pending ? "Removendo..." : "Remover"}
      </Button>
    </form>
  );
}
