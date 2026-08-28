import { serviceCategories } from "@/data/official/services";
import type { DemoDataset } from "@/types/demo-entities";
import type {
  DashboardAlert,
  DashboardMetrics,
  FunnelStage,
  ProductivityRank,
  UpcomingService,
} from "@/types/demo";

const FUNNEL_ORDER = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const;

const FUNNEL_LABELS: Record<(typeof FUNNEL_ORDER)[number], string> = {
  lead: "Lead",
  qualified: "Qualificado",
  proposal: "Proposta",
  negotiation: "Negociação",
  closed_won: "Fechado",
  closed_lost: "Perdido",
};

const DEMO_REFERENCE_DATE = "2026-08-28";

export function getAvailablePeriods(dataset: DemoDataset): string[] {
  const months = new Set<string>();

  for (const transaction of dataset.financialTransactions) {
    if (transaction.type === "revenue") {
      months.add(transaction.paidAt?.slice(0, 7) ?? transaction.dueDate.slice(0, 7));
    }
  }

  return [...months].sort();
}

export function formatPeriodLabel(periodKey: string): string {
  const [year, month] = periodKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function isInPeriod(dateValue: string, periodKey: string): boolean {
  return dateValue.startsWith(periodKey);
}

function daysUntil(dateValue: string, referenceDate: string): number {
  const target = new Date(`${dateValue}T12:00:00`);
  const reference = new Date(`${referenceDate}T12:00:00`);
  const diffMs = target.getTime() - reference.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function buildFunnel(dataset: DemoDataset): FunnelStage[] {
  return FUNNEL_ORDER.map((stage) => ({
    stage,
    label: FUNNEL_LABELS[stage],
    count: dataset.opportunities.filter((item) => item.stage === stage).length,
  }));
}

function buildRevenueByMonth(dataset: DemoDataset, periodKey: string): DashboardMetrics["revenueByMonth"] {
  const periods = getAvailablePeriods(dataset);
  const focusIndex = periods.indexOf(periodKey);
  const window = focusIndex >= 0 ? periods.slice(Math.max(0, focusIndex - 2), focusIndex + 1) : periods.slice(-3);

  return window.map((month) => ({
    month,
    label: formatPeriodLabel(month),
    amount: dataset.financialTransactions
      .filter(
        (item) =>
          item.type === "revenue" &&
          isInPeriod(item.paidAt ?? item.dueDate, month),
      )
      .reduce((sum, item) => sum + item.amount, 0),
  }));
}

function buildSalesByCategory(
  dataset: DemoDataset,
  periodKey: string,
): DashboardMetrics["salesByCategory"] {
  const categoryNames = Object.fromEntries(
    serviceCategories.map((category) => [category.id, category.name]),
  ) as Record<string, string>;

  const totals = new Map<string, number>();

  for (const transaction of dataset.financialTransactions) {
    if (transaction.type !== "revenue") {
      continue;
    }
    const paidOrDue = transaction.paidAt ?? transaction.dueDate;
    if (!isInPeriod(paidOrDue, periodKey)) {
      continue;
    }
    totals.set(
      transaction.categoryId,
      (totals.get(transaction.categoryId) ?? 0) + transaction.amount,
    );
  }

  return [...totals.entries()].map(([categoryId, amount]) => ({
    categoryId,
    categoryName: categoryNames[categoryId] ?? categoryId,
    amount,
  }));
}

function buildUpcomingServices(dataset: DemoDataset): UpcomingService[] {
  const clientAliases = Object.fromEntries(
    dataset.clients.map((client) => [client.id, client.alias]),
  );

  return dataset.workOrders
    .filter((item) => item.status === "scheduled" || item.status === "in_progress")
    .sort(
      (left, right) =>
        new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
    )
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      clientAlias: clientAliases[item.clientId] ?? item.clientId,
      serviceName: item.serviceName,
      scheduledFor: new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(item.scheduledAt)),
    }));
}

function buildProductivityRanking(
  dataset: DemoDataset,
  periodKey: string,
): ProductivityRank[] {
  const counts = new Map<string, number>();

  for (const workOrder of dataset.workOrders) {
    if (workOrder.status !== "completed") {
      continue;
    }
    if (!isInPeriod(workOrder.scheduledAt.slice(0, 10), periodKey)) {
      continue;
    }
    counts.set(
      workOrder.technicianAlias,
      (counts.get(workOrder.technicianAlias) ?? 0) + 1,
    );
  }

  return [...counts.entries()]
    .map(([technicianAlias, completedOrders]) => ({
      technicianAlias,
      completedOrders,
    }))
    .sort((left, right) => right.completedOrders - left.completedOrders)
    .slice(0, 5);
}

function buildAlerts(dataset: DemoDataset): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  const clientAliases = Object.fromEntries(
    dataset.clients.map((client) => [client.id, client.alias]),
  );

  for (const document of dataset.documents) {
    const days = daysUntil(document.expiresAt, DEMO_REFERENCE_DATE);
    if (days >= 0 && days <= 30) {
      alerts.push({
        id: `alert-doc-${document.id}`,
        title: "Documento próximo do vencimento",
        detail: `${document.name} (${clientAliases[document.clientId]}) vence em ${days} dias.`,
      });
    }
  }

  for (const proposal of dataset.proposals.filter((item) => item.status === "sent")) {
    alerts.push({
      id: `alert-prop-${proposal.id}`,
      title: "Proposta aguardando retorno",
      detail: `Proposta ${proposal.code} enviada para ${clientAliases[proposal.clientId]}.`,
    });
  }

  for (const workOrder of dataset.workOrders.filter((item) => item.status === "overdue")) {
    alerts.push({
      id: `alert-os-${workOrder.id}`,
      title: "OS atrasada",
      detail: `${workOrder.serviceName} para ${clientAliases[workOrder.clientId]} está atrasada.`,
    });
  }

  for (const product of dataset.products.filter(
    (item) => item.stockQuantity <= item.minimumStock,
  )) {
    alerts.push({
      id: `alert-stock-${product.id}`,
      title: "Estoque abaixo do mínimo",
      detail: `${product.name} com ${product.stockQuantity} ${product.unit} (mínimo ${product.minimumStock}).`,
    });
  }

  for (const contract of dataset.contracts.filter((item) => item.status === "expiring")) {
    alerts.push({
      id: `alert-contract-${contract.id}`,
      title: "Contrato próximo do vencimento",
      detail: `${contract.title} (${clientAliases[contract.clientId]}) encerra em ${contract.endDate}.`,
    });
  }

  return alerts.slice(0, 8);
}

export function buildDashboardMetrics(
  dataset: DemoDataset,
  periodKey: string,
): DashboardMetrics {
  const billingMonth = dataset.financialTransactions
    .filter(
      (item) =>
        item.type === "revenue" &&
        isInPeriod(item.paidAt ?? item.dueDate, periodKey),
    )
    .reduce((sum, item) => sum + item.amount, 0);

  const openProposals = dataset.proposals.filter(
    (item) => item.status === "sent" || item.status === "draft",
  ).length;

  const closedWon = dataset.opportunities.filter((item) => item.stage === "closed_won").length;
  const closedLost = dataset.opportunities.filter((item) => item.stage === "closed_lost").length;
  const decided = closedWon + closedLost;
  const conversionRate = decided > 0 ? Math.round((closedWon / decided) * 100) : 0;

  const scheduledServices = dataset.workOrders.filter(
    (item) => item.status === "scheduled" || item.status === "in_progress",
  ).length;

  const expiringContracts = dataset.contracts.filter(
    (item) => item.status === "expiring",
  ).length;

  const delinquencyAmount = dataset.financialTransactions
    .filter(
      (item) =>
        item.type === "receivable" &&
        !item.paidAt &&
        daysUntil(item.dueDate, DEMO_REFERENCE_DATE) < 0,
    )
    .reduce((sum, item) => sum + item.amount, 0);

  const documentsNearExpiry = dataset.documents.filter((document) => {
    const days = daysUntil(document.expiresAt, DEMO_REFERENCE_DATE);
    return days >= 0 && days <= 30;
  }).length;

  return {
    periodKey,
    periodLabel: formatPeriodLabel(periodKey),
    billingMonth,
    openProposals,
    conversionRate,
    scheduledServices,
    expiringContracts,
    delinquencyAmount,
    documentsNearExpiry,
    funnel: buildFunnel(dataset),
    revenueByMonth: buildRevenueByMonth(dataset, periodKey),
    salesByCategory: buildSalesByCategory(dataset, periodKey),
    upcomingServices: buildUpcomingServices(dataset),
    alerts: buildAlerts(dataset),
    productivityRanking: buildProductivityRanking(dataset, periodKey),
  };
}

export function getDefaultPeriodKey(dataset: DemoDataset): string {
  const periods = getAvailablePeriods(dataset);
  return periods.at(-1) ?? "2026-08";
}
