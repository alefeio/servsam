"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { OperationsPageHeader } from "@/features/operations/operations-page-header";
import {
  WORK_ORDER_STATUS_LABELS,
  getWorkOrdersInRange,
} from "@/lib/demo/operations-actions";

type AgendaMode = "day" | "week" | "month";

const DEMO_REFERENCE = new Date("2026-08-28T12:00:00");

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function formatDayLabel(dateIso: string): string {
  const date = new Date(dateIso);
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatTime(dateIso: string): string {
  return new Date(dateIso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AgendaView() {
  const { dataset } = useDemoDatasetStore();
  const [mode, setMode] = useState<AgendaMode>("week");
  const [referenceDate, setReferenceDate] = useState(DEMO_REFERENCE);

  const range = useMemo(() => {
    if (mode === "day") {
      const start = new Date(referenceDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(referenceDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (mode === "week") {
      return {
        start: startOfWeek(referenceDate),
        end: endOfWeek(referenceDate),
      };
    }
    return {
      start: startOfMonth(referenceDate),
      end: endOfMonth(referenceDate),
    };
  }, [mode, referenceDate]);

  const workOrders = getWorkOrdersInRange(
    dataset,
    range.start.toISOString(),
    range.end.toISOString(),
  );

  const grouped = workOrders.reduce<Record<string, typeof workOrders>>((acc, item) => {
    const key = item.scheduledAt.slice(0, 10);
    acc[key] = acc[key] ? [...acc[key], item] : [item];
    return acc;
  }, {});

  function shiftPeriod(direction: -1 | 1) {
    const next = new Date(referenceDate);
    if (mode === "day") {
      next.setDate(next.getDate() + direction);
    } else if (mode === "week") {
      next.setDate(next.getDate() + direction * 7);
    } else {
      next.setMonth(next.getMonth() + direction);
    }
    setReferenceDate(next);
  }

  const rangeLabel =
    mode === "day"
      ? referenceDate.toLocaleDateString("pt-BR")
      : mode === "week"
        ? `${range.start.toLocaleDateString("pt-BR")} — ${range.end.toLocaleDateString("pt-BR")}`
        : referenceDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <OperationsPageHeader
        title="Agenda"
        description="Visão diária, semanal e mensal. Cada compromisso mostra serviço, cliente, endereço, horário, equipe e veículo. Google Calendar não está ligado."
      />

      <Card>
        <CardHeader>
          <CardTitle>Visitas do mesmo serviço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {dataset.workOrders
            .filter((workOrder) => (workOrder.visits?.length ?? 0) > 1)
            .map((workOrder) => (
              <p key={workOrder.id}>
                <Link href={`/demonstracao/ordens-servico/${workOrder.id}`} className="font-medium text-navy hover:text-teal">
                  {workOrder.serviceName}
                </Link>
                {" · "}
                {workOrder.visits?.map((visit) => {
                  const label =
                    visit.status === "done"
                      ? "Executada"
                      : visit.status === "in_progress"
                        ? "Em execução"
                        : "Programada";
                  return `${new Date(visit.scheduledAt).toLocaleDateString("pt-BR")} ${label}`;
                }).join(" · ")}
              </p>
            ))}
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

      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Nenhuma ordem de serviço agendada neste período.
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([day, items]) => (
          <Card key={day}>
            <CardHeader>
              <CardTitle className="text-base">{formatDayLabel(`${day}T12:00:00`)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => {
                const client = dataset.clients.find(
                  (clientItem) => clientItem.id === item.clientId,
                );
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-navy">
                        {formatTime(item.scheduledAt)} · {item.serviceName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.code} · {client?.alias ?? "Cliente demo"} ·{" "}
                        {item.scheduleStatusLabel ?? WORK_ORDER_STATUS_LABELS[item.status]}
                        {item.vehicleLabel ? ` · ${item.vehicleLabel}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.addressLabel ?? "Endereço na ficha da OS"} ·{" "}
                        {item.teamAliases.join(", ")}
                      </p>
                    </div>
                    <Link
                      href={`/demonstracao/ordens-servico/${item.id}`}
                      className="text-sm font-medium text-navy hover:text-teal"
                    >
                      Abrir OS
                    </Link>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
