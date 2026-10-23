"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { PresentationPageHeader } from "@/features/presentation/presentation-page-header";

function chunkPhotos(sources: string[], size: number): string[][] {
  const pages: string[][] = [];
  for (let index = 0; index < sources.length; index += size) {
    pages.push(sources.slice(index, index + size));
  }
  return pages;
}

export function PhotoReportsListView() {
  const { dataset } = useDemoDatasetStore();

  return (
    <div className="space-y-6">
      <PresentationPageHeader
        title="Relatórios fotográficos"
        description="Prévia do relatório técnico com fotos. O modelo oficial e o upload real ainda não existem."
      />
      <ul className="space-y-3">
        {dataset.photoReports.map((report) => {
          const client = dataset.clients.find((item) => item.id === report.clientId);
          return (
            <li key={report.id}>
              <Link href={`/demonstracao/relatorios/fotograficos/${report.id}`} className="block rounded-lg border border-border bg-card p-4 hover:border-teal">
                <p className="font-medium text-navy">{report.title}</p>
                <p className="text-sm text-muted-foreground">{client?.alias}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PhotoReportDetailView({ reportId }: { reportId: string }) {
  const { dataset } = useDemoDatasetStore();
  const report = dataset.photoReports.find((item) => item.id === reportId);
  if (!report) notFound();
  const client = dataset.clients.find((item) => item.id === report.clientId);
  const workOrder = dataset.workOrders.find((item) => item.id === report.workOrderId);

  return (
    <div className="space-y-6">
      <PresentationPageHeader
        title={report.title}
        description="Prévia com 4 fotos por página, padrão visual desta demonstração, pendente de validação do cliente."
        backHref="/demonstracao/relatorios/fotograficos"
        backLabel="Relatórios fotográficos"
      />
      <article className="space-y-4 rounded-xl border border-border bg-white p-6 text-sm shadow-sm">
        <p className="text-center text-xs tracking-[0.18em] text-teal uppercase">SERVSAM · prévia demonstrativa</p>
        <p className="text-center text-xs font-semibold tracking-wide text-amber-800 uppercase">
          PRÉVIA DEMONSTRATIVA — NÃO É DOCUMENTO OFICIAL
        </p>
        <h2 className="text-xl font-semibold text-navy">Relatório fotográfico</h2>
        {(report.sections ?? []).length > 0 ? (
          <ol className="grid gap-2 md:grid-cols-2">
            {report.sections?.map((section, index) => (
              <li key={section.title} className="rounded-md border border-border p-3">
                <p className="font-medium text-navy">{index + 1}. {section.title}</p>
                <p className="text-muted-foreground">{section.body}</p>
              </li>
            ))}
          </ol>
        ) : null}
        <p><span className="text-muted-foreground">Cliente:</span> {client?.alias}</p>
        <p><span className="text-muted-foreground">OS:</span> {workOrder?.code} · {workOrder?.serviceName}</p>
        <p>{report.technicalDescription}</p>
        <p><span className="text-muted-foreground">Antes:</span> {report.beforeCondition}</p>
        <p><span className="text-muted-foreground">Depois:</span> {report.afterCondition}</p>
        <p><span className="text-muted-foreground">NR-33:</span> {report.nr33}</p>
        <p><span className="text-muted-foreground">NR-35:</span> {report.nr35}</p>
        <p>{report.observations}</p>
        {chunkPhotos(report.photoSrcs, report.photosPerPage ?? 4).map((page, pageIndex) => (
          <div key={pageIndex} className="space-y-2">
            <p className="font-medium text-navy">
              Página {pageIndex + 1} · {pageIndex === 0 ? "ANTES" : "DEPOIS"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {page.map((src, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt={`${pageIndex === 0 ? "Antes" : "Depois"} ${index + 1}`}
                  className="h-36 w-full rounded-md object-cover"
                />
              ))}
            </div>
          </div>
        ))}
        <div className="grid gap-4 border-t border-border pt-4 md:grid-cols-2">
          <p>Responsável do cliente: {report.clientResponsible}<br />Assinatura: espaço reservado</p>
          <p>Responsável técnico: {report.technicalResponsible}<br />Assinatura: espaço reservado</p>
        </div>
      </article>
      <Card>
        <CardHeader>
          <CardTitle>O que esta prévia não é</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Não há PDF oficial, upload de foto nem relatório gravado no banco. As imagens são assets locais do site.
        </CardContent>
      </Card>
    </div>
  );
}
