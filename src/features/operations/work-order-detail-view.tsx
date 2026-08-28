"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { OperationsPageHeader } from "@/features/operations/operations-page-header";
import {
  WORK_ORDER_STATUS_LABELS,
  cancelWorkOrder,
  completeWorkOrder,
  startWorkOrder,
  togglePlanningChecklistItem,
} from "@/lib/demo/operations-actions";

type WorkOrderDetailViewProps = {
  workOrderId: string;
};

function formatSchedule(dateIso: string): string {
  return new Date(dateIso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WorkOrderDetailView({ workOrderId }: WorkOrderDetailViewProps) {
  const { dataset, mutate } = useDemoDatasetStore();
  const workOrder = dataset.workOrders.find((item) => item.id === workOrderId);

  if (!workOrder) {
    notFound();
  }

  const client = dataset.clients.find((item) => item.id === workOrder.clientId);
  const unit = dataset.clientUnits.find((item) => item.id === workOrder.clientUnitId);
  const proposal = dataset.proposals.find((item) => item.id === workOrder.proposalId);
  const checkedCount = workOrder.planningChecklist.filter((item) => item.checked).length;

  return (
    <div className="space-y-6">
      <OperationsPageHeader
        title={`${workOrder.code} · ${workOrder.serviceName}`}
        description="Ficha administrativa com equipe, materiais previstos e checklist de planejamento. Conclusão simulada pela gestão."
        backHref="/demonstracao/ordens-servico"
        backLabel="Ordens de serviço"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Planejamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                {WORK_ORDER_STATUS_LABELS[workOrder.status]}
              </p>
              <p>
                <span className="text-muted-foreground">Agendamento:</span>{" "}
                {formatSchedule(workOrder.scheduledAt)}
              </p>
              {client ? (
                <p>
                  <span className="text-muted-foreground">Cliente:</span>{" "}
                  <Link
                    href={`/demonstracao/clientes/${client.id}`}
                    className="text-navy hover:text-teal"
                  >
                    {client.alias}
                  </Link>
                </p>
              ) : null}
              {unit ? (
                <p>
                  <span className="text-muted-foreground">Local:</span> {unit.name} —{" "}
                  {unit.address}, {unit.city}
                </p>
              ) : null}
              <p>
                <span className="text-muted-foreground">Equipe:</span>{" "}
                {workOrder.teamAliases.join(", ")}
              </p>
              <p>
                <span className="text-muted-foreground">Responsável:</span>{" "}
                {workOrder.technicianAlias}
              </p>
              {proposal ? (
                <p className="md:col-span-2">
                  <span className="text-muted-foreground">Proposta origem:</span>{" "}
                  <Link
                    href={`/demonstracao/comercial/propostas/${proposal.id}`}
                    className="text-navy hover:text-teal"
                  >
                    {proposal.code}
                  </Link>
                </p>
              ) : null}
              {workOrder.notes ? (
                <p className="md:col-span-2">
                  <span className="text-muted-foreground">Observações:</span>{" "}
                  {workOrder.notes}
                </p>
              ) : null}
              {workOrder.completedAt ? (
                <p>
                  <span className="text-muted-foreground">Concluída em:</span>{" "}
                  {workOrder.completedAt}
                </p>
              ) : null}
            </div>

            <div>
              <p className="mb-2 font-medium">
                Checklist de planejamento ({checkedCount}/
                {workOrder.planningChecklist.length})
              </p>
              <ul className="space-y-2">
                {workOrder.planningChecklist.map((item) => (
                  <li key={item.id}>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        disabled={
                          workOrder.status === "completed" ||
                          workOrder.status === "cancelled"
                        }
                        onChange={() =>
                          mutate((current) =>
                            togglePlanningChecklistItem(current, workOrderId, item.id),
                          )
                        }
                      />
                      <span>{item.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Materiais previstos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {workOrder.plannedMaterials.map((material) => {
                  const product = dataset.products.find(
                    (item) => item.id === material.productId,
                  );
                  return (
                    <li key={`${material.productId}-${material.quantity}`}>
                      {material.quantity} {product?.unit ?? "un."} ·{" "}
                      {product?.name ?? material.productId}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações da gestão</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {workOrder.status === "scheduled" || workOrder.status === "overdue" ? (
                <Button
                  type="button"
                  onClick={() => mutate((current) => startWorkOrder(current, workOrderId))}
                >
                  Iniciar serviço (simulado)
                </Button>
              ) : null}
              {workOrder.status === "in_progress" ? (
                <Button
                  type="button"
                  onClick={() => mutate((current) => completeWorkOrder(current, workOrderId))}
                >
                  Concluir serviço (simulado)
                </Button>
              ) : null}
              {workOrder.status !== "completed" && workOrder.status !== "cancelled" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => mutate((current) => cancelWorkOrder(current, workOrderId))}
                >
                  Cancelar OS
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
