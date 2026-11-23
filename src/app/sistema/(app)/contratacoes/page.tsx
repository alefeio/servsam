import type { Metadata } from "next";
import Link from "next/link";
import {
  ENGAGEMENT_ORIGIN_LABELS,
  ENGAGEMENT_STATUS_LABELS,
} from "@/data/platform/labels";
import {
  LinkButton,
  NoAccess,
  PageHeader,
} from "@/features/platform/form-parts";
import {
  requireAuthenticatedUser,
  userHasPermission,
} from "@/lib/platform/access";
import { formatCents } from "@/lib/platform/money";
import { listEngagements } from "@/lib/platform/engagements";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Contratações"),
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  q?: string | string[];
  situacao?: string | string[];
}>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function EngagementsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "contract.view"))
    return <NoAccess what="ver contratações" />;

  const params = await searchParams;
  const query = first(params.q);
  const status = first(params.situacao);
  const engagements = await listEngagements(actor, { query, status });

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Contratações"
        description="Formalização comercial a partir de orçamento aceito ou O.C. recebida."
        actions={
          <>
            {userHasPermission(actor, "proposal.view") ? (
              <LinkButton href="/sistema/orcamentos" variant="outline">
                Orçamentos
              </LinkButton>
            ) : null}
            {userHasPermission(actor, "contract.manage") ? (
              <LinkButton href="/sistema/ordens-compra/nova" variant="outline">
                Registrar O.C.
              </LinkButton>
            ) : null}
          </>
        }
      />

      <form className="flex flex-wrap items-center gap-3" role="search">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar por número, título ou cliente"
          aria-label="Buscar contratações"
          className="h-8 w-full max-w-sm rounded-lg border border-input bg-background px-2.5 text-sm"
        />
        <select
          name="situacao"
          defaultValue={status}
          aria-label="Situação"
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="">Todas as situações</option>
          {Object.entries(ENGAGEMENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
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

      {engagements.length === 0 ? (
        <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
          Nenhuma contratação encontrada. Gere a partir de um orçamento aceito
          ou de uma O.C. recebida.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Origem</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {engagements.map((engagement) => (
                <tr
                  key={engagement.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/sistema/contratacoes/${engagement.id}`}
                      className="font-medium text-navy hover:underline"
                    >
                      {engagement.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{engagement.title}</td>
                  <td className="px-4 py-3">{engagement.customer.legalName}</td>
                  <td className="px-4 py-3">
                    {ENGAGEMENT_ORIGIN_LABELS[engagement.origin]}
                    {engagement.proposal ? (
                      <>
                        {" · "}
                        <Link
                          href={`/sistema/orcamentos/${engagement.proposal.id}`}
                          className="text-navy hover:underline"
                        >
                          {engagement.proposal.code}
                        </Link>
                      </>
                    ) : null}
                    {engagement.purchaseOrder ? (
                      <>
                        {" · "}
                        <Link
                          href={`/sistema/ordens-compra/${engagement.purchaseOrder.id}`}
                          className="text-navy hover:underline"
                        >
                          {engagement.purchaseOrder.code}
                        </Link>
                      </>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {ENGAGEMENT_STATUS_LABELS[engagement.status]}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCents(engagement.totalCents)}
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
