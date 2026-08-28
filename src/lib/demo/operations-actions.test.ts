import { describe, expect, it } from "vitest";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import {
  completeWorkOrder,
  createWorkOrderFromProposal,
  filterWorkOrdersByStatus,
  getWorkOrdersInRange,
  startWorkOrder,
  togglePlanningChecklistItem,
  updateWorkOrderStatus,
} from "@/lib/demo/operations-actions";
import { updateProposalStatus } from "@/lib/demo/crm-actions";

describe("operations demo actions", () => {
  it("filters work orders by status", () => {
    const scheduled = filterWorkOrdersByStatus(seedDemoDataset, "scheduled");
    expect(scheduled.every((item) => item.status === "scheduled")).toBe(true);
  });

  it("returns work orders inside a date range", () => {
    const inRange = getWorkOrdersInRange(
      seedDemoDataset,
      "2026-09-01T00:00:00.000Z",
      "2026-09-07T23:59:59.999Z",
    );
    expect(inRange.length).toBeGreaterThan(0);
    expect(
      inRange.every((item) => item.scheduledAt.startsWith("2026-09-0")),
    ).toBe(true);
  });

  it("starts and completes a work order", () => {
    const target = seedDemoDataset.workOrders.find((item) => item.status === "scheduled");
    expect(target).toBeDefined();

    const started = startWorkOrder(seedDemoDataset, target!.id);
    expect(
      started.workOrders.find((item) => item.id === target!.id)?.status,
    ).toBe("in_progress");

    const completed = completeWorkOrder(started, target!.id);
    const changed = completed.workOrders.find((item) => item.id === target!.id);
    expect(changed?.status).toBe("completed");
    expect(changed?.completedAt).toBe("2026-08-28");
    expect(changed?.planningChecklist.every((item) => item.checked)).toBe(true);
  });

  it("toggles a planning checklist item", () => {
    const target = seedDemoDataset.workOrders.find((item) => item.status === "scheduled");
    expect(target).toBeDefined();
    const itemId = target!.planningChecklist[0]?.id;
    expect(itemId).toBeDefined();

    const updated = togglePlanningChecklistItem(seedDemoDataset, target!.id, itemId!);
    const changed = updated.workOrders.find((item) => item.id === target!.id);
    expect(changed?.planningChecklist.find((item) => item.id === itemId)?.checked).toBe(
      true,
    );
  });

  it("creates a work order from an accepted proposal once", () => {
    const proposal = seedDemoDataset.proposals.find((item) => item.status === "accepted");
    expect(proposal).toBeDefined();

    const datasetWithAccepted = updateProposalStatus(
      seedDemoDataset,
      proposal!.id,
      "accepted",
    );

    const created = createWorkOrderFromProposal(
      datasetWithAccepted,
      proposal!.id,
      "2026-09-10T09:00:00",
    );

    const workOrder = created.workOrders.find((item) => item.proposalId === proposal!.id);
    expect(workOrder).toBeDefined();
    expect(workOrder?.clientId).toBe(proposal!.clientId);
    expect(workOrder?.status).toBe("scheduled");

    const duplicated = createWorkOrderFromProposal(
      created,
      proposal!.id,
      "2026-09-10T09:00:00",
    );
    expect(
      duplicated.workOrders.filter((item) => item.proposalId === proposal!.id),
    ).toHaveLength(1);
  });

  it("updates work order status directly", () => {
    const target = seedDemoDataset.workOrders[0];
    const updated = updateWorkOrderStatus(seedDemoDataset, target.id, "cancelled");
    expect(
      updated.workOrders.find((item) => item.id === target.id)?.status,
    ).toBe("cancelled");
  });
});
