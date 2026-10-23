import { describe, expect, it } from "vitest";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import {
  assertDemoDatasetValid,
  validateDemoDataset,
} from "@/lib/demo/validate-dataset";

describe("demo dataset validation", () => {
  it("validates the seed dataset without broken references", () => {
    expect(() => assertDemoDatasetValid(seedDemoDataset)).not.toThrow();
    expect(validateDemoDataset(seedDemoDataset)).toEqual([]);
  });

  it("meets Sprint 2 entity count requirements", () => {
    expect(seedDemoDataset.clients.length).toBeGreaterThanOrEqual(10);
    expect(seedDemoDataset.clients.length).toBeLessThanOrEqual(15);
    expect(seedDemoDataset.opportunities.length).toBeGreaterThanOrEqual(20);
    expect(seedDemoDataset.opportunities.length).toBeLessThanOrEqual(30);
    expect(seedDemoDataset.workOrders.length).toBeGreaterThanOrEqual(15);
    expect(seedDemoDataset.workOrders.length).toBeLessThanOrEqual(25);
    expect(seedDemoDataset.contracts.length).toBeGreaterThanOrEqual(5);
    expect(seedDemoDataset.contracts.length).toBeLessThanOrEqual(8);
    expect(seedDemoDataset.documents.length).toBeGreaterThanOrEqual(6);
    expect(seedDemoDataset.documents.length).toBeLessThanOrEqual(10);
    expect(seedDemoDataset.products.length).toBeGreaterThanOrEqual(10);
    expect(seedDemoDataset.products.length).toBeLessThanOrEqual(15);
    expect(seedDemoDataset.financialTransactions.length).toBeGreaterThan(0);
    expect(seedDemoDataset.proposals.length).toBeGreaterThan(0);
  });

  it("meets Sprint 3 CRM entity requirements", () => {
    expect(seedDemoDataset.leads.length).toBeGreaterThanOrEqual(10);
    expect(seedDemoDataset.clientUnits.length).toBeGreaterThan(0);
    expect(seedDemoDataset.proposalItems.length).toBeGreaterThan(0);

    const clientsWithUnits = new Set(
      seedDemoDataset.clientUnits.map((unit) => unit.clientId),
    );
    expect(clientsWithUnits.size).toBeGreaterThanOrEqual(3);
  });

  it("meets Sprint 5 governance entity requirements", () => {
    expect(seedDemoDataset.documents.length).toBeGreaterThanOrEqual(8);
    expect(seedDemoDataset.contracts.every((contract) => contract.code.length > 0)).toBe(
      true,
    );
    expect(
      seedDemoDataset.contracts.every(
        (contract) => contract.scheduledVisits.length > 0,
      ),
    ).toBe(true);
    expect(
      seedDemoDataset.documents.every((document) => document.responsibleAlias.length > 0),
    ).toBe(true);
  });

  it("meets Sprint 6 management entity requirements", () => {
    expect(seedDemoDataset.publicTenders.length).toBeGreaterThanOrEqual(5);
    expect(seedDemoDataset.stockMovements.length).toBeGreaterThan(0);
    expect(
      seedDemoDataset.stockMovements.some((movement) => movement.workOrderId),
    ).toBe(true);
  });

  it("detects broken references", () => {
    const broken = {
      ...seedDemoDataset,
      proposals: [
        {
          ...seedDemoDataset.proposals[0],
          clientId: "client-inexistente",
        },
      ],
    };

    const issues = validateDemoDataset(broken);
    expect(issues.some((issue) => issue.field === "clientId")).toBe(true);
  });
});
