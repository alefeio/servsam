"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoPageHeader } from "@/features/crm/demo-page-header";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import {
  OPPORTUNITY_STAGE_LABELS,
  PROPOSAL_STATUS_LABELS,
  advanceOpportunityStage,
  markOpportunityLost,
  markOpportunityWon,
  reopenOpportunity,
} from "@/lib/demo/crm-actions";
import { formatCurrencyBrl } from "@/lib/utils/format";

type OpportunityDetailViewProps = {
  opportunityId: string;
};

export function OpportunityDetailView({ opportunityId }: OpportunityDetailViewProps) {
  const { dataset, mutate } = useDemoDatasetStore();
  const opportunity = dataset.opportunities.find((item) => item.id === opportunityId);

  if (!opportunity) {
    notFound();
  }

  const client = dataset.clients.find((item) => item.id === opportunity.clientId);
  const proposals = dataset.proposals.filter(
    (item) => item.opportunityId === opportunityId,
  );
  const isClosed =
    opportunity.stage === "closed_won" || opportunity.stage === "closed_lost";

  return (
    <div className="space-y-6">
      <DemoPageHeader
        title={opportunity.title}
        description="Ficha demonstrativa da oportunidade com propostas vinculadas e ações simuladas."
        backHref="/demonstracao/comercial/oportunidades"
        backLabel="Oportunidades"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Cliente:</span>{" "}
              {client ? (
                <Link
                  href={`/demonstracao/clientes/${client.id}`}
                  className="text-navy hover:text-teal"
                >
                  {client.alias}
                </Link>
              ) : (
                opportunity.clientId
              )}
            </p>
            <p>
              <span className="text-muted-foreground">Estágio:</span>{" "}
              {OPPORTUNITY_STAGE_LABELS[opportunity.stage]}
            </p>
            <p>
              <span className="text-muted-foreground">Valor estimado:</span>{" "}
              {formatCurrencyBrl(opportunity.estimatedValue)}
            </p>
            <p>
              <span className="text-muted-foreground">Criada em:</span>{" "}
              {opportunity.createdAt}
            </p>
            <p>
              <span className="text-muted-foreground">Atualizada em:</span>{" "}
              {opportunity.updatedAt}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações simuladas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {!isClosed ? (
              <>
                <Button
                  type="button"
                  onClick={() =>
                    mutate((current) =>
                      advanceOpportunityStage(current, opportunity.id),
                    )
                  }
                >
                  Avançar etapa
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    mutate((current) => markOpportunityWon(current, opportunity.id))
                  }
                >
                  Marcar como ganha
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    mutate((current) => markOpportunityLost(current, opportunity.id))
                  }
                >
                  Marcar como perdida
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  mutate((current) => reopenOpportunity(current, opportunity.id))
                }
              >
                Reabrir negociação
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Propostas vinculadas</CardTitle>
        </CardHeader>
        <CardContent>
          {proposals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma proposta demonstrativa vinculada a esta oportunidade.
            </p>
          ) : (
            <ul className="space-y-3">
              {proposals.map((proposal) => (
                <li
                  key={proposal.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
                >
                  <div>
                    <Link
                      href={`/demonstracao/comercial/propostas/${proposal.id}`}
                      className="font-medium text-navy hover:text-teal"
                    >
                      {proposal.code}
                    </Link>
                    <p className="text-muted-foreground">
                      {PROPOSAL_STATUS_LABELS[proposal.status]} ·{" "}
                      {formatCurrencyBrl(proposal.value)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
