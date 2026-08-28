import type { Metadata } from "next";
import { OpportunityDetailView } from "@/features/crm/opportunity-detail-view";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import { pageTitle } from "@/lib/seo";

type OpportunityPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return seedDemoDataset.opportunities.map((opportunity) => ({
    id: opportunity.id,
  }));
}

export async function generateMetadata({
  params,
}: OpportunityPageProps): Promise<Metadata> {
  const { id } = await params;
  const opportunity = seedDemoDataset.opportunities.find((item) => item.id === id);
  return {
    title: pageTitle(opportunity?.title ?? "Oportunidade"),
    robots: { index: false, follow: false },
  };
}

export default async function OpportunityDetailPage({ params }: OpportunityPageProps) {
  const { id } = await params;
  return <OpportunityDetailView opportunityId={id} />;
}
