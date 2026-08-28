import Link from "next/link";
import { SiteLogo } from "@/components/layout/site-logo";
import { publicNavItems } from "@/data/official/navigation";
import { company } from "@/data/official/company";
import { contactInfo } from "@/data/official/contact";
import { formatPhoneLink } from "@/lib/utils/format";

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-navy text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3 md:px-6">
        <div>
          <SiteLogo surface="dark" />
          <p className="mt-4 max-w-sm text-sm text-primary-foreground/75">
            {company.tagline}
          </p>
        </div>
        <nav aria-label="Rodapé">
          <h2 className="text-sm font-semibold">Páginas</h2>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            {publicNavItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/privacidade" className="hover:text-white">
                Privacidade
              </Link>
            </li>
          </ul>
        </nav>
        <div className="text-sm text-primary-foreground/80">
          <h2 className="text-sm font-semibold text-primary-foreground">
            Contato
          </h2>
          <p className="mt-4">
            {contactInfo.addressLine}, {contactInfo.neighborhood},{" "}
            {contactInfo.city}/{contactInfo.state}
          </p>
          <p className="mt-2">{contactInfo.businessHours}</p>
          <p className="mt-2">
            <a href={formatPhoneLink(contactInfo.whatsappE164)} className="hover:text-white">
              WhatsApp {contactInfo.whatsappDisplay}
            </a>
          </p>
          <p className="mt-2">
            <a href={`mailto:${contactInfo.email}`} className="hover:text-white">
              {contactInfo.email}
            </a>
          </p>
          <p className="mt-4">
            <Link href="/demonstracao/login" className="text-teal hover:text-white">
              Acessar demonstração
            </Link>
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-primary-foreground/60 md:px-6">
          {company.fullBrandName}. Conteúdo institucional verificado e trechos
          demonstrativos estão identificados nas páginas.
        </p>
      </div>
    </footer>
  );
}
