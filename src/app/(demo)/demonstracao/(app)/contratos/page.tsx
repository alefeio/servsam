import type { Metadata } from "next";
import { ContractsListView } from "@/features/governance/contracts-list-view";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Contratos"),
  robots: { index: false, follow: false },
};

export default function ContractsPage() {
  return <ContractsListView />;
}
