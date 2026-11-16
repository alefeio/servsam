import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import {
  DEMO_DATASET_STORAGE_KEY,
  getDemoDatasetLoadIssue,
  getDemoDatasetSnapshot,
  hydrateDemoDataset,
  resetDemoDatasetStoreForTests,
  restoreDemoData,
  saveDemoDataset,
} from "@/lib/demo/dataset-store";

function minimalStoredDataset() {
  return {
    clients: [
      {
        id: "client-local-only",
        alias: "Cliente local (DEMO)",
        segment: "Hotelaria",
        city: "Belém",
        provenance: seedDemoDataset.provenance,
      },
    ],
    clientUnits: [],
    leads: [],
    opportunities: [],
    proposals: [],
    proposalItems: [],
    workOrders: [],
    contracts: [],
    documents: [],
    products: [],
    stockMovements: [],
    publicTenders: [],
    financialTransactions: [],
  };
}

beforeEach(() => {
  window.localStorage.clear();
  resetDemoDatasetStoreForTests();
});

afterEach(() => {
  window.localStorage.clear();
  resetDemoDatasetStoreForTests();
});

describe("demo dataset store snapshots", () => {
  it("returns the seed when there is no storage", () => {
    const snapshot = getDemoDatasetSnapshot();
    expect(snapshot).toBe(seedDemoDataset);
    expect(getDemoDatasetLoadIssue()).toBeNull();
  });

  it("keeps the same reference for consecutive reads without change", () => {
    window.localStorage.setItem(
      DEMO_DATASET_STORAGE_KEY,
      JSON.stringify(minimalStoredDataset()),
    );
    const first = getDemoDatasetSnapshot();
    const second = getDemoDatasetSnapshot();
    expect(first).toBe(second);
    expect(first.clients.some((client) => client.id === "client-local-only")).toBe(true);
    expect(first.clients.some((client) => client.id === "client-hotel-amazonas")).toBe(true);
    expect(first.vehicles.length).toBeGreaterThan(0);
  });

  it("hydrates older browser data without dropping new seed records", () => {
    const hydrated = hydrateDemoDataset(minimalStoredDataset() as unknown as typeof seedDemoDataset);
    expect(hydrated.preServiceDocuments.length).toBeGreaterThan(0);
    expect(hydrated.environmentalProcesses.length).toBeGreaterThan(0);
    expect(hydrated.technicalResponsibles.length).toBeGreaterThan(0);
    expect(hydrated.clients.some((client) => client.id === "client-local-only")).toBe(true);
  });

  it("updates the snapshot after a mutation and keeps it stable", () => {
    const mutated = {
      ...seedDemoDataset,
      clients: seedDemoDataset.clients.map((client, index) =>
        index === 0 ? { ...client, alias: "Cliente alterado (DEMO)" } : client,
      ),
    };
    saveDemoDataset(mutated);
    const first = getDemoDatasetSnapshot();
    const second = getDemoDatasetSnapshot();
    expect(first).toBe(second);
    expect(first.clients[0]?.alias).toBe("Cliente alterado (DEMO)");
    expect(window.localStorage.getItem(DEMO_DATASET_STORAGE_KEY)).toContain(
      "Cliente alterado (DEMO)",
    );
  });

  it("keeps the mutated snapshot after a simulated reload", () => {
    const mutated = {
      ...seedDemoDataset,
      clients: seedDemoDataset.clients.map((client, index) =>
        index === 0 ? { ...client, city: "Ananindeua" } : client,
      ),
    };
    saveDemoDataset(mutated);
    resetDemoDatasetStoreForTests();
    const reloaded = getDemoDatasetSnapshot();
    expect(reloaded.clients[0]?.city).toBe("Ananindeua");
    expect(getDemoDatasetSnapshot()).toBe(reloaded);
  });

  it("restores the seed without wiping unrelated storage", () => {
    window.localStorage.setItem("servsam.demo.session", JSON.stringify({ keep: true }));
    saveDemoDataset(seedDemoDataset);
    restoreDemoData();
    expect(window.localStorage.getItem(DEMO_DATASET_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem("servsam.demo.session")).toContain("keep");
    expect(getDemoDatasetSnapshot()).toBe(seedDemoDataset);
  });

  it("reports invalid stored data without deleting it", () => {
    window.localStorage.setItem(DEMO_DATASET_STORAGE_KEY, JSON.stringify({ broken: true }));
    const snapshot = getDemoDatasetSnapshot();
    expect(snapshot).toBe(seedDemoDataset);
    expect(getDemoDatasetLoadIssue()?.kind).toBe("invalid");
    expect(window.localStorage.getItem(DEMO_DATASET_STORAGE_KEY)).toContain("broken");
  });

  it("reports corrupt JSON without deleting it", () => {
    window.localStorage.setItem(DEMO_DATASET_STORAGE_KEY, "{not-json");
    const snapshot = getDemoDatasetSnapshot();
    expect(snapshot).toBe(seedDemoDataset);
    expect(getDemoDatasetLoadIssue()?.kind).toBe("corrupt");
    expect(window.localStorage.getItem(DEMO_DATASET_STORAGE_KEY)).toBe("{not-json");
  });
});
