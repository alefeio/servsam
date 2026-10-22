import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoContentBanner } from "@/features/institutional/demo-content-banner";
import { formatCurrencyBrl } from "@/lib/utils/format";
import type { DashboardMetrics } from "@/types/demo";
import { formatPeriodLabel } from "@/lib/demo/metrics";
import Link from "next/link";

type DashboardViewProps = {
  metrics: DashboardMetrics;
  periods: string[];
  periodKey: string;
  onPeriodChange: (periodKey: string) => void;
};

export function DashboardView({
  metrics,
  periods,
  periodKey,
  onPeriodChange,
}: DashboardViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            O que precisa de atenção agora na operação demonstrativa. A data de
            referência desta massa é 28/08/2026.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Período</span>
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={periodKey}
              onChange={(event) => onPeriodChange(event.target.value)}
            >
              {periods.map((period) => (
                <option key={period} value={period}>
                  {formatPeriodLabel(period)}
                </option>
              ))}
            </select>
          </label>
          <DemoContentBanner />
        </div>
      </div>

      <p className="rounded-lg border border-teal/30 bg-secondary px-4 py-3 text-sm">
        Números fictícios, derivados da massa demonstrativa. Nada aqui é faturamento
        ou pendência real da SERVSAM.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Serviços de hoje" value={String(metrics.servicesToday)} />
        <MetricCard title="Serviços da semana" value={String(metrics.servicesThisWeek)} />
        <MetricCard title="OS abertas" value={String(metrics.scheduledServices)} />
        <MetricCard title="Propostas pendentes" value={String(metrics.openProposals)} />
        <MetricCard title="Certificados a emitir" value={String(metrics.certificatesToIssue)} />
        <MetricCard title="Contratos a vencer" value={String(metrics.expiringContracts)} />
        <MetricCard title="Financeiro em atraso" value={formatCurrencyBrl(metrics.delinquencyAmount)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas ações</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 md:grid-cols-2">
            {NEXT_ACTIONS.map((action) => (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className="block rounded-lg border border-border p-3 hover:border-teal"
                >
                  <p className="font-medium text-navy">{action.label}</p>
                  <p className="text-sm text-muted-foreground">{action.detail}</p>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximos serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {metrics.upcomingServices.map((item) => (
                <li key={item.id} className="rounded-lg border border-border p-3">
                  <p className="font-medium">{item.serviceName}</p>
                  <p className="text-sm text-muted-foreground">{item.clientAlias}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.scheduledFor}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {metrics.alerts.map((alert) => (
                <li key={alert.id} className="rounded-lg border border-border p-3">
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.detail}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-navy">{value}</p>
      </CardContent>
    </Card>
  );
}

const NEXT_ACTIONS = [
  {
    href: "/demonstracao/clientes/client-hotel-amazonas",
    label: "Abrir o Hotel Amazonas Plaza",
    detail: "Cliente-guia da apresentação, com proposta, OS, relatório e financeiro ligados.",
  },
  {
    href: "/demonstracao/ordens-servico/os-demo-04/execucao",
    label: "Confirmar o serviço de hoje",
    detail: "Execução em andamento na torre de hóspedes, veículo F2.",
  },
  {
    href: "/demonstracao/certificados/cert-hotel-001",
    label: "Revisar o atestado pendente",
    detail: "Prévia do certificado. O modelo oficial ainda depende de aprovação.",
  },
  {
    href: "/demonstracao/financeiro",
    label: "Cobrar a parcela em aberto",
    detail: "Parcela 2/2 da proposta DEMO-005 e uma renegociação demonstrativa.",
  },
  {
    href: "/demonstracao/colaboradores/emp-bruno",
    label: "Documento de colaborador vencendo",
    detail: "ASO vencido e NR-33 pendente no cadastro fictício de Bruno.",
  },
  {
    href: "/demonstracao/contratos",
    label: "Contratos próximos do vencimento",
    detail: "A lista de contratos mostra vigência, periodicidade e reajuste.",
  },
];
