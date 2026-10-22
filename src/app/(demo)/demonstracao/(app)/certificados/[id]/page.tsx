import type { Metadata } from "next";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import { CertificateDetailView } from "@/features/presentation/certificate-views";
import { pageTitle } from "@/lib/seo";

type PageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return seedDemoDataset.certificates.map((certificate) => ({ id: certificate.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const certificate = seedDemoDataset.certificates.find((item) => item.id === id);
  return {
    title: pageTitle(certificate?.number ?? "Certificado"),
    robots: { index: false, follow: false },
  };
}

export default async function CertificatePage({ params }: PageProps) {
  const { id } = await params;
  return <CertificateDetailView certificateId={id} />;
}
