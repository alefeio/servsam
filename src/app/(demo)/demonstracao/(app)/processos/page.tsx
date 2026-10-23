import type { Metadata } from "next";
import { EnvironmentalProcessListView } from "@/features/presentation/environmental-process-views";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Processos ambientais"),
  robots: { index: false, follow: false },
};

export default function EnvironmentalProcessesPage() {
  return <EnvironmentalProcessListView />;
}
