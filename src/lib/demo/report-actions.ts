import type { DemoDataset } from "@/types/demo-entities";
import { buildComplianceAlerts, getRecurringMonthlyRevenue } from "@/lib/demo/compliance-actions";
import {
  buildFinanceSummary,
  filterProductsBelowMinimum,
  filterPublicTendersByStage,
} from "@/lib/demo/management-actions";
import { buildDashboardMetrics, formatPeriodLabel } from "@/lib/demo/metrics";

export type DemoReportKind =
  | "executive"
  | "commercial"
  | "operations"
  | "financial"
  | "compliance";

export type DemoReportDefinition = {
  id: string;
  kind: DemoReportKind;
  title: string;
  description: string;
};

export const DEMO_REPORT_DEFINITIONS: DemoReportDefinition[] = [
  {
    id: "report-executive",
    kind: "executive",
    title: "Painel executivo",
    description: "Faturamento, conversão, serviços agendados e alertas prioritários.",
  },
  {
    id: "report-commercial",
    kind: "commercial",
    title: "Funil comercial",
    description: "Leads, oportunidades, propostas abertas e taxa de conversão.",
  },
  {
    id: "report-operations",
    kind: "operations",
    title: "Operação e OS",
    description: "Agenda, ordens de serviço, produtividade fictícia por técnico.",
  },
  {
    id: "report-financial",
    kind: "financial",
    title: "Financeiro gerencial",
    description: "Receitas, recebíveis em aberto, inadimplência e despesas do período.",
  },
  {
    id: "report-compliance",
    kind: "compliance",
    title: "Compliance e contratos",
    description: "Documentos a vencer, contratos recorrentes e licitações ativas.",
  },
];

export type DemoExportFormat = "pdf" | "excel";

const EXPORT_DISCLAIMER =
  "RELATÓRIO DEMONSTRATIVO — SERVSAM MVP\n" +
  "Conteúdo fictício derivado da massa demo. Não é documento fiscal, contábil ou oficial.\n" +
  "Exportação simulada: nenhuma integração com PDF/Excel de produção nesta fase.\n\n";

export function buildReportContent(
  dataset: DemoDataset,
  reportId: string,
  periodKey: string,
): string {
  const definition = DEMO_REPORT_DEFINITIONS.find((item) => item.id === reportId);
  if (!definition) {
    return `${EXPORT_DISCLAIMER}Relatório não encontrado.`;
  }

  const metrics = buildDashboardMetrics(dataset, periodKey);
  const finance = buildFinanceSummary(dataset, {
    periodKey,
    clientId: "all",
    type: "all",
    categoryId: "all",
  });
  const complianceAlerts = buildComplianceAlerts(dataset);
  const belowMinimum = filterProductsBelowMinimum(dataset);
  const activeTenders = filterPublicTendersByStage(dataset, "all").filter(
    (item) => item.stage !== "won" && item.stage !== "lost",
  );

  const header = `${EXPORT_DISCLAIMER}${definition.title}\nPeríodo: ${formatPeriodLabel(periodKey)}\nGerado em: ${new Date().toISOString()}\n\n`;

  switch (definition.kind) {
    case "executive":
      return (
        header +
        [
          `Faturamento do mês: R$ ${metrics.billingMonth.toFixed(2)}`,
          `Propostas em aberto: ${metrics.openProposals}`,
          `Taxa de conversão: ${metrics.conversionRate}%`,
          `Serviços agendados: ${metrics.scheduledServices}`,
          `Contratos a vencer: ${metrics.expiringContracts}`,
          `Inadimplência: R$ ${metrics.delinquencyAmount.toFixed(2)}`,
          `Alertas prioritários: ${metrics.alerts.length}`,
        ].join("\n")
      );
    case "commercial":
      return (
        header +
        [
          `Leads cadastrados: ${dataset.leads.length}`,
          `Oportunidades: ${dataset.opportunities.length}`,
          `Propostas em aberto: ${metrics.openProposals}`,
          `Taxa de conversão: ${metrics.conversionRate}%`,
          "",
          "Funil:",
          ...metrics.funnel.map((item) => `- ${item.label}: ${item.count}`),
        ].join("\n")
      );
    case "operations":
      return (
        header +
        [
          `Ordens de serviço: ${dataset.workOrders.length}`,
          `Agendadas/em andamento: ${metrics.scheduledServices}`,
          `Produtos abaixo do mínimo: ${belowMinimum.length}`,
          "",
          "Produtividade fictícia:",
          ...metrics.productivityRanking.map(
            (item) => `- ${item.technicianAlias}: ${item.completedOrders} OS concluídas`,
          ),
        ].join("\n")
      );
    case "financial":
      return (
        header +
        [
          `Faturamento (receitas pagas): R$ ${finance.billing.toFixed(2)}`,
          `A receber em aberto: R$ ${finance.openReceivables.toFixed(2)}`,
          `Inadimplência: R$ ${finance.overdueReceivables.toFixed(2)}`,
          `Despesas: R$ ${finance.expenses.toFixed(2)}`,
          `Receita recorrente mensal (contratos): R$ ${getRecurringMonthlyRevenue(dataset).toFixed(2)}`,
        ].join("\n")
      );
    case "compliance":
      return (
        header +
        [
          `Documentos com alerta: ${complianceAlerts.filter((a) => a.kind === "document").length}`,
          `Contratos com alerta: ${complianceAlerts.filter((a) => a.kind === "contract").length}`,
          `Licitações ativas: ${activeTenders.length}`,
          "",
          "Alertas:",
          ...complianceAlerts.slice(0, 8).map((alert) => `- ${alert.detail}`),
        ].join("\n")
      );
    default:
      return header;
  }
}

export function getDemoExportFilename(
  reportId: string,
  format: DemoExportFormat,
): string {
  const extension = format === "pdf" ? "pdf.demo.txt" : "xlsx.demo.txt";
  return `servsam-${reportId}-${extension}`;
}

export function triggerDemoExport(
  content: string,
  filename: string,
): { success: true; filename: string } {
  if (typeof window === "undefined") {
    return { success: true, filename };
  }

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);

  return { success: true, filename };
}
