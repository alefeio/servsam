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
    return parsed;
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
