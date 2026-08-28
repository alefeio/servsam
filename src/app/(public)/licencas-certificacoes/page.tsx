import type { Metadata } from "next";
import { PageHero, Section } from "@/components/layout/section";
import { CertificationStatus } from "@/features/institutional/certification-status";
import { FinalCta } from "@/features/institutional/final-cta";
import { contentRepository } from "@/lib/repositories/content-repository";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Licenças e certificações"),
  description:
    "Licenças e certificações informadas no site atual da SERVSAM, com documentação pendente de validação.",
};

export default function LicensesPage() {
  const certifications = contentRepository.getCertifications();

  return (
    <>
      <PageHero
        eyebrow="Conformidade"
        title="Licenças e certificações informadas"
        description="Os nomes abaixo aparecem no site atual. Sem número, validade, selo oficial ou arquivo documental até o cliente fornecer o material."
      />
      <Section>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certifications.map((certification) => (
            <CertificationStatus
              key={certification.id}
              certification={certification}
            />
          ))}
        </div>
      </Section>
      <FinalCta />
    </>
  );
}
