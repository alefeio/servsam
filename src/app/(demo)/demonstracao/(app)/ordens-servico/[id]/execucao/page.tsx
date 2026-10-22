import type { Metadata } from "next";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import { ExecutionView } from "@/features/presentation/execution-view";
import { pageTitle } from "@/lib/seo";

type PageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return seedDemoDataset.workOrders.map((workOrder) => ({ id: workOrder.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const workOrder = seedDemoDataset.workOrders.find((item) => item.id === id);
  return {
    title: pageTitle(workOrder ? `Execução ${workOrder.code}` : "Execução"),
    robots: { index: false, follow: false },
  };
}

export default async function ExecutionPage({ params }: PageProps) {
  const { id } = await params;
  return <ExecutionView workOrderId={id} />;
}
