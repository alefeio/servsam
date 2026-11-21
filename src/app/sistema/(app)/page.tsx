import type { Metadata } from "next";
import Link from "next/link";
import { PROPOSAL_STATUS_LABELS } from "@/data/platform/labels";
import {
  EmptyState,
  FutureCapabilityNotice,
  LinkButton,
  PageHeader,
  PlatformPage,
} from "@/features/platform/form-parts";
import {
  requireAuthenticatedUser,
  userHasPermission,
} from "@/lib/platform/access";
import { countActiveCustomers } from "@/lib/platform/customers";
import { formatCents } from "@/lib/platform/money";
import { PROPOSAL_STATUSES } from "@/lib/platform/proposal-state";
import { getProposalSummary } from "@/lib/platform/proposals";
import { getRuntimeEnvironmentLabel } from "@/lib/platform/runtime-environment";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Sistema"),
  robots: { index: false, follow: false },
};

export default async function ProductionHomePage() {
  const user = await requireAuthenticatedUser();
  const canSeeProposals = userHasPermission(user, "proposal.view");
  const canSeeCustomers = userHasPermission(user, "customer.view");
  const canCreateCustomer = userHasPermission(user, "customer.create");
  const canCreateProposal = userHasPermission(user, "proposal.create");

  const [summary, customerCount] = await Promise.all([
    canSeeProposals ? getProposalSummary(user) : null,
    canSeeCustomers ? countActiveCustomers(user) : null,
  ]);

  const roleLabel = user.roleNames.join(", ") || user.roleCodes.join(", ") || "Nenhum";
  const environment = getRuntimeEnvironmentLabel();

  return (
    <PlatformPage width="wide" className="space-y-8">
      <PageHeader
        title="Painel"
        description={`Indicadores calculados a partir dos cadastros persistentes deste ambiente (${environment.label}). A demonstração fictícia fica em /demonstracao e não alimenta este painel.`}
        actions={
          <>
            {canCreateCustomer ? (
              <LinkButton href="/sistema/clientes/novo" variant="outline">
                Novo cliente
              </LinkButton>
            ) : null}
            {canCreateProposal ? (
              <LinkButton href="/sistema/orcamentos/novo">Novo orçamento</LinkButton>
            ) : null}
          </>
        }
      />

      <dl className="grid gap-3 rounded-xl border border-border bg-background p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Organização</dt>
          <dd className="font-medium">SERVSAM</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ambiente</dt>
          <dd className="font-medium">{environment.shortLabel}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Perfis desta conta</dt>
          <dd className="font-medium">{roleLabel}</dd>
        </div>
        {customerCount !== null ? (
          <div className="sm:col-span-3">
            <dt className="text-muted-foreground">Clientes ativos</dt>
            <dd className="font-medium">
              <Link href="/sistema/clientes" className="text-navy hover:underline">
                {customerCount}
              </Link>
            </dd>
            <p className="mt-1 text-xs text-muted-foreground">
              Quantidade de cadastros não arquivados visíveis na listagem padrão.
            </p>
          </div>
        ) : null}
      </dl>

      {summary ? (
        <section className="space-y-4" aria-labelledby="orcamentos-resumo">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="orcamentos-resumo" className="text-lg font-semibold text-navy">
                Orçamentos
              </h2>
              <p className="text-xs text-muted-foreground">
                Contagens e totais por situação. Valores são orçados, não faturamento.
              </p>
            </div>
            <LinkButton href="/sistema/orcamentos" variant="outline">
              Ver todos
            </LinkButton>
          </div>

          {summary.sentPastValidity > 0 ? (
            <p
              role="status"
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {summary.sentPastValidity === 1
                ? "1 orçamento enviado está com a validade vencida."
                : `${summary.sentPastValidity} orçamentos enviados estão com a validade vencida.`}{" "}
              Marque como expirado ou registre a decisão do cliente.
            </p>
          ) : null}

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PROPOSAL_STATUSES.map((status) => (
              <li
                key={status}
                className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/40"
              >
                <Link href={`/sistema/orcamentos?situacao=${status}`} className="block">
                  <p className="text-xs text-muted-foreground">
                    {PROPOSAL_STATUS_LABELS[status]}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-navy">
                    {summary.byStatus[status].count}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCents(summary.byStatus[status].totalCents)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <dl className="grid gap-3 rounded-xl border border-border bg-background p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Aguardando resposta (enviados)</dt>
              <dd className="text-lg font-semibold text-navy">
                {formatCents(summary.openPipelineCents)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Aceitos (valor orçado)</dt>
              <dd className="text-lg font-semibold text-navy">
                {formatCents(summary.acceptedCents)}
              </dd>
            </div>
          </dl>
        </section>
      ) : (
        <EmptyState
          title="Resumo de orçamentos indisponível"
          description="Sua conta não tem permissão para ver orçamentos neste ambiente."
        />
      )}

      <FutureCapabilityNotice>
        Ordens de serviço, agenda persistente, O.C., contratos e financeiro operacional
        entram em sprints próprias. Não há atalho operacional falso neste painel.
      </FutureCapabilityNotice>
    </PlatformPage>
  );
}
