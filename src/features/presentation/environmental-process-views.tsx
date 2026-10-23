"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { PresentationPageHeader } from "@/features/presentation/presentation-page-header";
import type { DemoEnvironmentalProcessStatus } from "@/types/demo-entities";

const STATUS_LABEL: Record<DemoEnvironmentalProcessStatus, string> = {
  "documents-pending": "Documentação pendente",
  preparing: "Em preparação",
  filed: "Protocolado",
  "under-review": "Em análise",
  "pending-issue": "Pendência",
  completed: "Concluído",
};

export function EnvironmentalProcessListView() {
  const { dataset } = useDemoDatasetStore();

  return (
    <div className="space-y-6">
      <PresentationPageHeader
        title="Processos ambientais (DEMO)"
        description="Estrutura proposta para validação do cliente. Ainda não está confirmado que Processos significa outorga."
      />
      <ul className="space-y-3">
        {dataset.environmentalProcesses.map((process) => {
          const client = dataset.clients.find((item) => item.id === process.clientId);
          return (
            <li key={process.id}>
              <Link href={`/demonstracao/processos/${process.id}`} className="block rounded-lg border border-border bg-card p-4 hover:border-teal">
                <p className="font-medium text-navy">{process.title}</p>
                <p className="text-sm text-muted-foreground">
                  {client?.alias} · {STATUS_LABEL[process.status]}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function EnvironmentalProcessDetailView({ processId }: { processId: string }) {
  const { dataset } = useDemoDatasetStore();
  const process = dataset.environmentalProcesses.find((item) => item.id === processId);
  if (!process) notFound();
  const client = dataset.clients.find((item) => item.id === process.clientId);
  const responsible = dataset.technicalResponsibles.find(
    (item) => item.id === process.technicalResponsibleId,
  );

  return (
    <div className="space-y-6">
      <PresentationPageHeader
        title={process.code}
        description="Estrutura proposta para validação do cliente. Não é um processo protocolado."
        backHref="/demonstracao/processos"
        backLabel="Processos ambientais"
      />
      <Card>
        <CardHeader>
          <CardTitle>{process.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Cliente:</span> {client?.alias}</p>
          <p><span className="text-muted-foreground">Poço/unidade:</span> {process.unit}</p>
          <p><span className="text-muted-foreground">Responsável técnico:</span> {responsible?.name}</p>
          <p><span className="text-muted-foreground">Órgão:</span> {process.organ}</p>
          <p><span className="text-muted-foreground">Status:</span> {STATUS_LABEL[process.status]}</p>
          <p>{process.notes}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Checklist documental</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {process.checklist.map((item) => (
              <li key={item.id}>{item.checked ? "Pronto" : "Pendente"} · {item.label}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
