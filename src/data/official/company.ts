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

const homeDifferentiatorProvenance = createProvenance({
  sourceType: "BRIEFING_REQUIREMENT",
  needsClientValidation: true,
  notes:
    "Diferenciais da home alinhados à operação descrita em 22/10/2026. Sem alegação de certificação comprovada.",
});

export const whyChooseItems: WhyChooseItem[] = [
  {
    id: "organized-execution",
    title: "Execução organizada",
    description:
      "O serviço sai com escopo, local e atendimento definidos antes da equipe ir a campo.",
    provenance: homeDifferentiatorProvenance,
  },
  {
    id: "traceability",
    title: "Informação acompanhada",
    description:
      "Da proposta à conclusão, os dados do serviço ficam ligados ao mesmo atendimento.",
    provenance: homeDifferentiatorProvenance,
  },
  {
    id: "technical-documentation",
    title: "Documentação técnica",
    description:
      "Relatório e certificado entram na entrega quando o tipo de serviço pede esses documentos.",
    provenance: homeDifferentiatorProvenance,
  },
  {
    id: "prepared-team",
    title: "Equipe preparada",
    description:
      "A atuação segue o preparo da atividade, como altura, espaço confinado e controle de pragas, quando o serviço exige.",
    provenance: companyProvenance.team,
  },
];
