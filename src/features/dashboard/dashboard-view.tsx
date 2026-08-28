import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoContentBanner } from "@/features/institutional/demo-content-banner";
import { formatCurrencyBrl } from "@/lib/utils/format";
import type { DashboardMetrics } from "@/types/demo";
import { formatPeriodLabel } from "@/lib/demo/metrics";

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
  const maxRevenue = Math.max(...metrics.revenueByMonth.map((item) => item.amount), 1);
  const maxCategory = Math.max(...metrics.salesByCategory.map((item) => item.amount), 1);
  const maxFunnel = Math.max(...metrics.funnel.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Indicadores derivados da massa demonstrativa de {metrics.periodLabel}.
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
        Os indicadores abaixo são fictícios e derivados exclusivamente da massa
        demonstrativa. Não representam faturamento, produtividade ou resultados
        reais da SERVSAM.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          title="Faturamento do mês"
          value={formatCurrencyBrl(metrics.billingMonth)}
        />
        <MetricCard title="Propostas em aberto" value={String(metrics.openProposals)} />
        <MetricCard title="Taxa de conversão" value={`${metrics.conversionRate}%`} />
        <MetricCard
          title="Serviços agendados"
          value={String(metrics.scheduledServices)}
        />
        <MetricCard
          title="Contratos a vencer"
          value={String(metrics.expiringContracts)}
        />
        <MetricCard
          title="Inadimplência"
          value={formatCurrencyBrl(metrics.delinquencyAmount)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receita por mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.revenueByMonth.map((item) => (
              <BarRow
                key={item.month}
                label={item.label}
                value={formatCurrencyBrl(item.amount)}
                ratio={item.amount / maxRevenue}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendas por categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.salesByCategory.map((item) => (
              <BarRow
                key={item.categoryId}
                label={item.categoryName}
                value={formatCurrencyBrl(item.amount)}
                ratio={item.amount / maxCategory}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Funil comercial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.funnel.map((stage) => (
              <BarRow
                key={stage.stage}
                label={stage.label}
                value={String(stage.count)}
                ratio={stage.count / maxFunnel}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtividade (fictícia)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {metrics.productivityRanking.map((item) => (
                <li
                  key={item.technicianAlias}
                  className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                >
                  <span>{item.technicianAlias}</span>
                  <span className="font-medium">
                    {item.completedOrders} OS concluídas
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

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

function BarRow({
  label,
  value,
  ratio,
}: {
  label: string;
  value: string;
  ratio: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium text-navy">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-teal"
          style={{ width: `${Math.max(ratio * 100, 4)}%` }}
        />
      </div>
    </div>
  );
}
