import { createProvenance } from "@/lib/content/provenance";
import type { Segment } from "@/types/content";

const briefingProvenance = createProvenance({
  sourceType: "BRIEFING_REQUIREMENT",
  notes: "Segmentos definidos no briefing do MVP. Textos de apoio são provisórios.",
});

export const segments: Segment[] = [
  {
    id: "seg-condominios",
    slug: "condominios",
    name: "Condomínios",
    summary:
      "Organização de serviços de água, reservatórios e controle ambiental em áreas comuns.",
    imageHint: "Fotografia autorizada de área comum de condomínio, sem identificação de moradores.",
    imageSrc: "/images/segments/condominios.jpg",
    imageAlt: "Equipe técnica em manutenção de utilidades em condomínio residencial.",
    provenance: briefingProvenance,
  },
  {
    id: "seg-empresas",
    slug: "empresas",
    name: "Empresas",
    summary:
      "Rotinas técnicas para ambientes administrativos e operacionais que precisam de higiene contínua.",
    imageHint: "Fotografia autorizada de fachada ou recepção corporativa genérica.",
    imageSrc: "/images/segments/empresas.jpg",
    imageAlt: "Equipe técnica em inspeção em ambiente corporativo.",
    provenance: briefingProvenance,
  },
  {
    id: "seg-restaurantes",
    slug: "restaurantes",
    name: "Restaurantes",
    summary:
      "Apoio a cozinhas e áreas de preparo com foco em higiene e controle de pragas.",
    imageHint: "Fotografia autorizada de cozinha profissional vazia, sem marcas visíveis.",
    imageSrc: "/images/segments/restaurantes.jpg",
    imageAlt: "Equipe técnica em inspeção de cozinha profissional vazia.",
    provenance: briefingProvenance,
  },
  {
    id: "seg-escolas",
    slug: "escolas",
    name: "Escolas",
    summary:
      "Serviços pensados para espaços de ensino, com atenção a reservatórios e ambientes de uso coletivo.",
    imageHint: "Fotografia autorizada de pátio ou edificação escolar sem crianças identificáveis.",
    imageSrc: "/images/segments/escolas.jpg",
    imageAlt: "Equipe técnica em inspeção de reservatório em edificação escolar.",
    provenance: briefingProvenance,
  },
  {
    id: "seg-clinicas",
    slug: "clinicas",
    name: "Clínicas",
    summary:
      "Planejamento de higienização e controle ambiental em instalações de saúde.",
    imageHint: "Fotografia autorizada de corredor clínico sem pacientes ou logotipos.",
    imageSrc: "/images/segments/clinicas.jpg",
    imageAlt: "Equipe técnica em sanitização de corredor clínico sem pacientes visíveis.",
    provenance: briefingProvenance,
  },
  {
    id: "seg-industrias",
    slug: "industrias",
    name: "Indústrias",
    summary:
      "Serviços recorrentes de saneamento e controle ambiental em plantas e áreas de apoio.",
    imageHint: "Fotografia autorizada de área industrial externa, sem marcas de equipamentos.",
    imageSrc: "/images/segments/industrias.jpg",
    imageAlt: "Equipe técnica em inspeção de área industrial externa.",
    provenance: briefingProvenance,
  },
  {
    id: "seg-setor-publico",
    slug: "setor-publico",
    name: "Setor público",
    summary:
      "Atendimento a órgãos e instalações públicas, inclusive contextos de contratação formal.",
    imageHint: "Fotografia autorizada de edificação institucional, sem brasões oficiais.",
    imageSrc: "/images/segments/setor-publico.jpg",
    imageAlt: "Equipe técnica em inspeção de edificação institucional pública.",
    provenance: briefingProvenance,
  },
];
