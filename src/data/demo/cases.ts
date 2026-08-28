import { createProvenance } from "@/lib/content/provenance";
import type { CaseStudy } from "@/types/content";

const fictionalCase = createProvenance({
  sourceType: "DEMO_FICTIONAL",
  notes:
    "Case estrutural fictício para demonstrar layout. Sem resultados numéricos e sem clientes reais.",
});

export const demoCases: CaseStudy[] = [
  {
    id: "case-rio-guama",
    slug: "condominio-rio-guama",
    title: "Higienização programada de reservatórios",
    clientAlias: "Condomínio Rio Guamá (DEMO)",
    segment: "Condomínios",
    serviceFocus: "Higienização de caixas d'água e desinfecção de reservatórios",
    summary:
      "Exemplo de organização de rotina preventiva em reservatórios de uso coletivo. Este caso é fictício e serve apenas para mostrar o espaço futuro de cases autorizados.",
    imageHint:
      "Fotografia autorizada de reservatório condominial, quando o cliente fornecer material.",
    imageSrc: "/images/cases/condominio-rio-guama.jpg",
    imageAlt: "Caso demonstrativo: higienização de reservatório em condomínio residencial.",
    provenance: fictionalCase,
  },
  {
    id: "case-clinica-horizonte",
    slug: "clinica-horizonte-amazonia",
    title: "Plano preventivo de controle de pragas",
    clientAlias: "Clínica Horizonte Amazônia (DEMO)",
    segment: "Clínicas",
    serviceFocus: "Desinsetização e sanitização de ambientes",
    summary:
      "Exemplo de acompanhamento preventivo em instalações de saúde. Não representa um contrato real nem resultado medido.",
    imageHint:
      "Fotografia autorizada de área técnica clínica, sem pacientes identificáveis.",
    imageSrc: "/images/cases/clinica-horizonte-amazonia.jpg",
    imageAlt: "Caso demonstrativo: plano preventivo de controle de pragas em clínica.",
    provenance: fictionalCase,
  },
  {
    id: "case-industria-porto-verde",
    slug: "industria-porto-verde",
    title: "Organização de serviços recorrentes de saneamento",
    clientAlias: "Indústria Porto Verde (DEMO)",
    segment: "Indústrias",
    serviceFocus: "Saneamento e controle ambiental recorrente",
    summary:
      "Exemplo de visão recorrente para planta industrial. O conteúdo será substituído por cases autorizados após validação.",
    imageHint:
      "Fotografia autorizada de área industrial de apoio, sem marcas de equipamentos.",
    imageSrc: "/images/cases/industria-porto-verde.jpg",
    imageAlt: "Caso demonstrativo: serviços recorrentes de saneamento em área industrial.",
    provenance: fictionalCase,
  },
];
