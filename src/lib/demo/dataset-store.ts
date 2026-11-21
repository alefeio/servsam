import {
  DEMO_DATASET_STORAGE_KEY,
  DEMO_RESTORE_FLAG_KEY,
} from "@/data/demo/auth";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import type { DemoDataset } from "@/types/demo-entities";

const listeners = new Set<() => void>();

type DatasetLoadIssue = {
  kind: "invalid" | "corrupt";
  message: string;
  at: string;
};

let cachedRaw: string | null | undefined;
let cachedSnapshot: DemoDataset = seedDemoDataset;
let lastLoadIssue: DatasetLoadIssue | null = null;
let storageListenerBound = false;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function ensureStorageListener() {
  if (typeof window === "undefined" || storageListenerBound) {
    return;
  }
  storageListenerBound = true;
  window.addEventListener("storage", (event) => {
    if (event.key !== DEMO_DATASET_STORAGE_KEY && event.key !== null) {
      return;
    }
    invalidateDemoDatasetCache();
    emitChange();
  });
}

function invalidateDemoDatasetCache() {
  cachedRaw = undefined;
}

function readRawDataset(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(DEMO_DATASET_STORAGE_KEY);
}

export function subscribeDemoDataset(listener: () => void): () => void {
  ensureStorageListener();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isDemoDataset(value: unknown): value is DemoDataset {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as DemoDataset;
  return (
    Array.isArray(candidate.clients) &&
    Array.isArray(candidate.clientUnits) &&
    Array.isArray(candidate.leads) &&
    Array.isArray(candidate.opportunities) &&
    Array.isArray(candidate.proposals) &&
    Array.isArray(candidate.proposalItems) &&
    Array.isArray(candidate.workOrders) &&
    Array.isArray(candidate.contracts) &&
    Array.isArray(candidate.documents) &&
    Array.isArray(candidate.products) &&
    Array.isArray(candidate.stockMovements) &&
    Array.isArray(candidate.publicTenders) &&
    Array.isArray(candidate.financialTransactions)
  );
}

function mergeById<T extends { id: string }>(stored: T[] | undefined, seed: T[]): T[] {
  if (!stored) return seed;
  const seedById = new Map(seed.map((item) => [item.id, item]));
  const merged = stored.map((item) => {
    const base = seedById.get(item.id);
    return base ? { ...base, ...item } : item;
  });
  const ids = new Set(merged.map((item) => item.id));
  for (const item of seed) {
    if (!ids.has(item.id)) merged.push(item);
  }
  return merged;
}

function hydrateEmployees(
  stored: DemoDataset["employees"] | undefined,
  seed: DemoDataset["employees"],
): DemoDataset["employees"] {
  return mergeById(stored, seed).map((employee) => {
    if (employee.hrRecords && employee.hrRecords.length > 0) {
      return employee;
    }
    const fromWarnings = (employee.warnings ?? [])
      .filter((text) => text.trim().length > 0 && !text.toLowerCase().includes("nenhuma"))
      .map((text, index) => ({
        id: `${employee.id}-legacy-warning-${index}`,
        kind: "warning" as const,
        title: "Advertência (massa anterior)",
        startedAt: "2026-01-01",
        note: text,
      }));
    return {
      ...employee,
      warnings: employee.warnings ?? [],
      hrRecords: fromWarnings,
    };
  });
}

/** Completa campos e registros da validação visual sem apagar o que o navegador já alterou. */
export function hydrateDemoDataset(dataset: DemoDataset): DemoDataset {
  const seed = seedDemoDataset;
  return {
    ...seed,
    ...dataset,
    clients: mergeById(dataset.clients, seed.clients),
    clientUnits: mergeById(dataset.clientUnits, seed.clientUnits),
    opportunities: mergeById(dataset.opportunities, seed.opportunities),
    proposals: mergeById(dataset.proposals, seed.proposals).map((proposal) => {
      const fromSeed = seed.proposals.find((item) => item.id === proposal.id);
      return {
        ...proposal,
        paymentSignal: proposal.paymentSignal ?? fromSeed?.paymentSignal,
        formalization: proposal.formalization ?? fromSeed?.formalization,
        narrative: proposal.narrative ?? fromSeed?.narrative,
        receivedPurchaseOrder:
          proposal.receivedPurchaseOrder ?? fromSeed?.receivedPurchaseOrder,
      };
    }),
    proposalItems: mergeById(dataset.proposalItems, seed.proposalItems),
    workOrders: mergeById(dataset.workOrders, seed.workOrders).map((workOrder) => {
      const fromSeed = seed.workOrders.find((item) => item.id === workOrder.id);
      return {
        ...workOrder,
        scheduleHistory: workOrder.scheduleHistory ?? fromSeed?.scheduleHistory ?? [],
        purchaseOrderId: workOrder.purchaseOrderId ?? fromSeed?.purchaseOrderId,
      };
    }),
    documents: mergeById(dataset.documents, seed.documents),
    products: mergeById(dataset.products, seed.products),
    contracts: mergeById(dataset.contracts, seed.contracts).map((contract) => {
      const fromSeed = seed.contracts.find((item) => item.id === contract.id);
      return {
        ...contract,
        purchaseOrder: contract.purchaseOrder ?? fromSeed?.purchaseOrder,
      };
    }),
    receivedPurchaseOrders: mergeById(
      dataset.receivedPurchaseOrders ?? [],
      seed.receivedPurchaseOrders,
    ),
    financialTransactions: mergeById(dataset.financialTransactions, seed.financialTransactions),
    employees: hydrateEmployees(dataset.employees, seed.employees),
    certificates: mergeById(dataset.certificates, seed.certificates),
    photoReports: mergeById(dataset.photoReports, seed.photoReports),
    serviceExecutions: mergeById(dataset.serviceExecutions, seed.serviceExecutions),
    vehicles: mergeById(dataset.vehicles, seed.vehicles),
    technicalResponsibles: mergeById(dataset.technicalResponsibles, seed.technicalResponsibles),
    regulatoryCredentials: mergeById(dataset.regulatoryCredentials, seed.regulatoryCredentials),
    preServiceDocuments: mergeById(dataset.preServiceDocuments, seed.preServiceDocuments),
    environmentalProcesses: mergeById(dataset.environmentalProcesses, seed.environmentalProcesses),
    provenance: dataset.provenance ?? seed.provenance,
  };
}

export function getSeedDemoDataset(): DemoDataset {
  return seedDemoDataset;
}

export function getDemoDatasetLoadIssue(): DatasetLoadIssue | null {
  return lastLoadIssue;
}

export function clearDemoDatasetLoadIssue(): void {
  lastLoadIssue = null;
}

/**
 * Snapshot estável para useSyncExternalStore.
 * Com massa no localStorage, hydrateDemoDataset criava um objeto novo a cada leitura
 * e o React entrava em loop (erro #185). O cache só muda quando o texto salvo muda.
 */
export function getDemoDatasetSnapshot(): DemoDataset {
  if (typeof window === "undefined") {
    return seedDemoDataset;
  }

  ensureStorageListener();
  const raw = readRawDataset();
  if (cachedRaw === raw) {
    return cachedSnapshot;
  }

  cachedRaw = raw;
  if (!raw) {
    lastLoadIssue = null;
    cachedSnapshot = seedDemoDataset;
    return cachedSnapshot;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isDemoDataset(parsed)) {
      lastLoadIssue = {
        kind: "invalid",
        message:
          "A massa salva neste navegador não tem a estrutura esperada. Os dados não foram apagados.",
        at: new Date().toISOString(),
      };
      cachedSnapshot = seedDemoDataset;
      return cachedSnapshot;
    }
    lastLoadIssue = null;
    cachedSnapshot = hydrateDemoDataset(parsed);
    return cachedSnapshot;
  } catch {
    lastLoadIssue = {
      kind: "corrupt",
      message:
        "Não foi possível ler a massa demonstrativa salva. Os dados permaneceram no navegador.",
      at: new Date().toISOString(),
    };
    cachedSnapshot = seedDemoDataset;
    return cachedSnapshot;
  }
}

export function saveDemoDataset(dataset: DemoDataset): void {
  const raw = JSON.stringify(dataset);
  window.localStorage.setItem(DEMO_DATASET_STORAGE_KEY, raw);
  lastLoadIssue = null;
  cachedRaw = raw;
  cachedSnapshot = dataset;
  emitChange();
}

export function restoreDemoData(): void {
  window.localStorage.removeItem(DEMO_DATASET_STORAGE_KEY);
  window.localStorage.setItem(DEMO_RESTORE_FLAG_KEY, new Date().toISOString());
  lastLoadIssue = null;
  cachedRaw = null;
  cachedSnapshot = seedDemoDataset;
  emitChange();
}

/** Só para testes: limpa o cache em memória sem tocar no localStorage. */
export function resetDemoDatasetStoreForTests(): void {
  cachedRaw = undefined;
  cachedSnapshot = seedDemoDataset;
  lastLoadIssue = null;
}

export {
  DEMO_DATASET_STORAGE_KEY,
  DEMO_RESTORE_FLAG_KEY,
} from "@/data/demo/auth";
