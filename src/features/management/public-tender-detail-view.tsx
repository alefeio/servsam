"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { ManagementPageHeader } from "@/features/management/management-page-header";
import {
  PUBLIC_TENDER_STAGE_LABELS,
  advanceTenderStage,
  toggleTenderChecklistItem,
} from "@/lib/demo/management-actions";
import { formatCurrencyBrl } from "@/lib/utils/format";

type PublicTenderDetailViewProps = {
  tenderId: string;
};

export function PublicTenderDetailView({ tenderId }: PublicTenderDetailViewProps) {
  const { dataset, mutate } = useDemoDatasetStore();
  const tender = dataset.publicTenders.find((item) => item.id === tenderId);

  if (!tender) {
    notFound();
  }

  const client = tender.clientId
    ? dataset.clients.find((item) => item.id === tender.clientId)
    : undefined;
  const proposal = tender.proposalId
    ? dataset.proposals.find((item) => item.id === tender.proposalId)
    : undefined;
  const checkedCount = tender.documentChecklist.filter((item) => item.checked).length;
  const canAdvance =
    tender.stage !== "won" && tender.stage !== "lost" && tender.stage !== "evaluation";

  return (
    <div className="space-y-6">
      <ManagementPageHeader
        title={`${tender.code} · ${tender.title}`}
        description="Checklist documental e estágios simulados para oportunidade pública fictícia."
        backHref="/demonstracao/licitacoes"
        backLabel="Licitações"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados da licitação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Órgão:</span> {tender.organAlias}
            </p>
            <p>
              <span className="text-muted-foreground">Estágio:</span>{" "}
              {PUBLIC_TENDER_STAGE_LABELS[tender.stage]}
            </p>
            <p>
              <span className="text-muted-foreground">Valor estimado:</span>{" "}
              {formatCurrencyBrl(tender.estimatedValue)}
            </p>
            <p>
              <span className="text-muted-foreground">Publicação:</span>{" "}
              {tender.publicationDate}
            </p>
            <p>
              <span className="text-muted-foreground">Entrega da proposta:</span>{" "}
              {tender.submissionDeadline}
            </p>
            {tender.openingDate ? (
              <p>
                <span className="text-muted-foreground">Abertura:</span>{" "}
                {tender.openingDate}
              </p>
            ) : null}
            {client ? (
              <p>
                <span className="text-muted-foreground">Cliente vinculado:</span>{" "}
                <Link
                  href={`/demonstracao/clientes/${client.id}`}
                  className="text-navy hover:text-teal"
                >
                  {client.alias}
                </Link>
              </p>
            ) : null}
            {proposal ? (
              <p>
                <span className="text-muted-foreground">Proposta vinculada:</span>{" "}
                <Link
                  href={`/demonstracao/comercial/propostas/${proposal.id}`}
                  className="text-navy hover:text-teal"
                >
                  {proposal.code}
                </Link>
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Checklist documental ({checkedCount}/{tender.documentChecklist.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              {tender.documentChecklist.map((item) => (
                <li key={item.id}>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      disabled={tender.stage === "won" || tender.stage === "lost"}
                      onChange={() =>
                        mutate((current) =>
                          toggleTenderChecklistItem(current, tenderId, item.id),
                        )
                      }
                    />
                    <span>{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            {canAdvance ? (
              <Button
                type="button"
                onClick={() => mutate((current) => advanceTenderStage(current, tenderId))}
              >
                Avançar estágio (simulado)
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
