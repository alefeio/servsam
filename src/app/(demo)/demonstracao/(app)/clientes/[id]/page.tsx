import type { Metadata } from "next";
import { ClientDetailView } from "@/features/clients/client-detail-view";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import { pageTitle } from "@/lib/seo";

type ClientPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return seedDemoDataset.clients.map((client) => ({ id: client.id }));
}

export async function generateMetadata({
  params,
}: ClientPageProps): Promise<Metadata> {
  const { id } = await params;
  const client = seedDemoDataset.clients.find((item) => item.id === id);
  return {
    title: pageTitle(client?.alias ?? "Cliente"),
    robots: { index: false, follow: false },
  };
}

export default async function ClientDetailPage({ params }: ClientPageProps) {
  const { id } = await params;
  return <ClientDetailView clientId={id} />;
}
