"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGuardedForm } from "@/features/platform/use-guarded-form";
import {
  FormError,
  TextAreaField,
  TextField,
} from "@/features/platform/form-parts";
import {
  cancelAppointmentAction,
  createAppointmentAction,
  rescheduleAppointmentAction,
} from "@/lib/platform/appointment-actions";
import { CONFLICT_MESSAGE } from "@/lib/platform/appointment-constants";

export type EmployeeOption = {
  id: string;
  fullName: string;
  jobTitle: string;
};

function ConflictCheckbox({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <label className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      <input
        type="checkbox"
        name="acceptConflict"
        value="1"
        className="mt-1"
        aria-label="Confirme para salvar mesmo assim"
      />
      <span>
        {CONFLICT_MESSAGE} Confirme para salvar mesmo assim. A decisão será
        registrada na auditoria.
      </span>
    </label>
  );
}

export function CreateAppointmentForm({
  serviceOrderId,
  employees,
  redirectTo,
}: {
  serviceOrderId: string;
  employees: EmployeeOption[];
  redirectTo?: string;
}) {
  const { state, onSubmit, pending } = useGuardedForm(createAppointmentAction);
  const showConflict = state?.error === CONFLICT_MESSAGE;
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-border bg-background p-4"
    >
      <input type="hidden" name="serviceOrderId" value={serviceOrderId} />
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Início"
          name="startsAtLocal"
          type="datetime-local"
          required
        />
        <TextField
          label="Término"
          name="endsAtLocal"
          type="datetime-local"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="employeeId-create">
          Colaborador responsável
        </label>
        <select
          id="employeeId-create"
          name="employeeId"
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          defaultValue=""
        >
          <option value="">Sem atribuição</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.fullName} · {employee.jobTitle}
            </option>
          ))}
        </select>
      </div>
      <TextAreaField label="Observações" name="notes" maxLength={2000} />
      <ConflictCheckbox show={Boolean(showConflict)} />
      <FormError message={state?.error} />
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Confirmar agendamento"}
      </Button>
    </form>
  );
}

export function RescheduleAppointmentForm({
  appointmentId,
  serviceOrderId,
  employees,
  defaultStartsAtLocal,
  defaultEndsAtLocal,
  defaultEmployeeId,
  defaultNotes,
  redirectTo,
}: {
  appointmentId: string;
  serviceOrderId: string;
  employees: EmployeeOption[];
  defaultStartsAtLocal?: string;
  defaultEndsAtLocal?: string;
  defaultEmployeeId?: string | null;
  defaultNotes?: string | null;
  redirectTo?: string;
}) {
  const { state, onSubmit, pending } = useGuardedForm(
    rescheduleAppointmentAction,
  );
  const showConflict = state?.error === CONFLICT_MESSAGE;
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-border bg-background p-4"
    >
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <input type="hidden" name="serviceOrderId" value={serviceOrderId} />
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Novo início"
          name="startsAtLocal"
          type="datetime-local"
          required
          defaultValue={defaultStartsAtLocal}
        />
        <TextField
          label="Novo término"
          name="endsAtLocal"
          type="datetime-local"
          required
          defaultValue={defaultEndsAtLocal}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="employeeId-reschedule">
          Colaborador responsável
        </label>
        <select
          id="employeeId-reschedule"
          name="employeeId"
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          defaultValue={defaultEmployeeId ?? ""}
        >
          <option value="">Sem atribuição</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.fullName} · {employee.jobTitle}
            </option>
          ))}
        </select>
      </div>
      <TextField
        label="Motivo da remarcação"
        name="reason"
        required
        maxLength={500}
      />
      <TextAreaField
        label="Observações"
        name="notes"
        defaultValue={defaultNotes}
        maxLength={2000}
      />
      <ConflictCheckbox show={Boolean(showConflict)} />
      <FormError message={state?.error} />
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Remarcar"}
      </Button>
    </form>
  );
}

export function CancelAppointmentForm({
  appointmentId,
  serviceOrderId,
  redirectTo,
}: {
  appointmentId: string;
  serviceOrderId: string;
  redirectTo?: string;
}) {
  const [open, setOpen] = useState(false);
  const { state, onSubmit, pending } = useGuardedForm(cancelAppointmentAction);
  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Cancelar agendamento
      </Button>
    );
  }
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-border bg-background p-4"
    >
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <input type="hidden" name="serviceOrderId" value={serviceOrderId} />
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}
      <TextField
        label="Motivo do cancelamento"
        name="reason"
        required
        maxLength={500}
      />
      <FormError message={state?.error} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Cancelando..." : "Confirmar cancelamento"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Voltar
        </Button>
      </div>
    </form>
  );
}
