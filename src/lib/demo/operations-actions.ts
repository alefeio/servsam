import type { DemoDataset, WorkOrderStatus } from "@/types/demo-entities";
import {
  createDefaultPlannedMaterials,
  createDefaultPlanningChecklist,
  DEMO_FIELD_TEAMS,
} from "@/lib/demo/work-order-defaults";

const DEMO_TODAY = "2026-08-28";

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  issued: "Emitida",
  scheduled: "Agendada",
  in_progress: "Em andamento",
  completed: "Concluída",
  overdue: "Atrasada",
  cancelled: "Cancelada",
};

export { DEMO_FIELD_TEAMS };

export function filterWorkOrdersByStatus(
  dataset: DemoDataset,
  status: WorkOrderStatus | "all",
) {
  if (status === "all") {
    return dataset.workOrders;
  }
  return dataset.workOrders.filter((item) => item.status === status);
}

export function getWorkOrdersInRange(
  dataset: DemoDataset,
  rangeStart: string,
  rangeEnd: string,
) {
  const start = new Date(rangeStart).getTime();
  const end = new Date(rangeEnd).getTime();

  return dataset.workOrders
    .filter((item) => {
      if (!item.scheduledAt) return false;
      const scheduled = new Date(item.scheduledAt).getTime();
      return scheduled >= start && scheduled <= end;
    })
    .sort(
      (left, right) =>
        new Date(left.scheduledAt!).getTime() - new Date(right.scheduledAt!).getTime(),
    );
}

export function getUnscheduledWorkOrders(dataset: DemoDataset) {
  return dataset.workOrders.filter(
    (item) =>
      item.status === "issued" ||
      (!item.scheduledAt && item.status !== "cancelled" && item.status !== "completed"),
  );
}

/**
 * Conflitos soft: mesma equipe/técnico no mesmo horário (janela de 1h).
 * Não bloqueia — apenas sinaliza; política definitiva pendente.
 */
export function findScheduleConflicts(
  dataset: DemoDataset,
  workOrderId: string,
  scheduledAt: string,
): { workOrderId: string; code: string; technicianAlias: string }[] {
  const target = dataset.workOrders.find((item) => item.id === workOrderId);
  if (!target) return [];
  const slot = new Date(scheduledAt).getTime();
  const windowMs = 60 * 60 * 1000;

  return dataset.workOrders
    .filter((item) => {
      if (item.id === workOrderId) return false;
      if (!item.scheduledAt) return false;
      if (item.status === "cancelled" || item.status === "completed") return false;
      const other = new Date(item.scheduledAt).getTime();
      if (Math.abs(other - slot) > windowMs) return false;
      const sameTech = item.technicianAlias === target.technicianAlias;
      const overlappingTeam = item.teamAliases.some((alias) =>
        target.teamAliases.includes(alias),
      );
      return sameTech || overlappingTeam;
    })
    .map((item) => ({
      workOrderId: item.id,
      code: item.code,
      technicianAlias: item.technicianAlias,
    }));
}

export function updateWorkOrderStatus(
  dataset: DemoDataset,
  workOrderId: string,
  status: WorkOrderStatus,
): DemoDataset {
  return {
    ...dataset,
    workOrders: dataset.workOrders.map((workOrder) => {
      if (workOrder.id !== workOrderId) {
        return workOrder;
      }

      const completedAt =
        status === "completed"
          ? workOrder.completedAt ?? DEMO_TODAY
          : status === "scheduled" || status === "in_progress"
            ? undefined
            : workOrder.completedAt;

      const planningChecklist =
        status === "completed"
          ? workOrder.planningChecklist.map((item) => ({ ...item, checked: true }))
          : workOrder.planningChecklist;

      return {
        ...workOrder,
        status,
        completedAt,
        planningChecklist,
      };
    }),
  };
}

export function startWorkOrder(dataset: DemoDataset, workOrderId: string): DemoDataset {
  return updateWorkOrderStatus(dataset, workOrderId, "in_progress");
}

export function completeWorkOrder(dataset: DemoDataset, workOrderId: string): DemoDataset {
  return updateWorkOrderStatus(dataset, workOrderId, "completed");
}

export function cancelWorkOrder(dataset: DemoDataset, workOrderId: string): DemoDataset {
  return updateWorkOrderStatus(dataset, workOrderId, "cancelled");
}

export function togglePlanningChecklistItem(
  dataset: DemoDataset,
  workOrderId: string,
  itemId: string,
): DemoDataset {
  return {
    ...dataset,
    workOrders: dataset.workOrders.map((workOrder) => {
      if (workOrder.id !== workOrderId) {
        return workOrder;
      }

      return {
        ...workOrder,
        planningChecklist: workOrder.planningChecklist.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item,
        ),
      };
    }),
  };
}

function nextWorkOrderId(dataset: DemoDataset): string {
  const numbers = dataset.workOrders
    .map((item) => Number.parseInt(item.id.replace("os-demo-", ""), 10))
    .filter((value) => !Number.isNaN(value));
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `os-demo-${String(next).padStart(2, "0")}`;
}

function nextWorkOrderCode(dataset: DemoDataset): string {
  const numbers = dataset.workOrders
    .map((item) => Number.parseInt(item.code.replace("OS-DEMO-", ""), 10))
    .filter((value) => !Number.isNaN(value));
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `OS-DEMO-${String(next).padStart(3, "0")}`;
}

/**
 * Emite OS a partir do orçamento aceito.
 * Sinal é opcional/recomendado — não bloqueia a emissão.
 * Não agenda: scheduledAt fica ausente até scheduleWorkOrder.
 */
export function createWorkOrderFromProposal(
  dataset: DemoDataset,
  proposalId: string,
): DemoDataset {
  const proposal = dataset.proposals.find((item) => item.id === proposalId);
  if (!proposal || proposal.status !== "accepted") {
    return dataset;
  }

  if (dataset.workOrders.some((item) => item.proposalId === proposalId)) {
    return dataset;
  }

  const opportunity = dataset.opportunities.find(
    (item) => item.id === proposal.opportunityId,
  );
  const clientUnit = dataset.clientUnits.find(
    (item) => item.clientId === proposal.clientId,
  );
  const leadTechnician = DEMO_FIELD_TEAMS[0];
  const categoryId = opportunity?.categoryId ?? "water-sanitation";
  const serviceName =
    opportunity?.title ??
    dataset.proposalItems.find((item) => item.proposalId === proposalId)
      ?.description ??
    "Serviço demonstrativo";

  const signalNote =
    proposal.paymentSignal?.status === "confirmed"
      ? " Sinal já confirmado pelo Financeiro (simulado)."
      : proposal.paymentSignal?.status === "pending"
        ? " Sinal solicitado ao Financeiro (ainda pendente; não bloqueia a OS)."
        : " Sem sinal registrado (permitido nesta demonstração).";

  const newWorkOrder = {
    id: nextWorkOrderId(dataset),
    code: nextWorkOrderCode(dataset),
    clientId: proposal.clientId,
    clientUnitId: clientUnit?.id,
    proposalId: proposal.id,
    serviceName,
    categoryId,
    status: "issued" as const,
    issuedAt: DEMO_TODAY,
    technicianAlias: leadTechnician,
    teamAliases: [leadTechnician, DEMO_FIELD_TEAMS[1]],
    plannedMaterials: createDefaultPlannedMaterials(categoryId),
    planningChecklist: createDefaultPlanningChecklist(),
    notes: `OS emitida a partir do orçamento aceito.${signalNote} Agendamento é passo separado.`,
    scheduleStatusLabel: "Aguardando agendamento",
    scheduleHistory: [],
    provenance: proposal.provenance,
  };

  return {
    ...dataset,
    workOrders: [...dataset.workOrders, newWorkOrder],
  };
}

/**
 * Emite OS a partir de O.C. recebida (pode ser sem orçamento interno).
 * Uma OS por serviço demonstrativo; não duplica se já houver vínculo.
 */
export function createWorkOrderFromPurchaseOrder(
  dataset: DemoDataset,
  purchaseOrderId: string,
): DemoDataset {
  const purchaseOrder = dataset.receivedPurchaseOrders.find(
    (item) => item.id === purchaseOrderId,
  );
  if (!purchaseOrder) return dataset;
  if (purchaseOrder.workOrderId) return dataset;
  if (
    dataset.workOrders.some((item) => item.purchaseOrderId === purchaseOrderId)
  ) {
    return dataset;
  }

  const clientUnit = dataset.clientUnits.find(
    (item) => item.clientId === purchaseOrder.clientId,
  );
  const leadTechnician = DEMO_FIELD_TEAMS[0];
  const workOrderId = nextWorkOrderId(dataset);

  const newWorkOrder = {
    id: workOrderId,
    code: nextWorkOrderCode(dataset),
    clientId: purchaseOrder.clientId,
    clientUnitId: clientUnit?.id,
    proposalId: purchaseOrder.proposalId,
    contractId: purchaseOrder.contractId,
    purchaseOrderId: purchaseOrder.id,
    serviceName: purchaseOrder.serviceName,
    categoryId: purchaseOrder.categoryId,
    status: "issued" as const,
    issuedAt: DEMO_TODAY,
    technicianAlias: leadTechnician,
    teamAliases: [leadTechnician, DEMO_FIELD_TEAMS[1]],
    plannedMaterials: createDefaultPlannedMaterials(purchaseOrder.categoryId),
    planningChecklist: createDefaultPlanningChecklist(),
    notes:
      "OS emitida a partir de O.C. recebida do cliente (documento do contratante ≠ OS). Dados demonstrativos.",
    scheduleStatusLabel: "Aguardando agendamento",
    scheduleHistory: [],
    provenance: purchaseOrder.provenance,
  };

  return {
    ...dataset,
    workOrders: [...dataset.workOrders, newWorkOrder],
    receivedPurchaseOrders: dataset.receivedPurchaseOrders.map((item) =>
      item.id === purchaseOrderId ? { ...item, workOrderId } : item,
    ),
  };
}

export function canIssueWorkOrderFromPurchaseOrder(
  dataset: DemoDataset,
  purchaseOrderId: string,
): { ok: boolean; reason?: string } {
  const purchaseOrder = dataset.receivedPurchaseOrders.find(
    (item) => item.id === purchaseOrderId,
  );
  if (!purchaseOrder) {
    return { ok: false, reason: "O.C. não encontrada." };
  }
  if (
    purchaseOrder.workOrderId ||
    dataset.workOrders.some((item) => item.purchaseOrderId === purchaseOrderId)
  ) {
    return { ok: false, reason: "Já existe OS vinculada a esta O.C." };
  }
  return { ok: true };
}

export function scheduleWorkOrder(
  dataset: DemoDataset,
  workOrderId: string,
  scheduledAt: string,
  options?: { technicianAlias?: string; vehicleLabel?: string; note?: string },
): DemoDataset {
  return {
    ...dataset,
    workOrders: dataset.workOrders.map((workOrder) => {
      if (workOrder.id !== workOrderId) {
        return workOrder;
      }
      if (workOrder.status === "cancelled" || workOrder.status === "completed") {
        return workOrder;
      }

      const technicianAlias =
        options?.technicianAlias ?? workOrder.technicianAlias;
      const previousScheduledAt = workOrder.scheduledAt;
      const isReschedule = Boolean(previousScheduledAt);
      const historyEntry = {
        recordedAt: DEMO_TODAY,
        previousScheduledAt,
        scheduledAt,
        technicianAlias,
        note:
          options?.note ??
          (isReschedule
            ? "Remarcação demonstrativa (localStorage)."
            : "Agendamento inicial demonstrativo."),
      };

      return {
        ...workOrder,
        scheduledAt,
        status: workOrder.status === "issued" ? ("scheduled" as const) : workOrder.status,
        technicianAlias,
        vehicleLabel: options?.vehicleLabel ?? workOrder.vehicleLabel,
        scheduleStatusLabel: isReschedule ? "Remarcada" : "Agendada",
        scheduleHistory: [...(workOrder.scheduleHistory ?? []), historyEntry],
      };
    }),
  };
}

export function getWorkOrderByProposalId(dataset: DemoDataset, proposalId: string) {
  return dataset.workOrders.find((item) => item.proposalId === proposalId);
}

export function canIssueWorkOrderFromProposal(
  dataset: DemoDataset,
  proposalId: string,
): { ok: boolean; reason?: string } {
  const proposal = dataset.proposals.find((item) => item.id === proposalId);
  if (!proposal) {
    return { ok: false, reason: "Orçamento não encontrado." };
  }
  if (proposal.status !== "accepted") {
    return { ok: false, reason: "O orçamento precisa estar aceito." };
  }
  if (dataset.workOrders.some((item) => item.proposalId === proposalId)) {
    return { ok: false, reason: "Já existe OS vinculada a este orçamento." };
  }
  return { ok: true };
}
