import type { Metadata } from "next";
import { SettingsView } from "@/features/presentation/settings-view";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Configurações"),
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return <SettingsView />;
}
