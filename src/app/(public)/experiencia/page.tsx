import type { Metadata } from "next";
import { PageHero, Section } from "@/components/layout/section";
import { CaseCard } from "@/features/institutional/case-card";
import { FinalCta } from "@/features/institutional/final-cta";
import { contentRepository } from "@/lib/repositories/content-repository";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Experiência"),
  description:
    "Espaço para cases autorizados da SERVSAM. Os exemplos atuais são demonstrativos e fictícios.",
};

export default function ExperiencePage() {
  const cases = contentRepository.getDemoCases();

  return (
    <>
      <PageHero
        eyebrow="Experiência"
        title="Cases para demonstrar o formato da narrativa"
        description="Nenhum resultado numérico é atribuído. Estes exemplos fictícios mostram o layout que depois receberá cases autorizados."
      />
      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {cases.map((study) => (
            <CaseCard key={study.id} study={study} />
          ))}
        </div>
      </Section>
      <FinalCta />
    </>
  );
}
