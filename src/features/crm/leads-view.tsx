"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoPageHeader } from "@/features/crm/demo-page-header";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import {
  LEAD_STATUS_LABELS,
  filterLeadsByStatus,
  updateLeadStatus,
} from "@/lib/demo/crm-actions";
import type { LeadStatus } from "@/types/demo-entities";

const filters: Array<{ value: LeadStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "new", label: "Novos" },
  { value: "qualified", label: "Qualificados" },
  { value: "converted", label: "Convertidos" },
  { value: "discarded", label: "Descartados" },
];

export function LeadsView() {
  const { dataset, mutate } = useDemoDatasetStore();
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");

  const leads = useMemo(
    () => filterLeadsByStatus(dataset, statusFilter),
    [dataset, statusFilter],
  );

  function handleStatusChange(leadId: string, status: LeadStatus) {
    mutate((current) => updateLeadStatus(current, leadId, status));
  }

  return (
    <div className="space-y-6">
      <DemoPageHeader
        title="Leads"
        description="Lista demonstrativa de contatos comerciais. Qualifique ou descarte leads fictícios."
        backHref="/demonstracao/comercial"
        backLabel="Comercial"
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            type="button"
            size="sm"
            variant={statusFilter === filter.value ? "default" : "outline"}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {leads.map((lead) => (
          <Card key={lead.id}>
            <CardHeader>
              <CardTitle className="text-base">{lead.contactName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Empresa:</span>{" "}
                {lead.companyAlias}
              </p>
              <p>
                <span className="text-muted-foreground">Segmento:</span>{" "}
                {lead.segment}
              </p>
              <p>
                <span className="text-muted-foreground">Origem:</span> {lead.source}
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                {LEAD_STATUS_LABELS[lead.status]}
              </p>
              {lead.opportunityId ? (
                <Link
                  href={`/demonstracao/comercial/oportunidades/${lead.opportunityId}`}
                  className="inline-flex text-navy hover:text-teal"
                >
                  Ver oportunidade vinculada →
                </Link>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-2">
                {lead.status === "new" ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleStatusChange(lead.id, "qualified")}
                    >
                      Qualificar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(lead.id, "discarded")}
                    >
                      Descartar
                    </Button>
                  </>
                ) : null}
                {lead.status === "qualified" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(lead.id, "new")}
                  >
                    Reabrir como novo
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
