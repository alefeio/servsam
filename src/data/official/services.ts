import { SOURCE_URLS } from "@/lib/content/constants";
import { createProvenance } from "@/lib/content/provenance";
import type { Service, ServiceCategory } from "@/types/content";

const verifiedName = createProvenance({
  sourceType: "VERIFIED_CURRENT_SITE",
  sourceUrl: SOURCE_URLS.currentSite,
  needsClientValidation: true,
  notes:
    "Nome do serviço verificado no site atual. Texto descritivo é provisório e depende de validação técnica do cliente.",
});

export const serviceCategories: ServiceCategory[] = [
  {
    id: "water-sanitation",
    slug: "agua-e-saneamento",
    name: "Água e saneamento",
    summary:
      "Serviços técnicos para captação, reservação, higienização e tratamento de água.",
    provenance: verifiedName,
  },
  {
    id: "environmental-pest",
    slug: "controle-ambiental-e-pragas",
    name: "Controle ambiental e de pragas",
    summary:
      "Sanitização de ambientes e controle de roedores, cupins e insetos.",
    provenance: verifiedName,
  },
];

export const services: Service[] = [
  {
    id: "svc-01",
    slug: "higienizacao-poco-tubular",
    name: "Higienização de poço tubular",
    categoryId: "water-sanitation",
    summary:
      "Limpeza técnica destinada a preservar as condições de funcionamento e higiene do poço.",
    description:
      "Limpeza técnica destinada a preservar as condições de funcionamento e higiene do poço. O detalhamento operacional, a periodicidade e os critérios normativos serão validados com a SERVSAM antes de qualquer publicação definitiva.",
    imageHint:
      "Fotografia autorizada de equipe técnica junto a poço tubular, sem identificação de cliente.",
    imageSrc: "/images/services/higienizacao-poco-tubular.jpg",
    imageAlt: "Equipe técnica em higienização de poço tubular com equipamentos de proteção.",
    provenance: verifiedName,
  },
  {
    id: "svc-02",
    slug: "perfuracao-construcao-poco-tubular",
    name: "Perfuração e construção de poço tubular",
    categoryId: "water-sanitation",
    summary:
      "Implantação de solução de captação de água conforme condições técnicas e ambientais do local.",
    description:
      "Implantação de solução de captação de água conforme condições técnicas e ambientais do local. Escopo, licenças e etapas de obra permanecem pendentes de validação documental.",
    imageHint:
      "Fotografia autorizada de perfuração de poço em área externa, sem logotipos de terceiros.",
    imageSrc: "/images/services/perfuracao-construcao-poco-tubular.jpg",
    imageAlt: "Operação de perfuração e construção de poço tubular em área externa.",
    provenance: verifiedName,
  },
  {
    id: "svc-03",
    slug: "higienizacao-caixas-dagua",
    name: "Higienização de caixas d'água",
    categoryId: "water-sanitation",
    summary:
      "Limpeza e higienização programada de reservatórios, com organização de data e horário.",
    description:
      "Limpeza e higienização programada de reservatórios, com organização de data e horário. Não utilize este texto como recomendação sanitária legal até validação do cliente.",
    imageHint:
      "Fotografia autorizada de reservatório elevado ou caixa d'água em manutenção preventiva.",
    imageSrc: "/images/services/higienizacao-caixas-dagua.jpg",
    imageAlt: "Higienização programada de caixa d'água em reservatório elevado.",
    provenance: verifiedName,
  },
  {
    id: "svc-04",
    slug: "desinfeccao-reservatorios",
    name: "Desinfecção de reservatórios",
    categoryId: "water-sanitation",
    summary:
      "Serviço técnico de higienização e desinfecção, com atenção às condições do reservatório.",
    description:
      "Serviço técnico de higienização e desinfecção, com atenção às condições do reservatório. Procedimentos, produtos e evidências serão detalhados após alinhamento operacional.",
    imageHint:
      "Fotografia autorizada do interior ou acesso técnico de reservatório, sem pessoas identificáveis.",
    imageSrc: "/images/services/desinfeccao-reservatorios.jpg",
    imageAlt: "Equipe técnica em procedimento de desinfecção de reservatório com EPI e ventilação.",
    provenance: verifiedName,
  },
  {
    id: "svc-05",
    slug: "analise-qualidade-agua",
    name: "Análise da qualidade da água",
    categoryId: "water-sanitation",
    summary:
      "Avaliação da água destinada ao uso e consumo, conforme o tipo de análise contratado.",
    description:
      "Avaliação da água destinada ao uso e consumo, conforme o tipo de análise contratado. Parâmetros, laboratórios e laudos oficiais não devem ser inferidos nesta etapa.",
    imageHint:
      "Fotografia autorizada de coleta ou frascos de amostra em ambiente técnico controlado.",
    imageSrc: "/images/services/analise-qualidade-agua.jpg",
    imageAlt: "Análise de qualidade da água com equipamento portátil e frascos de amostra.",
    provenance: verifiedName,
  },
  {
    id: "svc-06",
    slug: "tratamento-agua-eta",
    name: "Tratamento de água - ETA",
    categoryId: "water-sanitation",
    summary:
      "Soluções relacionadas ao tratamento da água para adequação à finalidade de uso.",
    description:
      "Soluções relacionadas ao tratamento da água para adequação à finalidade de uso. Arranjo técnico da ETA depende de diagnóstico e validação com a SERVSAM.",
    imageHint:
      "Fotografia autorizada de estação ou conjunto de tratamento de água, sem marca d'água de terceiros.",
    imageSrc: "/images/services/tratamento-agua-eta.jpg",
    imageAlt: "Estação de tratamento de água com tanques e equipamentos técnicos.",
    provenance: verifiedName,
  },
  {
    id: "svc-07",
    slug: "sanitizacao-ambientes",
    name: "Sanitização de ambientes",
    categoryId: "environmental-pest",
    summary:
      "Tratamento de ambientes voltado à redução de agentes que prejudicam a higiene e a qualidade do espaço.",
    description:
      "Tratamento de ambientes voltado à redução de agentes que prejudicam a higiene e a qualidade do espaço. Métodos e frequências serão confirmados com o cliente.",
    imageHint:
      "Fotografia autorizada de ambiente interno preparado para sanitização profissional.",
    imageSrc: "/images/services/sanitizacao-ambientes.jpg",
    imageAlt: "Sanitização profissional de ambiente interno com equipamento e EPI.",
    provenance: verifiedName,
  },
  {
    id: "svc-08",
    slug: "desratizacao",
    name: "Desratização",
    categoryId: "environmental-pest",
    summary:
      "Identificação, controle e prevenção de ocorrência de roedores.",
    description:
      "Identificação, controle e prevenção de ocorrência de roedores. O plano de manejo e os pontos de aplicação devem ser definidos após inspeção.",
    imageHint:
      "Fotografia autorizada de inspeção em área de risco, sem imagens de pragas em destaque apelativo.",
    imageSrc: "/images/services/desratizacao.jpg",
    imageAlt: "Equipe técnica em sanitização profissional de cozinha industrial com EPI completo.",
    provenance: verifiedName,
  },
  {
    id: "svc-09",
    slug: "descupinizacao",
    name: "Descupinização",
    categoryId: "environmental-pest",
    summary:
      "Tratamento por barreira química, madeiramento, conduítes ou aplicação localizada, conforme diagnóstico.",
    description:
      "Tratamento por barreira química, madeiramento, conduítes ou aplicação localizada, conforme diagnóstico. A escolha do método permanece pendente de avaliação técnica.",
    imageHint:
      "Fotografia autorizada de madeiramento ou área estrutural em inspeção de cupins.",
    imageSrc: "/images/services/descupinizacao.jpg",
    imageAlt: "Inspeção técnica em estrutura de madeira com equipamento de diagnóstico.",
    provenance: verifiedName,
  },
  {
    id: "svc-10",
    slug: "desinsetizacao",
    name: "Desinsetização",
    categoryId: "environmental-pest",
    summary:
      "Controle de insetos e prevenção de proliferação no ambiente.",
    description:
      "Controle de insetos e prevenção de proliferação no ambiente. Espécies-alvo e protocolo de aplicação serão detalhados após diagnóstico.",
    imageHint:
      "Fotografia autorizada de área de serviço ou cozinha industrial em contexto preventivo.",
    imageSrc: "/images/services/desinsetizacao.jpg",
    imageAlt: "Equipe técnica em inspeção preventiva de área externa com registro em tablet.",
    provenance: verifiedName,
  },
];
