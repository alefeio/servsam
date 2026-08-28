import type { Metadata } from "next";
import { PageHero, Section } from "@/components/layout/section";
import { FinalCta } from "@/features/institutional/final-cta";
import { ImagePlaceholder } from "@/features/institutional/image-placeholder";
import { contentRepository } from "@/lib/repositories/content-repository";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Segmentos"),
  description:
    "A SERVSAM organiza o atendimento para condomínios, empresas, escolas, clínicas, indústrias e setor público.",
};

export default function SegmentsPage() {
  const segments = contentRepository.getSegments();

  return (
    <>
      <PageHero
        eyebrow="Para quem atendemos"
        title="Segmentos com necessidades técnicas distintas"
        description="Lista definida no briefing do MVP. Os textos de apoio são provisórios e não prometem especialização exclusiva sem validação comercial."
      />
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {segments.map((segment) => (
            <article key={segment.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <ImagePlaceholder
                hint={segment.imageHint}
                src={segment.imageSrc}
                alt={segment.imageAlt}
                compact
              />
              <div className="p-5">
                <h2 className="text-xl font-semibold">{segment.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {segment.summary}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Section>
      <FinalCta />
    </>
  );
}
