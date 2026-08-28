import type { Metadata } from "next";
import { ReportsView } from "@/features/presentation/reports-view";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Relatórios"),
  robots: { index: false, follow: false },
};

export default function ReportsPage() {
  return <ReportsView />;
}
