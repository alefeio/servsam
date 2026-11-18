"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { OperationsPageHeader } from "@/features/operations/operations-page-header";
import { formatWorkOrderSchedule } from "@/features/operations/work-order-schedule-format";
import {
  WORK_ORDER_STATUS_LABELS,
  filterWorkOrdersByStatus,
} from "@/lib/demo/operations-actions";
import type { WorkOrderStatus } from "@/types/demo-entities";

const STATUS_FILTERS: Array<{ value: WorkOrderStatus | "all"; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "issued", label: "Emitidas" },
  { value: "scheduled", label: "Agendadas" },
  { value: "in_progress", label: "Em andamento" },
  { value: "completed", label: "Concluídas" },
  { value: "overdue", label: "Atrasadas" },
  { value: "cancelled", label: "Canceladas" },
];

function scheduleSortValue(dateIso?: string): number {
  return dateIso ? new Date(dateIso).getTime() : Number.MAX_SAFE_INTEGER;
}

export function WorkOrdersListView() {
  const { dataset } = useDemoDatasetStore();
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | "all">("all");

  const workOrders = filterWorkOrdersByStatus(dataset, statusFilter).sort(
    (left, right) =>
      scheduleSortValue(right.scheduledAt) - scheduleSortValue(left.scheduledAt),
  );

  return (
    <div className="space-y-6">
      <OperationsPageHeader
        title="Ordens de serviço"
        description="Lista administrativa com equipe, materiais previstos e checklist de planejamento. Conclusão simulada pela gestão."
        backHref="/demonstracao/agenda"
        backLabel="Agenda"
      />

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-full px-3 py-1 text-sm ${
              statusFilter === filter.value
                ? "bg-navy text-white"
                : "bg-secondary text-muted-foreground hover:text-navy"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{workOrders.length} ordens listadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Código</th>
                  <th className="py-2 pr-4 font-medium">Cliente</th>
                  <th className="py-2 pr-4 font-medium">Serviço</th>
                  <th className="py-2 pr-4 font-medium">Agendamento</th>
                  <th className="py-2 pr-4 font-medium">Equipe</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((item) => {
                  const client = dataset.clients.find(
                    (clientItem) => clientItem.id === item.clientId,
                  );
                  return (
                    <tr key={item.id} className="border-b border-border/70">
                      <td className="py-3 pr-4 font-medium">{item.code}</td>
                      <td className="py-3 pr-4">{client?.alias ?? "—"}</td>
                      <td className="py-3 pr-4">{item.serviceName}</td>
                      <td className="py-3 pr-4">{formatWorkOrderSchedule(item.scheduledAt)}</td>
                      <td className="py-3 pr-4">{item.teamAliases.join(", ")}</td>
                      <td className="py-3 pr-4">
                        {WORK_ORDER_STATUS_LABELS[item.status]}
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/demonstracao/ordens-servico/${item.id}`}
                          className="font-medium text-navy hover:text-teal"
                        >
                          Detalhe
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
