"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { PresentationPageHeader } from "@/features/presentation/presentation-page-header";

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
        description="Até seis fotos por página, como no modelo informado. Layout demonstrativo, pendente de validação."
        backHref="/demonstracao/relatorios/fotograficos"
        backLabel="Relatórios fotográficos"
      />
      <article className="space-y-4 rounded-xl border border-border bg-white p-6 text-sm shadow-sm">
        <p className="text-center text-xs tracking-[0.18em] text-teal uppercase">SERVSAM · prévia demonstrativa</p>
        <h2 className="text-xl font-semibold text-navy">Relatório fotográfico</h2>
        <p><span className="text-muted-foreground">Cliente:</span> {client?.alias}</p>
        <p><span className="text-muted-foreground">OS:</span> {workOrder?.code} · {workOrder?.serviceName}</p>
        <p>{report.technicalDescription}</p>
        <p><span className="text-muted-foreground">Antes:</span> {report.beforeCondition}</p>
        <p><span className="text-muted-foreground">Depois:</span> {report.afterCondition}</p>
        <p><span className="text-muted-foreground">NR-33:</span> {report.nr33}</p>
        <p><span className="text-muted-foreground">NR-35:</span> {report.nr35}</p>
        <p>{report.observations}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.photoSrcs.slice(0, 6).map((src, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt={`Foto demonstrativa ${index + 1}`} className="h-36 w-full rounded-md object-cover" />
          ))}
        </div>
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
