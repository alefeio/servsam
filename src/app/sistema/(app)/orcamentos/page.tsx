import type { Metadata } from "next";
import Link from "next/link";
import { PROPOSAL_STATUS_LABELS } from "@/data/platform/labels";
import {
  LinkButton,
  NoAccess,
  PageHeader,
  ProposalStatusBadge,
} from "@/features/platform/form-parts";
import {
  requireAuthenticatedUser,
  userHasPermission,
} from "@/lib/platform/access";
import { formatDateBr } from "@/lib/platform/dates";
import { formatCents } from "@/lib/platform/money";
import {
  PROPOSAL_STATUSES,
  isPastValidity,
} from "@/lib/platform/proposal-state";
import { listProposals } from "@/lib/platform/proposals";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Orçamentos"),
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  q?: string | string[];
  situacao?: string | string[];
}>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "proposal.view"))
    return <NoAccess what="ver orçamentos" />;

  const params = await searchParams;
  const query = first(params.q);
  const status = first(params.situacao);
  const proposals = await listProposals(actor, { query, status });
  const canCreate = userHasPermission(actor, "proposal.create");
  const now = new Date();

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Orçamentos"
        description="Propostas comerciais por cliente. O aceite autoriza agenda e ordem de serviço nas próximas etapas."
        actions={
          canCreate ? (
            <LinkButton href="/sistema/orcamentos/novo">
              Novo orçamento
            </LinkButton>
          ) : null
        }
      />

      <form className="flex flex-wrap items-center gap-3" role="search">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar por número, título ou cliente"
          aria-label="Buscar orçamentos"
          className="h-8 w-full max-w-sm rounded-lg border border-input bg-background px-2.5 text-sm"
        />
        <select
          name="situacao"
          defaultValue={status}
          aria-label="Situação"
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="">Todas as situações</option>
          {PROPOSAL_STATUSES.map((value) => (
            <option key={value} value={value}>
              {PROPOSAL_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-8 rounded-lg border border-border bg-background px-3 text-sm hover:bg-muted"
        >
          Filtrar
        </button>
      </form>

      {proposals.length === 0 ? (
        <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
          Nenhum orçamento encontrado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3 font-medium">Validade</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((proposal) => (
                <tr
                  key={proposal.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/sistema/orcamentos/${proposal.id}`}
                      className="text-navy hover:underline"
                    >
                      {proposal.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{proposal.title}</td>
                  <td className="px-4 py-3">{proposal.customer.legalName}</td>
                  <td className="px-4 py-3">
                    <ProposalStatusBadge status={proposal.status} />
                    {proposal.status === "sent" &&
                    isPastValidity(proposal.validUntil, now) ? (
                      <p className="mt-1 text-xs text-destructive">
                        Validade vencida
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {formatDateBr(proposal.validUntil)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCents(proposal.totalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
