import type { Metadata } from "next";
import { WorkOrderDetailView } from "@/features/operations/work-order-detail-view";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import { pageTitle } from "@/lib/seo";

type WorkOrderPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return seedDemoDataset.workOrders.map((workOrder) => ({ id: workOrder.id }));
}

export async function generateMetadata({
  params,
}: WorkOrderPageProps): Promise<Metadata> {
  const { id } = await params;
  const workOrder = seedDemoDataset.workOrders.find((item) => item.id === id);
  return {
    title: pageTitle(workOrder?.code ?? "Ordem de serviço"),
    robots: { index: false, follow: false },
  };
}

export default async function WorkOrderDetailPage({ params }: WorkOrderPageProps) {
  const { id } = await params;
  return <WorkOrderDetailView workOrderId={id} />;
}
