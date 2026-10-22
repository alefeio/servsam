"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoPageHeader } from "@/features/crm/demo-page-header";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import {
  PROPOSAL_STATUS_LABELS,
  getProposalItemsTotal,
  updateProposalStatus,
} from "@/lib/demo/crm-actions";
import {
  createWorkOrderFromProposal,
  getWorkOrderByProposalId,
} from "@/lib/demo/operations-actions";
import { formatCurrencyBrl } from "@/lib/utils/format";
import type { ProposalStatus } from "@/types/demo-entities";

type ProposalDetailViewProps = {
  proposalId: string;
};

export function ProposalDetailView({ proposalId }: ProposalDetailViewProps) {
  const { dataset, mutate } = useDemoDatasetStore();
  const [previewNote, setPreviewNote] = useState<string | null>(null);
  const proposal = dataset.proposals.find((item) => item.id === proposalId);

  if (!proposal) {
    notFound();
  }

  const client = dataset.clients.find((item) => item.id === proposal.clientId);
  const opportunity = dataset.opportunities.find(
    (item) => item.id === proposal.opportunityId,
  );
  const items = dataset.proposalItems.filter((item) => item.proposalId === proposalId);
  const itemsTotal = getProposalItemsTotal(dataset, proposalId);
  const linkedWorkOrder = getWorkOrderByProposalId(dataset, proposalId);

  function setStatus(status: ProposalStatus) {
    mutate((current) => updateProposalStatus(current, proposalId, status));
  }

  function generateWorkOrder() {
    mutate((current) =>
      createWorkOrderFromProposal(
        current,
        proposalId,
        "2026-09-10T09:00:00",
      ),
    );
  }

  return (
    <div className="space-y-6">
      <DemoPageHeader
        title={`Proposta ${proposal.code}`}
        description="Composição demonstrativa com itens, quantidades e ações comerciais simuladas."
        backHref="/demonstracao/comercial/propostas"
        backLabel="Propostas"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Descrição</th>
                    <th className="py-2 pr-4 font-medium">Qtd.</th>
                    <th className="py-2 pr-4 font-medium">Unitário</th>
                    <th className="py-2 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border/70">
                      <td className="py-3 pr-4">{item.description}</td>
                      <td className="py-3 pr-4">{item.quantity}</td>
                      <td className="py-3 pr-4">
                        {formatCurrencyBrl(item.unitPrice)}
                      </td>
                      <td className="py-3">
                        {formatCurrencyBrl(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm">
              Total dos itens:{" "}
              <span className="font-semibold text-navy">
                {formatCurrencyBrl(itemsTotal)}
              </span>
              {proposal.discountAmount ? (
                <span className="text-muted-foreground">
                  {" "}
                  · desconto {formatCurrencyBrl(proposal.discountAmount)}
                </span>
              ) : null}
            </p>
            {proposal.paymentTerms ? (
              <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Pagamento</dt>
                  <dd>{proposal.paymentTerms}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Entrada</dt>
                  <dd>{proposal.downPayment}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Prazo de execução</dt>
                  <dd>{proposal.executionDeadline}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Taxa de cancelamento</dt>
                  <dd>{proposal.cancellationFee}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-muted-foreground">Condições</dt>
                  <dd>{proposal.commercialConditions}</dd>
                </div>
              </dl>
            ) : null}
            <p className="mt-4 rounded-md border border-dashed border-teal/50 px-3 py-6 text-center text-xs tracking-[0.2em] text-teal/80 uppercase">
              Marca d&apos;água demonstrativa — prévia, não é o PDF oficial
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() =>
                setPreviewNote("Prévia exibida nesta tela. Nenhum PDF oficial foi gerado.")
              }
            >
              Gerar prévia (demo)
            </Button>
            {previewNote ? <p className="mt-2 text-sm text-muted-foreground">{previewNote}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status e validade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Status:</span>{" "}
              {PROPOSAL_STATUS_LABELS[proposal.status]}
            </p>
            <p className="text-muted-foreground">
              Caminho principal: rascunho, enviada e aprovada. Recusada, expirada e cancelada também existem nesta demonstração.
            </p>
            <p>
              <span className="text-muted-foreground">Valor cadastrado:</span>{" "}
              {formatCurrencyBrl(proposal.value)}
            </p>
            {proposal.validUntil ? (
              <p>
                <span className="text-muted-foreground">Validade:</span>{" "}
                {proposal.validUntil}
              </p>
            ) : null}
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
            {proposal.observations ? (
              <p>
                <span className="text-muted-foreground">Observações:</span> {proposal.observations}
              </p>
            ) : null}
            {proposal.status === "accepted" ? (
              <p className="rounded-md bg-secondary px-3 py-2">
                Proposta aprovada. O próximo passo demonstrativo é o agendamento e a ordem de serviço.
              </p>
            ) : null}
            {opportunity ? (
              <p>
                <span className="text-muted-foreground">Oportunidade:</span>{" "}
                <Link
                  href={`/demonstracao/comercial/oportunidades/${opportunity.id}`}
                  className="text-navy hover:text-teal"
                >
                  {opportunity.title}
                </Link>
              </p>
            ) : null}
            <div className="flex flex-col gap-2 pt-2">
              {proposal.status === "draft" ? (
                <Button type="button" onClick={() => setStatus("sent")}>
                  Enviar proposta (simulado)
                </Button>
              ) : null}
              {proposal.status === "sent" ? (
                <>
                  <Button type="button" onClick={() => setStatus("accepted")}>
                    Aceitar proposta
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStatus("rejected")}
                  >
                    Recusar proposta
                  </Button>
                </>
              ) : null}
              {proposal.status === "rejected" ? (
                <Button type="button" variant="outline" onClick={() => setStatus("sent")}>
                  Reenviar proposta
                </Button>
              ) : null}
              {proposal.status === "accepted" && !linkedWorkOrder ? (
                <Button type="button" onClick={generateWorkOrder}>
                  Gerar OS a partir da proposta
                </Button>
              ) : null}
              {linkedWorkOrder ? (
                <Link
                  href={`/demonstracao/ordens-servico/${linkedWorkOrder.id}`}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-navy px-4 text-sm font-medium text-white hover:bg-navy/90"
                >
                  Abrir OS {linkedWorkOrder.code}
                </Link>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
