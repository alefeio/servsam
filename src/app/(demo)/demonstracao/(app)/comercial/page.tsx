import type { Metadata } from "next";
import { CommercialHubView } from "@/features/crm/commercial-hub-view";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Comercial"),
  robots: { index: false, follow: false },
};

export default function CommercialPage() {
  return <CommercialHubView />;
}
