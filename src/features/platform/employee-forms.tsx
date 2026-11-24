"use client";

import { Button } from "@/components/ui/button";
import { useGuardedForm } from "@/features/platform/use-guarded-form";
import {
  FormError,
  TextAreaField,
  TextField,
} from "@/features/platform/form-parts";
import {
  createEmployeeAction,
  updateEmployeeAction,
} from "@/lib/platform/employee-actions";

export type EmployeeFormValues = {
  id?: string;
  fullName?: string;
  jobTitle?: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export function EmployeeForm({ employee }: { employee?: EmployeeFormValues }) {
  const isEdit = Boolean(employee?.id);
  const { state, onSubmit, pending } = useGuardedForm(
    isEdit ? updateEmployeeAction : createEmployeeAction,
  );
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-border bg-background p-4"
    >
      {employee?.id ? (
        <input type="hidden" name="employeeId" value={employee.id} />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Nome completo"
          name="fullName"
          defaultValue={employee?.fullName}
          required
          maxLength={160}
        />
        <TextField
          label="Função / cargo"
          name="jobTitle"
          defaultValue={employee?.jobTitle}
          required
          maxLength={120}
        />
        <TextField
          label="Telefone profissional"
          name="phone"
          defaultValue={employee?.phone}
          inputMode="tel"
          maxLength={40}
        />
        <TextField
          label="E-mail profissional"
          name="email"
          type="email"
          defaultValue={employee?.email}
          maxLength={160}
        />
      </div>
      <TextAreaField
        label="Observações"
        name="notes"
        defaultValue={employee?.notes}
        maxLength={2000}
      />
      {isEdit ? (
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Situação</span>
          <select
            name="isActive"
            defaultValue={employee?.isActive === false ? "0" : "1"}
            className="flex h-9 w-full max-w-xs rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="1">Ativo</option>
            <option value="0">Inativo</option>
          </select>
        </label>
      ) : (
        <input type="hidden" name="isActive" value="1" />
      )}
      <FormError message={state?.error} />
      <Button type="submit" disabled={pending}>
        {pending
          ? "Salvando..."
          : isEdit
            ? "Salvar colaborador"
            : "Cadastrar colaborador"}
      </Button>
    </form>
  );
}
