import type { Metadata } from "next";
import { PublicTenderDetailView } from "@/features/management/public-tender-detail-view";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import { pageTitle } from "@/lib/seo";

type TenderPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return seedDemoDataset.publicTenders.map((tender) => ({ id: tender.id }));
}

export async function generateMetadata({
  params,
}: TenderPageProps): Promise<Metadata> {
  const { id } = await params;
  const tender = seedDemoDataset.publicTenders.find((item) => item.id === id);
  return {
    title: pageTitle(tender?.code ?? "Licitação"),
    robots: { index: false, follow: false },
  };
}

export default async function PublicTenderDetailPage({ params }: TenderPageProps) {
  const { id } = await params;
  return <PublicTenderDetailView tenderId={id} />;
}
