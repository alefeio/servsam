import type { Metadata } from "next";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import { PhotoReportDetailView } from "@/features/presentation/photo-report-views";
import { pageTitle } from "@/lib/seo";

type PageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return seedDemoDataset.photoReports.map((report) => ({ id: report.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const report = seedDemoDataset.photoReports.find((item) => item.id === id);
  return {
    title: pageTitle(report?.title ?? "Relatório fotográfico"),
    robots: { index: false, follow: false },
  };
}

export default async function PhotoReportPage({ params }: PageProps) {
  const { id } = await params;
  return <PhotoReportDetailView reportId={id} />;
}
