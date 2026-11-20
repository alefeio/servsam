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
import { formatBrDocument } from "@/lib/platform/br-document";
import { listCustomers } from "@/lib/platform/customers";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Clientes"),
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  q?: string | string[];
  arquivados?: string | string[];
}>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "customer.view"))
    return <NoAccess what="ver clientes" />;

  const params = await searchParams;
  const query = first(params.q);
  const includeArchived = first(params.arquivados) === "1";
  const customers = await listCustomers(actor, { query, includeArchived });
  const canCreate = userHasPermission(actor, "customer.create");

  return (
    <PlatformPage width="wide">
      <PageHeader
        title="Clientes"
        description="O cliente concentra contatos, unidades e orçamentos."
        actions={
          canCreate ? (
            <LinkButton href="/sistema/clientes/novo">Novo cliente</LinkButton>
          ) : null
        }
      />

      <form className="flex flex-wrap items-center gap-3" role="search">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar por nome ou documento"
          aria-label="Buscar clientes"
          className="h-8 w-full max-w-sm rounded-lg border border-input bg-background px-2.5 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="arquivados"
            value="1"
            defaultChecked={includeArchived}
          />
          Incluir arquivados
        </label>
        <button
          type="submit"
          className="h-8 rounded-lg border border-border bg-background px-3 text-sm hover:bg-muted"
        >
          Filtrar
        </button>
      </form>

      {customers.length === 0 ? (
        <EmptyState
          title="Nenhum cliente encontrado"
          description={
            query || includeArchived
              ? "Ajuste a busca ou os filtros e tente novamente."
              : "Cadastre o primeiro cliente para começar a jornada comercial."
          }
          action={
            canCreate && !query ? (
              <LinkButton href="/sistema/clientes/novo">Novo cliente</LinkButton>
            ) : null
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Cliente
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Documento
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Segmento
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Unidades
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Contatos
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Orçamentos
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/sistema/clientes/${customer.id}`}
                      className="font-medium text-navy hover:underline"
                    >
                      {customer.legalName}
                    </Link>
                    {customer.tradeName ? (
                      <p className="text-xs text-muted-foreground">
                        {customer.tradeName}
                      </p>
                    ) : null}
                    {customer.deletedAt ? (
                      <p className="text-xs text-destructive">Arquivado</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {formatBrDocument(customer.document) || "—"}
                  </td>
                  <td className="px-4 py-3">{customer.segment ?? "—"}</td>
                  <td className="px-4 py-3">{customer._count.units}</td>
                  <td className="px-4 py-3">{customer._count.contacts}</td>
                  <td className="px-4 py-3">{customer._count.proposals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PlatformPage>
  );
}
