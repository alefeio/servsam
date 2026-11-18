import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROPOSAL_STATUS_HINTS } from "@/data/platform/labels";
import {
  LinkButton,
  NoAccess,
  PageHeader,
  ProposalStatusBadge,
} from "@/features/platform/form-parts";
import {
  ArchiveProposalButton,
  ReviseProposalButton,
  TransitionButton,
} from "@/features/platform/proposal-form";
import {
  requireAuthenticatedUser,
  userHasPermission,
} from "@/lib/platform/access";
import { formatDateBr, formatDateTimeBr } from "@/lib/platform/dates";
import { formatCents } from "@/lib/platform/money";
import {
  canRevise,
  isEditable,
  isPastValidity,
} from "@/lib/platform/proposal-state";
import {
  getProposalDetail,
  getProposalHistory,
} from "@/lib/platform/proposals";
import { pageTitle } from "@/lib/seo";
import { PROPOSAL_STATUS_LABELS } from "@/data/platform/labels";

export const metadata: Metadata = {
  title: pageTitle("Orçamento"),
  robots: { index: false, follow: false },
};

const HISTORY_LABELS: Record<string, string> = {
  PROPOSAL_CREATED: "Criado",
  PROPOSAL_UPDATED: "Editado",
  PROPOSAL_ARCHIVED: "Arquivado",
  PROPOSAL_STATUS_CHANGED: "Situação alterada",
  PROPOSAL_REVISED: "Criado a partir de outra proposta",
};

function historyDetail(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "";
  const { from, to } = metadata as { from?: string; to?: string };
  if (from && to) {
    const label = (value: string) =>
      PROPOSAL_STATUS_LABELS[value as keyof typeof PROPOSAL_STATUS_LABELS] ??
      value;
    return `${label(from)} → ${label(to)}`;
  }
  return "";
}

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "proposal.view"))
    return <NoAccess what="ver orçamentos" />;

  const { id } = await params;
  const proposal = await getProposalDetail(actor, id);
  if (!proposal) notFound();

  const can = (key: string) => userHasPermission(actor, key);
  const history = can("audit.view")
    ? await getProposalHistory(actor, proposal.id)
    : [];
  const now = new Date();
  const pastValidity = isPastValidity(proposal.validUntil, now);
  const subtotalCents = proposal.items.reduce(
    (sum, item) => sum + item.totalCents,
    0,
  );

  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title={`${proposal.code} · ${proposal.title}`}
        description={PROPOSAL_STATUS_HINTS[proposal.status]}
        actions={
          <>
            <LinkButton href="/sistema/orcamentos" variant="outline">
              Voltar
            </LinkButton>
            {isEditable(proposal.status) && can("proposal.update") ? (
              <LinkButton href={`/sistema/orcamentos/${proposal.id}/editar`}>
                Editar
              </LinkButton>
            ) : null}
          </>
        }
      />

      <dl className="grid gap-3 rounded-xl border border-border bg-background p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Situação</dt>
          <dd className="mt-1">
            <ProposalStatusBadge status={proposal.status} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Cliente</dt>
          <dd className="font-medium">
            {can("customer.view") ? (
              <Link
                href={`/sistema/clientes/${proposal.customer.id}`}
                className="text-navy hover:underline"
              >
                {proposal.customer.legalName}
              </Link>
            ) : (
              proposal.customer.legalName
            )}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Unidade</dt>
          <dd className="font-medium">{proposal.customerUnit?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Válido até</dt>
          <dd className="font-medium">
            {formatDateBr(proposal.validUntil)}
            {proposal.status === "sent" && pastValidity ? (
              <span className="block text-xs text-destructive">
                Validade vencida
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Enviado em</dt>
          <dd className="font-medium">{formatDateTimeBr(proposal.sentAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Decidido em</dt>
          <dd className="font-medium">
            {formatDateTimeBr(proposal.decidedAt)}
          </dd>
        </div>
        {proposal.rejectionReason ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Motivo da recusa</dt>
            <dd>{proposal.rejectionReason}</dd>
          </div>
        ) : null}
        {proposal.supersedes ? (
          <div>
            <dt className="text-muted-foreground">Substitui</dt>
            <dd>
              <Link
                href={`/sistema/orcamentos/${proposal.supersedes.id}`}
                className="text-navy hover:underline"
              >
                {proposal.supersedes.code}
              </Link>
            </dd>
          </div>
        ) : null}
        {proposal.successors.length > 0 ? (
          <div>
            <dt className="text-muted-foreground">Substituído por</dt>
            <dd className="space-x-2">
              {proposal.successors.map((successor) => (
                <Link
                  key={successor.id}
                  href={`/sistema/orcamentos/${successor.id}`}
                  className="text-navy hover:underline"
                >
                  {successor.code}
                </Link>
              ))}
            </dd>
          </div>
        ) : null}
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
              {proposal.items.map((item) => (
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
            <tfoot className="text-sm">
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-2 text-right text-muted-foreground"
                >
                  Subtotal
                </td>
                <td className="px-4 py-2 text-right">
                  {formatCents(subtotalCents)}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-2 text-right text-muted-foreground"
                >
                  Desconto
                </td>
                <td className="px-4 py-2 text-right">
                  {formatCents(proposal.discountCents)}
                </td>
              </tr>
              <tr className="font-semibold text-navy">
                <td colSpan={4} className="px-4 py-3 text-right">
                  Total
                </td>
                <td className="px-4 py-3 text-right">
                  {formatCents(proposal.totalCents)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {proposal.paymentTerms ||
      proposal.commercialConditions ||
      proposal.observations ? (
        <section className="space-y-3 rounded-xl border border-border bg-background p-4 text-sm">
          {proposal.paymentTerms ? (
            <div>
              <h3 className="font-medium">Condições de pagamento</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {proposal.paymentTerms}
              </p>
            </div>
          ) : null}
          {proposal.commercialConditions ? (
            <div>
              <h3 className="font-medium">Condições comerciais</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {proposal.commercialConditions}
              </p>
            </div>
          ) : null}
          {proposal.observations ? (
            <div>
              <h3 className="font-medium">Observações</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {proposal.observations}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-4" aria-labelledby="acoes">
        <h2 id="acoes" className="text-lg font-semibold text-navy">
          Ações
        </h2>
        <div className="flex flex-wrap items-start gap-6">
          {proposal.status === "draft" && can("proposal.send") ? (
            <TransitionButton
              proposalId={proposal.id}
              to="sent"
              label="Marcar como enviado"
            />
          ) : null}
          {proposal.status === "sent" &&
          can("proposal.approve") &&
          !pastValidity ? (
            <TransitionButton
              proposalId={proposal.id}
              to="accepted"
              label="Registrar aceite"
            />
          ) : null}
          {proposal.status === "sent" && can("proposal.approve") ? (
            <TransitionButton
              proposalId={proposal.id}
              to="rejected"
              label="Registrar recusa"
              variant="outline"
              withReason
            />
          ) : null}
          {proposal.status === "sent" &&
          can("proposal.update") &&
          pastValidity ? (
            <TransitionButton
              proposalId={proposal.id}
              to="expired"
              label="Marcar como expirado"
              variant="outline"
            />
          ) : null}
          {canRevise(proposal.status) && can("proposal.create") ? (
            <ReviseProposalButton proposalId={proposal.id} />
          ) : null}
          {proposal.status === "draft" && can("proposal.update") ? (
            <ArchiveProposalButton proposalId={proposal.id} />
          ) : null}
        </div>
        {proposal.status === "accepted" ? (
          <p className="text-sm text-muted-foreground">
            Aceito não volta. Para ajustar, crie uma nova proposta a partir
            desta.
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
                <span>
                  {HISTORY_LABELS[entry.action] ?? entry.action}
                  {historyDetail(entry.metadata)
                    ? ` · ${historyDetail(entry.metadata)}`
                    : ""}
                </span>
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
