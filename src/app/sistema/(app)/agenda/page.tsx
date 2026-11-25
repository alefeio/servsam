import type { Metadata } from "next";
import Link from "next/link";
import { APPOINTMENT_STATUS_LABELS } from "@/data/platform/labels";
import { AgendaCalendar } from "@/features/platform/agenda-calendar";
import {
  EmptyState,
  LinkButton,
  NoAccess,
  PageHeader,
  PlatformPage,
} from "@/features/platform/form-parts";
import {
  requireAuthenticatedUser,
  userHasPermission,
} from "@/lib/platform/access";
import { listAppointments } from "@/lib/platform/appointments";
import { listCustomers } from "@/lib/platform/customers";
import { formatScheduleDateTime } from "@/lib/platform/dates";
import { listEmployees } from "@/lib/platform/employees";
import {
  formatScheduleDateOnly,
  isAgendaView,
  resolveAgendaWindow,
  shiftFocusDate,
  todayScheduleDateOnly,
  type AgendaView,
} from "@/lib/platform/schedule-range";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Agenda"),
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  view?: string | string[];
  data?: string | string[];
  colaborador?: string | string[];
  cliente?: string | string[];
  status?: string | string[];
  os?: string | string[];
  layout?: string | string[];
}>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function buildQuery(params: Record<string, string>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "schedule.view"))
    return <NoAccess what="ver a agenda" />;

  const params = await searchParams;
  const viewRaw = first(params.view);
  const view: AgendaView = isAgendaView(viewRaw) ? viewRaw : "week";
  const focus = first(params.data) || todayScheduleDateOnly();
  const employeeId = first(params.colaborador);
  const customerId = first(params.cliente);
  const statusRaw = first(params.status);
  const status =
    statusRaw === "scheduled" ||
    statusRaw === "completed" ||
    statusRaw === "cancelled"
      ? statusRaw
      : "scheduled";
  const osQuery = first(params.os);
  const layout = first(params.layout) === "lista" ? "lista" : "calendario";

  const window = resolveAgendaWindow(view, focus);
  const appointments = await listAppointments(actor, {
    from: window.from,
    to: window.to,
    employeeId: employeeId || undefined,
    customerId: customerId || undefined,
    status,
    query: osQuery || undefined,
  });

  const canSeeEmployees = userHasPermission(actor, "employee.view");
  const canSeeCustomers = userHasPermission(actor, "customer.view");
  const employees = canSeeEmployees
    ? await listEmployees(actor, { includeInactive: true })
    : [];
  const customers = canSeeCustomers
    ? await listCustomers(actor, { includeArchived: false })
    : [];

  const baseParams = {
    view,
    data: focus,
    colaborador: employeeId,
    cliente: customerId,
    status,
    os: osQuery,
    layout,
  };

  const calendarEvents = appointments.map((item) => ({
    id: item.id,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    serviceOrder: {
      id: item.serviceOrder.id,
      code: item.serviceOrder.code,
      description: item.serviceOrder.description,
      customer: { legalName: item.serviceOrder.customer.legalName },
    },
    employee: item.employee
      ? { fullName: item.employee.fullName }
      : null,
  }));

  return (
    <PlatformPage width="wide">
      <PageHeader
        title="Agenda operacional"
        description="Calendário com compromissos reais do PostgreSQL. Horários em America/Belém."
        actions={
          userHasPermission(actor, "service_order.view") ? (
            <LinkButton href="/sistema/ordens-servico" variant="outline">
              Ordens de serviço
            </LinkButton>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["day", "Dia"],
            ["week", "Semana"],
            ["month", "Mês"],
          ] as const
        ).map(([key, label]) => (
          <Link
            key={key}
            href={`/sistema/agenda${buildQuery({ ...baseParams, view: key })}`}
            className={
              view === key
                ? "rounded-lg bg-navy px-3 py-1.5 text-sm text-white"
                : "rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
            }
          >
            {label}
          </Link>
        ))}
        <Link
          href={`/sistema/agenda${buildQuery({
            ...baseParams,
            data: shiftFocusDate(focus, view, -1),
          })}`}
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Anterior
        </Link>
        <Link
          href={`/sistema/agenda${buildQuery({
            ...baseParams,
            data: todayScheduleDateOnly(),
          })}`}
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Hoje
        </Link>
        <Link
          href={`/sistema/agenda${buildQuery({
            ...baseParams,
            data: shiftFocusDate(focus, view, 1),
          })}`}
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Próximo
        </Link>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <Link
          href={`/sistema/agenda${buildQuery({
            ...baseParams,
            layout: "calendario",
          })}`}
          className={
            layout === "calendario"
              ? "rounded-lg bg-navy/10 px-3 py-1.5 text-sm font-medium text-navy"
              : "rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
          }
        >
          Calendário
        </Link>
        <Link
          href={`/sistema/agenda${buildQuery({
            ...baseParams,
            layout: "lista",
          })}`}
          className={
            layout === "lista"
              ? "rounded-lg bg-navy/10 px-3 py-1.5 text-sm font-medium text-navy"
              : "rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
          }
        >
          Lista
        </Link>
        <p className="ml-2 text-sm font-medium text-navy capitalize">
          {window.label}
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-background p-3"
        role="search"
      >
        <input type="hidden" name="view" value={view} />
        <input type="hidden" name="data" value={focus} />
        <input type="hidden" name="layout" value={layout} />
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Status</span>
          <select
            name="status"
            defaultValue={status}
            className="block h-8 rounded-lg border border-input bg-background px-2 text-sm"
          >
            <option value="scheduled">Agendados</option>
            <option value="cancelled">Cancelados</option>
            <option value="completed">Realizados</option>
          </select>
        </label>
        {canSeeEmployees ? (
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Colaborador</span>
            <select
              name="colaborador"
              defaultValue={employeeId}
              className="block h-8 min-w-[12rem] rounded-lg border border-input bg-background px-2 text-sm"
            >
              <option value="">Todos</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName}
                  {!employee.isActive ? " (inativo)" : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {canSeeCustomers ? (
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Cliente</span>
            <select
              name="cliente"
              defaultValue={customerId}
              className="block h-8 min-w-[12rem] rounded-lg border border-input bg-background px-2 text-sm"
            >
              <option value="">Todos</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.legalName}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">OS</span>
          <input
            type="search"
            name="os"
            defaultValue={osQuery}
            placeholder="Código ou serviço"
            className="block h-8 w-44 rounded-lg border border-input bg-background px-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="h-8 rounded-lg border border-border bg-background px-3 text-sm hover:bg-muted"
        >
          Filtrar
        </button>
      </form>

      {appointments.length === 0 ? (
        <EmptyState
          title="Nenhum compromisso neste período"
          description="Agende a partir de uma OS emitida ou remova filtros."
        />
      ) : layout === "calendario" ? (
        <AgendaCalendar
          view={view}
          windowFrom={window.from}
          events={calendarEvents}
          focusDate={focus}
          queryBase={baseParams}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Horário</th>
                <th className="px-4 py-3 font-medium">OS</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Serviço</th>
                <th className="px-4 py-3 font-medium">Unidade</th>
                <th className="px-4 py-3 font-medium">Responsável</th>
                <th className="px-4 py-3 font-medium">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/sistema/agenda/${item.id}`}
                      className="font-medium text-navy hover:underline"
                    >
                      {formatScheduleDateTime(item.startsAt)}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      até {formatScheduleDateTime(item.endsAt)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatScheduleDateOnly(item.startsAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/sistema/ordens-servico/${item.serviceOrder.id}`}
                      className="text-navy hover:underline"
                    >
                      {item.serviceOrder.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {item.serviceOrder.customer.legalName}
                  </td>
                  <td className="px-4 py-3">{item.serviceOrder.description}</td>
                  <td className="px-4 py-3">
                    {item.serviceOrder.customerUnit?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {item.employee?.fullName ?? "Sem atribuição"}
                  </td>
                  <td className="px-4 py-3">
                    {APPOINTMENT_STATUS_LABELS[item.status]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PlatformPage>
  );
}
