"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { ManagementPageHeader } from "@/features/management/management-page-header";
import {
  PUBLIC_TENDER_STAGE_LABELS,
  filterPublicTendersByStage,
  getCriticalTenderDates,
} from "@/lib/demo/management-actions";
import { formatCurrencyBrl } from "@/lib/utils/format";
import type { PublicTenderStage } from "@/types/demo-entities";

const STAGE_FILTERS: Array<{ value: PublicTenderStage | "all"; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "prospecting", label: "Prospecção" },
  { value: "documentation", label: "Documentação" },
  { value: "submitted", label: "Enviadas" },
  { value: "evaluation", label: "Julgamento" },
  { value: "won", label: "Vencedoras" },
  { value: "lost", label: "Perdidas" },
];

export function PublicTendersListView() {
  const { dataset } = useDemoDatasetStore();
  const [stageFilter, setStageFilter] = useState<PublicTenderStage | "all">("all");

  const tenders = filterPublicTendersByStage(dataset, stageFilter).sort((left, right) =>
    left.submissionDeadline.localeCompare(right.submissionDeadline),
  );
  const criticalDates = getCriticalTenderDates(dataset).slice(0, 4);

  return (
    <div className="space-y-6">
      <ManagementPageHeader
        title="Licitações"
        description="Oportunidades públicas fictícias com estágios, checklist documental e datas críticas."
      />

      {criticalDates.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Datas críticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {criticalDates.map(({ tender, daysToSubmission, daysToOpening }) => (
              <div
                key={tender.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{tender.code} · {tender.title}</p>
                  <p className="text-muted-foreground">
                    Entrega até {tender.submissionDeadline}
                    {daysToSubmission >= 0
                      ? ` (${daysToSubmission} dias)`
                      : " (prazo encerrado no demo)"}
                    {daysToOpening !== null && tender.openingDate
                      ? ` · Abertura ${tender.openingDate}`
                      : ""}
                  </p>
                </div>
                <Link
                  href={`/demonstracao/licitacoes/${tender.id}`}
                  className="font-medium text-navy hover:text-teal"
                >
                  Abrir
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {STAGE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStageFilter(filter.value)}
            className={`rounded-full px-3 py-1 text-sm ${
              stageFilter === filter.value
                ? "bg-navy text-white"
                : "bg-secondary text-muted-foreground hover:text-navy"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tenders.length} licitações listadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Código</th>
                  <th className="py-2 pr-4 font-medium">Objeto</th>
                  <th className="py-2 pr-4 font-medium">Órgão</th>
                  <th className="py-2 pr-4 font-medium">Estágio</th>
                  <th className="py-2 pr-4 font-medium">Entrega</th>
                  <th className="py-2 pr-4 font-medium">Valor est.</th>
                  <th className="py-2 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {tenders.map((tender) => (
                  <tr key={tender.id} className="border-b border-border/70">
                    <td className="py-3 pr-4 font-medium">{tender.code}</td>
                    <td className="py-3 pr-4">{tender.title}</td>
                    <td className="py-3 pr-4">{tender.organAlias}</td>
                    <td className="py-3 pr-4">
                      {PUBLIC_TENDER_STAGE_LABELS[tender.stage]}
                    </td>
                    <td className="py-3 pr-4">{tender.submissionDeadline}</td>
                    <td className="py-3 pr-4">
                      {formatCurrencyBrl(tender.estimatedValue)}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/demonstracao/licitacoes/${tender.id}`}
                        className="font-medium text-navy hover:text-teal"
                      >
                        Detalhe
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
