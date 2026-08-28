import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlannedModuleView } from "@/features/dashboard/planned-module-view";
import { demoRepository } from "@/lib/repositories/demo-repository";
import { pageTitle } from "@/lib/seo";

type PlannedPageProps = {
  params: Promise<{ module: string[] }>;
};

export function generateStaticParams() {
  return demoRepository.getPlannedModules().map((module) => ({
    module: module.href.replace("/demonstracao/", "").split("/"),
  }));
}

export async function generateMetadata({
  params,
}: PlannedPageProps): Promise<Metadata> {
  const { module } = await params;
  const href = `/demonstracao/${module.join("/")}`;
  const planned = demoRepository.getPlannedModuleByHref(href);
  return {
    title: pageTitle(planned?.name ?? "Módulo planejado"),
    robots: { index: false, follow: false },
  };
}

export default async function PlannedModulePage({ params }: PlannedPageProps) {
  const { module } = await params;
  const href = `/demonstracao/${module.join("/")}`;
  const planned = demoRepository.getPlannedModuleByHref(href);
  if (!planned) {
    notFound();
  }
  return <PlannedModuleView module={planned} />;
}
