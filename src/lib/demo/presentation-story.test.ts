import { describe, expect, it } from "vitest";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import { buildDashboardMetrics } from "@/lib/demo/metrics";

describe("sprint 10 presentation story", () => {
  it("keeps Hotel Amazonas connected across the master flow", () => {
    const clientId = "client-hotel-amazonas";
    const proposal = seedDemoDataset.proposals.find((item) => item.id === "prop-005");
    const items = seedDemoDataset.proposalItems.filter((item) => item.proposalId === "prop-005");
    const workOrder = seedDemoDataset.workOrders.find((item) => item.id === "os-demo-04");
    const report = seedDemoDataset.photoReports.find((item) => item.id === "rel-foto-hotel");
    const certificate = seedDemoDataset.certificates.find((item) => item.id === "cert-hotel-001");
    const execution = seedDemoDataset.serviceExecutions.find(
      (item) => item.workOrderId === "os-demo-04",
    );
    const receivable = seedDemoDataset.financialTransactions.find((item) => item.id === "fin-025");
    const contract = seedDemoDataset.contracts.find((item) => item.id === "contract-004");
    const itemTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    expect(proposal?.clientId).toBe(clientId);
    expect(proposal?.status).toBe("accepted");
    expect(proposal?.discountAmount).toBe(400);
    expect(itemTotal - (proposal?.discountAmount ?? 0)).toBe(proposal?.value);
    expect(workOrder?.proposalId).toBe("prop-005");
    expect(workOrder?.clientId).toBe(clientId);
    expect(workOrder?.vehicleLabel).toBe("F2");
    expect(workOrder?.serviceTypeLabel).toContain("RSV");
    expect(contract?.clientId).toBe(clientId);
    expect(report?.clientId).toBe(clientId);
    expect(report?.workOrderId).toBe("os-demo-04");
    expect(report?.photoSrcs).toHaveLength(6);
    expect(certificate?.status).toBe("draft");
    expect(certificate?.workOrderId).toBe("os-demo-04");
    expect(execution?.startedAt).toBeTruthy();
    expect(receivable?.clientId).toBe(clientId);
    expect(receivable?.billingStatus).toBe("open");
    expect(proposal?.formalization?.documentCode).toBe("OCS-DEMO-014");
    expect(proposal?.paymentSignal?.status).toBe("confirmed");
    expect(proposal?.paymentSignal?.amount).toBe(4900);
    expect(proposal?.observations).not.toMatch(/libera o agendamento/);
    expect(workOrder?.familyFields?.some((field) => field.value.includes("10.000 L"))).toBe(true);
    expect(report?.technicalDescription).toContain("10.000 L");
    expect(report?.photosPerPage).toBe(4);
    expect(workOrder?.visits).toHaveLength(3);
    expect(workOrder?.visits?.[0]?.status).toBe("in_progress");
  });

  it("accepts numeric and alphanumeric demonstration documents", () => {
    const documents = seedDemoDataset.clients.map((client) => client.documentNumber);
    expect(documents).toContain("04.882.110/0001-36");
    expect(documents).toContain("A1.B2C.3D4/0001-55");
  });

  it("surfaces today, certificates and proposal alerts together", () => {
    const metrics = buildDashboardMetrics(seedDemoDataset, "2026-08");
    expect(metrics.servicesToday).toBeGreaterThan(0);
    expect(metrics.servicesThisWeek).toBeGreaterThanOrEqual(metrics.servicesToday);
    expect(metrics.certificatesToIssue).toBeGreaterThan(0);
    expect(metrics.alerts.some((alert) => alert.title.includes("Orçamento"))).toBe(true);
    expect(metrics.alerts.some((alert) => alert.title.includes("Certificado"))).toBe(true);
    expect(metrics.alerts.some((alert) => alert.title.includes("ASO"))).toBe(true);
  });

  it("shows family variants, rating, pre-service docs and environmental process", () => {
    const cip = seedDemoDataset.workOrders.find((item) => item.id === "os-cip-01");
    const collection = seedDemoDataset.workOrders.find((item) => item.id === "os-coleta-01");
    const ete = seedDemoDataset.workOrders.find((item) => item.id === "os-ete-01");
    const monitoring = seedDemoDataset.serviceExecutions.find(
      (item) => item.workOrderId === "os-monitor-01",
    );
    const recurring = seedDemoDataset.workOrders.find((item) => item.id === "os-monitor-01");
    const templates = new Set(seedDemoDataset.certificates.map((item) => item.template));

    expect(cip?.serviceFamily).toBe("cip");
    expect(cip?.familyFields?.some((field) => field.label === "Infestação")).toBe(true);
    expect(collection?.serviceFamily).toBe("water-collection");
    expect(ete?.serviceFamily).toBe("ete");
    expect(monitoring?.rating).toBe("Excelente");
    expect(monitoring?.ratingNote).toBeTruthy();
    expect(recurring?.visits?.filter((visit) => visit.status === "done").length).toBeGreaterThan(0);
    expect(recurring?.visits?.some((visit) => visit.status === "scheduled")).toBe(true);
    expect(seedDemoDataset.preServiceDocuments.map((item) => item.kind)).toEqual(
      expect.arrayContaining(["notice", "entry-authorization", "awareness"]),
    );
    expect(templates).toEqual(new Set(["reservoir", "well", "pest", "waste"]));
    expect(seedDemoDataset.environmentalProcesses[0]?.status).toBe("documents-pending");
    expect(seedDemoDataset.vehicles.some((vehicle) => vehicle.kind === "Motocicleta")).toBe(true);
    expect(seedDemoDataset.technicalResponsibles).toHaveLength(2);
    expect(seedDemoDataset.proposals.find((item) => item.id === "prop-005")?.formalization?.receivedAt).toBe(
      "2026-08-27",
    );
    expect(
      seedDemoDataset.workOrders.filter((item) => item.scheduledAt?.startsWith("2026-08-28")),
    ).toHaveLength(1);
  });
});
