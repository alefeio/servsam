import type { Metadata } from "next";
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
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Novo orçamento"),
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ cliente?: string | string[] }>;

export default async function NewProposalPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requireAuthenticatedUser();
  if (
    !userHasPermission(actor, "proposal.create") ||
    !userHasPermission(actor, "customer.view")
  ) {
    return <NoAccess what="criar orçamentos" />;
  }

  const params = await searchParams;
  const preselected = Array.isArray(params.cliente)
    ? params.cliente[0]
    : params.cliente;
  const customers = await listCustomerOptions(actor);

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Novo orçamento"
        description="Nasce como rascunho. O envio e o aceite são passos separados."
        actions={
          <LinkButton href="/sistema/orcamentos" variant="outline">
            Voltar
          </LinkButton>
        }
      />
      {customers.length === 0 ? (
        <p className="rounded-xl border border-border bg-background p-4 text-sm">
          Cadastre um cliente antes de criar o orçamento.
        </p>
      ) : (
        <ProposalForm
          customers={customers}
          proposal={{ customerId: preselected ?? "" }}
        />
      )}
    </section>
  );
}
