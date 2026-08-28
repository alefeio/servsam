import type { Metadata } from "next";
import { PageHero, Section } from "@/components/layout/section";
import { FinalCta } from "@/features/institutional/final-cta";
import { ServiceCard } from "@/features/institutional/service-card";
import { contentRepository } from "@/lib/repositories/content-repository";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Serviços"),
  description:
    "Serviços de água, saneamento, sanitização e controle de pragas da SERVSAM.",
};

export default function ServicesPage() {
  const categories = contentRepository.getServiceCategories();
  const services = contentRepository.getServices();

  return (
    <>
      <PageHero
        eyebrow="Portfólio técnico"
        title="Serviços de saneamento, água e controle ambiental"
        description="Nomes verificados no site atual. As descrições desta etapa são provisórias e serão validadas com a SERVSAM."
      />
      {categories.map((category) => (
        <Section key={category.id} tone={category.id === "environmental-pest" ? "muted" : "default"}>
          <h2 className="text-2xl font-semibold tracking-tight">{category.name}</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{category.summary}</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services
              .filter((service) => service.categoryId === category.id)
              .map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
          </div>
        </Section>
      ))}
      <FinalCta />
    </>
  );
}
