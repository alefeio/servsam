import type { Metadata } from "next";
import Link from "next/link";
import {
  ENGAGEMENT_ORIGIN_LABELS,
  SERVICE_ORDER_STATUS_LABELS,
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
import { formatDateBr } from "@/lib/platform/dates";
import { SERVICE_ORDER_STATUSES } from "@/lib/platform/service-order-state";
import { listServiceOrders } from "@/lib/platform/service-orders";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Ordens de serviço"),
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  q?: string | string[];
  situacao?: string | string[];
}>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function ServiceOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "service_order.view"))
    return <NoAccess what="ver ordens de serviço" />;

  const params = await searchParams;
  const query = first(params.q);
  const status = first(params.situacao);
  const orders = await listServiceOrders(actor, { query, status });

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Ordens de serviço"
        description="Emissão a partir de serviços contratados. Agendamento será integrado no Gate 11B.3."
        actions={
          userHasPermission(actor, "contract.view") ? (
            <LinkButton href="/sistema/contratacoes" variant="outline">
              Contratações
            </LinkButton>
          ) : null
        }
      />

      <form className="flex flex-wrap items-center gap-3" role="search">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar por número, serviço, cliente ou contratação"
          aria-label="Buscar ordens de serviço"
          className="h-8 w-full max-w-sm rounded-lg border border-input bg-background px-2.5 text-sm"
        />
        <select
          name="situacao"
          defaultValue={status}
          aria-label="Situação"
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="">Todas as situações</option>
          {SERVICE_ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {SERVICE_ORDER_STATUS_LABELS[value]}
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

      {orders.length === 0 ? (
        <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
          Nenhuma ordem de serviço. Emita a partir de uma contratação ativa.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Serviço</th>
                <th className="px-4 py-3 font-medium">Contratação</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3 font-medium">Emitida em</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/sistema/ordens-servico/${order.id}`}
                      className="font-medium text-navy hover:underline"
                    >
                      {order.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.customer.legalName}</td>
                  <td className="px-4 py-3">{order.description}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/sistema/contratacoes/${order.engagement.id}`}
                      className="text-navy hover:underline"
                    >
                      {order.engagement.code}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {ENGAGEMENT_ORIGIN_LABELS[order.engagement.origin]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {SERVICE_ORDER_STATUS_LABELS[order.status]}
                  </td>
                  <td className="px-4 py-3">{formatDateBr(order.issuedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
