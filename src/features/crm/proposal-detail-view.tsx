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
  confirmPaymentSignal,
  getProposalItemsTotal,
  registerPaymentSignal,
  updateProposalStatus,
} from "@/lib/demo/crm-actions";
import {
  canIssueWorkOrderFromProposal,
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

  function registerSignal() {
    mutate((current) => registerPaymentSignal(current, proposalId));
  }

  function confirmSignal() {
    mutate((current) => confirmPaymentSignal(current, proposalId));
  }

  function issueWorkOrder() {
    mutate((current) => createWorkOrderFromProposal(current, proposalId));
  }

  const paymentSignal = proposal.paymentSignal;
  const issueCheck = canIssueWorkOrderFromProposal(dataset, proposalId);

  return (
    <div className="space-y-6">
      <DemoPageHeader
        title={`Orçamento ${proposal.code}`}
        description="Composição demonstrativa: aceite da contratação, solicitação financeira opcional e emissão da OS. Eventos simulados no navegador."
        backHref="/demonstracao/comercial/propostas"
        backLabel="Orçamentos"
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
              Fluxo principal: rascunho → enviado → aceito → (opcional) solicitação ao
              Financeiro → OS. O sinal não bloqueia universalmente a emissão da OS.
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
                Orçamento aceito — contratação liberada. Você pode emitir a OS agora. O sinal
                é recomendado quando aplicável (Comercial solicita; Financeiro confirma), sem
                ser pré-requisito universal. Agendamento é passo separado.
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
                  Enviar orçamento (simulado)
                </Button>
              ) : null}
              {proposal.status === "sent" ? (
                <>
                  <Button type="button" onClick={() => setStatus("accepted")}>
                    Aceitar orçamento
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStatus("rejected")}
                  >
                    Recusar orçamento
                  </Button>
                </>
              ) : null}
              {proposal.status === "rejected" ? (
                <Button type="button" variant="outline" onClick={() => setStatus("sent")}>
                  Reenviar orçamento
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

      {proposal.status === "accepted" || paymentSignal || linkedWorkOrder ? (
        <Card>
          <CardHeader>
            <CardTitle>Contratação, financeiro simulado e OS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Três eventos distintos (simulados): (1) aceite comercial; (2) Comercial solicita
              providência ao Financeiro; (3) Financeiro confirma recebimento. A OS depende do
              aceite — não da etapa 3.
            </p>
            {paymentSignal ? (
              <dl className="grid gap-2 md:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Status financeiro</dt>
                  <dd className="font-medium">
                    {paymentSignal.status === "confirmed"
                      ? "Recebimento confirmado (Financeiro)"
                      : "Solicitação pendente (Comercial)"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Valor solicitado</dt>
                  <dd className="font-medium">{formatCurrencyBrl(paymentSignal.amount)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Solicitado em</dt>
                  <dd>{paymentSignal.registeredAt.split("-").reverse().join("/")}</dd>
                </div>
                {paymentSignal.confirmedAt ? (
                  <div>
                    <dt className="text-muted-foreground">Confirmado em</dt>
                    <dd>{paymentSignal.confirmedAt.split("-").reverse().join("/")}</dd>
                  </div>
                ) : null}
                {paymentSignal.requestedByRole ? (
                  <div>
                    <dt className="text-muted-foreground">Solicitado por</dt>
                    <dd>Comercial (simulado)</dd>
                  </div>
                ) : null}
                {paymentSignal.confirmedByRole ? (
                  <div>
                    <dt className="text-muted-foreground">Confirmado por</dt>
                    <dd>Financeiro (simulado)</dd>
                  </div>
                ) : null}
                {paymentSignal.note ? (
                  <div className="md:col-span-2">
                    <dt className="text-muted-foreground">Observação</dt>
                    <dd>{paymentSignal.note}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p>
                Nenhum sinal solicitado. Você pode emitir a OS sem esta etapa ou solicitar
                providência ao Financeiro quando fizer sentido.
              </p>
            )}
            <p className="rounded-md bg-secondary px-3 py-2 text-muted-foreground">
              Sem cobrança bancária real, sem NF-e e sem RBAC persistente nesta demonstração.
              Valor sugerido não é percentual obrigatório.
            </p>
            {!linkedWorkOrder && !issueCheck.ok && issueCheck.reason ? (
              <p className="text-muted-foreground">{issueCheck.reason}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {proposal.status === "accepted" && !paymentSignal ? (
                <Button type="button" variant="outline" onClick={registerSignal}>
                  Comercial: solicitar ao Financeiro
                </Button>
              ) : null}
              {proposal.status === "accepted" && paymentSignal?.status === "pending" ? (
                <Button type="button" variant="outline" onClick={confirmSignal}>
                  Financeiro: confirmar recebimento
                </Button>
              ) : null}
              {!linkedWorkOrder ? (
                <Button type="button" onClick={issueWorkOrder} disabled={!issueCheck.ok}>
                  Emitir OS
                </Button>
              ) : (
                <Link
                  href={`/demonstracao/ordens-servico/${linkedWorkOrder.id}`}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-navy px-4 text-sm font-medium text-white hover:bg-navy/90"
                >
                  Abrir OS {linkedWorkOrder.code}
                </Link>
              )}
            </div>
            {linkedWorkOrder && !linkedWorkOrder.scheduledAt ? (
              <p className="text-muted-foreground">
                OS emitida e aguardando agendamento. O agendamento é feito na própria OS ou na
                Agenda.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {proposal.receivedPurchaseOrder ? (
        <Card>
          <CardHeader>
            <CardTitle>O.C. recebida (avulso)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Código:</span>{" "}
              {proposal.receivedPurchaseOrder.code}
            </p>
            <p>
              <span className="text-muted-foreground">Situação:</span>{" "}
              {proposal.receivedPurchaseOrder.statusLabel}
            </p>
            <p>
              <span className="text-muted-foreground">Recebida em:</span>{" "}
              {(
                proposal.receivedPurchaseOrder.receivedAt ??
                proposal.receivedPurchaseOrder.issuedAt
              )
                .split("-")
                .reverse()
                .join("/")}
            </p>
            <p>
              <span className="text-muted-foreground">Valor:</span>{" "}
              {formatCurrencyBrl(proposal.receivedPurchaseOrder.amount)}
            </p>
            <p className="text-muted-foreground">{proposal.receivedPurchaseOrder.note}</p>
            <Link
              href="/demonstracao/comercial/ordens-compra"
              className="inline-flex text-sm font-medium text-navy hover:text-teal"
            >
              Ver todas as O.C. recebidas →
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {proposal.formalization ? (
        <Card>
          <CardHeader>
            <CardTitle>Formalização da aprovação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Status:</span> {proposal.formalization.statusLabel}
            </p>
            <p>
              <span className="text-muted-foreground">Forma de formalização:</span>{" "}
              {proposal.formalization.kindLabel}
            </p>
            <p>
              <span className="text-muted-foreground">Documento:</span> {proposal.formalization.documentCode}
            </p>
            <p>
              <span className="text-muted-foreground">Data:</span>{" "}
              {proposal.formalization.receivedAt.split("-").reverse().join("/")}
            </p>
            <p className="text-muted-foreground">{proposal.formalization.note}</p>
            <p className="text-muted-foreground">
              Outras formas nesta demonstração: orçamento assinado, OS do cliente, OC, OCS ou outro. Ainda sem regra definitiva.
            </p>
            <p className="text-muted-foreground">
              Orçamento SERVSAM, O.C. recebida do cliente e OS de execução são documentos
              distintos. A O.C. também existe em serviços avulsos, não só em contratos
              periódicos.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setPreviewNote(
                  `Prévia DEMO de ${proposal.formalization?.documentCode}. Não é documento oficial.`,
                )
              }
            >
              Visualizar documento
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {proposal.narrative ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {(
            [
              ["Escopo técnico", proposal.narrative.technicalScope],
              ["Procedimentos previstos", proposal.narrative.procedures],
              ["Obrigações do contratante", proposal.narrative.contractorDuties],
              ["Condições específicas", proposal.narrative.specificConditions],
              ["Entregáveis incluídos", proposal.narrative.includedDeliverables],
            ] as const
          ).map(([title, lines]) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Responsável técnico</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {dataset.technicalResponsibles.find(
                (item) => item.id === proposal.narrative?.technicalResponsibleId,
              )?.name ?? "A definir conforme o serviço"}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
