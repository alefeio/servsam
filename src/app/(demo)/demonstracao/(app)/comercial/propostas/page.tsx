import type { Metadata } from "next";
import { ProposalsListView } from "@/features/crm/proposals-list-view";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Propostas"),
  robots: { index: false, follow: false },
};

export default function ProposalsPage() {
  return <ProposalsListView />;
}
