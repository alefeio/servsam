"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { OperationsPageHeader } from "@/features/operations/operations-page-header";

const KIND_LABEL = {
  notice: "Informativo de serviço",
  "entry-authorization": "Autorização de entrada",
  awareness: "Declaração de ciência",
} as const;

export function PreServiceView({ workOrderId }: { workOrderId: string }) {
  const { dataset } = useDemoDatasetStore();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const workOrder = dataset.workOrders.find((item) => item.id === workOrderId);
  if (!workOrder) notFound();

  const documents = dataset.preServiceDocuments.filter((item) => item.workOrderId === workOrderId);

  return (
    <div className="space-y-6">
      <OperationsPageHeader
        title="Documentação pré-serviço"
        description="Comunicação anterior à execução. Cada botão gera uma prévia DEMO, não um documento oficial."
        backHref={`/demonstracao/ordens-servico/${workOrder.id}`}
        backLabel="Ordem de serviço"
      />
      {documents.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum documento nesta OS</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Esta família ainda não tem informativo, autorização ou declaração neste fixture. A tela existe para validar quando cada documento é obrigatório.
          </CardContent>
        </Card>
      ) : null}
      {documents.map((document) => (
        <Card key={document.id}>
          <CardHeader>
            <CardTitle>{KIND_LABEL[document.kind]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{document.summary}</p>
            <ul className="list-disc space-y-1 pl-5">
              {document.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <Button type="button" variant="outline" onClick={() => setPreviewId(document.id)}>
              Gerar prévia DEMO
            </Button>
            {previewId === document.id ? (
              <p className="rounded-md border border-dashed border-amber-600/50 p-3 text-amber-900">
                PRÉVIA DEMONSTRATIVA — NÃO É DOCUMENTO OFICIAL. {document.title}.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
