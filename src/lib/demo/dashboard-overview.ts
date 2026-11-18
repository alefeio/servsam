import type { DemoDataset } from "@/types/demo-entities";
import type {
  DashboardAlert,
  DashboardNextAction,
  FormalizationOverviewItem,
  RecurringVisitItem,
} from "@/types/demo";

const DEMO_REFERENCE_DATE = "2026-08-28";

const PRIORITY_RANK: Record<DashboardNextAction["priority"], number> = {
  high: 0,
  medium: 1,
  guide: 2,
};

function clientAlias(dataset: DemoDataset, clientId: string): string {
  return dataset.clients.find((client) => client.id === clientId)?.alias ?? clientId;
}

function formatVisitDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

function visitStatusLabel(status: "done" | "in_progress" | "scheduled"): string {
  if (status === "done") return "Executada";
  if (status === "in_progress") return "Em execução";
  return "Programada";
}

function resolveAlertAction(
  alert: DashboardAlert,
  dataset: DemoDataset,
): DashboardNextAction | null {
  if (alert.id.startsWith("alert-cert-")) {
    const certificateId = alert.id.replace("alert-cert-", "");
    if (!dataset.certificates.some((item) => item.id === certificateId)) return null;
    return {
      id: `action-${alert.id}`,
      title: alert.title,
      detail: alert.detail,
      category: "Certificado",
      priority: "high",
      href: `/demonstracao/certificados/${certificateId}`,
      recordId: certificateId,
    };
  }

  if (alert.id.startsWith("alert-emp-")) {
    const withoutPrefix = alert.id.replace("alert-emp-", "");
    const employeeId = withoutPrefix.split("-").slice(0, 2).join("-");
    const employee = dataset.employees.find((item) => item.id === employeeId)
      ?? dataset.employees.find((item) => withoutPrefix.startsWith(item.id));
    if (!employee) {
      return {
        id: `action-${alert.id}`,
        title: alert.title,
        detail: alert.detail,
        category: "Colaborador",
        priority: "high",
        href: "/demonstracao/colaboradores",
      };
    }
    return {
      id: `action-${alert.id}`,
      title: alert.title,
      detail: alert.detail,
      category: "Colaborador",
      priority: "high",
      href: `/demonstracao/colaboradores/${employee.id}`,
      recordId: employee.id,
    };
  }

  if (alert.id.startsWith("alert-prop-")) {
    const proposalId = alert.id.replace("alert-prop-", "");
    if (!dataset.proposals.some((item) => item.id === proposalId)) return null;
    return {
      id: `action-${alert.id}`,
      title: alert.title,
      detail: alert.detail,
      category: "Proposta",
      priority: "medium",
      href: `/demonstracao/comercial/propostas/${proposalId}`,
      recordId: proposalId,
    };
  }

  if (alert.id.startsWith("alert-contract-")) {
    const contractId = alert.id.replace("alert-contract-", "");
    if (!dataset.contracts.some((item) => item.id === contractId)) return null;
    return {
      id: `action-${alert.id}`,
      title: alert.title,
      detail: alert.detail,
      category: "Contrato",
      priority: "medium",
      href: `/demonstracao/contratos/${contractId}`,
      recordId: contractId,
    };
  }

  if (alert.id.startsWith("alert-formalization-")) {
    const workOrderId = alert.id.replace("alert-formalization-", "");
    const workOrder = dataset.workOrders.find((item) => item.id === workOrderId);
    if (!workOrder) return null;
    const href = workOrder.proposalId
      ? `/demonstracao/comercial/propostas/${workOrder.proposalId}`
      : `/demonstracao/ordens-servico/${workOrder.id}`;
    return {
      id: `action-${alert.id}`,
      title: alert.title,
      detail: alert.detail,
      category: "Formalização",
      priority: "high",
      href,
      recordId: workOrder.proposalId ?? workOrder.id,
    };
  }

  if (alert.id.startsWith("alert-process-")) {
    const processId = alert.id.replace("alert-process-", "");
    if (!dataset.environmentalProcesses.some((item) => item.id === processId)) return null;
    return {
      id: `action-${alert.id}`,
      title: alert.title,
      detail: alert.detail,
      category: "Processo ambiental",
      priority: "medium",
      href: `/demonstracao/processos/${processId}`,
      recordId: processId,
    };
  }

  if (alert.id.startsWith("alert-os-")) {
    const workOrderId = alert.id.replace("alert-os-", "");
    if (!dataset.workOrders.some((item) => item.id === workOrderId)) return null;
    return {
      id: `action-${alert.id}`,
      title: alert.title,
      detail: alert.detail,
      category: "Ordem de serviço",
      priority: "high",
      href: `/demonstracao/ordens-servico/${workOrderId}`,
      recordId: workOrderId,
    };
  }

  if (alert.id.startsWith("alert-doc-")) {
    const documentId = alert.id.replace("alert-doc-", "");
    if (!dataset.documents.some((item) => item.id === documentId)) return null;
    return {
      id: `action-${alert.id}`,
      title: alert.title,
      detail: alert.detail,
      category: "Documento",
      priority: "medium",
      href: `/demonstracao/documentos/${documentId}`,
      recordId: documentId,
    };
  }

  if (alert.id.startsWith("alert-stock-") || alert.id.startsWith("alert-expiry-")) {
    const productId = alert.id.replace(/alert-(stock|expiry)-/, "");
    if (!dataset.products.some((item) => item.id === productId)) {
      return {
        id: `action-${alert.id}`,
        title: alert.title,
        detail: alert.detail,
        category: "Produtos",
        priority: "medium",
        href: "/demonstracao/estoque",
      };
    }
    return {
      id: `action-${alert.id}`,
      title: alert.title,
      detail: alert.detail,
      category: "Produtos",
      priority: "medium",
      href: `/demonstracao/estoque/${productId}`,
      recordId: productId,
    };
  }

  if (alert.id.startsWith("alert-postsale-")) {
    const workOrderId = alert.id.replace("alert-postsale-", "");
    if (!dataset.workOrders.some((item) => item.id === workOrderId)) return null;
    return {
      id: `action-${alert.id}`,
      title: alert.title,
      detail: alert.detail,
      category: "Pós-venda",
      priority: "medium",
      href: `/demonstracao/ordens-servico/${workOrderId}`,
      recordId: workOrderId,
    };
  }

  return {
    id: `action-${alert.id}`,
    title: alert.title,
    detail: alert.detail,
    category: "Alerta",
    priority: "medium",
  };
}

function buildNarrativeGuides(dataset: DemoDataset): DashboardNextAction[] {
  const guides: DashboardNextAction[] = [];
  const hotel = dataset.clients.find((item) => item.id === "client-hotel-amazonas");
  if (hotel) {
    guides.push({
      id: "guide-hotel",
      title: "Abrir o Hotel Amazonas Plaza",
      detail: "Roteiro da apresentação: proposta, formalização, OS, relatório e financeiro.",
      category: "Roteiro",
      priority: "guide",
      href: `/demonstracao/clientes/${hotel.id}`,
      recordId: hotel.id,
    });
  }

  const execution = dataset.workOrders.find((item) => item.id === "os-demo-04");
  if (execution) {
    guides.push({
      id: "guide-hotel-execution",
      title: "Confirmar o serviço de hoje",
      detail: `${execution.serviceName} · veículo ${execution.vehicleLabel ?? "não informado"}.`,
      category: "Roteiro",
      priority: "guide",
      href: `/demonstracao/ordens-servico/${execution.id}/execucao`,
      recordId: execution.id,
    });
  }

  const formalized = dataset.proposals.find(
    (item) => item.id === "prop-005" && item.formalization,
  );
  if (formalized?.formalization) {
    guides.push({
      id: "guide-hotel-formalization",
      title: "Ver formalização recebida",
      detail: `${formalized.formalization.documentCode} em ${formalized.formalization.receivedAt.split("-").reverse().join("/")}. Hipótese ainda em validação.`,
      category: "Roteiro",
      priority: "guide",
      href: `/demonstracao/comercial/propostas/${formalized.id}`,
      recordId: formalized.id,
    });
  }

  return guides;
}

function buildFinanceAction(
  dataset: DemoDataset,
  delinquencyAmount: number,
): DashboardNextAction | null {
  if (delinquencyAmount <= 0) return null;
  const openReceivable = dataset.financialTransactions.find(
    (item) =>
      item.type === "receivable" &&
      !item.paidAt &&
      item.dueDate < DEMO_REFERENCE_DATE,
  );
  return {
    id: "action-finance-overdue",
    title: "Financeiro em atraso",
    detail: openReceivable
      ? `Há valores vencidos na massa demonstrativa, inclusive lançamentos do Hotel Amazonas.`
      : "Há valores vencidos derivados das contas a receber desta demonstração.",
    category: "Financeiro",
    priority: "high",
    href: "/demonstracao/financeiro",
    recordId: openReceivable?.id,
  };
}

function buildPreServiceActions(dataset: DemoDataset): DashboardNextAction[] {
  const reference = new Date(`${DEMO_REFERENCE_DATE}T12:00:00`);
  return dataset.workOrders
    .filter((workOrder) => {
      if (workOrder.status === "cancelled" || workOrder.status === "completed") return false;
      if (!workOrder.scheduledAt) return false;
      const scheduled = new Date(workOrder.scheduledAt);
      if (scheduled < reference) return false;
      const hasPreService = dataset.preServiceDocuments.some(
        (document) => document.workOrderId === workOrder.id,
      );
      return !hasPreService;
    })
    .slice(0, 2)
    .map((workOrder) => ({
      id: `action-preservice-${workOrder.id}`,
      title: "Documento pré-serviço a emitir",
      detail: `${workOrder.serviceName} de ${clientAlias(dataset, workOrder.clientId)} ainda sem informativo ou autorização nesta demonstração.`,
      category: "Pré-serviço",
      priority: "medium" as const,
      href: `/demonstracao/ordens-servico/${workOrder.id}/pre-servico`,
      recordId: workOrder.id,
    }));
}

function buildRecurrenceAction(dataset: DemoDataset): DashboardNextAction | null {
  const recurring = buildRecurringVisits(dataset)[0];
  if (!recurring) return null;
  return {
    id: "action-recurrence-next",
    title: "Recorrência próxima",
    detail: `${recurring.clientAlias} · ${recurring.serviceName} em ${recurring.nextVisitAt}.`,
    category: "Agenda",
    priority: "medium",
    href: recurring.href,
    recordId: recurring.id,
  };
}

export function buildFormalizationOverview(
  dataset: DemoDataset,
): FormalizationOverviewItem[] {
  const items: FormalizationOverviewItem[] = [];

  for (const proposal of dataset.proposals.filter((item) => item.status === "accepted")) {
    const linkedOs = dataset.workOrders.find((item) => item.proposalId === proposal.id);
    if (proposal.formalization) {
      const scheduleReady =
        linkedOs !== undefined &&
        linkedOs.scheduleStatusLabel !== "Aguardando formalização";
      items.push({
        id: `formalization-${proposal.id}`,
        proposalCode: proposal.code,
        clientAlias: clientAlias(dataset, proposal.clientId),
        status: scheduleReady ? "schedule-ready" : "received",
        statusLabel: scheduleReady
          ? "Formalizada · agendamento liberado"
          : "Formalização recebida",
        documentCode: proposal.formalization.documentCode,
        href: `/demonstracao/comercial/propostas/${proposal.id}`,
      });
      continue;
    }

    items.push({
      id: `formalization-${proposal.id}`,
      proposalCode: proposal.code,
      clientAlias: clientAlias(dataset, proposal.clientId),
      status: "awaiting",
      statusLabel: "Aguardando formalização",
      href: `/demonstracao/comercial/propostas/${proposal.id}`,
    });
  }

  for (const workOrder of dataset.workOrders.filter(
    (item) => item.scheduleStatusLabel === "Aguardando formalização",
  )) {
    if (workOrder.proposalId) continue;
    items.push({
      id: `formalization-os-${workOrder.id}`,
      proposalCode: workOrder.code,
      clientAlias: clientAlias(dataset, workOrder.clientId),
      status: "awaiting",
      statusLabel: "Aguardando formalização",
      href: `/demonstracao/ordens-servico/${workOrder.id}`,
    });
  }

  return items.sort((left, right) => {
    const order = { awaiting: 0, received: 1, "schedule-ready": 2 } as const;
    return order[left.status] - order[right.status];
  });
}

export function buildRecurringVisits(dataset: DemoDataset): RecurringVisitItem[] {
  const referenceMs = new Date(`${DEMO_REFERENCE_DATE}T00:00:00`).getTime();

  return dataset.workOrders
    .flatMap((workOrder) => {
      const visits = workOrder.visits ?? [];
      if (visits.length < 2) return [];

      const nextVisit =
        visits
          .filter((visit) => visit.status === "scheduled" || visit.status === "in_progress")
          .sort(
            (left, right) =>
              new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
          )
          .find((visit) => new Date(visit.scheduledAt).getTime() >= referenceMs) ??
        visits
          .filter((visit) => visit.status === "scheduled")
          .sort(
            (left, right) =>
              new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
          )[0];

      if (!nextVisit) return [];

      const vehicle = dataset.vehicles.find((item) => item.id === nextVisit.vehicleId);
      return [
        {
          id: `${workOrder.id}-${nextVisit.id}`,
          clientAlias: clientAlias(dataset, workOrder.clientId),
          serviceName: workOrder.serviceName,
          nextVisitAt: formatVisitDate(nextVisit.scheduledAt),
          statusLabel: visitStatusLabel(nextVisit.status),
          vehicleLabel: vehicle?.internalCode ?? workOrder.vehicleLabel,
          team: nextVisit.team,
          href: `/demonstracao/ordens-servico/${workOrder.id}`,
          sortAt: nextVisit.scheduledAt,
        },
      ];
    })
    .sort((left, right) => left.sortAt.localeCompare(right.sortAt))
    .slice(0, 6)
    .map((visit) => ({
      id: visit.id,
      clientAlias: visit.clientAlias,
      serviceName: visit.serviceName,
      nextVisitAt: visit.nextVisitAt,
      statusLabel: visit.statusLabel,
      vehicleLabel: visit.vehicleLabel,
      team: visit.team,
      href: visit.href,
    }));
}

export function buildDashboardNextActions(input: {
  dataset: DemoDataset;
  alerts: DashboardAlert[];
  delinquencyAmount: number;
}): DashboardNextAction[] {
  const { dataset, alerts, delinquencyAmount } = input;
  const actions: DashboardNextAction[] = [];
  const seen = new Set<string>();

  function push(action: DashboardNextAction | null) {
    if (!action) return;
    const key = action.href ?? action.id;
    if (seen.has(key) || seen.has(action.id)) return;
    seen.add(action.id);
    if (action.href) seen.add(action.href);
    actions.push(action);
  }

  for (const alert of alerts) {
    push(resolveAlertAction(alert, dataset));
  }

  push(buildFinanceAction(dataset, delinquencyAmount));
  for (const action of buildPreServiceActions(dataset)) {
    push(action);
  }
  push(buildRecurrenceAction(dataset));

  const prioritized = actions
    .filter((action) => action.priority !== "guide")
    .sort((left, right) => {
      const byPriority = PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
      if (byPriority !== 0) return byPriority;
      return left.title.localeCompare(right.title, "pt-BR");
    })
    .slice(0, 9);

  const guides: DashboardNextAction[] = [];
  for (const guide of buildNarrativeGuides(dataset)) {
    const key = guide.href ?? guide.id;
    if (seen.has(key) || seen.has(guide.id)) continue;
    seen.add(guide.id);
    if (guide.href) seen.add(guide.href);
    guides.push(guide);
  }

  return [...prioritized, ...guides];
}
