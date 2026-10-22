"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { ManagementPageHeader } from "@/features/management/management-page-header";
import { serviceCategories } from "@/data/official/services";
import {
  FINANCIAL_TYPE_LABELS,
  buildFinanceSummary,
  filterFinancialTransactions,
  getFinancePeriodKeys,
} from "@/lib/demo/management-actions";
import { DEMO_REFERENCE_DATE, daysUntil } from "@/lib/demo/compliance-actions";
import { formatCurrencyBrl } from "@/lib/utils/format";
import type { DemoFinancialTransaction, FinancialTransactionType } from "@/types/demo-entities";

export function FinanceView() {
  const { dataset } = useDemoDatasetStore();
  const periodKeys = useMemo(() => getFinancePeriodKeys(dataset), [dataset]);
  const [periodKey, setPeriodKey] = useState(periodKeys.at(-1) ?? "2026-08");
  const [clientId, setClientId] = useState<string | "all">("all");
  const [type, setType] = useState<FinancialTransactionType | "all">("all");
  const [categoryId, setCategoryId] = useState<
    "water-sanitation" | "environmental-pest" | "all"
  >("all");

  const filters = { periodKey, clientId, type, categoryId };
  const summary = buildFinanceSummary(dataset, filters);
  const transactions = filterFinancialTransactions(dataset, filters).sort((left, right) =>
    right.dueDate.localeCompare(left.dueDate),
  );

  const categoryName = (id: string) =>
    serviceCategories.find((item) => item.id === id)?.name ?? id;

  const openHorizon = dataset.financialTransactions.filter(
    (item) => !item.paidAt && item.billingStatus !== "negotiated" && item.type !== "expense",
  );
  const dueWithin = (days: number) =>
    openHorizon
      .filter((item) => {
        const remaining = daysUntil(item.dueDate, DEMO_REFERENCE_DATE);
        return remaining >= 0 && remaining <= days;
      })
      .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      <ManagementPageHeader
        title="Financeiro gerencial"
        description="Contratos, recebíveis, parcelas e situação. Visão de 30, 60 e 90 dias a partir de 28/08/2026. Não é contabilidade nem cobrança real."
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Período</span>
            <select
              value={periodKey}
              onChange={(event) => setPeriodKey(event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3"
            >
              {periodKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Cliente</span>
            <select
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3"
            >
              <option value="all">Todos</option>
              {dataset.clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.alias}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Tipo</span>
            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as FinancialTransactionType | "all")
              }
              className="h-10 w-full rounded-md border border-border bg-background px-3"
            >
              <option value="all">Todos</option>
              <option value="revenue">Receita</option>
              <option value="receivable">A receber</option>
              <option value="expense">Despesa</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Serviço</span>
            <select
              value={categoryId}
              onChange={(event) =>
                setCategoryId(
                  event.target.value as "water-sanitation" | "environmental-pest" | "all",
                )
              }
              className="h-10 w-full rounded-md border border-border bg-background px-3"
            >
              <option value="all">Todos</option>
              {serviceCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">
              {formatCurrencyBrl(summary.billing)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Em aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">
              {formatCurrencyBrl(summary.openReceivables)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inadimplência</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">
              {formatCurrencyBrl(summary.overdueReceivables)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">
              {formatCurrencyBrl(summary.expenses)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Até 30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">{formatCurrencyBrl(dueWithin(30))}</p>
            <p className="mt-1 text-sm text-muted-foreground">Em aberto, com vencimento na janela.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Até 60 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">{formatCurrencyBrl(dueWithin(60))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Até 90 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-navy">{formatCurrencyBrl(dueWithin(90))}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{summary.transactionCount} lançamentos no filtro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Descrição</th>
                  <th className="py-2 pr-4 font-medium">Cliente</th>
                  <th className="py-2 pr-4 font-medium">Tipo</th>
                  <th className="py-2 pr-4 font-medium">Serviço</th>
                  <th className="py-2 pr-4 font-medium">Vencimento</th>
                  <th className="py-2 pr-4 font-medium">Situação</th>
                  <th className="py-2 pr-4 font-medium">Valor</th>
                  <th className="py-2 font-medium">Vínculos</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const client = dataset.clients.find(
                    (item) => item.id === transaction.clientId,
                  );
                  return (
                    <tr key={transaction.id} className="border-b border-border/70">
                      <td className="py-3 pr-4">{transaction.description}{transaction.installmentLabel ? ` · ${transaction.installmentLabel}` : ""}</td>
                      <td className="py-3 pr-4">{client?.alias ?? "—"}</td>
                      <td className="py-3 pr-4">
                        {FINANCIAL_TYPE_LABELS[transaction.type]}
                        {transaction.paidAt ? " · pago" : ""}
                      </td>
                      <td className="py-3 pr-4">
                        {categoryName(transaction.categoryId)}
                      </td>
                      <td className="py-3 pr-4">{transaction.dueDate}</td>
                      <td className="py-3 pr-4">{billingSituation(transaction)}</td>
                      <td className="py-3 pr-4">
                        {formatCurrencyBrl(transaction.amount)}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1">
                          {transaction.contractId ? (
                            <Link
                              href={`/demonstracao/contratos/${transaction.contractId}`}
                              className="text-navy hover:text-teal"
                            >
                              Contrato
                            </Link>
                          ) : null}
                          {transaction.workOrderId ? (
                            <Link
                              href={`/demonstracao/ordens-servico/${transaction.workOrderId}`}
                              className="text-navy hover:text-teal"
                            >
                              OS
                            </Link>
                          ) : null}
                          {!transaction.contractId && !transaction.workOrderId ? "—" : null}
                        </div>
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

function billingSituation(transaction: DemoFinancialTransaction): string {
  if (transaction.billingStatus === "negotiated") return "Negociado";
  if (transaction.paidAt) return "Pago";
  if (daysUntil(transaction.dueDate, DEMO_REFERENCE_DATE) < 0) return "Vencido";
  return "Em aberto";
}
