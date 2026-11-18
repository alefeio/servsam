"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoDatasetStore } from "@/features/crm/use-demo-dataset-store";
import { PresentationPageHeader } from "@/features/presentation/presentation-page-header";
import type { DemoEmployeeHrKind } from "@/types/demo-entities";

const HR_SECTIONS: Array<{ kind: DemoEmployeeHrKind; label: string }> = [
  { kind: "vacation", label: "Férias" },
  { kind: "absence", label: "Faltas" },
  { kind: "medical_certificate", label: "Atestados" },
  { kind: "warning", label: "Advertências" },
  { kind: "suspension", label: "Suspensões" },
  { kind: "occurrence", label: "Ocorrências" },
];

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
  const hrRecords = employee.hrRecords ?? [];
  // Texto livre antigo só aparece quando ainda não há registros estruturados.
  const legacyWarnings = hrRecords.length > 0 ? [] : (employee.warnings ?? []);

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
          <p><span className="text-muted-foreground">Documento:</span> {employee.identityDocument ?? "Não informado neste fixture"}</p>
          <p><span className="text-muted-foreground">Situação:</span> {employee.situation ?? "Ativo nesta demonstração"}</p>
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
          <CardTitle>Histórico de RH</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="rounded-md border border-dashed border-teal/50 px-3 py-2 text-xs text-muted-foreground">
            Dados demonstrativos fictícios. Mostram o que o módulo de pessoas poderia guardar; não
            há dados clínicos e o que registrar de verdade ainda precisa de validação do cliente.
          </p>
          {HR_SECTIONS.map((section) => {
            const records = hrRecords.filter((record) => record.kind === section.kind);
            return (
              <section key={section.kind} className="space-y-1">
                <h3 className="font-medium text-navy">{section.label}</h3>
                {records.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum registro neste fixture.</p>
                ) : (
                  <ul className="space-y-1">
                    {records.map((record) => (
                      <li key={record.id}>
                        <span className="font-medium">{record.title}</span>
                        <span className="text-muted-foreground">
                          {" · "}
                          {record.startedAt}
                          {record.endedAt ? ` → ${record.endedAt}` : ""}
                        </span>
                        <p className="text-muted-foreground">{record.note}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
          {legacyWarnings.length > 0 ? (
            <section className="space-y-1">
              <h3 className="font-medium text-navy">Histórico anterior (texto livre)</h3>
              <ul className="space-y-1">
                {legacyWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
