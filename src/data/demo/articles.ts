import { createProvenance } from "@/lib/content/provenance";
import type { EditorialArticle } from "@/types/content";

const demoArticle = createProvenance({
  sourceType: "DEMO_FICTIONAL",
  notes:
    "Card editorial demonstrativo. Sem recomendações sanitárias definitivas ou periodicidades legais.",
});

export const demoArticles: EditorialArticle[] = [
  {
    id: "article-caixas-dagua",
    slug: "quando-revisar-higienizacao-caixas-dagua",
    title: "Quando revisar a higienização de caixas d'água?",
    excerpt:
      "Texto editorial provisório sobre a importância de programar a revisão dos reservatórios. Periodicidades legais e protocolos oficiais serão incluídos somente com fonte validada.",
    imageHint: "Fotografia autorizada de caixa d'água em área técnica condominial.",
    imageSrc: "/images/editorial/caixas-dagua.jpg",
    imageAlt: "Ilustração editorial sobre revisão de higienização de caixas d'água.",
    provenance: demoArticle,
  },
  {
    id: "article-cupins",
    slug: "sinais-necessidade-controle-cupins",
    title: "Sinais que indicam necessidade de controle de cupins",
    excerpt:
      "Resumo editorial demonstrativo sobre indícios visuais que costumam motivar uma inspeção. Não substitui diagnóstico técnico.",
    imageHint: "Fotografia autorizada de madeiramento em inspeção, sem insetos em close apelativo.",
    imageSrc: "/images/editorial/cupins.jpg",
    imageAlt: "Ilustração editorial sobre sinais de necessidade de controle de cupins.",
    provenance: demoArticle,
  },
  {
    id: "article-qualidade-agua",
    slug: "por-que-acompanhar-qualidade-agua",
    title: "Por que acompanhar a qualidade da água?",
    excerpt:
      "Nota editorial provisória sobre o valor de acompanhar a água de uso e consumo. Laudos, parâmetros e obrigações normativas dependem de validação posterior.",
    imageHint: "Fotografia autorizada de coleta de água em ambiente controlado.",
    imageSrc: "/images/editorial/qualidade-agua.jpg",
    imageAlt: "Ilustração editorial sobre acompanhamento da qualidade da água.",
    provenance: demoArticle,
  },
];
