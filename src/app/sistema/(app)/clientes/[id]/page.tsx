import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArchiveContactForm,
  ArchiveCustomerForm,
  ArchiveUnitForm,
  ContactForm,
  RestoreCustomerForm,
  UnitForm,
} from "@/features/platform/customer-forms";
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
import { formatBrDocument } from "@/lib/platform/br-document";
import { getCustomerDetail } from "@/lib/platform/customers";
import { formatCents } from "@/lib/platform/money";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Cliente"),
  robots: { index: false, follow: false },
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "customer.view"))
    return <NoAccess what="ver clientes" />;

  const { id } = await params;
  const customer = await getCustomerDetail(actor, id);
  if (!customer) notFound();

  const canUpdate = userHasPermission(actor, "customer.update");
  const canSeeProposals = userHasPermission(actor, "proposal.view");
  const canCreateProposal = userHasPermission(actor, "proposal.create");
  const archived = customer.deletedAt !== null;

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title={customer.legalName}
        description={customer.tradeName ?? undefined}
        actions={
          <>
            <LinkButton href="/sistema/clientes" variant="outline">
              Voltar
            </LinkButton>
            {canUpdate && !archived ? (
              <LinkButton href={`/sistema/clientes/${customer.id}/editar`}>
                Editar
              </LinkButton>
            ) : null}
          </>
        }
      />

      {archived ? (
        <div className="space-y-3 rounded-xl border border-border bg-background p-4 text-sm">
          <p>Este cliente está arquivado. O histórico permanece no sistema.</p>
          {canUpdate ? <RestoreCustomerForm customerId={customer.id} /> : null}
        </div>
      ) : null}

      <dl className="grid gap-3 rounded-xl border border-border bg-background p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Documento</dt>
          <dd className="font-medium">
            {formatBrDocument(customer.document) || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Segmento</dt>
          <dd className="font-medium">{customer.segment ?? "—"}</dd>
        </div>
        <div className="sm:col-span-3">
          <dt className="text-muted-foreground">Observações</dt>
          <dd className="whitespace-pre-wrap">{customer.notes ?? "—"}</dd>
        </div>
      </dl>

      <section className="space-y-4" aria-labelledby="contatos">
        <h2 id="contatos" className="text-lg font-semibold text-navy">
          Contatos
        </h2>
        {customer.contacts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
            Nenhum contato cadastrado. Inclua o responsável comercial ou técnico do cliente.
          </p>
        ) : (
          <ul className="space-y-3">
            {customer.contacts.map((contact) => (
              <li
                key={contact.id}
                className="rounded-xl border border-border bg-background p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {contact.name}
                      {contact.isPrimary ? (
                        <span className="ml-2 text-xs font-normal text-teal">
                          Principal
                        </span>
                      ) : null}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[contact.roleTitle, contact.email, contact.phone]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  {canUpdate && !archived ? (
                    <ArchiveContactForm contactId={contact.id} />
                  ) : null}
                </div>
                {canUpdate && !archived ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-navy">
                      Editar contato
                    </summary>
                    <div className="mt-3">
                      <ContactForm customerId={customer.id} contact={contact} />
                    </div>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {canUpdate && !archived ? (
          <details className="rounded-xl border border-border bg-background p-4">
            <summary className="cursor-pointer text-sm font-medium text-navy">
              Novo contato
            </summary>
            <div className="mt-3">
              <ContactForm customerId={customer.id} />
            </div>
          </details>
        ) : null}
      </section>

      <section className="space-y-4" aria-labelledby="unidades">
        <h2 id="unidades" className="text-lg font-semibold text-navy">
          Unidades
        </h2>
        {customer.units.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma unidade cadastrada.
          </p>
        ) : (
          <ul className="space-y-3">
            {customer.units.map((unit) => (
              <li
                key={unit.id}
                className="rounded-xl border border-border bg-background p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{unit.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {[
                        unit.addressLine,
                        unit.city,
                        unit.state,
                        unit.postalCode,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  {canUpdate && !archived ? (
                    <ArchiveUnitForm unitId={unit.id} />
                  ) : null}
                </div>
                {canUpdate && !archived ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-navy">
                      Editar unidade
                    </summary>
                    <div className="mt-3">
                      <UnitForm customerId={customer.id} unit={unit} />
                    </div>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {canUpdate && !archived ? (
          <details className="rounded-xl border border-border bg-background p-4">
            <summary className="cursor-pointer text-sm font-medium text-navy">
              Nova unidade
            </summary>
            <div className="mt-3">
              <UnitForm customerId={customer.id} />
            </div>
          </details>
        ) : null}
      </section>

      {canSeeProposals ? (
        <section className="space-y-4" aria-labelledby="orcamentos">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="orcamentos" className="text-lg font-semibold text-navy">
              Orçamentos
            </h2>
            {canCreateProposal && !archived ? (
              <LinkButton href="/sistema/orcamentos/novo" variant="outline">
                Novo orçamento
              </LinkButton>
            ) : null}
          </div>
          {customer.proposals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum orçamento para este cliente.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-background">
              {customer.proposals.map((proposal) => (
                <li
                  key={proposal.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                >
                  <Link
                    href={`/sistema/orcamentos/${proposal.id}`}
                    className="font-medium text-navy hover:underline"
                  >
                    {proposal.code} · {proposal.title}
                  </Link>
                  <span className="flex items-center gap-3">
                    <span>{formatCents(proposal.totalCents)}</span>
                    <ProposalStatusBadge status={proposal.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {canUpdate && !archived ? (
        <section className="space-y-2 border-t border-border pt-6">
          <h2 className="text-sm font-medium text-muted-foreground">
            Arquivar
          </h2>
          <p className="text-sm text-muted-foreground">
            O cliente sai das listas e dos novos orçamentos. O histórico
            permanece.
          </p>
          <ArchiveCustomerForm customerId={customer.id} />
        </section>
      ) : null}
    </section>
  );
}
