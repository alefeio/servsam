import type { Metadata } from "next";
import { PublicTendersListView } from "@/features/management/public-tenders-list-view";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Licitações"),
  robots: { index: false, follow: false },
};

export default function PublicTendersPage() {
  return <PublicTendersListView />;
}
