"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { OperationsPageHeader } from "@/features/operations/operations-page-header";

type ExecutionViewProps = {
  workOrderId: string;
};

export function ExecutionView({ workOrderId }: ExecutionViewProps) {
  const { dataset } = useDemoDatasetStore();
  const workOrder = dataset.workOrders.find((item) => item.id === workOrderId);
  if (!workOrder) notFound();

  const execution = dataset.serviceExecutions.find((item) => item.workOrderId === workOrderId);
  const client = dataset.clients.find((item) => item.id === workOrder.clientId);

  return (
    <div className="space-y-6">
      <OperationsPageHeader
        title={`Execução · ${workOrder.code}`}
        description="O que a equipe registra no serviço. O planejamento da OS fica na ficha anterior. Esta tela ainda não é o aplicativo de campo."
        backHref={`/demonstracao/ordens-servico/${workOrder.id}`}
        backLabel="Planejamento da OS"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Planejamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Serviço previsto: {workOrder.serviceName}</p>
            <p>Equipe prevista: {workOrder.teamAliases.join(", ")}</p>
            <p>Veículo: {workOrder.vehicleLabel ?? "Não escalado"}</p>
            <Link href={`/demonstracao/ordens-servico/${workOrder.id}`} className="font-medium text-navy hover:text-teal">
              Voltar ao planejamento
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>No local</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Cliente:</span> {client?.alias}</p>
            <p><span className="text-muted-foreground">Início:</span> {execution?.startedAt ?? "Ainda não iniciado neste fixture"}</p>
            <p><span className="text-muted-foreground">Conclusão:</span> {execution?.finishedAt ?? "Serviço ainda aberto nesta demonstração"}</p>
            <p><span className="text-muted-foreground">Equipe no local:</span> {workOrder.teamAliases.join(", ")}</p>
            <p><span className="text-muted-foreground">Responsável do cliente:</span> {execution?.clientResponsible ?? "—"}</p>
            <p><span className="text-muted-foreground">Aceite:</span> {execution?.acceptance ?? "Sem aceite registrado"}</p>
            <p><span className="text-muted-foreground">Assinatura:</span> área reservada na prévia, sem captura real.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checklist da execução</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {(execution?.checklist ?? workOrder.planningChecklist).map((item) => (
              <li key={item.id}>{item.checked ? "Feito" : "Pendente"} · {item.label}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos utilizados e evidências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ul>
            {(execution?.usedMaterials ?? workOrder.plannedMaterials).map((material) => {
              const product = dataset.products.find((item) => item.id === material.productId);
              return (
                <li key={material.productId}>
                  {material.quantity} {product?.unit ?? "UN"} · {product?.name ?? material.productId}
                </li>
              );
            })}
          </ul>
          <p>{execution?.observations ?? workOrder.notes ?? "Sem observação de execução."}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(execution?.photoSrcs ?? []).map((src) => (
              // Assets locais. O upload APIMG fica para depois da aprovação visual.
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="Evidência demonstrativa do serviço" className="h-40 w-full rounded-lg object-cover" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
