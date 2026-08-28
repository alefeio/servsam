import type { Metadata } from "next";
import { ClientsListView } from "@/features/clients/clients-list-view";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Clientes"),
  robots: { index: false, follow: false },
};

export default function ClientsPage() {
  return <ClientsListView />;
}
