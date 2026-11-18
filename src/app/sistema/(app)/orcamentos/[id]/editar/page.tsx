import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  LinkButton,
  NoAccess,
  PageHeader,
} from "@/features/platform/form-parts";
import { ProposalForm } from "@/features/platform/proposal-form";
import {
  requireAuthenticatedUser,
  userHasPermission,
} from "@/lib/platform/access";
import { listCustomerOptions } from "@/lib/platform/customers";
import { toDateInputValue } from "@/lib/platform/dates";
import { isEditable } from "@/lib/platform/proposal-state";
import { getProposalDetail } from "@/lib/platform/proposals";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Editar orçamento"),
  robots: { index: false, follow: false },
};

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAuthenticatedUser();
  const allowed =
    userHasPermission(actor, "proposal.update") &&
    userHasPermission(actor, "proposal.view") &&
    userHasPermission(actor, "customer.view");
  if (!allowed) return <NoAccess what="editar orçamentos" />;

  const { id } = await params;
  const proposal = await getProposalDetail(actor, id);
  if (!proposal) notFound();

  if (!isEditable(proposal.status)) {
    return (
      <section className="mx-auto max-w-3xl space-y-4">
        <PageHeader title={`${proposal.code} · ${proposal.title}`} />
        <p className="rounded-xl border border-border bg-background p-4 text-sm">
          Só rascunho pode ser editado. Para ajustar, crie uma nova proposta a
          partir desta.
        </p>
        <LinkButton
          href={`/sistema/orcamentos/${proposal.id}`}
          variant="outline"
        >
          Voltar ao orçamento
        </LinkButton>
      </section>
    );
  }

  const customers = await listCustomerOptions(actor);

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={`Editar ${proposal.code}`}
        actions={
          <LinkButton
            href={`/sistema/orcamentos/${proposal.id}`}
            variant="outline"
          >
            Voltar
          </LinkButton>
        }
      />
      <ProposalForm
        customers={customers}
        proposal={{
          id: proposal.id,
          customerId: proposal.customerId,
          customerUnitId: proposal.customerUnitId,
          title: proposal.title,
          validUntil: proposal.validUntil
            ? toDateInputValue(proposal.validUntil)
            : undefined,
          paymentTerms: proposal.paymentTerms,
          commercialConditions: proposal.commercialConditions,
          observations: proposal.observations,
          discountCents: proposal.discountCents,
          items: proposal.items.map((item) => ({
            description: item.description,
            quantity: String(item.quantity),
            unitPriceCents: item.unitPriceCents,
          })),
        }}
      />
    </section>
  );
}
