import { describe, expect, it } from "vitest";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import {
  canIssueWorkOrderFromProposal,
  canIssueWorkOrderFromPurchaseOrder,
  completeWorkOrder,
  createWorkOrderFromProposal,
  createWorkOrderFromPurchaseOrder,
  filterWorkOrdersByStatus,
  findScheduleConflicts,
  getUnscheduledWorkOrders,
  getWorkOrdersInRange,
  scheduleWorkOrder,
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
      inRange.every((item) => item.scheduledAt?.startsWith("2026-09-0")),
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

  it("issues a work order from an accepted proposal without requiring a signal", () => {
    const proposal = seedDemoDataset.proposals.find(
      (item) =>
        item.status === "accepted" &&
        !item.paymentSignal &&
        !seedDemoDataset.workOrders.some((workOrder) => workOrder.proposalId === item.id),
    );
    expect(proposal).toBeDefined();
    expect(canIssueWorkOrderFromProposal(seedDemoDataset, proposal!.id).ok).toBe(true);

    const created = createWorkOrderFromProposal(seedDemoDataset, proposal!.id);
    const workOrder = created.workOrders.find((item) => item.proposalId === proposal!.id);
    expect(workOrder).toBeDefined();
    expect(workOrder?.clientId).toBe(proposal!.clientId);
    expect(workOrder?.status).toBe("issued");
    expect(workOrder?.scheduledAt).toBeUndefined();
    expect(getUnscheduledWorkOrders(created).some((item) => item.id === workOrder?.id)).toBe(
      true,
    );

    const duplicated = createWorkOrderFromProposal(created, proposal!.id);
    expect(
      duplicated.workOrders.filter((item) => item.proposalId === proposal!.id),
    ).toHaveLength(1);
  });

  it("still allows issuing a work order when the signal is only pending", () => {
    const proposal = seedDemoDataset.proposals.find(
      (item) => item.paymentSignal?.status === "pending",
    );
    expect(proposal).toBeDefined();
    expect(canIssueWorkOrderFromProposal(seedDemoDataset, proposal!.id).ok).toBe(true);

    const created = createWorkOrderFromProposal(seedDemoDataset, proposal!.id);
    expect(
      created.workOrders.some((item) => item.proposalId === proposal!.id),
    ).toBe(true);
  });

  it("does not issue a work order from a proposal that is not accepted", () => {
    const proposal = seedDemoDataset.proposals.find((item) => item.status === "sent");
    expect(proposal).toBeDefined();
    expect(canIssueWorkOrderFromProposal(seedDemoDataset, proposal!.id).ok).toBe(false);

    const unchanged = createWorkOrderFromProposal(seedDemoDataset, proposal!.id);
    expect(
      unchanged.workOrders.filter((item) => item.proposalId === proposal!.id),
    ).toHaveLength(0);
  });

  it("issues a work order from a received purchase order without internal proposal", () => {
    const purchaseOrder = seedDemoDataset.receivedPurchaseOrders.find(
      (item) => item.withoutInternalProposal && !item.workOrderId,
    );
    expect(purchaseOrder).toBeDefined();
    expect(canIssueWorkOrderFromPurchaseOrder(seedDemoDataset, purchaseOrder!.id).ok).toBe(
      true,
    );

    const created = createWorkOrderFromPurchaseOrder(
      seedDemoDataset,
      purchaseOrder!.id,
    );
    const workOrder = created.workOrders.find(
      (item) => item.purchaseOrderId === purchaseOrder!.id,
    );
    expect(workOrder).toBeDefined();
    expect(workOrder?.proposalId).toBeUndefined();
    expect(
      created.receivedPurchaseOrders.find((item) => item.id === purchaseOrder!.id)
        ?.workOrderId,
    ).toBe(workOrder?.id);

    const duplicated = createWorkOrderFromPurchaseOrder(created, purchaseOrder!.id);
    expect(
      duplicated.workOrders.filter((item) => item.purchaseOrderId === purchaseOrder!.id),
    ).toHaveLength(1);
  });

  it("schedules and reschedules with history", () => {
    const proposal = seedDemoDataset.proposals.find(
      (item) =>
        item.status === "accepted" &&
        !seedDemoDataset.workOrders.some((workOrder) => workOrder.proposalId === item.id),
    );
    expect(proposal).toBeDefined();

    const issued = createWorkOrderFromProposal(seedDemoDataset, proposal!.id);
    const workOrder = issued.workOrders.find((item) => item.proposalId === proposal!.id);
    expect(workOrder?.status).toBe("issued");

    const scheduled = scheduleWorkOrder(
      issued,
      workOrder!.id,
      "2026-09-10T09:00:00",
    );
    const first = scheduled.workOrders.find((item) => item.id === workOrder!.id);
    expect(first?.status).toBe("scheduled");
    expect(first?.scheduledAt).toBe("2026-09-10T09:00:00");
    expect(first?.scheduleHistory).toHaveLength(1);

    const rescheduled = scheduleWorkOrder(
      scheduled,
      workOrder!.id,
      "2026-09-11T14:00:00",
    );
    const second = rescheduled.workOrders.find((item) => item.id === workOrder!.id);
    expect(second?.scheduledAt).toBe("2026-09-11T14:00:00");
    expect(second?.scheduleHistory).toHaveLength(2);
    expect(second?.scheduleStatusLabel).toBe("Remarcada");
  });

  it("signals soft schedule conflicts without blocking", () => {
    const scheduled = seedDemoDataset.workOrders.find(
      (item) => item.scheduledAt && item.status === "scheduled",
    );
    expect(scheduled).toBeDefined();
    const conflicts = findScheduleConflicts(
      seedDemoDataset,
      scheduled!.id,
      scheduled!.scheduledAt!,
    );
    expect(Array.isArray(conflicts)).toBe(true);
  });

  it("updates work order status directly", () => {
    const target = seedDemoDataset.workOrders[0];
    const updated = updateWorkOrderStatus(seedDemoDataset, target.id, "cancelled");
    expect(
      updated.workOrders.find((item) => item.id === target.id)?.status,
    ).toBe("cancelled");
  });

  it("keeps accepted status helper available for fixtures", () => {
    const proposal = seedDemoDataset.proposals.find((item) => item.status === "accepted");
    expect(proposal).toBeDefined();
    const updated = updateProposalStatus(seedDemoDataset, proposal!.id, "accepted");
    expect(updated.proposals.find((item) => item.id === proposal!.id)?.status).toBe(
      "accepted",
    );
  });
});
