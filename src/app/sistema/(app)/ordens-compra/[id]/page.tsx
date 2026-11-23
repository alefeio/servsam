import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/data/platform/labels";
import { CreateEngagementFromPurchaseOrderButton } from "@/features/platform/engagement-form";
import {
  LinkButton,
  NoAccess,
  PageHeader,
} from "@/features/platform/form-parts";
import {
  requireAuthenticatedUser,
  userHasPermission,
} from "@/lib/platform/access";
import { formatDateBr, formatDateTimeBr } from "@/lib/platform/dates";
import { formatCents } from "@/lib/platform/money";
import {
  getPurchaseOrderDetail,
  getPurchaseOrderHistory,
} from "@/lib/platform/purchase-orders";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Ordem de compra"),
  robots: { index: false, follow: false },
};

const HISTORY_LABELS: Record<string, string> = {
  PURCHASE_ORDER_CREATED: "Registrada",
  PURCHASE_ORDER_UPDATED: "Atualizada",
  PURCHASE_ORDER_ARCHIVED: "Arquivada",
  ENGAGEMENT_CREATED: "Contratação gerada",
};

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "contract.view"))
    return <NoAccess what="ver ordens de compra" />;

  const { id } = await params;
  const order = await getPurchaseOrderDetail(actor, id);
  if (!order) notFound();

  const can = (key: string) => userHasPermission(actor, key);
  const history = can("audit.view")
    ? await getPurchaseOrderHistory(actor, order.id)
    : [];
  const engagement =
    order.engagement && !order.engagement.deletedAt ? order.engagement : null;

  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title={`${order.code} · O.C. ${order.externalNumber}`}
        description={order.description}
        actions={
          <LinkButton href="/sistema/ordens-compra" variant="outline">
            Voltar
          </LinkButton>
        }
      />

      <dl className="grid gap-3 rounded-xl border border-border bg-background p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Situação</dt>
          <dd className="mt-1 font-medium">
            {PURCHASE_ORDER_STATUS_LABELS[order.status]}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Cliente</dt>
          <dd className="font-medium">
            {can("customer.view") ? (
              <Link
                href={`/sistema/clientes/${order.customer.id}`}
                className="text-navy hover:underline"
              >
                {order.customer.legalName}
              </Link>
            ) : (
              order.customer.legalName
            )}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Unidade</dt>
          <dd className="font-medium">{order.customerUnit?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Recebida em</dt>
          <dd className="font-medium">{formatDateBr(order.receivedAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Valor acordado</dt>
          <dd className="font-medium">
            {formatCents(order.agreedAmountCents)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Referência do documento</dt>
          <dd className="font-medium">{order.documentReference ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Contratação</dt>
          <dd className="font-medium">
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
          </dd>
        </div>
      </dl>

      <section className="space-y-3" aria-labelledby="itens">
        <h2 id="itens" className="text-lg font-semibold text-navy">
          Itens
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 text-right font-medium">Qtd.</th>
                <th className="px-4 py-3 text-right font-medium">Unitário</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">{item.position}</td>
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3 text-right">
                    {new Intl.NumberFormat("pt-BR", {
                      maximumFractionDigits: 3,
                    }).format(Number(item.quantity))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCents(item.unitPriceCents)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCents(item.totalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {order.observations ? (
        <section className="rounded-xl border border-border bg-background p-4 text-sm">
          <h3 className="font-medium">Observações</h3>
          <p className="whitespace-pre-wrap text-muted-foreground">
            {order.observations}
          </p>
        </section>
      ) : null}

      <section className="space-y-4" aria-labelledby="acoes">
        <h2 id="acoes" className="text-lg font-semibold text-navy">
          Ações
        </h2>
        {!engagement &&
        order.status === "registered" &&
        can("contract.manage") ? (
          <CreateEngagementFromPurchaseOrderButton
            purchaseOrderId={order.id}
          />
        ) : null}
        {engagement ? (
          <p className="text-sm text-muted-foreground">
            Contratação já gerada:{" "}
            <Link
              href={`/sistema/contratacoes/${engagement.id}`}
              className="text-navy hover:underline"
            >
              {engagement.code}
            </Link>
            .
          </p>
        ) : null}
      </section>

      {history.length > 0 ? (
        <section className="space-y-3" aria-labelledby="historico">
          <h2 id="historico" className="text-lg font-semibold text-navy">
            Histórico
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-background text-sm">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap justify-between gap-2 px-4 py-3"
              >
                <span>{HISTORY_LABELS[entry.action] ?? entry.action}</span>
                <span className="text-muted-foreground">
                  {entry.actor?.name ?? "Sistema"} ·{" "}
                  {formatDateTimeBr(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
