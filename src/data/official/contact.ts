import { SOURCE_URLS } from "@/lib/content/constants";
import { createProvenance } from "@/lib/content/provenance";
import type { ContactInfo } from "@/types/content";
import type { ContentProvenance } from "@/types/provenance";

export const contactProvenance: ContentProvenance = createProvenance({
  sourceType: "VERIFIED_CURRENT_SITE",
  sourceUrl: SOURCE_URLS.contactPage,
  notes: "Horário, endereço, telefones e e-mail encontrados nas páginas públicas.",
});

export const instagramProvenance: ContentProvenance = createProvenance({
  sourceType: "VERIFIED_PUBLIC_RECORD",
  sourceUrl: SOURCE_URLS.instagram,
  needsClientValidation: true,
  notes: "Perfil encontrado em busca pública. Confirmar se permanece o canal oficial.",
});

export const contactInfo: ContactInfo = {
  businessHours: "8h às 18h, de segunda a sexta-feira",
  addressLine: "Travessa Barão de Mamoré, 161",
  neighborhood: "Guamá",
  city: "Belém",
  state: "PA",
  whatsappDisplay: "(91) 98054-5097",
  whatsappE164: "5591980545097",
  phoneDisplay: "(91) 3274-2960",
  phoneE164: "559132742960",
  email: "servsam.adm@gmail.com",
  instagramUrl: SOURCE_URLS.instagram,
  instagramHandle: "@servsam.belem",
};
