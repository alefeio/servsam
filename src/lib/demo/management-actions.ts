import type {
  DemoDataset,
  FinancialTransactionType,
  PublicTenderStage,
} from "@/types/demo-entities";
import { DEMO_REFERENCE_DATE, daysUntil } from "@/lib/demo/compliance-actions";

export const PUBLIC_TENDER_STAGE_LABELS: Record<PublicTenderStage, string> = {
  prospecting: "Prospecção",
  documentation: "Documentação",
  submitted: "Proposta enviada",
  evaluation: "Em julgamento",
  won: "Vencedora",
  lost: "Perdida",
};

export const PUBLIC_TENDER_STAGE_ORDER: PublicTenderStage[] = [
  "prospecting",
  "documentation",
  "submitted",
  "evaluation",
  "won",
  "lost",
];

export const STOCK_MOVEMENT_LABELS = {
  inbound: "Entrada",
  outbound: "Saída",
  adjustment: "Ajuste",
} as const;

export const FINANCIAL_TYPE_LABELS: Record<FinancialTransactionType, string> = {
  revenue: "Receita",
  receivable: "A receber",
  expense: "Despesa",
};

export function filterPublicTendersByStage(
  dataset: DemoDataset,
  stage: PublicTenderStage | "all",
) {
  if (stage === "all") {
    return dataset.publicTenders;
  }
  return dataset.publicTenders.filter((tender) => tender.stage === stage);
}

export function filterProductsBelowMinimum(dataset: DemoDataset) {
  return dataset.products.filter((product) => product.stockQuantity <= product.minimumStock);
}

export function filterProductsNearExpiry(
  dataset: DemoDataset,
  withinDays = 60,
  referenceDate = DEMO_REFERENCE_DATE,
) {
  return dataset.products.filter((product) => {
    if (!product.expiryDate) {
      return false;
    }
    const days = daysUntil(product.expiryDate, referenceDate);
    return days >= 0 && days <= withinDays;
  });
}

export function getProductMovements(dataset: DemoDataset, productId: string) {
  return dataset.stockMovements
    .filter((movement) => movement.productId === productId)
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    );
}

export function getWorkOrderMovements(dataset: DemoDataset, workOrderId: string) {
  return dataset.stockMovements.filter((movement) => movement.workOrderId === workOrderId);
}

export function toggleTenderChecklistItem(
  dataset: DemoDataset,
  tenderId: string,
  itemId: string,
): DemoDataset {
  return {
    ...dataset,
    publicTenders: dataset.publicTenders.map((tender) => {
      if (tender.id !== tenderId) {
        return tender;
      }
      return {
        ...tender,
        documentChecklist: tender.documentChecklist.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item,
        ),
      };
    }),
  };
}

export function advanceTenderStage(dataset: DemoDataset, tenderId: string): DemoDataset {
  const tender = dataset.publicTenders.find((item) => item.id === tenderId);
  if (!tender || tender.stage === "won" || tender.stage === "lost") {
    return dataset;
  }

  const index = PUBLIC_TENDER_STAGE_ORDER.indexOf(tender.stage);
  if (index < 0 || index >= PUBLIC_TENDER_STAGE_ORDER.length - 3) {
    return dataset;
  }

  const nextStage = PUBLIC_TENDER_STAGE_ORDER[index + 1];
  if (nextStage === "won" || nextStage === "lost") {
    return dataset;
  }

  return {
    ...dataset,
    publicTenders: dataset.publicTenders.map((item) =>
      item.id === tenderId ? { ...item, stage: nextStage } : item,
    ),
  };
}

export type FinanceFilters = {
  periodKey: string;
  clientId: string | "all";
  type: FinancialTransactionType | "all";
  categoryId: "water-sanitation" | "environmental-pest" | "all";
};

export function getFinancePeriodKeys(dataset: DemoDataset): string[] {
  const periods = new Set<string>();
  for (const transaction of dataset.financialTransactions) {
    periods.add(transaction.dueDate.slice(0, 7));
    if (transaction.paidAt) {
      periods.add(transaction.paidAt.slice(0, 7));
    }
  }
  return [...periods].sort();
}

export function filterFinancialTransactions(dataset: DemoDataset, filters: FinanceFilters) {
  return dataset.financialTransactions.filter((transaction) => {
    if (filters.clientId !== "all" && transaction.clientId !== filters.clientId) {
      return false;
    }
    if (filters.type !== "all" && transaction.type !== filters.type) {
      return false;
    }
    if (filters.categoryId !== "all" && transaction.categoryId !== filters.categoryId) {
      return false;
    }

    const dateRef = transaction.paidAt ?? transaction.dueDate;
    return dateRef.startsWith(filters.periodKey);
  });
}

export function buildFinanceSummary(dataset: DemoDataset, filters: FinanceFilters) {
  const filtered = filterFinancialTransactions(dataset, filters);

  const billing = filtered
    .filter((item) => item.type === "revenue" && item.paidAt)
    .reduce((sum, item) => sum + item.amount, 0);

  const openReceivables = filtered
    .filter((item) => item.type === "receivable" && !item.paidAt)
    .reduce((sum, item) => sum + item.amount, 0);

  const overdueReceivables = filtered
    .filter(
      (item) =>
        item.type === "receivable" &&
        !item.paidAt &&
        daysUntil(item.dueDate, DEMO_REFERENCE_DATE) < 0,
    )
    .reduce((sum, item) => sum + item.amount, 0);

  const expenses = filtered
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    billing,
    openReceivables,
    overdueReceivables,
    expenses,
    transactionCount: filtered.length,
  };
}

export function getCriticalTenderDates(dataset: DemoDataset) {
  return dataset.publicTenders
    .filter((tender) => tender.stage !== "won" && tender.stage !== "lost")
    .map((tender) => ({
      tender,
      daysToSubmission: daysUntil(tender.submissionDeadline),
      daysToOpening: tender.openingDate ? daysUntil(tender.openingDate) : null,
    }))
    .sort((left, right) => left.daysToSubmission - right.daysToSubmission);
}
