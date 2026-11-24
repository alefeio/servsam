import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { APPOINTMENT_STATUS_LABELS } from "@/data/platform/labels";
import {
  CancelAppointmentForm,
  RescheduleAppointmentForm,
} from "@/features/platform/appointment-forms";
import {
  LinkButton,
  NoAccess,
  PageHeader,
} from "@/features/platform/form-parts";
import {
  requireAuthenticatedUser,
  userHasPermission,
} from "@/lib/platform/access";
import {
  getAppointmentDetail,
  getAppointmentHistory,
} from "@/lib/platform/appointments";
import {
  formatDateTimeBr,
  formatScheduleDateTime,
  toScheduleDateTimeLocalValue,
} from "@/lib/platform/dates";
import { listActiveEmployeeOptions } from "@/lib/platform/employees";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Agendamento"),
  robots: { index: false, follow: false },
};

const HISTORY_LABELS: Record<string, string> = {
  APPOINTMENT_CREATED: "Criado",
  APPOINTMENT_RESCHEDULED: "Remarcado (novo)",
  APPOINTMENT_CANCELLED: "Cancelado",
  APPOINTMENT_ASSIGNEE_CHANGED: "Responsável alterado",
};

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "schedule.view"))
    return <NoAccess what="ver a agenda" />;

  const { id } = await params;
  const appointment = await getAppointmentDetail(actor, id);
  if (!appointment) notFound();

  const canUpdate = userHasPermission(actor, "schedule.update");
  const canSeeEmployees = userHasPermission(actor, "employee.view");
  const employees = canSeeEmployees
    ? await listActiveEmployeeOptions(actor)
    : [];
  const history = userHasPermission(actor, "audit.view")
    ? await getAppointmentHistory(actor, appointment.id)
    : [];

  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title={`${appointment.serviceOrder.code} · agendamento`}
        description={`${formatScheduleDateTime(appointment.startsAt)} — ${formatScheduleDateTime(appointment.endsAt)} · ${APPOINTMENT_STATUS_LABELS[appointment.status]}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/sistema/agenda" variant="outline">
              Agenda
            </LinkButton>
            <LinkButton
              href={`/sistema/ordens-servico/${appointment.serviceOrder.id}`}
              variant="outline"
            >
              Abrir OS
            </LinkButton>
          </div>
        }
      />

      <dl className="grid gap-3 rounded-xl border border-border bg-background p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Cliente</dt>
          <dd className="font-medium">
            {appointment.serviceOrder.customer.legalName}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Unidade</dt>
          <dd className="font-medium">
            {appointment.serviceOrder.customerUnit?.name ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Serviço</dt>
          <dd className="font-medium">{appointment.serviceOrder.description}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Responsável</dt>
          <dd className="font-medium">
            {appointment.employee ? (
              userHasPermission(actor, "employee.view") ? (
                <Link
                  href={`/sistema/colaboradores/${appointment.employee.id}`}
                  className="text-navy hover:underline"
                >
                  {appointment.employee.fullName}
                </Link>
              ) : (
                appointment.employee.fullName
              )
            ) : (
              "Sem atribuição"
            )}
          </dd>
        </div>
        {appointment.notes ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Observações</dt>
            <dd className="mt-1 whitespace-pre-wrap">{appointment.notes}</dd>
          </div>
        ) : null}
        {appointment.changeReason ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Motivo</dt>
            <dd className="mt-1">{appointment.changeReason}</dd>
          </div>
        ) : null}
        {appointment.conflictAccepted ? (
          <div className="sm:col-span-2 text-amber-800">
            Conflito de horário confirmado pelo usuário.
          </div>
        ) : null}
      </dl>

      {canUpdate && appointment.status === "scheduled" ? (
        <section className="space-y-4" aria-labelledby="acoes-agenda">
          <h2 id="acoes-agenda" className="text-lg font-semibold text-navy">
            Remarcar
          </h2>
          <RescheduleAppointmentForm
            appointmentId={appointment.id}
            serviceOrderId={appointment.serviceOrder.id}
            employees={employees}
            defaultStartsAtLocal={toScheduleDateTimeLocalValue(
              appointment.startsAt,
            )}
            defaultEndsAtLocal={toScheduleDateTimeLocalValue(
              appointment.endsAt,
            )}
            defaultEmployeeId={appointment.employeeId}
            defaultNotes={appointment.notes}
          />
          <CancelAppointmentForm
            appointmentId={appointment.id}
            serviceOrderId={appointment.serviceOrder.id}
            redirectTo={`/sistema/ordens-servico/${appointment.serviceOrder.id}`}
          />
        </section>
      ) : null}

      {history.length > 0 ? (
        <section className="space-y-3" aria-labelledby="historico-agenda">
          <h2 id="historico-agenda" className="text-lg font-semibold text-navy">
            Histórico
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-background text-sm">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap justify-between gap-2 px-4 py-3"
              >
                <span>{HISTORY_LABELS[entry.action] ?? entry.action}</span>
                <span className="text-muted-foreground">
                  {entry.actor?.name ?? "Sistema"} ·{" "}
                  {formatDateTimeBr(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
