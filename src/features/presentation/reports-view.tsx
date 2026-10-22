"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { PresentationPageHeader } from "@/features/presentation/presentation-page-header";
import {
  DEMO_REPORT_DEFINITIONS,
  buildReportContent,
  getDemoExportFilename,
  triggerDemoExport,
} from "@/lib/demo/report-actions";
import { formatPeriodLabel, getAvailablePeriods } from "@/lib/demo/metrics";
import type { DemoExportFormat } from "@/lib/demo/report-actions";

export function ReportsView() {
  const { dataset } = useDemoDatasetStore();
  const periods = getAvailablePeriods(dataset);
  const [periodKey, setPeriodKey] = useState(periods.at(-1) ?? "2026-08");
  const [lastExport, setLastExport] = useState<string | null>(null);

  function handleExport(reportId: string, format: DemoExportFormat) {
    const content = buildReportContent(dataset, reportId, periodKey);
    const filename = getDemoExportFilename(reportId, format);
    triggerDemoExport(content, filename);
    setLastExport(
      `Exportação demonstrativa (${format.toUpperCase()}) salva como ${filename}`,
    );
  }

  return (
    <div className="space-y-6">
      <PresentationPageHeader
        title="Relatórios"
        description="Indicadores finais derivados da massa demonstrativa, com exportações claramente identificadas como fictícias."
      />

      <p className="text-sm text-muted-foreground">
        Os indicadores abaixo não são o relatório de campo.{" "}
        <Link href="/demonstracao/relatorios/fotograficos" className="font-medium text-navy hover:text-teal">
          Abrir relatórios fotográficos
        </Link>
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Período de referência</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex max-w-xs flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Período</span>
            <select
              value={periodKey}
              onChange={(event) => setPeriodKey(event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3"
            >
              {periods.map((period) => (
                <option key={period} value={period}>
                  {formatPeriodLabel(period)}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      {lastExport ? (
        <p role="status" className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
          {lastExport}. O arquivo é texto com extensão demonstrativa — não é PDF/Excel real.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {DEMO_REPORT_DEFINITIONS.map((report) => {
          const preview = buildReportContent(dataset, report.id, periodKey)
            .split("\n")
            .slice(4, 10)
            .join("\n");

          return (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle className="text-base">{report.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{report.description}</p>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                  {preview}
                </pre>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleExport(report.id, "pdf")}
                  >
                    Exportar PDF (demo)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport(report.id, "excel")}
                  >
                    Exportar Excel (demo)
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
