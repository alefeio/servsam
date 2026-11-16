import { describe, expect, it } from "vitest";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import {
  buildDashboardNextActions,
  buildFormalizationOverview,
  buildRecurringVisits,
} from "@/lib/demo/dashboard-overview";
import { buildDashboardMetrics } from "@/lib/demo/metrics";
import { updateProposalStatus } from "@/lib/demo/crm-actions";

describe("direction executive overview", () => {
  it("builds formalization states without marking Hotel Amazonas as pending", () => {
    const overview = buildFormalizationOverview(seedDemoDataset);
    const hotel = overview.find((item) => item.proposalCode === "DEMO-005");
    const awaiting = overview.filter((item) => item.status === "awaiting");

    expect(hotel?.status).toBe("schedule-ready");
    expect(hotel?.documentCode).toBe("OCS-DEMO-014");
    expect(hotel?.statusLabel).toContain("agendamento liberado");
    expect(awaiting.length).toBeGreaterThan(0);
    expect(awaiting.every((item) => item.href.length > 0)).toBe(true);
  });

  it("lists recurring visits for services with multiple dates", () => {
    const visits = buildRecurringVisits(seedDemoDataset);
    expect(visits.some((item) => item.clientAlias.includes("Marajó"))).toBe(true);
    expect(visits.some((item) => item.clientAlias.includes("Hotel Amazonas"))).toBe(true);
    expect(visits.every((item) => item.href.includes("/ordens-servico/"))).toBe(true);
  });

  it("derives next actions from alerts and keeps valid destinations", () => {
    const metrics = buildDashboardMetrics(seedDemoDataset, "2026-08");
    const actions = metrics.nextActions;

    expect(actions.some((action) => action.priority === "guide")).toBe(true);
    expect(actions.some((action) => action.title.includes("Certificado") || action.category === "Certificado")).toBe(
      true,
    );
    expect(actions.some((action) => action.id === "guide-hotel")).toBe(true);
    expect(
      actions.every((action) => !action.href || action.href.startsWith("/demonstracao/")),
    ).toBe(true);

    const fromAlerts = buildDashboardNextActions({
      dataset: seedDemoDataset,
      alerts: metrics.alerts,
      delinquencyAmount: metrics.delinquencyAmount,
    });
    expect(fromAlerts.length).toBeGreaterThan(0);
    expect(fromAlerts.length).toBeLessThanOrEqual(12);
  });

  it("updates next actions when a waiting proposal is accepted", () => {
    const before = buildDashboardMetrics(seedDemoDataset, "2026-08");
    const waiting = seedDemoDataset.proposals.find((item) => item.status === "sent");
    expect(waiting).toBeDefined();

    const hadWaitingAction = before.nextActions.some(
      (action) => action.recordId === waiting!.id || action.href?.includes(waiting!.id),
    );
    expect(hadWaitingAction || before.alerts.some((alert) => alert.id.includes(waiting!.id))).toBe(
      true,
    );

    const updated = updateProposalStatus(seedDemoDataset, waiting!.id, "accepted");
    const after = buildDashboardMetrics(updated, "2026-08");

    expect(
      after.alerts.some((alert) => alert.id === `alert-prop-${waiting!.id}`),
    ).toBe(false);
    expect(
      after.nextActions.some((action) => action.href === `/demonstracao/comercial/propostas/${waiting!.id}` && action.category === "Proposta"),
    ).toBe(false);
  });

  it("keeps executive numbers derived from fixtures", () => {
    const metrics = buildDashboardMetrics(seedDemoDataset, "2026-08");
    expect(metrics.billingMonth).toBeGreaterThan(0);
    expect(metrics.formalizationOverview.length).toBeGreaterThan(0);
    expect(metrics.recurringVisits.length).toBeGreaterThan(0);
    expect(metrics.certificatesToIssue).toBe(
      seedDemoDataset.certificates.filter((item) => item.status === "draft").length,
    );
  });
});
