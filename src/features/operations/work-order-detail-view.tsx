"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { OperationsPageHeader } from "@/features/operations/operations-page-header";
import {
  AWAITING_SCHEDULE_LABEL,
  formatWorkOrderSchedule,
  fromDatetimeLocalValue,
} from "@/features/operations/work-order-schedule-format";
import {
  WORK_ORDER_STATUS_LABELS,
  cancelWorkOrder,
  completeWorkOrder,
  scheduleWorkOrder,
  startWorkOrder,
  togglePlanningChecklistItem,
} from "@/lib/demo/operations-actions";

type WorkOrderDetailViewProps = {
  workOrderId: string;
};

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function WorkOrderDetailView({ workOrderId }: WorkOrderDetailViewProps) {
  const { dataset, mutate } = useDemoDatasetStore();
  const [scheduleDraft, setScheduleDraft] = useState("2026-09-10T09:00");
  // OS emitidas na sessão só existem no localStorage; adiar 404 até o snapshot do cliente.
  const isClient = useIsClient();
  const workOrder = dataset.workOrders.find((item) => item.id === workOrderId);

  if (!workOrder) {
    if (!isClient) {
      return (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">Carregando ordem de serviço…</p>
        </div>
      );
    }
    notFound();
  }

  const client = dataset.clients.find((item) => item.id === workOrder.clientId);
  const unit = dataset.clientUnits.find((item) => item.id === workOrder.clientUnitId);
  const proposal = dataset.proposals.find((item) => item.id === workOrder.proposalId);
  const canSchedule =
    workOrder.status !== "cancelled" &&
    workOrder.status !== "completed";
  const isReschedule = Boolean(workOrder.scheduledAt);
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
                {workOrder.status === "issued" && !workOrder.scheduledAt
                  ? AWAITING_SCHEDULE_LABEL
                  : WORK_ORDER_STATUS_LABELS[workOrder.status]}
              </p>
              <p>
                <span className="text-muted-foreground">Agendamento:</span>{" "}
                {workOrder.scheduledAt
                  ? formatWorkOrderSchedule(workOrder.scheduledAt)
                  : AWAITING_SCHEDULE_LABEL}
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
                <span className="text-muted-foreground">Tipo:</span>{" "}
                {workOrder.serviceTypeLabel ?? "Não classificado neste fixture"}
              </p>
              <p>
                <span className="text-muted-foreground">Veículo:</span>{" "}
                {workOrder.vehicleLabel ?? "Não escalado neste fixture"}
              </p>
              <p>
                <span className="text-muted-foreground">Equipe:</span>{" "}
                {workOrder.teamAliases.join(", ")}
              </p>
              {workOrder.scheduleStatusLabel ? (
                <p>
                  <span className="text-muted-foreground">Agenda:</span>{" "}
                  {workOrder.scheduleStatusLabel}
                </p>
              ) : null}
              {!unit && workOrder.addressLabel ? (
                <p>
                  <span className="text-muted-foreground">Endereço:</span> {workOrder.addressLabel}
                </p>
              ) : null}
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
              {canSchedule ? (
                <div className="space-y-2 rounded-lg border border-dashed border-teal/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    {isReschedule
                      ? "Remarque data e horário. O histórico fica no dataset demonstrativo (localStorage). Sem Google Calendar."
                      : "OS emitida sem data. Escolha data e hora para agendar nesta demonstração."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Responsável atual: {workOrder.technicianAlias}
                  </p>
                  <label className="block text-xs text-muted-foreground">
                    Data e hora
                    <input
                      type="datetime-local"
                      value={scheduleDraft}
                      onChange={(event) => setScheduleDraft(event.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground"
                    />
                  </label>
                  <Button
                    type="button"
                    disabled={!scheduleDraft}
                    onClick={() =>
                      mutate((current) =>
                        scheduleWorkOrder(
                          current,
                          workOrderId,
                          fromDatetimeLocalValue(scheduleDraft),
                        ),
                      )
                    }
                  >
                    {isReschedule ? "Remarcar OS (simulado)" : "Agendar OS (simulado)"}
                  </Button>
                  {(workOrder.scheduleHistory?.length ?? 0) > 0 ? (
                    <ul className="space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
                      {workOrder.scheduleHistory?.map((entry, index) => (
                        <li key={`${entry.scheduledAt}-${index}`}>
                          {entry.previousScheduledAt
                            ? `Remarcado: ${entry.previousScheduledAt} → ${entry.scheduledAt}`
                            : `Agendado: ${entry.scheduledAt}`}{" "}
                          · {entry.technicianAlias}
                          {entry.note ? ` · ${entry.note}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
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
              <Link
                href={`/demonstracao/ordens-servico/${workOrder.id}/execucao`}
                className="inline-flex h-9 items-center justify-center rounded-md bg-teal px-4 text-sm font-medium text-white"
              >
                Abrir execução
              </Link>
              {dataset.photoReports
                .filter((report) => report.workOrderId === workOrder.id)
                .map((report) => (
                  <Link
                    key={report.id}
                    href={`/demonstracao/relatorios/fotograficos/${report.id}`}
                    className="text-sm font-medium text-navy hover:text-teal"
                  >
                    Ver relatório fotográfico
                  </Link>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {workOrder.familyFields && workOrder.familyFields.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Formulário da família do serviço</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            {workOrder.familyFields.map((field) => (
              <p key={field.label}>
                <span className="text-muted-foreground">{field.label}:</span> {field.value}
              </p>
            ))}
            {workOrder.clientResponsible ? (
              <p>
                <span className="text-muted-foreground">Responsável do cliente:</span>{" "}
                {workOrder.clientResponsible}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {workOrder.visits && workOrder.visits.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Visitas vinculadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {workOrder.visits.map((visit) => {
                const vehicle = dataset.vehicles.find((item) => item.id === visit.vehicleId);
                const statusLabel =
                  visit.status === "done"
                    ? "Executada"
                    : visit.status === "in_progress"
                      ? "Em execução"
                      : "Programada";
                return (
                  <li key={visit.id}>
                    {new Date(visit.scheduledAt).toLocaleDateString("pt-BR")} — {statusLabel} · {visit.place} · {visit.team} · {vehicle?.plate ?? visit.vehicleId}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Documentação pré-serviço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Informativo, autorização de entrada e declaração de ciência ficam separados do relatório e do certificado.
          </p>
          <Link
            href={`/demonstracao/ordens-servico/${workOrder.id}/pre-servico`}
            className="font-medium text-navy hover:text-teal"
          >
            Abrir documentação pré-serviço
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Termo e prévia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            O termo de execução e o aceite ficam na tela de execução. Esta caixa só mostra como o PDF seria anunciado.
          </p>
          <p className="rounded-md border border-dashed border-teal/50 px-3 py-6 text-center text-xs tracking-[0.18em] text-teal/80 uppercase">
            Prévia demonstrativa da OS — não é o PDF oficial
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
