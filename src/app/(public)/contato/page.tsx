import type { Metadata } from "next";
import { PageHero, Section } from "@/components/layout/section";
import { ContactForm } from "@/features/institutional/contact-form";
import { contentRepository } from "@/lib/repositories/content-repository";
import { formatPhoneLink } from "@/lib/utils/format";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Contato"),
  description:
    "Solicite um orçamento demonstrativo da SERVSAM ou fale pelos canais públicos atuais.",
};

export default function ContactPage() {
  const contact = contentRepository.getContact();

  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Solicite um orçamento"
        description="O formulário simula o envio nesta etapa. Você também pode usar os canais já publicados no site atual."
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.8fr]">
          <ContactForm />
          <aside className="h-fit rounded-xl border border-border bg-muted/60 p-6">
            <h2 className="text-lg font-semibold">Canais verificados</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                {contact.addressLine}, {contact.neighborhood}, {contact.city}/
                {contact.state}
              </li>
              <li>{contact.businessHours}</li>
              <li>
                <a href={formatPhoneLink(contact.whatsappE164)}>
                  WhatsApp {contact.whatsappDisplay}
                </a>
              </li>
              <li>
                <a href={formatPhoneLink(contact.phoneE164)}>
                  Telefone {contact.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
              <li>
                <a href={contact.instagramUrl} target="_blank" rel="noreferrer">
                  {contact.instagramHandle}
                </a>
              </li>
            </ul>
          </aside>
        </div>
      </Section>
    </>
  );
}
