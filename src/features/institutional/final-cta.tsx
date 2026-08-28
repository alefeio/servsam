import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/layout/section";
import { company } from "@/data/official/company";
import { contactInfo } from "@/data/official/contact";

export function FinalCta() {
  return (
    <Section tone="navy">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Solicite um orçamento técnico
        </h2>
        <p className="mt-4 text-primary-foreground/80">
          Conte a necessidade do seu condomínio, empresa ou instituição. O
          envio pelo site é demonstrativo nesta etapa; você também pode falar
          pelo WhatsApp {contactInfo.whatsappDisplay}.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/contato" className="bg-teal hover:bg-teal/90">
            Solicitar orçamento
          </ButtonLink>
          <ButtonLink href="/servicos" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
            Conhecer serviços
          </ButtonLink>
        </div>
        <p className="mt-6 text-sm text-primary-foreground/70">{company.tagline}</p>
      </div>
    </Section>
  );
}
