import type { Metadata } from "next";
import { PageHero, Section } from "@/components/layout/section";
import { contentRepository } from "@/lib/repositories/content-repository";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Privacidade"),
  description:
    "Página provisória de privacidade da SERVSAM, pendente de validação jurídica.",
};

export default function PrivacyPage() {
  const company = contentRepository.getCompany();
  const contact = contentRepository.getContact();

  return (
    <>
      <PageHero
        eyebrow="Documento provisório"
        title="Privacidade"
        description="Esta página é um rascunho de homologação. A política definitiva depende de revisão jurídica e de validação do cliente."
      />
      <Section>
        <div className="prose prose-neutral max-w-3xl text-muted-foreground">
          <p>
            O site institucional da {company.fullBrandName} coleta, nesta
            demonstração, apenas os dados que a pessoa informa no formulário de
            orçamento. O envio é simulado no navegador e não é transmitido a um
            servidor de produção.
          </p>
          <p className="mt-4">
            Canais públicos atuais para contato: {contact.email}, WhatsApp{" "}
            {contact.whatsappDisplay} e telefone {contact.phoneDisplay}.
          </p>
          <p className="mt-4">
            Cookies de analytics, remarketing e bases de leads reais não fazem
            parte desta sprint. A versão definitiva deverá descrever
            finalidades, bases legais, prazos de retenção e direitos da pessoa
            titular.
          </p>
        </div>
      </Section>
    </>
  );
}
