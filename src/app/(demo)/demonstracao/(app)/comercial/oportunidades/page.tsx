import type { Metadata } from "next";
import { OpportunitiesKanbanView } from "@/features/crm/opportunities-kanban-view";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Oportunidades"),
  robots: { index: false, follow: false },
};

export default function OpportunitiesPage() {
  return <OpportunitiesKanbanView />;
}
