import type { Metadata } from "next";
import { DocumentsListView } from "@/features/governance/documents-list-view";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Documentos"),
  robots: { index: false, follow: false },
};

export default function DocumentsPage() {
  return <DocumentsListView />;
}
