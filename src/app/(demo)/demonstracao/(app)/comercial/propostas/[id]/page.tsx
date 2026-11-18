import type { Metadata } from "next";
import { ProposalDetailView } from "@/features/crm/proposal-detail-view";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import { pageTitle } from "@/lib/seo";

type ProposalPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return seedDemoDataset.proposals.map((proposal) => ({ id: proposal.id }));
}

export async function generateMetadata({
  params,
}: ProposalPageProps): Promise<Metadata> {
  const { id } = await params;
  const proposal = seedDemoDataset.proposals.find((item) => item.id === id);
  return {
    title: pageTitle(proposal ? `Orçamento ${proposal.code}` : "Orçamento"),
    robots: { index: false, follow: false },
  };
}

export default async function ProposalDetailPage({ params }: ProposalPageProps) {
  const { id } = await params;
  return <ProposalDetailView proposalId={id} />;
}
