import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero, Section } from "@/components/layout/section";
import { DemoContentBanner } from "@/features/institutional/demo-content-banner";
import { FinalCta } from "@/features/institutional/final-cta";
import { ImagePlaceholder } from "@/features/institutional/image-placeholder";
import { contentRepository } from "@/lib/repositories/content-repository";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Conteúdos"),
  description:
    "Materiais editoriais demonstrativos da SERVSAM, sem recomendações sanitárias definitivas.",
};

export default function ContentsPage() {
  const articles = contentRepository.getDemoArticles();

  return (
    <>
      <PageHero
        eyebrow="Conteúdos"
        title="Notas editoriais para o espaço de materiais"
        description="Textos provisórios, marcados como demonstrativos. Periodicidades legais e protocolos oficiais só entram com fonte validada."
      />
      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {articles.map((article) => (
            <Card key={article.id} className="h-full">
              <ImagePlaceholder
                hint={article.imageHint}
                src={article.imageSrc}
                alt={article.imageAlt}
                compact
              />
              <CardHeader className="gap-3">
                <DemoContentBanner />
                <CardTitle>{article.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
      <FinalCta />
    </>
  );
}
