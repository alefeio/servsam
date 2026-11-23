import type { Metadata } from "next";
import Link from "next/link";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/data/platform/labels";
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
import { formatDateBr } from "@/lib/platform/dates";
import { listPurchaseOrders } from "@/lib/platform/purchase-orders";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Ordens de compra"),
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  q?: string | string[];
  situacao?: string | string[];
}>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "contract.view"))
    return <NoAccess what="ver ordens de compra" />;

  const params = await searchParams;
  const query = first(params.q);
  const status = first(params.situacao);
  const orders = await listPurchaseOrders(actor, { query, status });
  const canCreate = userHasPermission(actor, "contract.manage");

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Ordens de compra recebidas"
        description="O.C. enviada pelo contratante. Não é orçamento SERVSAM nem ordem de serviço."
        actions={
          canCreate ? (
            <LinkButton href="/sistema/ordens-compra/nova">
              Registrar O.C.
            </LinkButton>
          ) : null
        }
      />

      <form className="flex flex-wrap items-center gap-3" role="search">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar por número interno, O.C. externa ou cliente"
          aria-label="Buscar ordens de compra"
          className="h-8 w-full max-w-sm rounded-lg border border-input bg-background px-2.5 text-sm"
        />
        <select
          name="situacao"
          defaultValue={status}
          aria-label="Situação"
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="">Todas as situações</option>
          {Object.entries(PURCHASE_ORDER_STATUS_LABELS).map(([value, label]) => (
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

      {orders.length === 0 ? (
        <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
          Nenhuma ordem de compra recebida.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Interno</th>
                <th className="px-4 py-3 font-medium">O.C. externa</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Recebida</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Contratação</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const engagement =
                  order.engagement && !order.engagement.deletedAt
                    ? order.engagement
                    : null;
                return (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/sistema/ordens-compra/${order.id}`}
                        className="font-medium text-navy hover:underline"
                      >
                        {order.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{order.externalNumber}</td>
                    <td className="px-4 py-3">{order.customer.legalName}</td>
                    <td className="px-4 py-3">
                      {formatDateBr(order.receivedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {PURCHASE_ORDER_STATUS_LABELS[order.status]}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCents(order.agreedAmountCents)}
                    </td>
                    <td className="px-4 py-3">
                      {engagement ? (
                        <Link
                          href={`/sistema/contratacoes/${engagement.id}`}
                          className="text-navy hover:underline"
                        >
                          {engagement.code}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
