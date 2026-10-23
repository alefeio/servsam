import type { Metadata } from "next";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import { EnvironmentalProcessDetailView } from "@/features/presentation/environmental-process-views";
import { pageTitle } from "@/lib/seo";

type PageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return seedDemoDataset.environmentalProcesses.map((process) => ({ id: process.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const process = seedDemoDataset.environmentalProcesses.find((item) => item.id === id);
  return {
    title: pageTitle(process?.code ?? "Processo ambiental"),
    robots: { index: false, follow: false },
  };
}

export default async function EnvironmentalProcessPage({ params }: PageProps) {
  const { id } = await params;
  return <EnvironmentalProcessDetailView processId={id} />;
}
