import type { DemoDataset, WorkOrderStatus } from "@/types/demo-entities";
import {
  createDefaultPlannedMaterials,
  createDefaultPlanningChecklist,
  DEMO_FIELD_TEAMS,
} from "@/lib/demo/work-order-defaults";

const DEMO_TODAY = "2026-08-28";

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
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
      const scheduled = new Date(item.scheduledAt).getTime();
      return scheduled >= start && scheduled <= end;
    })
    .sort(
      (left, right) =>
        new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
    );
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

export function createWorkOrderFromProposal(
  dataset: DemoDataset,
  proposalId: string,
  scheduledAt: string,
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

  const newWorkOrder = {
    id: nextWorkOrderId(dataset),
    code: nextWorkOrderCode(dataset),
    clientId: proposal.clientId,
    clientUnitId: clientUnit?.id,
    proposalId: proposal.id,
    serviceName,
    categoryId,
    status: "scheduled" as const,
    scheduledAt,
    technicianAlias: leadTechnician,
    teamAliases: [leadTechnician, DEMO_FIELD_TEAMS[1]],
    plannedMaterials: createDefaultPlannedMaterials(categoryId),
    planningChecklist: createDefaultPlanningChecklist(),
    notes: "OS gerada a partir de proposta aceita (demonstração).",
    provenance: proposal.provenance,
  };

  return {
    ...dataset,
    workOrders: [...dataset.workOrders, newWorkOrder],
  };
}

export function getWorkOrderByProposalId(dataset: DemoDataset, proposalId: string) {
  return dataset.workOrders.find((item) => item.proposalId === proposalId);
}
