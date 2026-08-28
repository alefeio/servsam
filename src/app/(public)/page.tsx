import type { Metadata } from "next";
import {
  Droplets,
  ShieldCheck,
  Building2,
  ClipboardList,
  FileText,
  CalendarCheck,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Section } from "@/components/layout/section";
import { CaseCard } from "@/features/institutional/case-card";
import { CertificationStatus } from "@/features/institutional/certification-status";
import { FinalCta } from "@/features/institutional/final-cta";
import { ImagePlaceholder } from "@/features/institutional/image-placeholder";
import { siteMedia } from "@/data/official/site-media";
import { ServiceCard } from "@/features/institutional/service-card";
import { contentRepository } from "@/lib/repositories/content-repository";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Início"),
  description:
    "Soluções técnicas em saneamento, água e controle de pragas para ambientes mais seguros.",
};

const processIcons = [ClipboardList, FileText, FileText, CalendarCheck];

export default function HomePage() {
  const company = contentRepository.getCompany();
  const categories = contentRepository.getServiceCategories();
  const services = contentRepository.getServices();
  const whyChoose = contentRepository.getWhyChooseItems();
  const segments = contentRepository.getSegments();
  const processSteps = contentRepository.getProcessSteps();
  const cases = contentRepository.getDemoCases();
  const certifications = contentRepository.getCertifications();

  return (
    <>
      <Section tone="navy" className="py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-medium tracking-wide text-teal uppercase">
              Saneamento, água e controle ambiental
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl md:leading-tight">
              Soluções técnicas para ambientes mais seguros e operações mais
              confiáveis.
            </h1>
            <p className="mt-6 max-w-2xl text-base text-primary-foreground/80 md:text-lg">
              {company.institutionalText}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contato" className="bg-teal hover:bg-teal/90">
                Solicitar orçamento
              </ButtonLink>
              <ButtonLink
                href="/servicos"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                Conhecer serviços
              </ButtonLink>
            </div>
          </div>
          <ImagePlaceholder
            src={siteMedia.homeHero.src}
            alt={siteMedia.homeHero.alt}
            hint="Fotografia autorizada de equipe técnica da SERVSAM em serviço de saneamento, sem clientes identificáveis."
            className="min-h-72 rounded-2xl"
          />
        </div>
      </Section>

      <Section>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Categorias de serviço
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {categories.map((category) => {
            const Icon =
              category.id === "water-sanitation" ? Droplets : ShieldCheck;
            return (
              <Card key={category.id}>
                <CardHeader>
                  <Icon className="size-6 text-teal" aria-hidden />
                  <CardTitle>{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{category.summary}</p>
                  <ul className="mt-4 space-y-2 text-sm">
                    {services
                      .filter((service) => service.categoryId === category.id)
                      .map((service) => (
                        <li key={service.id}>{service.name}</li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section tone="muted">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Por que escolher a SERVSAM?
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      <Section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Segmentos atendidos
          </h2>
          <ButtonLink href="/segmentos" variant="outline" size="sm">
            Ver segmentos
          </ButtonLink>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {segments.map((segment) => (
            <article
              key={segment.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
            >
              <Building2 className="mt-0.5 size-5 text-teal" aria-hidden />
              <div>
                <h3 className="font-medium">{segment.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{segment.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="muted">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Como conduzimos a solicitação
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Processo comercial demonstrativo para explicar a sequência de
          atendimento. Não representa prazo contratual.
        </p>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {processSteps.map((step, index) => {
            const Icon = processIcons[index] ?? ClipboardList;
            return (
              <li key={step.id} className="rounded-xl border border-border bg-card p-5">
                <Icon className="size-5 text-teal" aria-hidden />
                <p className="mt-4 text-xs font-medium tracking-wide text-teal uppercase">
                  Etapa {step.order}
                </p>
                <h3 className="mt-2 font-medium">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Experiência em formato de cases
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Os três exemplos abaixo são fictícios e marcam o espaço visual para
          cases autorizados.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {cases.map((study) => (
            <CaseCard key={study.id} study={study} />
          ))}
        </div>
      </Section>

      <Section tone="muted">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Licenças e certificações informadas
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Relação encontrada no site atual. Documentação, validade e selos
          oficiais não são exibidos até validação do cliente.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certifications.map((certification) => (
            <CertificationStatus
              key={certification.id}
              certification={certification}
            />
          ))}
        </div>
      </Section>

      <Section>
        <h2 className="text-2xl font-semibold tracking-tight">Serviços em detalhe</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 6).map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
        <div className="mt-8">
          <ButtonLink href="/servicos" variant="outline">
            Ver todos os serviços
          </ButtonLink>
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
