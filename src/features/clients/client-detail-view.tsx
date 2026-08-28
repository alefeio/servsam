"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoPageHeader } from "@/features/crm/demo-page-header";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { OPPORTUNITY_STAGE_LABELS, PROPOSAL_STATUS_LABELS } from "@/lib/demo/crm-actions";
import {
  CONTRACT_STATUS_LABELS,
  getClientDocuments,
} from "@/lib/demo/compliance-actions";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/demo/operations-actions";
import { formatCurrencyBrl } from "@/lib/utils/format";

type ClientDetailViewProps = {
  clientId: string;
};

export function ClientDetailView({ clientId }: ClientDetailViewProps) {
  const { dataset } = useDemoDatasetStore();
  const client = dataset.clients.find((item) => item.id === clientId);

  if (!client) {
    notFound();
  }

  const units = dataset.clientUnits.filter((unit) => unit.clientId === clientId);
  const opportunities = dataset.opportunities.filter(
    (item) => item.clientId === clientId,
  );
  const proposals = dataset.proposals.filter((item) => item.clientId === clientId);
  const contracts = dataset.contracts.filter((item) => item.clientId === clientId);
  const documents = getClientDocuments(dataset, clientId);
  const workOrders = dataset.workOrders.filter((item) => item.clientId === clientId);

  return (
    <div className="space-y-6">
      <DemoPageHeader
        title={client.alias}
        description="Ficha demonstrativa do cliente com unidades, oportunidades e contratos fictícios."
        backHref="/demonstracao/clientes"
        backLabel="Clientes"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Segmento:</span> {client.segment}
            </p>
            <p>
              <span className="text-muted-foreground">Cidade:</span> {client.city}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unidades ({units.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {units.map((unit) => (
                <li key={unit.id} className="rounded-lg border border-border p-3">
                  <p className="font-medium">{unit.name}</p>
                  <p className="text-muted-foreground">
                    {unit.address} · {unit.city}
                  </p>
                </li>
              ))}
              {units.length === 0 ? (
                <p className="text-muted-foreground">
                  Nenhuma unidade adicional cadastrada neste fixture.
                </p>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Oportunidades</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {opportunities.map((opportunity) => (
              <li key={opportunity.id}>
                <Link
                  href={`/demonstracao/comercial/oportunidades/${opportunity.id}`}
                  className="text-navy hover:text-teal"
                >
                  {opportunity.title}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  · {OPPORTUNITY_STAGE_LABELS[opportunity.stage]} ·{" "}
                  {formatCurrencyBrl(opportunity.estimatedValue)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Propostas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {proposals.map((proposal) => (
                <li key={proposal.id}>
                  <Link
                    href={`/demonstracao/comercial/propostas/${proposal.id}`}
                    className="text-navy hover:text-teal"
                  >
                    {proposal.code}
                  </Link>
                  <span className="text-muted-foreground">
                    {" "}
                    · {PROPOSAL_STATUS_LABELS[proposal.status]}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {contracts.map((contract) => (
                <li key={contract.id} className="rounded-lg border border-border p-3">
                  <Link
                    href={`/demonstracao/contratos/${contract.id}`}
                    className="font-medium text-navy hover:text-teal"
                  >
                    {contract.code} · {contract.title}
                  </Link>
                  <p className="text-muted-foreground">
                    {contract.startDate} → {contract.endDate} ·{" "}
                    {formatCurrencyBrl(contract.monthlyValue)}/mês ·{" "}
                    {CONTRACT_STATUS_LABELS[contract.status]}
                  </p>
                </li>
              ))}
              {contracts.length === 0 ? (
                <p className="text-muted-foreground">Sem contrato neste fixture.</p>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Documentos ({documents.length})</CardTitle>
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
                  </span>
                </li>
              ))}
              {documents.length === 0 ? (
                <p className="text-muted-foreground">Sem documentos neste fixture.</p>
              ) : null}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ordens de serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {workOrders.slice(0, 6).map((workOrder) => (
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
                <p className="text-muted-foreground">Sem OS neste fixture.</p>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
