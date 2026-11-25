import type { Metadata } from "next";
import Link from "next/link";
import {
  BILLING_REQUEST_STATUS_LABELS,
  RECEIPT_KIND_LABELS,
  RECEIPT_STATUS_LABELS,
} from "@/data/platform/labels";
import {
  ConfirmReceiptForm,
  FinanceStatusBadge,
  ProcessBillingForm,
  RejectReceiptForm,
  ReverseReceiptForm,
} from "@/features/platform/finance-forms";
import {
  EmptyState,
  NoAccess,
  PageHeader,
  PlatformPage,
} from "@/features/platform/form-parts";
import {
  requireAuthenticatedUser,
  userHasPermission,
} from "@/lib/platform/access";
import { listCustomers } from "@/lib/platform/customers";
import { formatDateTimeBr } from "@/lib/platform/dates";
import {
  classifyFinanceQueryError,
  logFinanceQueryFailure,
} from "@/lib/platform/finance-availability";
import {
  getFinanceDashboard,
  parseBelemDayBound,
} from "@/lib/platform/finance";
import { formatCents } from "@/lib/platform/money";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Financeiro"),
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  de?: string | string[];
  ate?: string | string[];
  cliente?: string | string[];
  situacaoNota?: string | string[];
  situacaoRecebimento?: string | string[];
  tipoRecebimento?: string | string[];
}>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "finance.view")) {
    return <NoAccess what="ver o financeiro" />;
  }

  const params = await searchParams;
  const fromRaw = first(params.de);
  const toRaw = first(params.ate);
  const customerId = first(params.cliente);
  const billingStatus = first(params.situacaoNota);
  const receiptStatus = first(params.situacaoRecebimento);
  const receiptKind = first(params.tipoRecebimento);
  const canManage = userHasPermission(actor, "finance.manage");

  let dashboard: Awaited<ReturnType<typeof getFinanceDashboard>> | null = null;
  let moduleMessage: string | null = null;
  try {
    dashboard = await getFinanceDashboard(actor, {
      from: parseBelemDayBound(fromRaw, false),
      to: parseBelemDayBound(toRaw, true),
      customerId: customerId || undefined,
      billingStatus: billingStatus || undefined,
      receiptStatus: receiptStatus || undefined,
      receiptKind: receiptKind || undefined,
    });
  } catch (error) {
    logFinanceQueryFailure("financeiro-page", error);
    const state = classifyFinanceQueryError(error);
    moduleMessage =
      state.status === "unavailable" || state.status === "forbidden"
        ? state.message
        : "Não foi possível carregar o painel.";
  }

  const customers = userHasPermission(actor, "customer.view")
    ? await listCustomers(actor, { includeArchived: false })
    : [];

  return (
    <PlatformPage>
      <PageHeader
        title="Financeiro"
        description="FIN-F0: solicitações fiscais comerciais e confirmação manual de recebimentos. Não é DRE, conta bancária nem conciliação."
      />

      {moduleMessage ? (
        <p
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {moduleMessage}
        </p>
      ) : null}

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-background p-4 text-sm">
        <label className="space-y-1">
          <span className="text-muted-foreground">De</span>
          <input
            type="date"
            name="de"
            defaultValue={fromRaw}
            className="block h-8 rounded-lg border border-input bg-background px-2"
          />
        </label>
        <label className="space-y-1">
          <span className="text-muted-foreground">Até</span>
          <input
            type="date"
            name="ate"
            defaultValue={toRaw}
            className="block h-8 rounded-lg border border-input bg-background px-2"
          />
        </label>
        {customers.length > 0 ? (
          <label className="space-y-1">
            <span className="text-muted-foreground">Cliente</span>
            <select
              name="cliente"
              defaultValue={customerId}
              className="block h-8 min-w-[12rem] rounded-lg border border-input bg-background px-2"
            >
              <option value="">Todos</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.legalName}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="space-y-1">
          <span className="text-muted-foreground">Nota</span>
          <select
            name="situacaoNota"
            defaultValue={billingStatus}
            className="block h-8 rounded-lg border border-input bg-background px-2"
          >
            <option value="">Todas</option>
            {Object.entries(BILLING_REQUEST_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-muted-foreground">Recebimento</span>
          <select
            name="situacaoRecebimento"
            defaultValue={receiptStatus}
            className="block h-8 rounded-lg border border-input bg-background px-2"
          >
            <option value="">Todos</option>
            {Object.entries(RECEIPT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-muted-foreground">Tipo</span>
          <select
            name="tipoRecebimento"
            defaultValue={receiptKind}
            className="block h-8 rounded-lg border border-input bg-background px-2"
          >
            <option value="">Todos</option>
            {Object.entries(RECEIPT_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-8 rounded-lg border border-border bg-background px-3 hover:bg-muted"
        >
          Filtrar
        </button>
      </form>

      {dashboard ? (
        <>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-border bg-background p-4">
              <dt className="text-xs text-muted-foreground">Notas pendentes</dt>
              <dd className="mt-1 text-2xl font-semibold text-navy">
                {dashboard.indicators.pendingBilling}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <dt className="text-xs text-muted-foreground">Notas processadas</dt>
              <dd className="mt-1 text-2xl font-semibold text-navy">
                {dashboard.indicators.processedBilling}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <dt className="text-xs text-muted-foreground">
                Recebimentos à confirmar
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-navy">
                {dashboard.indicators.pendingReceipts}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <dt className="text-xs text-muted-foreground">Valor pendente</dt>
              <dd className="mt-1 text-2xl font-semibold text-navy">
                {formatCents(dashboard.indicators.pendingReceiptsCents)}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <dt className="text-xs text-muted-foreground">
                Confirmado no período (por data da confirmação)
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-navy">
                {formatCents(dashboard.indicators.confirmedCents)}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Indicadores agregam todos os registros do filtro. Pendentes usam a
            data de referência; confirmados usam a data da confirmação manual.
            Listas abaixo limitadas a {dashboard.indicators.listsLimitedTo}{" "}
            itens.
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-navy">
              Solicitações fiscais
            </h2>
            {dashboard.billingRequests.length === 0 ? (
              <EmptyState
                title="Nenhuma solicitação no filtro"
                description="O Comercial solicita providências na contratação."
              />
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border bg-background text-sm">
                {dashboard.billingRequests.map((row) => (
                  <li key={row.id} className="space-y-2 px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/sistema/contratacoes/${row.engagement.id}`}
                          className="font-medium text-navy hover:underline"
                        >
                          {row.engagement.code}
                        </Link>
                        <p className="text-muted-foreground">
                          {row.customer.legalName} · {row.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTimeBr(row.requestedAt)}
                          {row.referenceAmountCents != null
                            ? ` · ref. ${formatCents(row.referenceAmountCents)}`
                            : ""}
                        </p>
                      </div>
                      <FinanceStatusBadge kind="billing" status={row.status} />
                    </div>
                    {canManage &&
                    (row.status === "requested" ||
                      row.status === "under_review") ? (
                      <ProcessBillingForm
                        billingRequestId={row.id}
                        engagementId={row.engagementId}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-navy">Recebimentos</h2>
            {dashboard.receipts.length === 0 ? (
              <EmptyState
                title="Nenhum recebimento no filtro"
                description="Valor contratado ≠ receita confirmada."
              />
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border bg-background text-sm">
                {dashboard.receipts.map((row) => (
                  <li key={row.id} className="space-y-2 px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/sistema/contratacoes/${row.engagement.id}`}
                          className="font-medium text-navy hover:underline"
                        >
                          {row.engagement.code}
                        </Link>
                        <p className="text-muted-foreground">
                          {row.customer.legalName} ·{" "}
                          {RECEIPT_KIND_LABELS[row.kind]} ·{" "}
                          {formatCents(row.amountCents)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ref. {formatDateTimeBr(row.referenceDate)}
                          {row.requestedAmountCents !== row.amountCents
                            ? ` · solicitado ${formatCents(row.requestedAmountCents)}`
                            : ""}
                          {row.confirmedManually
                            ? " · registrado pelo Financeiro"
                            : ""}
                        </p>
                      </div>
                      <FinanceStatusBadge kind="receipt" status={row.status} />
                    </div>
                    {canManage && row.status === "pending" ? (
                      <>
                        <ConfirmReceiptForm
                          receiptEntryId={row.id}
                          engagementId={row.engagementId}
                          requestedAmountCents={row.requestedAmountCents}
                        />
                        <RejectReceiptForm
                          receiptEntryId={row.id}
                          engagementId={row.engagementId}
                        />
                      </>
                    ) : null}
                    {canManage && row.status === "confirmed" ? (
                      <ReverseReceiptForm
                        receiptEntryId={row.id}
                        engagementId={row.engagementId}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </PlatformPage>
  );
}
