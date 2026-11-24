import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { formatDateTimeBr } from "@/lib/platform/dates";
import {
  getEmployeeDetail,
  getEmployeeHistory,
} from "@/lib/platform/employees";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Colaborador"),
  robots: { index: false, follow: false },
};

const HISTORY_LABELS: Record<string, string> = {
  EMPLOYEE_CREATED: "Criado",
  EMPLOYEE_UPDATED: "Alterado",
};

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAuthenticatedUser();
  if (!userHasPermission(actor, "employee.view"))
    return <NoAccess what="ver colaboradores" />;

  const { id } = await params;
  const employee = await getEmployeeDetail(actor, id);
  if (!employee) notFound();

  const canManage = userHasPermission(actor, "employee.manage");
  const history = userHasPermission(actor, "audit.view")
    ? await getEmployeeHistory(actor, employee.id)
    : [];

  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title={employee.fullName}
        description={`${employee.jobTitle} · ${employee.isActive ? "Ativo" : "Inativo"}`}
        actions={
          <LinkButton href="/sistema/colaboradores" variant="outline">
            Voltar
          </LinkButton>
        }
      />

      {canManage ? (
        <EmployeeForm
          employee={{
            id: employee.id,
            fullName: employee.fullName,
            jobTitle: employee.jobTitle,
            phone: employee.phone,
            email: employee.email,
            notes: employee.notes,
            isActive: employee.isActive,
          }}
        />
      ) : (
        <dl className="grid gap-3 rounded-xl border border-border bg-background p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Telefone</dt>
            <dd className="font-medium">{employee.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">E-mail</dt>
            <dd className="font-medium">{employee.email ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Observações</dt>
            <dd className="mt-1 whitespace-pre-wrap">
              {employee.notes ?? "—"}
            </dd>
          </div>
        </dl>
      )}

      {history.length > 0 ? (
        <section className="space-y-3" aria-labelledby="historico-colab">
          <h2 id="historico-colab" className="text-lg font-semibold text-navy">
            Histórico
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-background text-sm">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap justify-between gap-2 px-4 py-3"
              >
                <span>{HISTORY_LABELS[entry.action] ?? entry.action}</span>
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
