"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { GovernancePageHeader } from "@/features/governance/governance-page-header";
import {
  CONTRACT_STATUS_LABELS,
  daysUntil,
  getDocumentAlertTier,
} from "@/lib/demo/compliance-actions";
import { formatCurrencyBrl } from "@/lib/utils/format";

type DocumentDetailViewProps = {
  documentId: string;
};

export function DocumentDetailView({ documentId }: DocumentDetailViewProps) {
  const { dataset } = useDemoDatasetStore();
  const document = dataset.documents.find((item) => item.id === documentId);

  if (!document) {
    notFound();
  }

  const client = dataset.clients.find((item) => item.id === document.clientId);
  const contract = document.contractId
    ? dataset.contracts.find((item) => item.id === document.contractId)
    : undefined;
  const relatedWorkOrders = contract
    ? dataset.workOrders.filter((item) => item.contractId === contract.id)
    : dataset.workOrders.filter((item) => item.clientId === document.clientId);

  const tier = getDocumentAlertTier(document.expiresAt);
  const days = daysUntil(document.expiresAt);

  return (
    <div className="space-y-6">
      <GovernancePageHeader
        title={document.name}
        description="Ficha demonstrativa de documento com responsável, validade e vínculos com cliente, contrato e OS."
        backHref="/demonstracao/documentos"
        backLabel="Documentos"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados do documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Tipo:</span> {document.type}
            </p>
            <p>
              <span className="text-muted-foreground">Responsável:</span>{" "}
              {document.responsibleAlias}
            </p>
            {document.issuedAt ? (
              <p>
                <span className="text-muted-foreground">Emitido em:</span>{" "}
                {document.issuedAt}
              </p>
            ) : null}
            <p>
              <span className="text-muted-foreground">Validade:</span>{" "}
              {document.expiresAt}
            </p>
            <p>
              <span className="text-muted-foreground">Alerta:</span>{" "}
              {tier
                ? tier === "expired"
                  ? "Documento vencido (demonstrativo)"
                  : `Faixa de ${tier} dias (${days} dias restantes)`
                : "Fora do horizonte de 90 dias"}
            </p>
            {client ? (
              <p>
                <span className="text-muted-foreground">Cliente:</span>{" "}
                <Link
                  href={`/demonstracao/clientes/${client.id}`}
                  className="text-navy hover:text-teal"
                >
                  {client.alias}
                </Link>
              </p>
            ) : null}
          </CardContent>
        </Card>

        {contract ? (
          <Card>
            <CardHeader>
              <CardTitle>Contrato vinculado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <Link
                  href={`/demonstracao/contratos/${contract.id}`}
                  className="font-medium text-navy hover:text-teal"
                >
                  {contract.code} · {contract.title}
                </Link>
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                {CONTRACT_STATUS_LABELS[contract.status]}
              </p>
              <p>
                <span className="text-muted-foreground">Vigência:</span>{" "}
                {contract.startDate} → {contract.endDate}
              </p>
              <p>
                <span className="text-muted-foreground">Valor mensal:</span>{" "}
                {formatCurrencyBrl(contract.monthlyValue)}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Contrato vinculado</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Documento avulso neste fixture — sem contrato associado.
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ordens de serviço relacionadas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {relatedWorkOrders.map((workOrder) => (
              <li key={workOrder.id}>
                <Link
                  href={`/demonstracao/ordens-servico/${workOrder.id}`}
                  className="text-navy hover:text-teal"
                >
                  {workOrder.code} · {workOrder.serviceName}
                </Link>
              </li>
            ))}
            {relatedWorkOrders.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma OS relacionada neste fixture.</p>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
