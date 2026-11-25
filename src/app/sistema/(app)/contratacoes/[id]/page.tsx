import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BILLING_REQUEST_STATUS_LABELS,
  ENGAGEMENT_ORIGIN_LABELS,
  ENGAGEMENT_STATUS_LABELS,
  RECEIPT_KIND_LABELS,
  RECEIPT_STATUS_LABELS,
  SERVICE_ORDER_STATUS_LABELS,
} from "@/data/platform/labels";
import {
  CancelBillingForm,
  CancelPendingReceiptForm,
  ConfirmReceiptForm,
  FinanceStatusBadge,
  InformReceiptForm,
  ProcessBillingForm,
  RejectReceiptForm,
  RequestBillingForm,
  ReverseReceiptForm,
} from "@/features/platform/finance-forms";
import {
  LinkButton,
  NoAccess,
  PageHeader,
} from "@/features/platform/form-parts";
import { EmitServiceOrderButton } from "@/features/platform/service-order-form";
import {
  requireAuthenticatedUser,
  userHasPermission,
} from "@/lib/platform/access";
import { formatDateTimeBr } from "@/lib/platform/dates";
import {
  getEngagementDetail,
  getEngagementHistory,
} from "@/lib/platform/engagements";
import {
  classifyFinanceQueryError,
  logFinanceQueryFailure,
  type FinanceModuleState,
} from "@/lib/platform/finance-availability";
import {
  getEngagementFinanceSummary,
  listBillingRequestsForEngagement,
  listReceiptsForEngagement,
} from "@/lib/platform/finance";
import { formatCents } from "@/lib/platform/money";
import {
  classifyServiceOrderQueryError,
  logServiceOrderQueryFailure,
  type ServiceOrderModuleState,
} from "@/lib/platform/service-order-availability";
import { getServiceOrdersByEngagement } from "@/lib/platform/service-orders";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Contratação"),
  robots: { index: false, follow: false },
};

const HISTORY_LABELS: Record<string, string> = {
  ENGAGEMENT_CREATED: "Criada",
};

export default async function EngagementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "contract.view"))
    return <NoAccess what="ver contratações" />;

  const { id } = await params;
  const engagement = await getEngagementDetail(actor, id);
  if (!engagement) notFound();

  const can = (key: string) => userHasPermission(actor, key);
  const history = can("audit.view")
    ? await getEngagementHistory(actor, engagement.id)
    : [];

  let serviceOrders: Awaited<
    ReturnType<typeof getServiceOrdersByEngagement>
  > = [];
  let serviceOrderModule: ServiceOrderModuleState = { status: "ready" };

  if (can("service_order.view")) {
    try {
      serviceOrders = await getServiceOrdersByEngagement(actor, engagement.id);
    } catch (error) {
      logServiceOrderQueryFailure("engagement-detail", error);
      serviceOrderModule = classifyServiceOrderQueryError(error);
      serviceOrders = [];
    }
  }

  const moduleReady = serviceOrderModule.status === "ready";
  const activeOrderByItem = new Map(
    serviceOrders
      .filter((order) => order.status !== "cancelled")
      .map((order) => [order.engagementItemId, order] as const),
  );
  const cancelledOrdersByItem = new Map<string, typeof serviceOrders>();
  for (const order of serviceOrders) {
    if (order.status !== "cancelled") continue;
    const list = cancelledOrdersByItem.get(order.engagementItemId) ?? [];
    list.push(order);
    cancelledOrdersByItem.set(order.engagementItemId, list);
  }
  const cancelledOrders = serviceOrders.filter(
    (order) => order.status === "cancelled",
  );

  let financeModule: FinanceModuleState = { status: "ready" };
  let financeSummary: Awaited<
    ReturnType<typeof getEngagementFinanceSummary>
  > = null;
  let billingRequests: Awaited<
    ReturnType<typeof listBillingRequestsForEngagement>
  > = [];
  let receipts: Awaited<ReturnType<typeof listReceiptsForEngagement>> = [];

  if (can("contract.view")) {
    try {
      financeSummary = await getEngagementFinanceSummary(actor, engagement.id);
      billingRequests = await listBillingRequestsForEngagement(
        actor,
        engagement.id,
      );
      receipts = await listReceiptsForEngagement(actor, engagement.id);
    } catch (error) {
      logFinanceQueryFailure("engagement-detail", error);
      financeModule = classifyFinanceQueryError(error);
      financeSummary = null;
      billingRequests = [];
      receipts = [];
    }
  }

  const canRequestFinance = can("contract.manage");
  const canManageFinance = can("finance.manage");
  const financeReady = financeModule.status === "ready";

  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title={`${engagement.code} · ${engagement.title}`}
        description="Formalização comercial persistente. Emita OS por serviço contratado."
        actions={
          <LinkButton href="/sistema/contratacoes" variant="outline">
            Voltar
          </LinkButton>
        }
      />

      {serviceOrderModule.status === "unavailable" ? (
        <p
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {serviceOrderModule.message} Clientes, orçamentos e contratações
          permanecem acessíveis. A emissão de OS fica desabilitada até o módulo
          estar disponível.
        </p>
      ) : null}
      {serviceOrderModule.status === "forbidden" ? (
        <p
          role="status"
          className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground"
        >
          Sem permissão para consultar ordens de serviço nesta contratação.
        </p>
      ) : null}

      <dl className="grid gap-3 rounded-xl border border-border bg-background p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Situação</dt>
          <dd className="mt-1 font-medium">
            {ENGAGEMENT_STATUS_LABELS[engagement.status]}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Origem</dt>
          <dd className="font-medium">
            {ENGAGEMENT_ORIGIN_LABELS[engagement.origin]}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Cliente</dt>
          <dd className="font-medium">
            {can("customer.view") ? (
              <Link
                href={`/sistema/clientes/${engagement.customer.id}`}
                className="text-navy hover:underline"
              >
                {engagement.customer.legalName}
              </Link>
            ) : (
              engagement.customer.legalName
            )}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Unidade</dt>
          <dd className="font-medium">
            {engagement.customerUnit?.name ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Total contratado</dt>
          <dd className="font-medium">{formatCents(engagement.totalCents)}</dd>
        </div>
        {engagement.proposal ? (
          <div>
            <dt className="text-muted-foreground">Orçamento</dt>
            <dd className="font-medium">
              {can("proposal.view") ? (
                <Link
                  href={`/sistema/orcamentos/${engagement.proposal.id}`}
                  className="text-navy hover:underline"
                >
                  {engagement.proposal.code}
                </Link>
              ) : (
                engagement.proposal.code
              )}
            </dd>
          </div>
        ) : null}
        {engagement.purchaseOrder ? (
          <div>
            <dt className="text-muted-foreground">O.C. recebida</dt>
            <dd className="font-medium">
              <Link
                href={`/sistema/ordens-compra/${engagement.purchaseOrder.id}`}
                className="text-navy hover:underline"
              >
                {engagement.purchaseOrder.code} (
                {engagement.purchaseOrder.externalNumber})
              </Link>
            </dd>
          </div>
        ) : null}
      </dl>

      <section className="space-y-3" aria-labelledby="itens">
        <h2 id="itens" className="text-lg font-semibold text-navy">
          Serviços contratados
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
                <th className="px-4 py-3 font-medium">OS</th>
              </tr>
            </thead>
            <tbody>
              {engagement.items.map((item) => {
                const activeOrder = activeOrderByItem.get(item.id);
                const priorCancelled = cancelledOrdersByItem.get(item.id) ?? [];
                return (
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
                    <td className="px-4 py-3">
                      {activeOrder ? (
                        <div className="space-y-1">
                          <Link
                            href={`/sistema/ordens-servico/${activeOrder.id}`}
                            className="font-medium text-navy hover:underline"
                          >
                            {activeOrder.code}
                          </Link>
                          <span className="block text-xs text-muted-foreground">
                            {SERVICE_ORDER_STATUS_LABELS[activeOrder.status]}
                          </span>
                        </div>
                      ) : !moduleReady ? (
                        <span className="text-xs text-muted-foreground">
                          Indisponível
                        </span>
                      ) : engagement.status === "active" &&
                        can("service_order.create") ? (
                        <EmitServiceOrderButton
                          engagementId={engagement.id}
                          engagementItemId={item.id}
                          priorCancelledCodes={priorCancelled.map(
                            (order) => order.code,
                          )}
                        />
                      ) : priorCancelled.length > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          Sem OS ativa
                        </span>
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
        <p className="text-xs text-muted-foreground">
          Cada linha de serviço pode originar no máximo uma OS ativa. A
          quantidade contratada não vira número de visitas.
        </p>
      </section>

      {moduleReady && cancelledOrders.length > 0 ? (
        <section className="space-y-3" aria-labelledby="os-canceladas">
          <h2 id="os-canceladas" className="text-lg font-semibold text-navy">
            Ordens de serviço canceladas
          </h2>
          <p className="text-sm text-muted-foreground">
            Histórico preservado. Números cancelados não são reutilizados na
            reemissão.
          </p>
          <ul className="divide-y divide-border rounded-xl border border-border bg-background text-sm">
            {cancelledOrders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-start justify-between gap-2 px-4 py-3"
              >
                <div>
                  <Link
                    href={`/sistema/ordens-servico/${order.id}`}
                    className="font-medium text-navy hover:underline"
                  >
                    {order.code}
                  </Link>
                  <p className="text-muted-foreground">
                    {order.engagementItem.description}
                    {order.cancellationReason
                      ? ` · Motivo: ${order.cancellationReason}`
                      : ""}
                  </p>
                </div>
                <span className="text-muted-foreground">
                  {SERVICE_ORDER_STATUS_LABELS[order.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {engagement.notes ? (
        <section className="rounded-xl border border-border bg-background p-4 text-sm">
          <h3 className="font-medium">Observações</h3>
          <p className="whitespace-pre-wrap text-muted-foreground">
            {engagement.notes}
          </p>
        </section>
      ) : null}

      <section className="space-y-4" aria-labelledby="financeiro-f0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="financeiro-f0" className="text-lg font-semibold text-navy">
              Financeiro (FIN-F0)
            </h2>
            <p className="text-sm text-muted-foreground">
              Solicitação fiscal comercial e recebimentos confirmados
              manualmente pelo Financeiro. Não é conciliação bancária nem
              emissão de NF-e.
            </p>
          </div>
          {can("finance.view") ? (
            <LinkButton href="/sistema/financeiro" variant="outline">
              Painel financeiro
            </LinkButton>
          ) : null}
        </div>

        {financeModule.status === "unavailable" ? (
          <p
            role="status"
            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            {financeModule.message}
          </p>
        ) : null}

        {financeReady && financeSummary ? (
          <dl className="grid gap-3 rounded-xl border border-border bg-background p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Contratado</dt>
              <dd className="mt-1 font-medium">
                {formatCents(financeSummary.contractedCents)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Confirmado pelo Financeiro</dt>
              <dd className="mt-1 font-medium">
                {formatCents(financeSummary.confirmedCents)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Aguardando confirmação</dt>
              <dd className="mt-1 font-medium">
                {formatCents(financeSummary.pendingCents)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Saldo de referência</dt>
              <dd className="mt-1 font-medium">
                {formatCents(financeSummary.referenceBalanceCents)}
              </dd>
            </div>
          </dl>
        ) : null}

        {financeReady && canRequestFinance ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <RequestBillingForm
              engagementId={engagement.id}
              defaultReferenceReais={(engagement.totalCents / 100).toFixed(2).replace(".", ",")}
            />
            <InformReceiptForm engagementId={engagement.id} />
          </div>
        ) : null}

        {financeReady ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-border bg-background p-4">
              <h3 className="text-sm font-semibold">Solicitações de nota</h3>
              {billingRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma solicitação.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {billingRequests.map((row) => (
                    <li key={row.id} className="rounded-lg border border-border/70 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{row.description}</span>
                        <FinanceStatusBadge kind="billing" status={row.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTimeBr(row.requestedAt)}
                        {row.referenceAmountCents != null
                          ? ` · ref. ${formatCents(row.referenceAmountCents)}`
                          : ""}
                        {row.invoiceIssuedExternally
                          ? ` · doc. externo: ${row.externalDocumentRef ?? "—"}`
                          : ""}
                      </p>
                      {canManageFinance &&
                      (row.status === "requested" ||
                        row.status === "under_review") ? (
                        <ProcessBillingForm
                          billingRequestId={row.id}
                          engagementId={engagement.id}
                        />
                      ) : null}
                      {(canManageFinance ||
                        (canRequestFinance &&
                          row.requestedById === actor.id)) &&
                      (row.status === "requested" ||
                        row.status === "under_review") ? (
                        <CancelBillingForm
                          billingRequestId={row.id}
                          engagementId={engagement.id}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-background p-4">
              <h3 className="text-sm font-semibold">Recebimentos</h3>
              {receipts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum lançamento.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {receipts.map((row) => (
                    <li key={row.id} className="rounded-lg border border-border/70 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">
                          {RECEIPT_KIND_LABELS[row.kind]} ·{" "}
                          {formatCents(row.amountCents)}
                        </span>
                        <FinanceStatusBadge kind="receipt" status={row.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ref. {formatDateTimeBr(row.referenceDate)} ·{" "}
                        {RECEIPT_STATUS_LABELS[row.status]}
                        {row.requestedAmountCents !== row.amountCents
                          ? ` · solicitado ${formatCents(row.requestedAmountCents)}`
                          : ""}
                        {row.confirmedManually
                          ? " · registrado pelo Financeiro"
                          : ""}
                      </p>
                      {canManageFinance && row.status === "pending" ? (
                        <>
                          <ConfirmReceiptForm
                            receiptEntryId={row.id}
                            engagementId={engagement.id}
                            requestedAmountCents={row.requestedAmountCents}
                          />
                          <RejectReceiptForm
                            receiptEntryId={row.id}
                            engagementId={engagement.id}
                          />
                        </>
                      ) : null}
                      {row.status === "pending" &&
                      (canManageFinance ||
                        (canRequestFinance &&
                          row.requestedById === actor.id)) ? (
                        <CancelPendingReceiptForm
                          receiptEntryId={row.id}
                          engagementId={engagement.id}
                        />
                      ) : null}
                      {canManageFinance && row.status === "confirmed" ? (
                        <ReverseReceiptForm
                          receiptEntryId={row.id}
                          engagementId={engagement.id}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}

        {financeReady ? (
          <p className="text-xs text-muted-foreground">
            Situações:{" "}
            {Object.values(BILLING_REQUEST_STATUS_LABELS).join(" · ")}. Emissão
            de OS permanece independente de sinal obrigatório.
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
