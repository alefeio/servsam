import { describe, expect, it } from "vitest";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import {
  DEMO_REPORT_DEFINITIONS,
  buildReportContent,
  getDemoExportFilename,
} from "@/lib/demo/report-actions";

describe("demo report actions", () => {
  it("defines five report types", () => {
    expect(DEMO_REPORT_DEFINITIONS).toHaveLength(5);
  });

  it("builds report content with disclaimer for each report", () => {
    for (const report of DEMO_REPORT_DEFINITIONS) {
      const content = buildReportContent(seedDemoDataset, report.id, "2026-08");
      expect(content).toContain("RELATÓRIO DEMONSTRATIVO");
      expect(content).toContain(report.title);
    }
  });

  it("uses demonstrative export filenames", () => {
    expect(getDemoExportFilename("report-executive", "pdf")).toContain(".demo.txt");
    expect(getDemoExportFilename("report-executive", "excel")).toContain(".demo.txt");
  });

  it("includes derived metrics in executive report", () => {
    const content = buildReportContent(seedDemoDataset, "report-executive", "2026-08");
    expect(content).toContain("Faturamento do mês");
    expect(content).toContain("Taxa de conversão");
  });
});
