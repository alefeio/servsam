import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/layout/section";
import { contactInfo } from "@/data/official/contact";
import { closingCta } from "@/data/official/home";

export function FinalCta() {
  return (
    <Section tone="navy" className="py-14 md:py-20">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {closingCta.title}
        </h2>
        <p className="mt-4 text-primary-foreground/80">{closingCta.description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={closingCta.primaryHref} className="bg-teal hover:bg-teal/90">
            {closingCta.primaryLabel}
          </ButtonLink>
          <ButtonLink
            href={`https://wa.me/${contactInfo.whatsappE164}`}
            target="_blank"
            rel="noreferrer"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
          >
            {closingCta.secondaryLabel}
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
