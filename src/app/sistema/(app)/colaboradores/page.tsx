import type { Metadata } from "next";
import Link from "next/link";
import {
  EmptyState,
  LinkButton,
  NoAccess,
  PageHeader,
  PlatformPage,
} from "@/features/platform/form-parts";
import {
  requireAuthenticatedUser,
  userHasPermission,
} from "@/lib/platform/access";
import { listEmployees } from "@/lib/platform/employees";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Colaboradores"),
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  q?: string | string[];
  inativos?: string | string[];
}>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "employee.view"))
    return <NoAccess what="ver colaboradores" />;

  const params = await searchParams;
  const query = first(params.q);
  const includeInactive = first(params.inativos) === "1";
  const employees = await listEmployees(actor, { query, includeInactive });
  const canManage = userHasPermission(actor, "employee.manage");

  return (
    <PlatformPage width="wide">
      <PageHeader
        title="Colaboradores"
        description="Cadastro operacional mínimo para atribuição na agenda. Não cria conta de login."
        actions={
          canManage ? (
            <LinkButton href="/sistema/colaboradores/novo">
              Novo colaborador
            </LinkButton>
          ) : null
        }
      />

      <form className="flex flex-wrap items-center gap-3" role="search">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar por nome, cargo ou e-mail"
          aria-label="Buscar colaboradores"
          className="h-8 w-full max-w-sm rounded-lg border border-input bg-background px-2.5 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="inativos"
            value="1"
            defaultChecked={includeInactive}
          />
          Incluir inativos
        </label>
        <button
          type="submit"
          className="h-8 rounded-lg border border-border bg-background px-3 text-sm hover:bg-muted"
        >
          Filtrar
        </button>
      </form>

      {employees.length === 0 ? (
        <EmptyState
          title="Nenhum colaborador"
          description="Cadastre o responsável operacional antes de atribuir na agenda."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Função</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/sistema/colaboradores/${employee.id}`}
                      className="font-medium text-navy hover:underline"
                    >
                      {employee.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{employee.jobTitle}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {employee.phone || employee.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {employee.isActive ? "Ativo" : "Inativo"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PlatformPage>
  );
}
