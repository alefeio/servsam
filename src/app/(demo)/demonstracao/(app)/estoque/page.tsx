import type { Metadata } from "next";
import { InventoryListView } from "@/features/management/inventory-list-view";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Estoque"),
  robots: { index: false, follow: false },
};

export default function InventoryPage() {
  return <InventoryListView />;
}
