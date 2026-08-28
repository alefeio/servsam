import { CERTIFICATION_PENDING_LABEL, SOURCE_URLS } from "@/lib/content/constants";
import { createProvenance } from "@/lib/content/provenance";
import type { Certification } from "@/types/content";

const certificationProvenance = createProvenance({
  sourceType: "VERIFIED_CURRENT_SITE",
  sourceUrl: SOURCE_URLS.currentSite,
  needsClientValidation: true,
  notes:
    "Nome informado no site atual. Sem número, validade, selo oficial ou documento anexado.",
});

const names = [
  "Vigilância Sanitária",
  "Corpo de Bombeiros",
  "Prefeitura de Belém",
  "SEMAS",
  "ANVISA",
  "CREA",
] as const;

export const certifications: Certification[] = names.map((name, index) => ({
  id: `cert-${String(index + 1).padStart(2, "0")}`,
  name,
  statusLabel: CERTIFICATION_PENDING_LABEL,
  provenance: certificationProvenance,
}));
