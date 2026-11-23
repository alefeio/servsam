import type { Metadata } from "next";
import {
  LinkButton,
  NoAccess,
  PageHeader,
} from "@/features/platform/form-parts";
import { PurchaseOrderForm } from "@/features/platform/purchase-order-form";
import {
  requireAuthenticatedUser,
  userHasPermission,
} from "@/lib/platform/access";
import { listCustomerOptions } from "@/lib/platform/customers";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Registrar O.C."),
  robots: { index: false, follow: false },
};

export default async function NewPurchaseOrderPage() {
  const actor = await requireAuthenticatedUser();
  if (
    !userHasPermission(actor, "contract.manage") ||
    !userHasPermission(actor, "customer.view")
  ) {
    return <NoAccess what="registrar ordens de compra" />;
  }

  const customers = await listCustomerOptions(actor);

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Registrar O.C. recebida"
        description="Documento do contratante. Permite contratação sem orçamento interno."
        actions={
          <LinkButton href="/sistema/ordens-compra" variant="outline">
            Voltar
          </LinkButton>
        }
      />
      {customers.length === 0 ? (
        <p className="rounded-xl border border-border bg-background p-4 text-sm">
          Cadastre um cliente antes de registrar a O.C.
        </p>
      ) : (
        <PurchaseOrderForm customers={customers} />
      )}
    </section>
  );
}
