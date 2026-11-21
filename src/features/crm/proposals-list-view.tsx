"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoPageHeader } from "@/features/crm/demo-page-header";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { PROPOSAL_STATUS_LABELS } from "@/lib/demo/crm-actions";
import { formatCurrencyBrl } from "@/lib/utils/format";

export function ProposalsListView() {
  const { dataset } = useDemoDatasetStore();

  return (
    <div className="space-y-6">
      <DemoPageHeader
        title="Orçamentos"
        description="Orçamentos demonstrativos com itens, validade e status. Abra a ficha para simular envio, aceite, solicitação financeira opcional e emissão da OS."
        backHref="/demonstracao/comercial"
        backLabel="Comercial"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {dataset.proposals.map((proposal) => {
          const client = dataset.clients.find((item) => item.id === proposal.clientId);
          return (
            <Card key={proposal.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  <Link
                    href={`/demonstracao/comercial/propostas/${proposal.id}`}
                    className="hover:text-teal"
                  >
                    {proposal.code}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>{client?.alias ?? proposal.clientId}</p>
                <p className="text-muted-foreground">
                  {PROPOSAL_STATUS_LABELS[proposal.status]}
                </p>
                <p className="font-medium">{formatCurrencyBrl(proposal.value)}</p>
                {proposal.validUntil ? (
                  <p className="text-muted-foreground">
                    Válida até {proposal.validUntil}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
