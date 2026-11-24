import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  APPOINTMENT_STATUS_LABELS,
  ENGAGEMENT_ORIGIN_LABELS,
  SERVICE_ORDER_STATUS_LABELS,
} from "@/data/platform/labels";
import {
  CancelAppointmentForm,
  CreateAppointmentForm,
  RescheduleAppointmentForm,
} from "@/features/platform/appointment-forms";
import {
  LinkButton,
  NoAccess,
  PageHeader,
} from "@/features/platform/form-parts";
import { CancelServiceOrderButton } from "@/features/platform/service-order-form";
import {
  requireAuthenticatedUser,
  userHasPermission,
} from "@/lib/platform/access";
import {
  listAppointmentsForServiceOrder,
} from "@/lib/platform/appointments";
import {
  formatDateBr,
  formatDateTimeBr,
  formatScheduleDateTime,
  toScheduleDateTimeLocalValue,
} from "@/lib/platform/dates";
import { listActiveEmployeeOptions } from "@/lib/platform/employees";
import {
  canCancelServiceOrder,
  canScheduleServiceOrder,
} from "@/lib/platform/service-order-state";
import {
  getServiceOrderDetail,
  getServiceOrderHistory,
} from "@/lib/platform/service-orders";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Ordem de serviço"),
  robots: { index: false, follow: false },
};

const HISTORY_LABELS: Record<string, string> = {
  SERVICE_ORDER_CREATED: "Emitida",
  SERVICE_ORDER_CANCELLED: "Cancelada",
  SERVICE_ORDER_STATUS_CHANGED: "Situação alterada",
  APPOINTMENT_CREATED: "Agendamento criado",
  APPOINTMENT_RESCHEDULED: "Agendamento remarcado",
  APPOINTMENT_CANCELLED: "Agendamento cancelado",
};

export default async function ServiceOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "service_order.view"))
    return <NoAccess what="ver ordens de serviço" />;

  const { id } = await params;
  const order = await getServiceOrderDetail(actor, id);
  if (!order) notFound();

  const can = (key: string) => userHasPermission(actor, key);
  const history = can("audit.view")
    ? await getServiceOrderHistory(actor, order.id)
    : [];

  const canViewSchedule = can("schedule.view");
  const appointments = canViewSchedule
    ? await listAppointmentsForServiceOrder(actor, order.id)
    : [];
  const active = appointments.find((row) => row.status === "scheduled");
  const employees =
    can("employee.view") && (can("schedule.create") || can("schedule.update"))
      ? await listActiveEmployeeOptions(actor)
      : [];

  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title={`${order.code} · ${order.description}`}
        description="Documento operacional persistente com agendamento no PostgreSQL."
        actions={
          <div className="flex flex-wrap gap-2">
            {canViewSchedule ? (
              <LinkButton href="/sistema/agenda" variant="outline">
                Agenda
              </LinkButton>
            ) : null}
            <LinkButton href="/sistema/ordens-servico" variant="outline">
              Voltar
            </LinkButton>
          </div>
        }
      />

      <dl className="grid gap-3 rounded-xl border border-border bg-background p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Situação</dt>
          <dd className="mt-1 font-medium">
            {SERVICE_ORDER_STATUS_LABELS[order.status]}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Emitida em</dt>
          <dd className="font-medium">{formatDateBr(order.issuedAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Cliente</dt>
          <dd className="font-medium">
            {can("customer.view") ? (
              <Link
                href={`/sistema/clientes/${order.customer.id}`}
                className="text-navy hover:underline"
              >
                {order.customer.legalName}
              </Link>
            ) : (
              order.customer.legalName
            )}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Unidade</dt>
          <dd className="font-medium">{order.customerUnit?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Contratação</dt>
          <dd className="font-medium">
            {can("contract.view") ? (
              <Link
                href={`/sistema/contratacoes/${order.engagement.id}`}
                className="text-navy hover:underline"
              >
                {order.engagement.code}
              </Link>
            ) : (
              order.engagement.code
            )}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Origem comercial</dt>
          <dd className="font-medium">
            {ENGAGEMENT_ORIGIN_LABELS[order.engagement.origin]}
            {order.engagement.proposal ? (
              <>
                {" · "}
                {can("proposal.view") ? (
                  <Link
                    href={`/sistema/orcamentos/${order.engagement.proposal.id}`}
                    className="text-navy hover:underline"
                  >
                    {order.engagement.proposal.code}
                  </Link>
                ) : (
                  order.engagement.proposal.code
                )}
              </>
            ) : null}
            {order.engagement.purchaseOrder ? (
              <>
                {" · "}
                <Link
                  href={`/sistema/ordens-compra/${order.engagement.purchaseOrder.id}`}
                  className="text-navy hover:underline"
                >
                  {order.engagement.purchaseOrder.code}
                </Link>
              </>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Item contratado</dt>
          <dd className="font-medium">
            #{order.engagementItem.position} ·{" "}
            {order.engagementItem.description}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Qtd. contratada (referência)</dt>
          <dd className="font-medium">
            {new Intl.NumberFormat("pt-BR", {
              maximumFractionDigits: 3,
            }).format(Number(order.quantity))}
          </dd>
        </div>
      </dl>

      {order.scopeNotes || order.observations ? (
        <section className="space-y-3 rounded-xl border border-border bg-background p-4 text-sm">
          {order.scopeNotes ? (
            <div>
              <h3 className="font-medium">Escopo</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {order.scopeNotes}
              </p>
            </div>
          ) : null}
          {order.observations ? (
            <div>
              <h3 className="font-medium">Observações</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {order.observations}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {order.status === "cancelled" && order.cancellationReason ? (
        <p className="text-sm text-muted-foreground">
          Motivo do cancelamento: {order.cancellationReason}
        </p>
      ) : null}

      {canViewSchedule ? (
        <section className="space-y-4" aria-labelledby="agendamento">
          <h2 id="agendamento" className="text-lg font-semibold text-navy">
            Agendamento
          </h2>

          {active ? (
            <div className="space-y-4 rounded-xl border border-border bg-background p-4 text-sm">
              <p>
                <Link
                  href={`/sistema/agenda/${active.id}`}
                  className="font-medium text-navy hover:underline"
                >
                  {formatScheduleDateTime(active.startsAt)} —{" "}
                  {formatScheduleDateTime(active.endsAt)}
                </Link>
              </p>
              <p className="text-muted-foreground">
                Responsável: {active.employee?.fullName ?? "Sem atribuição"} ·{" "}
                {APPOINTMENT_STATUS_LABELS[active.status]}
              </p>
              {can("schedule.update") ? (
                <>
                  <RescheduleAppointmentForm
                    appointmentId={active.id}
                    serviceOrderId={order.id}
                    employees={employees}
                    defaultStartsAtLocal={toScheduleDateTimeLocalValue(
                      active.startsAt,
                    )}
                    defaultEndsAtLocal={toScheduleDateTimeLocalValue(
                      active.endsAt,
                    )}
                    defaultEmployeeId={active.employeeId}
                    defaultNotes={active.notes}
                    redirectTo={`/sistema/ordens-servico/${order.id}`}
                  />
                  <CancelAppointmentForm
                    appointmentId={active.id}
                    serviceOrderId={order.id}
                    redirectTo={`/sistema/ordens-servico/${order.id}`}
                  />
                </>
              ) : null}
            </div>
          ) : can("schedule.create") &&
            canScheduleServiceOrder(order.status) ? (
            <CreateAppointmentForm
              serviceOrderId={order.id}
              employees={employees}
              redirectTo={`/sistema/ordens-servico/${order.id}`}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Não há agendamento vigente para esta OS.
            </p>
          )}

          {appointments.length > 1 ||
          (appointments.length === 1 && !active) ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Histórico de compromissos</h3>
              <ul className="divide-y divide-border rounded-xl border border-border bg-background text-sm">
                {appointments.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap justify-between gap-2 px-4 py-3"
                  >
                    <Link
                      href={`/sistema/agenda/${row.id}`}
                      className="text-navy hover:underline"
                    >
                      {formatScheduleDateTime(row.startsAt)} ·{" "}
                      {APPOINTMENT_STATUS_LABELS[row.status]}
                    </Link>
                    <span className="text-muted-foreground">
                      {row.employee?.fullName ?? "Sem atribuição"}
                      {row.changeReason ? ` · ${row.changeReason}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {can("service_order.update") && canCancelServiceOrder(order.status) ? (
        <section className="space-y-3" aria-labelledby="acoes">
          <h2 id="acoes" className="text-lg font-semibold text-navy">
            Ações
          </h2>
          <CancelServiceOrderButton serviceOrderId={order.id} />
        </section>
      ) : null}

      {history.length > 0 ? (
        <section className="space-y-3" aria-labelledby="historico">
          <h2 id="historico" className="text-lg font-semibold text-navy">
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
