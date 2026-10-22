import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/layout/section";
import { siteMedia } from "@/data/official/site-media";
import { homeContent } from "@/data/official/home";
import { CertificationStatus } from "@/features/institutional/certification-status";
import { DemoContentBanner } from "@/features/institutional/demo-content-banner";
import { FinalCta } from "@/features/institutional/final-cta";
import { ImagePlaceholder } from "@/features/institutional/image-placeholder";
import { ServiceCard } from "@/features/institutional/service-card";
import { FICTIONAL_CASE_LABEL } from "@/lib/content/constants";
import { contentRepository } from "@/lib/repositories/content-repository";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Início"),
  description: homeContent.description,
};

export default function HomePage() {
  const featuredServices = contentRepository.getFeaturedServices();
  const whyChoose = contentRepository.getWhyChooseItems();
  const segments = contentRepository.getSegments();
  const processSteps = contentRepository.getProcessSteps();
  const deliverables = contentRepository.getTechnicalDeliverables();
  const cases = contentRepository.getDemoCases();
  const certifications = contentRepository.getCertifications();

  return (
    <>
      <Section tone="navy" className="py-14 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-medium tracking-wide text-teal uppercase">
              {homeContent.eyebrow}
            </p>
            <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight md:text-5xl md:leading-tight">
              {homeContent.headline}
            </h1>
            <p className="mt-6 max-w-xl text-base text-primary-foreground/80 md:text-lg">
              {homeContent.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contato" className="bg-teal hover:bg-teal/90">
                {homeContent.primaryCta}
              </ButtonLink>
              <ButtonLink
                href="/servicos"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                {homeContent.secondaryCta}
              </ButtonLink>
            </div>
          </div>
          <ImagePlaceholder
            src={siteMedia.homeHero.src}
            alt={siteMedia.homeHero.alt}
            hint="Fotografia autorizada de equipe técnica da SERVSAM em serviço de saneamento, sem clientes identificáveis."
            className="min-h-64 rounded-2xl md:min-h-72"
          />
        </div>
      </Section>

      <Section className="py-12 md:py-16">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {homeContent.servicesTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          {homeContent.servicesIntro}
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
        <div className="mt-8">
          <ButtonLink href="/servicos" variant="outline">
            {homeContent.servicesCta}
          </ButtonLink>
        </div>
      </Section>

      <Section tone="muted" className="py-12 md:py-16">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {homeContent.whyTitle}
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {whyChoose.map((item) => (
            <article key={item.id} className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section className="py-12 md:py-16">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {homeContent.processTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          {homeContent.processIntro}
        </p>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {processSteps.map((step) => (
            <li key={step.id} className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-teal">{step.order}</p>
              <h3 className="mt-2 font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="muted" className="py-12 md:py-16">
        <h2 className="max-w-2xl text-2xl font-semibold tracking-tight md:text-3xl">
          {homeContent.documentationTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          {homeContent.documentationIntro}
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {deliverables.map((item) => (
            <article key={item.id} className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section className="py-12 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {homeContent.segmentsTitle}
          </h2>
          <ButtonLink href="/segmentos" variant="outline" size="sm">
            {homeContent.segmentsCta}
          </ButtonLink>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {segments.map((segment) => (
            <li key={segment.id} className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-medium">{segment.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{segment.summary}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="muted" className="py-12 md:py-16">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {homeContent.casesTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          {homeContent.casesIntro}
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {cases.map((study) => (
            <li key={study.id} className="rounded-xl border border-border bg-card p-5">
              <DemoContentBanner label={FICTIONAL_CASE_LABEL} />
              <p className="mt-3 text-xs font-medium tracking-wide text-teal uppercase">
                {study.segment}
              </p>
              <h3 className="mt-2 font-medium">{study.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{study.clientAlias}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <ButtonLink href="/experiencia" variant="outline">
            {homeContent.casesCta}
          </ButtonLink>
        </div>
      </Section>

      <Section className="py-12 md:py-16">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {homeContent.licensesTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          {homeContent.licensesIntro}
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certifications.map((certification) => (
            <li key={certification.id}>
              <CertificationStatus certification={certification} />
            </li>
          ))}
        </ul>
      </Section>

      <FinalCta />
    </>
  );
}
