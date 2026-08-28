"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { GovernancePageHeader } from "@/features/governance/governance-page-header";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/demo/operations-actions";
import {
  CONTRACT_PERIODICITY_LABELS,
  CONTRACT_STATUS_LABELS,
  getContractDocuments,
  getContractRenewalAlertTier,
  getContractWorkOrders,
  getDocumentAlertTier,
} from "@/lib/demo/compliance-actions";
import { formatCurrencyBrl } from "@/lib/utils/format";

type ContractDetailViewProps = {
  contractId: string;
};

function formatAlertLabel(tier: ReturnType<typeof getContractRenewalAlertTier>): string {
  if (!tier) {
    return "Sem alerta no horizonte de 90 dias";
  }
  if (tier === "expired") {
    return "Vencido";
  }
  return `Alerta ${tier} dias`;
}

export function ContractDetailView({ contractId }: ContractDetailViewProps) {
  const { dataset } = useDemoDatasetStore();
  const contract = dataset.contracts.find((item) => item.id === contractId);

  if (!contract) {
    notFound();
  }

  const client = dataset.clients.find((item) => item.id === contract.clientId);
  const documents = getContractDocuments(dataset, contractId);
  const workOrders = getContractWorkOrders(dataset, contractId);
  const renewalTier = getContractRenewalAlertTier(contract.endDate);

  return (
    <div className="space-y-6">
      <GovernancePageHeader
        title={`${contract.code} · ${contract.title}`}
        description="Vigência, periodicidade, reajuste demonstrativo e cronograma previsto vinculado a OS fictícias."
        backHref="/demonstracao/contratos"
        backLabel="Contratos"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados do contrato</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Status:</span>{" "}
              {CONTRACT_STATUS_LABELS[contract.status]}
            </p>
            <p>
              <span className="text-muted-foreground">Periodicidade:</span>{" "}
              {CONTRACT_PERIODICITY_LABELS[contract.periodicity]}
            </p>
            <p>
              <span className="text-muted-foreground">Vigência:</span>{" "}
              {contract.startDate} → {contract.endDate}
            </p>
            <p>
              <span className="text-muted-foreground">Valor mensal:</span>{" "}
              {formatCurrencyBrl(contract.monthlyValue)}
            </p>
            <p>
              <span className="text-muted-foreground">Índice de reajuste:</span>{" "}
              {contract.adjustmentIndex}
            </p>
            {contract.nextAdjustmentDate ? (
              <p>
                <span className="text-muted-foreground">Próximo reajuste:</span>{" "}
                {contract.nextAdjustmentDate}
              </p>
            ) : null}
            <p>
              <span className="text-muted-foreground">Alerta de renovação:</span>{" "}
              {formatAlertLabel(renewalTier)}
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

        <Card>
          <CardHeader>
            <CardTitle>Documentos vinculados</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {documents.map((document) => (
                <li key={document.id}>
                  <Link
                    href={`/demonstracao/documentos/${document.id}`}
                    className="text-navy hover:text-teal"
                  >
                    {document.name}
                  </Link>
                  <span className="text-muted-foreground">
                    {" "}
                    · vence {document.expiresAt}
                    {getDocumentAlertTier(document.expiresAt)
                      ? ` · alerta ${getDocumentAlertTier(document.expiresAt)}d`
                      : ""}
                  </span>
                </li>
              ))}
              {documents.length === 0 ? (
                <p className="text-muted-foreground">Nenhum documento vinculado.</p>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cronograma previsto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Data prevista</th>
                  <th className="py-2 pr-4 font-medium">Serviço</th>
                  <th className="py-2 font-medium">OS vinculada</th>
                </tr>
              </thead>
              <tbody>
                {contract.scheduledVisits.map((visit) => (
                  <tr key={visit.id} className="border-b border-border/70">
                    <td className="py-3 pr-4">{visit.scheduledDate}</td>
                    <td className="py-3 pr-4">{visit.serviceName}</td>
                    <td className="py-3">
                      {visit.workOrderId ? (
                        <Link
                          href={`/demonstracao/ordens-servico/${visit.workOrderId}`}
                          className="text-navy hover:text-teal"
                        >
                          Abrir OS
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ordens de serviço do contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {workOrders.map((workOrder) => (
              <li key={workOrder.id}>
                <Link
                  href={`/demonstracao/ordens-servico/${workOrder.id}`}
                  className="text-navy hover:text-teal"
                >
                  {workOrder.code} · {workOrder.serviceName}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  · {WORK_ORDER_STATUS_LABELS[workOrder.status]}
                </span>
              </li>
            ))}
            {workOrders.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma OS vinculada neste fixture.</p>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
