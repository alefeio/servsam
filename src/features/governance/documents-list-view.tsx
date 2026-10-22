"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { GovernancePageHeader } from "@/features/governance/governance-page-header";
import {
  buildComplianceAlerts,
  countAlertsByTier,
  daysUntil,
  filterDocumentsByAlertTier,
  getDocumentAlertTier,
} from "@/lib/demo/compliance-actions";
import type { ExpiryAlertTier } from "@/lib/demo/compliance-actions";

type DocumentFilter = ExpiryAlertTier | "all" | "expired";

const TIER_FILTERS: Array<{ value: DocumentFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: 90, label: "90 dias" },
  { value: 60, label: "60 dias" },
  { value: 30, label: "30 dias" },
  { value: "expired", label: "Vencidos" },
];

function tierBadgeClass(tier: ReturnType<typeof getDocumentAlertTier>): string {
  if (tier === "expired") {
    return "bg-destructive/15 text-destructive";
  }
  if (tier === 30) {
    return "bg-destructive/10 text-destructive";
  }
  if (tier === 60) {
    return "bg-amber-100 text-amber-900";
  }
  if (tier === 90) {
    return "bg-secondary text-navy";
  }
  return "bg-muted text-muted-foreground";
}

export function DocumentsListView() {
  const { dataset } = useDemoDatasetStore();
  const [tierFilter, setTierFilter] = useState<DocumentFilter>("all");

  const documents = filterDocumentsByAlertTier(dataset, tierFilter).sort((left, right) =>
    left.expiresAt.localeCompare(right.expiresAt),
  );
  const alertCounts = countAlertsByTier(dataset);
  const complianceAlerts = buildComplianceAlerts(dataset).slice(0, 6);

  return (
    <div className="space-y-6">
      <GovernancePageHeader
        title="Documentos e compliance"
        description="Repositório visual de propostas, OS, relatórios, certificados, contratos, notificações, licenças e documentação técnica. Alertas de 90, 60 e 30 dias continuam derivados das datas fictícias."
        backHref="/demonstracao/contratos"
        backLabel="Contratos"
      />

      <Card>
        <CardHeader>
          <CardTitle>Onde cada peça aparece</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <Link href="/demonstracao/comercial/propostas" className="text-navy hover:text-teal">Propostas</Link>
          <Link href="/demonstracao/ordens-servico" className="text-navy hover:text-teal">Ordens de serviço</Link>
          <Link href="/demonstracao/relatorios/fotograficos" className="text-navy hover:text-teal">Relatórios fotográficos</Link>
          <Link href="/demonstracao/certificados" className="text-navy hover:text-teal">Certificados</Link>
          <Link href="/demonstracao/contratos" className="text-navy hover:text-teal">Contratos</Link>
          <Link href="/demonstracao/colaboradores" className="text-navy hover:text-teal">ASO, NR-33 e NR-35</Link>
          <Link href="/demonstracao/estoque" className="text-navy hover:text-teal">Fichas e FISPQ de produtos</Link>
          <Link href="/demonstracao/clientes/client-hotel-amazonas" className="text-navy hover:text-teal">Histórico do cliente-guia</Link>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">90 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">{alertCounts.tier90}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">60 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">{alertCounts.tier60}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">{alertCounts.tier30}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">{alertCounts.expired}</p>
          </CardContent>
        </Card>
      </div>

      {complianceAlerts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Alertas prioritários</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {complianceAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border/70 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-muted-foreground">{alert.detail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${tierBadgeClass(alert.tier)}`}
                  >
                    {alert.tier === "expired" ? "Vencido" : `${alert.tier}d`}
                  </span>
                  {alert.kind === "document" ? (
                    <Link
                      href={`/demonstracao/documentos/${alert.entityId}`}
                      className="text-navy hover:text-teal"
                    >
                      Abrir
                    </Link>
                  ) : (
                    <Link
                      href={`/demonstracao/contratos/${alert.entityId}`}
                      className="text-navy hover:text-teal"
                    >
                      Abrir
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {TIER_FILTERS.map((filter) => (
          <button
            key={String(filter.value)}
            type="button"
            onClick={() => setTierFilter(filter.value)}
            className={`rounded-full px-3 py-1 text-sm ${
              tierFilter === filter.value
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
          <CardTitle>{documents.length} documentos listados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Documento</th>
                  <th className="py-2 pr-4 font-medium">Tipo</th>
                  <th className="py-2 pr-4 font-medium">Cliente</th>
                  <th className="py-2 pr-4 font-medium">Responsável</th>
                  <th className="py-2 pr-4 font-medium">Validade</th>
                  <th className="py-2 pr-4 font-medium">Alerta</th>
                  <th className="py-2 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => {
                  const client = dataset.clients.find(
                    (item) => item.id === document.clientId,
                  );
                  const tier = getDocumentAlertTier(document.expiresAt);
                  const days = daysUntil(document.expiresAt);
                  return (
                    <tr key={document.id} className="border-b border-border/70">
                      <td className="py-3 pr-4 font-medium">{document.name}</td>
                      <td className="py-3 pr-4">{document.type}</td>
                      <td className="py-3 pr-4">{client?.alias ?? "—"}</td>
                      <td className="py-3 pr-4">{document.responsibleAlias}</td>
                      <td className="py-3 pr-4">{document.expiresAt}</td>
                      <td className="py-3 pr-4">
                        {tier ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${tierBadgeClass(tier)}`}
                          >
                            {tier === "expired"
                              ? "Vencido"
                              : `${tier}d (${days} dias)`}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/demonstracao/documentos/${document.id}`}
                          className="font-medium text-navy hover:text-teal"
                        >
                          Detalhe
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
