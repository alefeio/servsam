"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { PresentationPageHeader } from "@/features/presentation/presentation-page-header";

export function EmployeesListView() {
  const { dataset } = useDemoDatasetStore();

  return (
    <div className="space-y-6">
      <PresentationPageHeader
        title="Colaboradores"
        description="Cadastro visual para o cliente dizer o que o módulo de pessoas precisa guardar. Não é folha nem RH de produção."
      />
      <ul className="space-y-3">
        {dataset.employees.map((employee) => (
          <li key={employee.id}>
            <Link href={`/demonstracao/colaboradores/${employee.id}`} className="block rounded-lg border border-border bg-card p-4 hover:border-teal">
              <p className="font-medium text-navy">{employee.name}</p>
              <p className="text-sm text-muted-foreground">{employee.role}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmployeeDetailView({ employeeId }: { employeeId: string }) {
  const { dataset } = useDemoDatasetStore();
  const employee = dataset.employees.find((item) => item.id === employeeId);
  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <PresentationPageHeader
        title={employee.name}
        description={employee.role}
        backHref="/demonstracao/colaboradores"
        backLabel="Colaboradores"
      />
      <Card>
        <CardHeader>
          <CardTitle>Cadastro</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p><span className="text-muted-foreground">Função:</span> {employee.role}</p>
          <p><span className="text-muted-foreground">Telefone:</span> {employee.phone}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Documentos, ASO, NR e EPI</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {employee.documents.map((document) => (
              <li key={document.label}>
                <span className="font-medium">{document.label}:</span> {document.status}
                {document.expiresAt ? ` · ${document.expiresAt}` : ""}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Treinamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {(employee.trainings ?? ["Nenhum treinamento neste fixture."]).map((training) => (
              <li key={training}>{training}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Advertências e histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {employee.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
