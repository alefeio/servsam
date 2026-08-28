import type { DemoDataset } from "@/types/demo-entities";

export const DEMO_REFERENCE_DATE = "2026-08-28";

export type ExpiryAlertTier = 90 | 60 | 30;

export const EXPIRY_ALERT_TIERS: ExpiryAlertTier[] = [90, 60, 30];

export const CONTRACT_PERIODICITY_LABELS = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
} as const;

export const CONTRACT_STATUS_LABELS = {
  active: "Ativo",
  expiring: "A vencer",
  expired: "Encerrado",
} as const;

export function daysUntil(dateValue: string, referenceDate = DEMO_REFERENCE_DATE): number {
  const target = new Date(`${dateValue}T12:00:00`);
  const reference = new Date(`${referenceDate}T12:00:00`);
  return Math.ceil((target.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDocumentAlertTier(
  expiresAt: string,
  referenceDate = DEMO_REFERENCE_DATE,
): ExpiryAlertTier | "expired" | null {
  const days = daysUntil(expiresAt, referenceDate);
  if (days < 0) {
    return "expired";
  }
  if (days <= 30) {
    return 30;
  }
  if (days <= 60) {
    return 60;
  }
  if (days <= 90) {
    return 90;
  }
  return null;
}

export function getContractRenewalAlertTier(
  endDate: string,
  referenceDate = DEMO_REFERENCE_DATE,
): ExpiryAlertTier | "expired" | null {
  return getDocumentAlertTier(endDate, referenceDate);
}

export type ComplianceAlert = {
  id: string;
  kind: "document" | "contract";
  entityId: string;
  title: string;
  detail: string;
  tier: ExpiryAlertTier | "expired";
  daysRemaining: number;
};

export function buildComplianceAlerts(dataset: DemoDataset): ComplianceAlert[] {
  const clientAliases = Object.fromEntries(
    dataset.clients.map((client) => [client.id, client.alias]),
  );
  const alerts: ComplianceAlert[] = [];

  for (const document of dataset.documents) {
    const tier = getDocumentAlertTier(document.expiresAt);
    if (!tier) {
      continue;
    }
    const days = daysUntil(document.expiresAt);
    alerts.push({
      id: `compliance-doc-${document.id}`,
      kind: "document",
      entityId: document.id,
      title: "Documento com vencimento próximo",
      detail: `${document.name} (${clientAliases[document.clientId]}) · responsável ${document.responsibleAlias}`,
      tier,
      daysRemaining: days,
    });
  }

  for (const contract of dataset.contracts) {
    const tier = getContractRenewalAlertTier(contract.endDate);
    if (!tier) {
      continue;
    }
    const days = daysUntil(contract.endDate);
    alerts.push({
      id: `compliance-contract-${contract.id}`,
      kind: "contract",
      entityId: contract.id,
      title: "Contrato com renovação próxima",
      detail: `${contract.title} (${clientAliases[contract.clientId]}) encerra em ${contract.endDate}`,
      tier,
      daysRemaining: days,
    });
  }

  return alerts.sort((left, right) => left.daysRemaining - right.daysRemaining);
}

export function filterDocumentsByAlertTier(
  dataset: DemoDataset,
  tier: ExpiryAlertTier | "all" | "expired",
) {
  if (tier === "all") {
    return dataset.documents;
  }
  return dataset.documents.filter((document) => {
    const documentTier = getDocumentAlertTier(document.expiresAt);
    return documentTier === tier;
  });
}

export function filterContractsByStatus(
  dataset: DemoDataset,
  status: DemoDataset["contracts"][number]["status"] | "all",
) {
  if (status === "all") {
    return dataset.contracts;
  }
  return dataset.contracts.filter((contract) => contract.status === status);
}

export function getRecurringMonthlyRevenue(dataset: DemoDataset): number {
  return dataset.contracts
    .filter((contract) => contract.status === "active" || contract.status === "expiring")
    .reduce((sum, contract) => sum + contract.monthlyValue, 0);
}

export function getRecurringAnnualProjection(dataset: DemoDataset): number {
  return getRecurringMonthlyRevenue(dataset) * 12;
}

export function getContractDocuments(dataset: DemoDataset, contractId: string) {
  return dataset.documents.filter((document) => document.contractId === contractId);
}

export function getContractWorkOrders(dataset: DemoDataset, contractId: string) {
  return dataset.workOrders.filter((workOrder) => workOrder.contractId === contractId);
}

export function getClientDocuments(dataset: DemoDataset, clientId: string) {
  return dataset.documents.filter((document) => document.clientId === clientId);
}

export function getClientContracts(dataset: DemoDataset, clientId: string) {
  return dataset.contracts.filter((contract) => contract.clientId === clientId);
}

export function countAlertsByTier(dataset: DemoDataset) {
  const alerts = buildComplianceAlerts(dataset);
  return {
    tier90: alerts.filter((alert) => alert.tier === 90).length,
    tier60: alerts.filter((alert) => alert.tier === 60).length,
    tier30: alerts.filter((alert) => alert.tier === 30).length,
    expired: alerts.filter((alert) => alert.tier === "expired").length,
  };
}
