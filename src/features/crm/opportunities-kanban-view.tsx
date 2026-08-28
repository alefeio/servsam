"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoPageHeader } from "@/features/crm/demo-page-header";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import {
  KANBAN_STAGES,
  OPPORTUNITY_STAGE_LABELS,
  advanceOpportunityStage,
  markOpportunityLost,
  markOpportunityWon,
} from "@/lib/demo/crm-actions";
import { formatCurrencyBrl } from "@/lib/utils/format";
import type { OpportunityStage } from "@/types/demo-entities";

function clientAlias(dataset: ReturnType<typeof useDemoDatasetStore>["dataset"], clientId: string) {
  return dataset.clients.find((client) => client.id === clientId)?.alias ?? clientId;
}

export function OpportunitiesKanbanView() {
  const { dataset, mutate } = useDemoDatasetStore();

  function opportunitiesByStage(stage: OpportunityStage) {
    return dataset.opportunities.filter((item) => item.stage === stage);
  }

  const closed = dataset.opportunities.filter(
    (item) => item.stage === "closed_won" || item.stage === "closed_lost",
  );

  return (
    <div className="space-y-6">
      <DemoPageHeader
        title="Oportunidades"
        description="Kanban comercial demonstrativo. Avance etapas ou marque ganho/perda de forma simulada."
        backHref="/demonstracao/comercial"
        backLabel="Comercial"
      />

      <div className="grid gap-4 xl:grid-cols-4">
        {KANBAN_STAGES.map((stage) => (
          <Card key={stage}>
            <CardHeader>
              <CardTitle className="text-sm">
                {OPPORTUNITY_STAGE_LABELS[stage]} ({opportunitiesByStage(stage).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {opportunitiesByStage(stage).map((opportunity) => (
                <article
                  key={opportunity.id}
                  className="rounded-lg border border-border p-3 text-sm"
                >
                  <Link
                    href={`/demonstracao/comercial/oportunidades/${opportunity.id}`}
                    className="font-medium text-navy hover:text-teal"
                  >
                    {opportunity.title}
                  </Link>
                  <p className="mt-1 text-muted-foreground">
                    {clientAlias(dataset, opportunity.clientId)}
                  </p>
                  <p className="mt-1 font-medium">
                    {formatCurrencyBrl(opportunity.estimatedValue)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        mutate((current) =>
                          advanceOpportunityStage(current, opportunity.id),
                        )
                      }
                    >
                      Avançar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        mutate((current) => markOpportunityWon(current, opportunity.id))
                      }
                    >
                      Ganhar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        mutate((current) => markOpportunityLost(current, opportunity.id))
                      }
                    >
                      Perder
                    </Button>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {closed.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Encerradas ({closed.length})</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {closed.map((opportunity) => (
              <article
                key={opportunity.id}
                className="rounded-lg border border-border p-3 text-sm"
              >
                <Link
                  href={`/demonstracao/comercial/oportunidades/${opportunity.id}`}
                  className="font-medium text-navy hover:text-teal"
                >
                  {opportunity.title}
                </Link>
                <p className="mt-1 text-muted-foreground">
                  {OPPORTUNITY_STAGE_LABELS[opportunity.stage]} ·{" "}
                  {clientAlias(dataset, opportunity.clientId)}
                </p>
              </article>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
