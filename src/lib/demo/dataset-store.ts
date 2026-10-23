import {
  DEMO_DATASET_STORAGE_KEY,
  DEMO_RESTORE_FLAG_KEY,
} from "@/data/demo/auth";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import type { DemoDataset } from "@/types/demo-entities";

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function subscribeDemoDataset(listener: () => void): () => void {
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

/** Completa campos e registros da validação visual sem apagar o que o navegador já alterou. */
export function hydrateDemoDataset(dataset: DemoDataset): DemoDataset {
  const seed = seedDemoDataset;
  return {
    ...seed,
    ...dataset,
    clients: mergeById(dataset.clients, seed.clients),
    clientUnits: mergeById(dataset.clientUnits, seed.clientUnits),
    opportunities: mergeById(dataset.opportunities, seed.opportunities),
    proposals: mergeById(dataset.proposals, seed.proposals),
    proposalItems: mergeById(dataset.proposalItems, seed.proposalItems),
    workOrders: mergeById(dataset.workOrders, seed.workOrders),
    documents: mergeById(dataset.documents, seed.documents),
    products: mergeById(dataset.products, seed.products),
    contracts: mergeById(dataset.contracts, seed.contracts),
    financialTransactions: mergeById(dataset.financialTransactions, seed.financialTransactions),
    employees: mergeById(dataset.employees, seed.employees),
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

export function getDemoDatasetSnapshot(): DemoDataset {
  if (typeof window === "undefined") {
    return seedDemoDataset;
  }

  const raw = window.localStorage.getItem(DEMO_DATASET_STORAGE_KEY);
  if (!raw) {
    return seedDemoDataset;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isDemoDataset(parsed)) {
      return seedDemoDataset;
    }
    return hydrateDemoDataset(parsed);
  } catch {
    return seedDemoDataset;
  }
}

export function saveDemoDataset(dataset: DemoDataset): void {
  window.localStorage.setItem(DEMO_DATASET_STORAGE_KEY, JSON.stringify(dataset));
  emitChange();
}

export function restoreDemoData(): void {
  window.localStorage.removeItem(DEMO_DATASET_STORAGE_KEY);
  window.localStorage.setItem(DEMO_RESTORE_FLAG_KEY, new Date().toISOString());
  emitChange();
}

export {
  DEMO_DATASET_STORAGE_KEY,
  DEMO_RESTORE_FLAG_KEY,
} from "@/data/demo/auth";
