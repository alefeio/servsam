import type { Metadata } from "next";
import { WorkOrdersListView } from "@/features/operations/work-orders-list-view";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Ordens de serviço"),
  robots: { index: false, follow: false },
};

export default function WorkOrdersPage() {
  return <WorkOrdersListView />;
}
