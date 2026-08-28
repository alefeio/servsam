import type { Metadata } from "next";
import { FinanceView } from "@/features/management/finance-view";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Financeiro"),
  robots: { index: false, follow: false },
};

export default function FinancePage() {
  return <FinanceView />;
}
