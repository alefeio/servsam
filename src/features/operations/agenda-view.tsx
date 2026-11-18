"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { OperationsPageHeader } from "@/features/operations/operations-page-header";
import { fromDatetimeLocalValue } from "@/features/operations/work-order-schedule-format";
import {
  WORK_ORDER_STATUS_LABELS,
  getUnscheduledWorkOrders,
  getWorkOrdersInRange,
  scheduleWorkOrder,
} from "@/lib/demo/operations-actions";
import type { DemoWorkOrder, WorkOrderStatus } from "@/types/demo-entities";

type AgendaMode = "day" | "week" | "month";

const DEMO_REFERENCE = new Date("2026-08-28T12:00:00");
const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 20;
const MAX_CHIPS_PER_CELL = 3;

const STATUS_CHIP_CLASSES: Record<WorkOrderStatus, string> = {
  issued: "border-teal/50 bg-background text-navy",
  scheduled: "border-teal/30 bg-teal/10 text-navy",
  in_progress: "border-navy/30 bg-navy/10 text-navy",
  completed: "border-border bg-secondary text-muted-foreground",
  overdue: "border-destructive/30 bg-destructive/10 text-destructive",
  cancelled: "border-border bg-secondary text-muted-foreground line-through",
};

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function startOfWeek(date: Date): Date {
  const copy = startOfDay(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function endOfWeek(date: Date): Date {
  const end = startOfWeek(date);
  end.setDate(end.getDate() + 6);
  return endOfDay(end);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addDays(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function toDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function toDatetimeLocalAt(date: Date, hour: number): string {
  return `${toDayKey(date)}T${String(hour).padStart(2, "0")}:00`;
}

function formatTime(dateIso?: string): string {
  if (!dateIso) return "--:--";
  return new Date(dateIso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function buildRange(mode: AgendaMode, referenceDate: Date): { start: Date; end: Date } {
  if (mode === "day") {
    return { start: startOfDay(referenceDate), end: endOfDay(referenceDate) };
  }
  if (mode === "week") {
    return { start: startOfWeek(referenceDate), end: endOfWeek(referenceDate) };
  }
  // Grade mensal: semanas completas, para mostrar dias vizinhos como no Google Calendar.
  return {
    start: startOfWeek(startOfMonth(referenceDate)),
    end: endOfWeek(endOfMonth(referenceDate)),
  };
}

function listDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let cursor = startOfDay(start);
  while (cursor.getTime() <= end.getTime()) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

type AgendaEventChipProps = {
  workOrder: DemoWorkOrder;
  clientAlias: string;
  compact?: boolean;
};

function AgendaEventChip({ workOrder, clientAlias, compact = false }: AgendaEventChipProps) {
  const statusLabel = workOrder.scheduleStatusLabel ?? WORK_ORDER_STATUS_LABELS[workOrder.status];
  return (
    <Link
      href={`/demonstracao/ordens-servico/${workOrder.id}`}
      title={`${workOrder.code} · ${workOrder.serviceName} · ${clientAlias} · ${statusLabel}`}
      className={`block rounded-md border px-2 py-1 text-left text-xs leading-tight hover:border-teal ${STATUS_CHIP_CLASSES[workOrder.status]}`}
    >
      <span className="font-medium">{formatTime(workOrder.scheduledAt)}</span>{" "}
      <span className="line-clamp-2">{workOrder.serviceName}</span>
      {compact ? null : (
        <span className="mt-0.5 block text-[11px] opacity-80">
          {clientAlias} · {workOrder.teamAliases.join(", ")}
          {workOrder.vehicleLabel ? ` · ${workOrder.vehicleLabel}` : ""}
        </span>
      )}
    </Link>
  );
}

export function AgendaView() {
  const { dataset, mutate } = useDemoDatasetStore();
  const [mode, setMode] = useState<AgendaMode>("week");
  const [referenceDate, setReferenceDate] = useState(DEMO_REFERENCE);
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({});

  const range = useMemo(() => buildRange(mode, referenceDate), [mode, referenceDate]);

  const workOrders = getWorkOrdersInRange(
    dataset,
    range.start.toISOString(),
    range.end.toISOString(),
  );
  const unscheduled = getUnscheduledWorkOrders(dataset);

  const byDay = workOrders.reduce<Record<string, DemoWorkOrder[]>>((acc, item) => {
    const key = item.scheduledAt?.slice(0, 10);
    if (!key) return acc;
    acc[key] = acc[key] ? [...acc[key], item] : [item];
    return acc;
  }, {});

  const days = listDays(range.start, range.end);
  const referenceKey = toDayKey(referenceDate);
  const monthIndex = referenceDate.getMonth();

  function clientAliasOf(clientId: string): string {
    return dataset.clients.find((item) => item.id === clientId)?.alias ?? "Cliente demo";
  }

  function shiftPeriod(direction: -1 | 1) {
    const next = new Date(referenceDate);
    if (mode === "day") {
      next.setDate(next.getDate() + direction);
    } else if (mode === "week") {
      next.setDate(next.getDate() + direction * 7);
    } else {
      next.setDate(1);
      next.setMonth(next.getMonth() + direction);
    }
    setReferenceDate(next);
  }

  function openDay(day: Date) {
    setReferenceDate(day);
    setMode("day");
  }

  function draftFor(workOrderId: string): string {
    return scheduleDrafts[workOrderId] ?? toDatetimeLocalAt(referenceDate, 9);
  }

  function handleSchedule(workOrderId: string) {
    const value = draftFor(workOrderId);
    if (!value) return;
    mutate((current) =>
      scheduleWorkOrder(current, workOrderId, fromDatetimeLocalValue(value)),
    );
    setScheduleDrafts((current) =>
      Object.fromEntries(Object.entries(current).filter(([id]) => id !== workOrderId)),
    );
  }

  const rangeLabel =
    mode === "day"
      ? referenceDate.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : mode === "week"
        ? `${range.start.toLocaleDateString("pt-BR")} — ${range.end.toLocaleDateString("pt-BR")}`
        : referenceDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const hours = Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
    (_, index) => DAY_START_HOUR + index,
  );
  const dayItems = byDay[referenceKey] ?? [];

  return (
    <div className="space-y-6">
      <OperationsPageHeader
        title="Agenda"
        description="Grade diária, semanal e mensal no estilo de calendário. A agenda SERVSAM é a fonte da verdade; Google Calendar não está ligado nesta demonstração."
      />

      <Card>
        <CardHeader>
          <CardTitle>OS emitidas aguardando agendamento ({unscheduled.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            OS emitida não ocupa a grade até receber data e hora. Escolha o horário e agende.
            Dados demonstrativos.
          </p>
          {unscheduled.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma OS aguardando agendamento.</p>
          ) : (
            <ul className="space-y-3">
              {unscheduled.map((workOrder) => (
                <li
                  key={workOrder.id}
                  className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-dashed border-teal/50 px-4 py-3"
                >
                  <div>
                    <Link
                      href={`/demonstracao/ordens-servico/${workOrder.id}`}
                      className="font-medium text-navy hover:text-teal"
                    >
                      {workOrder.code} · {workOrder.serviceName}
                    </Link>
                    <p className="text-muted-foreground">
                      {clientAliasOf(workOrder.clientId)} ·{" "}
                      {workOrder.scheduleStatusLabel ?? "Emitida, aguardando agendamento"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="text-xs text-muted-foreground">
                      Data e hora
                      <input
                        type="datetime-local"
                        value={draftFor(workOrder.id)}
                        onChange={(event) =>
                          setScheduleDrafts((current) => ({
                            ...current,
                            [workOrder.id]: event.target.value,
                          }))
                        }
                        className="mt-1 block h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
                      />
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!draftFor(workOrder.id)}
                      onClick={() => handleSchedule(workOrder.id)}
                    >
                      Agendar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-border p-1">
          <Button
            type="button"
            size="sm"
            variant={mode === "day" ? "default" : "ghost"}
            onClick={() => setMode("day")}
          >
            Diária
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "week" ? "default" : "ghost"}
            onClick={() => setMode("week")}
          >
            Semanal
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "month" ? "default" : "ghost"}
            onClick={() => setMode("month")}
          >
            Mensal
          </Button>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setReferenceDate(DEMO_REFERENCE)}>
          Hoje
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => shiftPeriod(-1)}>
          ← Anterior
        </Button>
        <span className="text-sm font-medium capitalize">{rangeLabel}</span>
        <Button type="button" size="sm" variant="outline" onClick={() => shiftPeriod(1)}>
          Próximo →
        </Button>
        <Link
          href="/demonstracao/ordens-servico"
          className="ml-auto text-sm font-medium text-navy hover:text-teal"
        >
          Ver todas as OS →
        </Link>
      </div>

      {workOrders.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma ordem de serviço agendada neste período.
        </p>
      ) : null}

      {mode === "month" ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-7 border-b border-border bg-secondary/50 text-xs font-medium text-muted-foreground">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="px-2 py-2">
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day) => {
                  const key = toDayKey(day);
                  const items = byDay[key] ?? [];
                  const inMonth = day.getMonth() === monthIndex;
                  const isReference = key === toDayKey(DEMO_REFERENCE);
                  return (
                    <div
                      key={key}
                      className={`min-h-28 space-y-1 border-b border-r border-border/70 p-1.5 ${
                        inMonth ? "bg-card" : "bg-secondary/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => openDay(day)}
                        className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-medium ${
                          isReference
                            ? "bg-navy text-white"
                            : inMonth
                              ? "text-navy hover:bg-secondary"
                              : "text-muted-foreground hover:bg-secondary"
                        }`}
                        aria-label={`Abrir dia ${day.toLocaleDateString("pt-BR")}`}
                      >
                        {day.getDate()}
                      </button>
                      {items.slice(0, MAX_CHIPS_PER_CELL).map((item) => (
                        <AgendaEventChip
                          key={item.id}
                          workOrder={item}
                          clientAlias={clientAliasOf(item.clientId)}
                          compact
                        />
                      ))}
                      {items.length > MAX_CHIPS_PER_CELL ? (
                        <button
                          type="button"
                          onClick={() => openDay(day)}
                          className="text-xs font-medium text-navy hover:text-teal"
                        >
                          +{items.length - MAX_CHIPS_PER_CELL} mais
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {mode === "week" ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <div className="grid min-w-[840px] grid-cols-7">
              {days.map((day) => {
                const key = toDayKey(day);
                const items = byDay[key] ?? [];
                const isReference = key === toDayKey(DEMO_REFERENCE);
                return (
                  <div key={key} className="min-h-72 border-r border-border/70 last:border-r-0">
                    <button
                      type="button"
                      onClick={() => openDay(day)}
                      className={`block w-full border-b border-border px-2 py-2 text-left text-xs font-medium capitalize ${
                        isReference ? "bg-navy text-white" : "bg-secondary/50 text-navy hover:bg-secondary"
                      }`}
                    >
                      {formatDayLabel(day)}
                    </button>
                    <div className="space-y-1.5 p-1.5">
                      {items.map((item) => (
                        <AgendaEventChip
                          key={item.id}
                          workOrder={item}
                          clientAlias={clientAliasOf(item.clientId)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {mode === "day" ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border/70">
              {hours.map((hour) => {
                const items = dayItems.filter((item) => {
                  const eventHour = new Date(item.scheduledAt ?? "").getHours();
                  if (Number.isNaN(eventHour)) return false;
                  const bucket = Math.min(Math.max(eventHour, DAY_START_HOUR), DAY_END_HOUR);
                  return bucket === hour;
                });
                return (
                  <div key={hour} className="grid min-h-14 grid-cols-[64px_1fr] gap-3 px-3 py-2">
                    <span className="pt-1 text-xs text-muted-foreground">
                      {String(hour).padStart(2, "0")}:00
                    </span>
                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <AgendaEventChip
                          key={item.id}
                          workOrder={item}
                          clientAlias={clientAliasOf(item.clientId)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Visitas do mesmo serviço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {dataset.workOrders
            .filter((workOrder) => (workOrder.visits?.length ?? 0) > 1)
            .map((workOrder) => (
              <p key={workOrder.id}>
                <Link
                  href={`/demonstracao/ordens-servico/${workOrder.id}`}
                  className="font-medium text-navy hover:text-teal"
                >
                  {workOrder.serviceName}
                </Link>
                {" · "}
                {workOrder.visits
                  ?.map((visit) => {
                    const label =
                      visit.status === "done"
                        ? "Executada"
                        : visit.status === "in_progress"
                          ? "Em execução"
                          : "Programada";
                    return `${new Date(visit.scheduledAt).toLocaleDateString("pt-BR")} ${label}`;
                  })
                  .join(" · ")}
              </p>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
