import { describe, expect, it } from "vitest";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import {
  buildComplianceAlerts,
  countAlertsByTier,
  filterDocumentsByAlertTier,
  getContractDocuments,
  getContractWorkOrders,
  getDocumentAlertTier,
  getRecurringMonthlyRevenue,
} from "@/lib/demo/compliance-actions";

describe("compliance demo actions", () => {
  it("classifies document alert tiers at 90, 60 and 30 days", () => {
    expect(getDocumentAlertTier("2026-11-26")).toBe(90);
    expect(getDocumentAlertTier("2026-10-27")).toBe(60);
    expect(getDocumentAlertTier("2026-09-05")).toBe(30);
    expect(getDocumentAlertTier("2026-07-01")).toBe("expired");
    expect(getDocumentAlertTier("2027-01-01")).toBeNull();
  });

  it("builds compliance alerts for documents and contracts", () => {
    const alerts = buildComplianceAlerts(seedDemoDataset);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.some((alert) => alert.kind === "document")).toBe(true);
    expect(alerts.some((alert) => alert.kind === "contract")).toBe(true);
  });

  it("counts alerts by tier", () => {
    const counts = countAlertsByTier(seedDemoDataset);
    expect(counts.tier30 + counts.tier60 + counts.tier90 + counts.expired).toBeGreaterThan(
      0,
    );
  });

  it("filters documents by alert tier", () => {
    const tier30 = filterDocumentsByAlertTier(seedDemoDataset, 30);
    expect(
      tier30.every((document) => getDocumentAlertTier(document.expiresAt) === 30),
    ).toBe(true);
  });

  it("derives recurring monthly revenue from active and expiring contracts", () => {
    const expected = seedDemoDataset.contracts
      .filter((contract) => contract.status === "active" || contract.status === "expiring")
      .reduce((sum, contract) => sum + contract.monthlyValue, 0);

    expect(getRecurringMonthlyRevenue(seedDemoDataset)).toBe(expected);
  });

  it("links contract documents and work orders", () => {
    const contract = seedDemoDataset.contracts[0];
    const documents = getContractDocuments(seedDemoDataset, contract.id);
    const workOrders = getContractWorkOrders(seedDemoDataset, contract.id);

    expect(documents.every((document) => document.contractId === contract.id)).toBe(
      true,
    );
    expect(workOrders.every((workOrder) => workOrder.contractId === contract.id)).toBe(
      true,
    );
  });
});
