import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoContentBanner } from "@/features/institutional/demo-content-banner";
import { formatPeriodLabel } from "@/lib/demo/metrics";
import { formatCurrencyBrl } from "@/lib/utils/format";
import type { DashboardMetrics, DashboardNextAction } from "@/types/demo";

type DashboardViewProps = {
  metrics: DashboardMetrics;
  periods: string[];
  periodKey: string;
  onPeriodChange: (periodKey: string) => void;
  roleLabel?: string;
};

const PRIORITY_LABEL: Record<DashboardNextAction["priority"], string> = {
  high: "Alta",
  medium: "Média",
  guide: "Roteiro",
};

export function DashboardView({
  metrics,
  periods,
  periodKey,
  onPeriodChange,
  roleLabel,
}: DashboardViewProps) {
  const priorityActions = metrics.nextActions.filter((action) => action.priority !== "guide");
  const guideActions = metrics.nextActions.filter((action) => action.priority === "guide");
  const alertIdsCovered = new Set(
    metrics.nextActions
      .map((action) => action.id.replace(/^action-/, ""))
      .filter((id) => id.startsWith("alert-")),
  );
  const remainingAlerts = metrics.alerts.filter((alert) => !alertIdsCovered.has(alert.id)).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Como está a operação, o que merece atenção da Diretoria e o que resolver primeiro.
            Data de referência da massa: 28/08/2026.
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

      {roleLabel === "Direção" ? (
        <p className="rounded-lg border border-navy/20 bg-navy/5 px-4 py-3 text-sm text-navy">
          Prioridades da Direção nesta demonstração: operação do dia, indicadores do período e
          pendências que liberam ou bloqueiam o fluxo do Hotel Amazonas Plaza.
        </p>
      ) : roleLabel === "Compliance" ? (
        <p className="rounded-lg border border-teal/30 bg-secondary px-4 py-3 text-sm">
          Contexto Compliance: use Documentos, Contratos e Licitações para a governança. O roteiro
          completo permanece acessível nesta demonstração.
        </p>
      ) : (
        <p className="rounded-lg border border-teal/30 bg-secondary px-4 py-3 text-sm">
          Números fictícios, derivados da massa demonstrativa. Nada aqui é faturamento ou pendência
          real da SERVSAM.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-navy">Indicadores operacionais</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Serviços de hoje" value={String(metrics.servicesToday)} />
          <MetricCard title="Serviços da semana" value={String(metrics.servicesThisWeek)} />
          <MetricCard title="OS abertas" value={String(metrics.scheduledServices)} />
          <MetricCard title="Propostas pendentes" value={String(metrics.openProposals)} />
          <MetricCard title="Certificados a emitir" value={String(metrics.certificatesToIssue)} />
          <MetricCard title="Contratos a vencer" value={String(metrics.expiringContracts)} />
          <MetricCard title="Financeiro em atraso" value={formatCurrencyBrl(metrics.delinquencyAmount)} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-navy">Resumo executivo</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title={`Receitas de ${metrics.periodLabel}`}
            value={formatCurrencyBrl(metrics.billingMonth)}
            hint="Soma das receitas pagas ou lançadas no período selecionado."
          />
          <MetricCard
            title="Valores vencidos"
            value={formatCurrencyBrl(metrics.delinquencyAmount)}
            hint="Contas a receber com vencimento anterior a 28/08/2026."
          />
          <MetricCard
            title="Contratos próximos do vencimento"
            value={String(metrics.expiringContracts)}
            hint="Contratos com status a vencer na massa demonstrativa."
          />
          <MetricCard
            title="Certificados pendentes"
            value={String(metrics.certificatesToIssue)}
            hint="Atestados e certificados ainda em prévia."
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-navy">Próximas ações prioritárias</h2>
          <p className="text-xs text-muted-foreground">
            Derivadas dos alertas e da narrativa. Mudam quando a massa muda.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pendências calculadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {priorityActions.length === 0 ? (
                  <li className="text-sm text-muted-foreground">
                    Nenhuma pendência calculada neste momento da demonstração.
                  </li>
                ) : (
                  priorityActions.map((action) => <ActionItem key={action.id} action={action} />)
                )}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Atalhos do roteiro</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {guideActions.map((action) => (
                  <ActionItem key={action.id} action={action} />
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Formalização de propostas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Hipótese da Sprint 10.1: a formalização libera o agendamento. A regra definitiva ainda
              depende do cliente.
            </p>
            <ul className="space-y-3">
              {metrics.formalizationOverview.slice(0, 6).map((item) => (
                <li key={item.id} className="rounded-lg border border-border p-3">
                  <Link href={item.href} className="font-medium text-navy hover:text-teal">
                    {item.proposalCode} · {item.clientAlias}
                  </Link>
                  <p className="text-muted-foreground">{item.statusLabel}</p>
                  {item.documentCode ? (
                    <p className="text-xs text-muted-foreground">Documento: {item.documentCode}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recorrências e próximas visitas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {metrics.recurringVisits.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  Nenhum serviço com múltiplas visitas neste fixture.
                </li>
              ) : (
                metrics.recurringVisits.map((visit) => (
                  <li key={visit.id} className="rounded-lg border border-border p-3 text-sm">
                    <Link href={visit.href} className="font-medium text-navy hover:text-teal">
                      {visit.clientAlias}
                    </Link>
                    <p>{visit.serviceName}</p>
                    <p className="text-muted-foreground">
                      Próxima visita {visit.nextVisitAt} · {visit.statusLabel}
                      {visit.vehicleLabel ? ` · ${visit.vehicleLabel}` : ""}
                      {visit.team ? ` · ${visit.team}` : ""}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
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
                  <p className="mt-1 text-xs text-muted-foreground">{item.scheduledFor}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {remainingAlerts.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  Os alertas principais já aparecem em Próximas ações.
                </li>
              ) : (
                remainingAlerts.map((alert) => (
                  <li key={alert.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.detail}</p>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ActionItem({ action }: { action: DashboardNextAction }) {
  const content = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium text-navy">{action.title}</p>
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
          {action.category} · {PRIORITY_LABEL[action.priority]}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{action.detail}</p>
    </>
  );

  if (!action.href) {
    return <li className="rounded-lg border border-border p-3">{content}</li>;
  }

  return (
    <li>
      <Link href={action.href} className="block rounded-lg border border-border p-3 hover:border-teal">
        {content}
      </Link>
    </li>
  );
}

function MetricCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-navy">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
