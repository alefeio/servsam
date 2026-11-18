import type { Metadata } from "next";
import Link from "next/link";
import { PROPOSAL_STATUS_LABELS } from "@/data/platform/labels";
import { LinkButton } from "@/features/platform/form-parts";
import {
  requireAuthenticatedUser,
  userHasPermission,
} from "@/lib/platform/access";
import { countActiveCustomers } from "@/lib/platform/customers";
import { formatCents } from "@/lib/platform/money";
import { PROPOSAL_STATUSES } from "@/lib/platform/proposal-state";
import { getProposalSummary } from "@/lib/platform/proposals";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Sistema"),
  robots: { index: false, follow: false },
};

export default async function ProductionHomePage() {
  const user = await requireAuthenticatedUser();
  const canSeeProposals = userHasPermission(user, "proposal.view");
  const canSeeCustomers = userHasPermission(user, "customer.view");

  const [summary, customerCount] = await Promise.all([
    canSeeProposals ? getProposalSummary(user) : null,
    canSeeCustomers ? countActiveCustomers(user) : null,
  ]);

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-navy">Painel</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Números calculados a partir dos cadastros reais do sistema. A
          demonstração fica em outro endereço e não alimenta este painel.
        </p>
      </div>

      <dl className="grid gap-3 rounded-xl border border-border bg-background p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Organização</dt>
          <dd className="font-medium">SERVSAM</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Papéis desta conta</dt>
          <dd className="font-medium">
            {user.roleCodes.join(", ") || "Nenhum"}
          </dd>
        </div>
        {customerCount !== null ? (
          <div>
            <dt className="text-muted-foreground">Clientes ativos</dt>
            <dd className="font-medium">
              <Link
                href="/sistema/clientes"
                className="text-navy hover:underline"
              >
                {customerCount}
              </Link>
            </dd>
          </div>
        ) : null}
      </dl>

      {summary ? (
        <section className="space-y-4" aria-labelledby="orcamentos-resumo">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="orcamentos-resumo"
              className="text-lg font-semibold text-navy"
            >
              Orçamentos
            </h2>
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
                className="rounded-xl border border-border bg-background p-4"
              >
                <Link
                  href={`/sistema/orcamentos?situacao=${status}`}
                  className="block"
                >
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
              <dt className="text-muted-foreground">
                Aguardando resposta (enviados)
              </dt>
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
          <p className="text-xs text-muted-foreground">
            Valores orçados, não faturamento. Financeiro e ordens de serviço
            entram em sprints próprias.
          </p>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sua conta não tem permissão para ver o resumo de orçamentos.
        </p>
      )}
    </section>
  );
}
