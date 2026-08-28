import type { Metadata } from "next";
import { AgendaView } from "@/features/operations/agenda-view";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Agenda"),
  robots: { index: false, follow: false },
};

export default function AgendaPage() {
  return <AgendaView />;
}
