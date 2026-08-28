import { describe, expect, it } from "vitest";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import {
  advanceTenderStage,
  buildFinanceSummary,
  filterFinancialTransactions,
  filterProductsBelowMinimum,
  filterPublicTendersByStage,
  getProductMovements,
  getWorkOrderMovements,
  toggleTenderChecklistItem,
} from "@/lib/demo/management-actions";

describe("management demo actions", () => {
  it("filters public tenders by stage", () => {
    const documentation = filterPublicTendersByStage(seedDemoDataset, "documentation");
    expect(
      documentation.every((tender) => tender.stage === "documentation"),
    ).toBe(true);
  });

  it("toggles tender checklist and advances stage", () => {
    const tender = seedDemoDataset.publicTenders.find(
      (item) => item.stage === "documentation",
    );
    expect(tender).toBeDefined();

    const itemId = tender!.documentChecklist[0]?.id;
    const toggled = toggleTenderChecklistItem(seedDemoDataset, tender!.id, itemId!);
    const changed = toggled.publicTenders.find((item) => item.id === tender!.id);
    expect(
      changed?.documentChecklist.find((item) => item.id === itemId)?.checked,
    ).not.toBe(tender!.documentChecklist[0]?.checked);

    const advanced = advanceTenderStage(toggled, tender!.id);
    expect(
      advanced.publicTenders.find((item) => item.id === tender!.id)?.stage,
    ).toBe("submitted");
  });

  it("lists products below minimum stock", () => {
    const below = filterProductsBelowMinimum(seedDemoDataset);
    expect(below.every((product) => product.stockQuantity <= product.minimumStock)).toBe(
      true,
    );
    expect(below.length).toBeGreaterThan(0);
  });

  it("links stock movements to products and work orders", () => {
    const movement = seedDemoDataset.stockMovements.find((item) => item.workOrderId);
    expect(movement).toBeDefined();

    const productMovements = getProductMovements(seedDemoDataset, movement!.productId);
    expect(productMovements.some((item) => item.id === movement!.id)).toBe(true);

    const workOrderMovements = getWorkOrderMovements(
      seedDemoDataset,
      movement!.workOrderId!,
    );
    expect(workOrderMovements.some((item) => item.id === movement!.id)).toBe(true);
  });

  it("filters financial transactions and builds summary", () => {
    const filters = {
      periodKey: "2026-08",
      clientId: "all" as const,
      type: "all" as const,
      categoryId: "all" as const,
    };

    const filtered = filterFinancialTransactions(seedDemoDataset, filters);
    expect(filtered.length).toBeGreaterThan(0);

    const summary = buildFinanceSummary(seedDemoDataset, filters);
    const expectedBilling = filtered
      .filter((item) => item.type === "revenue" && item.paidAt)
      .reduce((sum, item) => sum + item.amount, 0);

    expect(summary.billing).toBe(expectedBilling);
  });
});
