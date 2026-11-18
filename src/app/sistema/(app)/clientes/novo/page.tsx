import type { Metadata } from "next";
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
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Novo cliente"),
  robots: { index: false, follow: false },
};

export default async function NewCustomerPage() {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "customer.create"))
    return <NoAccess what="cadastrar clientes" />;

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Novo cliente"
        description="Contatos e unidades entram depois do cadastro."
        actions={
          <LinkButton href="/sistema/clientes" variant="outline">
            Voltar
          </LinkButton>
        }
      />
      <CustomerForm />
    </section>
  );
}
