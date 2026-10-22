import type { Metadata } from "next";
import { CertificatesListView } from "@/features/presentation/certificate-views";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Certificados"),
  robots: { index: false, follow: false },
};

export default function CertificatesPage() {
  return <CertificatesListView />;
}
