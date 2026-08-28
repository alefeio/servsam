import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHero, Section } from "@/components/layout/section";
import { ImagePlaceholder } from "@/features/institutional/image-placeholder";
import { contentRepository } from "@/lib/repositories/content-repository";
import { pageTitle } from "@/lib/seo";

type ServicePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return contentRepository.getServices().map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = contentRepository.getServiceBySlug(slug);
  if (!service) {
    return { title: pageTitle("Serviço") };
  }
  return {
    title: pageTitle(service.name),
    description: service.summary,
  };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = contentRepository.getServiceBySlug(slug);
  if (!service) {
    notFound();
  }
  const category = contentRepository
    .getServiceCategories()
    .find((item) => item.id === service.categoryId);

  return (
    <>
      <PageHero
        eyebrow={category?.name}
        title={service.name}
        description={service.summary}
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-xl font-semibold">Sobre o serviço</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {service.description}
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              Texto descritivo provisório, sujeito à validação técnica do
              cliente. Não utilize esta página como protocolo sanitário oficial.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contato">Solicitar orçamento</ButtonLink>
              <ButtonLink href="/servicos" variant="outline">
                Voltar aos serviços
              </ButtonLink>
            </div>
          </div>
          <ImagePlaceholder hint={service.imageHint} src={service.imageSrc} alt={service.imageAlt} />
        </div>
      </Section>
    </>
  );
}
