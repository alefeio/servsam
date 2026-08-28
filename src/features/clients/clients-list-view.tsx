"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoPageHeader } from "@/features/crm/demo-page-header";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";

export function ClientsListView() {
  const { dataset } = useDemoDatasetStore();

  return (
    <div className="space-y-6">
      <DemoPageHeader
        title="Clientes"
        description="Cadastro demonstrativo de clientes fictícios com unidades e vínculos comerciais."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dataset.clients.map((client) => {
          const unitCount = dataset.clientUnits.filter(
            (unit) => unit.clientId === client.id,
          ).length;
          const openOpportunities = dataset.opportunities.filter(
            (item) =>
              item.clientId === client.id &&
              item.stage !== "closed_won" &&
              item.stage !== "closed_lost",
          ).length;

          return (
            <Card key={client.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  <Link
                    href={`/demonstracao/clientes/${client.id}`}
                    className="hover:text-teal"
                  >
                    {client.alias}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>{client.segment}</p>
                <p>{client.city}</p>
                <p>{unitCount} unidade(s) cadastrada(s)</p>
                <p>{openOpportunities} oportunidade(s) em aberto</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
