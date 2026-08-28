"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { GovernancePageHeader } from "@/features/governance/governance-page-header";
import {
  CONTRACT_PERIODICITY_LABELS,
  CONTRACT_STATUS_LABELS,
  filterContractsByStatus,
  getRecurringAnnualProjection,
  getRecurringMonthlyRevenue,
} from "@/lib/demo/compliance-actions";
import { formatCurrencyBrl } from "@/lib/utils/format";
import type { ContractStatus } from "@/types/demo-entities";

const STATUS_FILTERS: Array<{ value: ContractStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "expiring", label: "A vencer" },
  { value: "expired", label: "Encerrados" },
];

export function ContractsListView() {
  const { dataset } = useDemoDatasetStore();
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">("all");

  const contracts = filterContractsByStatus(dataset, statusFilter).sort((left, right) =>
    left.endDate.localeCompare(right.endDate),
  );
  const monthlyRevenue = getRecurringMonthlyRevenue(dataset);
  const annualProjection = getRecurringAnnualProjection(dataset);

  return (
    <div className="space-y-6">
      <GovernancePageHeader
        title="Contratos"
        description="Recorrência, vigência, reajuste demonstrativo e cronograma previsto de atendimentos."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receita recorrente mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">
              {formatCurrencyBrl(monthlyRevenue)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Soma dos contratos ativos e a vencer (demonstrativo).
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Projeção anual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">
              {formatCurrencyBrl(annualProjection)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Estimativa linear a partir da base mensal fictícia.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-full px-3 py-1 text-sm ${
              statusFilter === filter.value
                ? "bg-navy text-white"
                : "bg-secondary text-muted-foreground hover:text-navy"
            }`}
          >
            {filter.label}
          </button>
        ))}
        <Link
          href="/demonstracao/documentos"
          className="ml-auto text-sm font-medium text-navy hover:text-teal"
        >
          Ver documentos e alertas →
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{contracts.length} contratos listados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Código</th>
                  <th className="py-2 pr-4 font-medium">Cliente</th>
                  <th className="py-2 pr-4 font-medium">Título</th>
                  <th className="py-2 pr-4 font-medium">Periodicidade</th>
                  <th className="py-2 pr-4 font-medium">Vigência</th>
                  <th className="py-2 pr-4 font-medium">Valor/mês</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => {
                  const client = dataset.clients.find(
                    (item) => item.id === contract.clientId,
                  );
                  return (
                    <tr key={contract.id} className="border-b border-border/70">
                      <td className="py-3 pr-4 font-medium">{contract.code}</td>
                      <td className="py-3 pr-4">{client?.alias ?? "—"}</td>
                      <td className="py-3 pr-4">{contract.title}</td>
                      <td className="py-3 pr-4">
                        {CONTRACT_PERIODICITY_LABELS[contract.periodicity]}
                      </td>
                      <td className="py-3 pr-4">
                        {contract.startDate} → {contract.endDate}
                      </td>
                      <td className="py-3 pr-4">
                        {formatCurrencyBrl(contract.monthlyValue)}
                      </td>
                      <td className="py-3 pr-4">
                        {CONTRACT_STATUS_LABELS[contract.status]}
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/demonstracao/contratos/${contract.id}`}
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
