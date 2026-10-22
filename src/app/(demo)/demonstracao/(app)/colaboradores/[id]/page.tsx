import type { Metadata } from "next";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import { EmployeeDetailView } from "@/features/presentation/employee-views";
import { pageTitle } from "@/lib/seo";

type PageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return seedDemoDataset.employees.map((employee) => ({ id: employee.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const employee = seedDemoDataset.employees.find((item) => item.id === id);
  return {
    title: pageTitle(employee?.name ?? "Colaborador"),
    robots: { index: false, follow: false },
  };
}

export default async function EmployeePage({ params }: PageProps) {
  const { id } = await params;
  return <EmployeeDetailView employeeId={id} />;
}
