import type { Metadata } from "next";
import { DocumentDetailView } from "@/features/governance/document-detail-view";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import { pageTitle } from "@/lib/seo";

type DocumentPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return seedDemoDataset.documents.map((document) => ({ id: document.id }));
}

export async function generateMetadata({
  params,
}: DocumentPageProps): Promise<Metadata> {
  const { id } = await params;
  const document = seedDemoDataset.documents.find((item) => item.id === id);
  return {
    title: pageTitle(document?.name ?? "Documento"),
    robots: { index: false, follow: false },
  };
}

export default async function DocumentDetailPage({ params }: DocumentPageProps) {
  const { id } = await params;
  return <DocumentDetailView documentId={id} />;
}
