import type { Metadata } from "next";
import { ContractDetailView } from "@/features/governance/contract-detail-view";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import { pageTitle } from "@/lib/seo";

type ContractPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return seedDemoDataset.contracts.map((contract) => ({ id: contract.id }));
}

export async function generateMetadata({
  params,
}: ContractPageProps): Promise<Metadata> {
  const { id } = await params;
  const contract = seedDemoDataset.contracts.find((item) => item.id === id);
  return {
    title: pageTitle(contract?.code ?? "Contrato"),
    robots: { index: false, follow: false },
  };
}

export default async function ContractDetailPage({ params }: ContractPageProps) {
  const { id } = await params;
  return <ContractDetailView contractId={id} />;
}
