import { SOURCE_URLS } from "@/lib/content/constants";
import { createProvenance } from "@/lib/content/provenance";
import type { CompanyProfile, Training, WhyChooseItem } from "@/types/content";
import type { ContentProvenance } from "@/types/provenance";

export const companyProvenance: Record<
  "brand" | "legal" | "copy" | "team",
  ContentProvenance
> = {
  brand: createProvenance({
    sourceType: "VERIFIED_CURRENT_SITE",
    sourceUrl: SOURCE_URLS.currentSite,
    notes: "Marca e nome fantasia encontrados no site atual.",
  }),
  legal: createProvenance({
    sourceType: "VERIFIED_PUBLIC_RECORD",
    sourceUrl: SOURCE_URLS.transparencyPortal,
    needsClientValidation: true,
    notes:
      "Razão social, CNPJ, abertura e situação cadastral em fonte pública. Validar antes da publicação definitiva.",
  }),
  copy: createProvenance({
    sourceType: "VERIFIED_CURRENT_SITE",
    sourceUrl: SOURCE_URLS.currentSite,
    notes: "Textos institucionais adaptados do posicionamento do site atual.",
  }),
  team: createProvenance({
    sourceType: "VERIFIED_CURRENT_SITE",
    sourceUrl: SOURCE_URLS.currentSite,
    notes: "Equipe e treinamentos mencionados no site atual.",
  }),
};

export const company: CompanyProfile = {
  brandName: "SERVSAM",
  fullBrandName: "SERVSAM - Serviços de Saneamento e Meio Ambiente",
  legalName: "SERVISAM - Serviços de Saneamento e Meio Ambiente Ltda.",
  tradeName: "SERVSAM - Serviços de Saneamento e Meio Ambiente",
  cnpj: "21.332.050/0001-46",
  foundedOn: "2014-10-30",
  cadastralStatus: "ativa",
  tagline: "Soluções técnicas em saneamento, água e controle de pragas.",
  institutionalText:
    "A SERVSAM é uma empresa nacional que nasceu no Pará e atua em serviços relacionados a saneamento e meio ambiente, contribuindo para a prevenção de doenças, a qualidade de vida e o desenvolvimento da sociedade.",
  teamText:
    "Profissionais qualificados e treinados nas normas exigidas pelos órgãos de fiscalização e controle.",
  purpose:
    "Atuar em saneamento e meio ambiente, prevenindo doenças, promovendo qualidade de vida e desenvolvimento da sociedade.",
};

export const trainings: Training[] = [
  {
    id: "confined-spaces",
    name: "espaços confinados",
    provenance: companyProvenance.team,
  },
  {
    id: "height-work",
    name: "trabalho em altura",
    provenance: companyProvenance.team,
  },
  {
    id: "electrical",
    name: "energia elétrica",
    provenance: companyProvenance.team,
  },
  {
    id: "pest-control",
    name: "controle de pragas",
    provenance: companyProvenance.team,
  },
];

export const whyChooseItems: WhyChooseItem[] = [
  {
    id: "paraense-origin",
    title: "Origem paraense",
    description:
      "Empresa nacional que nasceu no Pará, com atuação próxima aos contextos da região.",
    provenance: companyProvenance.copy,
  },
  {
    id: "technical-work",
    title: "Atuação técnica",
    description:
      "Serviços de saneamento, água e controle ambiental conduzidos com linguagem técnica e responsabilidade operacional.",
    provenance: companyProvenance.copy,
  },
  {
    id: "trained-team",
    title: "Equipe treinada",
    description:
      "Profissionais treinados nas normas exigidas pelos órgãos de fiscalização e controle.",
    provenance: companyProvenance.team,
  },
  {
    id: "service-range",
    title: "Variedade de serviços",
    description:
      "Portfólio que reúne água, saneamento, sanitização e controle de pragas.",
    provenance: companyProvenance.copy,
  },
  {
    id: "segments",
    title: "Diferentes segmentos",
    description:
      "Atendimento pensado para condomínios, empresas, escolas, clínicas, indústrias e setor público.",
    provenance: createProvenance({
      sourceType: "BRIEFING_REQUIREMENT",
      notes: "Segmentos definidos no briefing do MVP.",
    }),
  },
];
