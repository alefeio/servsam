import type { Metadata } from "next";
import { EmployeeForm } from "@/features/platform/employee-forms";
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
  title: pageTitle("Novo colaborador"),
  robots: { index: false, follow: false },
};

export default async function NewEmployeePage() {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "employee.manage"))
    return <NoAccess what="cadastrar colaboradores" />;

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Novo colaborador"
        description="Entidade operacional. Não gera usuário de acesso ao sistema."
        actions={
          <LinkButton href="/sistema/colaboradores" variant="outline">
            Voltar
          </LinkButton>
        }
      />
      <EmployeeForm />
    </section>
  );
}
