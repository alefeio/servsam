import { describe, expect, it } from "vitest";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import {
  buildDashboardMetrics,
  getAvailablePeriods,
  getDefaultPeriodKey,
} from "@/lib/demo/metrics";

describe("dashboard metrics derivation", () => {
  it("derives billing from revenue transactions in the selected period", () => {
    const periodKey = "2026-08";
    const metrics = buildDashboardMetrics(seedDemoDataset, periodKey);

    const expectedBilling = seedDemoDataset.financialTransactions
      .filter(
        (item) =>
          item.type === "revenue" &&
          (item.paidAt ?? item.dueDate).startsWith(periodKey),
      )
      .reduce((sum, item) => sum + item.amount, 0);

    expect(metrics.billingMonth).toBe(expectedBilling);
  });

  it("derives open proposals from proposal statuses", () => {
    const metrics = buildDashboardMetrics(seedDemoDataset, "2026-08");
    const expected = seedDemoDataset.proposals.filter(
      (item) => item.status === "sent" || item.status === "draft",
    ).length;

    expect(metrics.openProposals).toBe(expected);
  });

  it("derives funnel counts from opportunities", () => {
    const metrics = buildDashboardMetrics(seedDemoDataset, "2026-08");
    const totalFromFunnel = metrics.funnel.reduce((sum, item) => sum + item.count, 0);

    expect(totalFromFunnel).toBe(seedDemoDataset.opportunities.length);
  });

  it("lists available revenue periods from the dataset", () => {
    const periods = getAvailablePeriods(seedDemoDataset);
    expect(periods).toContain("2026-06");
    expect(periods).toContain("2026-07");
    expect(periods).toContain("2026-08");
    expect(getDefaultPeriodKey(seedDemoDataset)).toBe("2026-08");
  });

  it("builds alerts from documents, proposals, stock and overdue work orders", () => {
    const metrics = buildDashboardMetrics(seedDemoDataset, "2026-08");
    expect(metrics.alerts.length).toBeGreaterThan(0);
    expect(metrics.alerts.some((alert) => alert.title.includes("Proposta"))).toBe(
      true,
    );
  });
});
