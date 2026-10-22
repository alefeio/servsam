import type { Metadata } from "next";
import { EmployeesListView } from "@/features/presentation/employee-views";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Colaboradores"),
  robots: { index: false, follow: false },
};

export default function EmployeesPage() {
  return <EmployeesListView />;
}
