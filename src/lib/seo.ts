import { company } from "@/data/official/company";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function pageTitle(title: string): string {
  return title;
}

export function defaultDescription(): string {
  return `${company.fullBrandName}. ${company.tagline}`;
}
