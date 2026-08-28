import type { Metadata } from "next";
import { PageHero, Section } from "@/components/layout/section";
import { FinalCta } from "@/features/institutional/final-cta";
import { ImagePlaceholder } from "@/features/institutional/image-placeholder";
import { contentRepository } from "@/lib/repositories/content-repository";
import { pageTitle } from "@/lib/seo";
import { siteMedia } from "@/data/official/site-media";

export const metadata: Metadata = {
  title: pageTitle("Sobre"),
  description:
    "A SERVSAM é uma empresa nacional que nasceu no Pará e atua em saneamento, água e meio ambiente.",
};

export default function AboutPage() {
  const company = contentRepository.getCompany();
  const trainings = contentRepository.getTrainings();
  const contact = contentRepository.getContact();

  return (
    <>
      <PageHero
        eyebrow="Sobre a SERVSAM"
        title={company.fullBrandName}
        description={company.institutionalText}
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Propósito</h2>
            <p className="leading-relaxed text-muted-foreground">{company.purpose}</p>
            <h2 className="text-2xl font-semibold">Equipe</h2>
            <p className="leading-relaxed text-muted-foreground">{company.teamText}</p>
            <h3 className="text-lg font-medium">Treinamentos informados</h3>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              {trainings.map((training) => (
                <li key={training.id} className="capitalize">
                  {training.name}
                </li>
              ))}
            </ul>
          </div>
          <ImagePlaceholder
            hint="Fotografia autorizada da equipe ou da base operacional em Belém, quando fornecida pela SERVSAM."
            src={siteMedia.aboutTeam.src}
            alt={siteMedia.aboutTeam.alt}
          />
        </div>
      </Section>
      <Section tone="muted">
        <h2 className="text-2xl font-semibold">Identificação pública</h2>
        <dl className="mt-6 grid gap-4 md:grid-cols-2">
          <Info term="Razão social" detail={company.legalName} />
          <Info term="Nome fantasia" detail={company.tradeName} />
          <Info term="CNPJ" detail={company.cnpj} />
          <Info term="Abertura" detail="30/10/2014" />
          <Info term="Situação cadastral" detail={company.cadastralStatus} />
          <Info
            term="Endereço"
            detail={`${contact.addressLine}, ${contact.neighborhood}, ${contact.city}/${contact.state}`}
          />
        </dl>
        <p className="mt-6 text-sm text-muted-foreground">
          Dados empresariais obtidos em fonte pública. O ano de abertura e os
          registros cadastrais entram na lista de validação do cliente antes da
          publicação definitiva.
        </p>
      </Section>
      <FinalCta />
    </>
  );
}

function Info({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {term}
      </dt>
      <dd className="mt-1 font-medium">{detail}</dd>
    </div>
  );
}
