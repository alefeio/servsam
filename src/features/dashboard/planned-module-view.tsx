import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button-link";
import type { PlannedModule } from "@/types/demo";

export function PlannedModuleView({ module }: { module: PlannedModule }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/demonstracao" />}>
              Visão geral
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{module.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="rounded-xl border border-dashed border-teal/40 bg-card p-8">
        <p className="text-sm font-medium tracking-wide text-teal uppercase">
          Módulo planejado - ainda não implementado
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{module.name}</h1>
        <p className="mt-4 text-muted-foreground">{module.objective}</p>
        <p className="mt-4 text-sm">
          Sprint prevista: <strong>Sprint {module.plannedSprint}</strong>
        </p>
        <div className="mt-8">
          <ButtonLink href="/demonstracao">Voltar para a visão geral</ButtonLink>
        </div>
      </div>
    </div>
  );
}
