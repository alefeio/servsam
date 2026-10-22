import type { Metadata } from "next";
import { PhotoReportsListView } from "@/features/presentation/photo-report-views";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Relatórios fotográficos"),
  robots: { index: false, follow: false },
};

export default function PhotoReportsPage() {
  return <PhotoReportsListView />;
}
