import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerForm } from "@/features/platform/customer-forms";
import {
  LinkButton,
  NoAccess,
  PageHeader,
} from "@/features/platform/form-parts";
import {
  requireAuthenticatedUser,
  userHasPermission,
} from "@/lib/platform/access";
import { getCustomerDetail } from "@/lib/platform/customers";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Editar cliente"),
  robots: { index: false, follow: false },
};

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAuthenticatedUser();
  if (
    !userHasPermission(actor, "customer.update") ||
    !userHasPermission(actor, "customer.view")
  ) {
    return <NoAccess what="editar clientes" />;
  }
  const { id } = await params;
  const customer = await getCustomerDetail(actor, id);
  if (!customer || customer.deletedAt) notFound();

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Editar cliente"
        actions={
          <LinkButton
            href={`/sistema/clientes/${customer.id}`}
            variant="outline"
          >
            Voltar
          </LinkButton>
        }
      />
      <CustomerForm
        customer={{
          id: customer.id,
          legalName: customer.legalName,
          tradeName: customer.tradeName,
          document: customer.document,
          segment: customer.segment,
          notes: customer.notes,
        }}
      />
    </section>
  );
}
