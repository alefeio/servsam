import type { Metadata } from "next";
import { DashboardPreview } from "@/features/dashboard/dashboard-preview";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Visão geral"),
  robots: { index: false, follow: false },
};

export default function DemoDashboardPage() {
  return <DashboardPreview />;
}
