import type { Metadata } from "next";
import { LeadsView } from "@/features/crm/leads-view";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Leads"),
  robots: { index: false, follow: false },
};

export default function LeadsPage() {
  return <LeadsView />;
}
