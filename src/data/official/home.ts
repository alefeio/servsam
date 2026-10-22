import { createProvenance } from "@/lib/content/provenance";
import type { TechnicalDeliverable } from "@/types/content";

const homeProvenance = createProvenance({
  sourceType: "BRIEFING_REQUIREMENT",
  needsClientValidation: true,
  notes:
    "Posicionamento da home revisado em 22/10/2026 a partir da operação descrita pelo cliente. Não afirma documento em todo serviço nem licença comprovada.",
});

export const homeContent = {
  eyebrow: "Saneamento e controle ambiental",
  headline: "Serviços técnicos, da avaliação à entrega.",
  subtitle:
    "A SERVSAM planeja o atendimento, executa o serviço e organiza relatório ou certificado quando eles fazem parte da entrega.",
  description:
    "Serviços técnicos de saneamento e controle ambiental, com execução organizada e documentação quando aplicável.",
  primaryCta: "Solicitar orçamento",
  secondaryCta: "Conhecer serviços",
  servicesTitle: "Serviços principais",
  servicesIntro:
    "Uma seleção do atendimento mais pedido. O catálogo completo, inclusive controle de pragas, fica na página de serviços.",
  servicesCta: "Ver todos os serviços",
  featuredServiceIds: ["svc-03", "svc-01", "svc-05", "svc-06", "svc-07", "svc-08"],
  whyTitle: "Por que escolher a SERVSAM",
  processTitle: "Como funciona o atendimento",
  processIntro: "Do primeiro contato à entrega do serviço. O prazo de cada etapa é combinado na proposta.",
  documentationTitle: "Serviço executado. Informação documentada.",
  documentationIntro:
    "Quando o serviço pede, a entrega inclui registros organizados. Nem todo atendimento gera os três documentos.",
  segmentsTitle: "Segmentos atendidos",
  segmentsCta: "Ver segmentos",
  casesTitle: "Exemplos de experiência",
  casesIntro:
    "Os exemplos abaixo são fictícios. Mostram o formato da seção até termos trabalhos reais autorizados.",
  casesCta: "Ver o formato dos exemplos",
  licensesTitle: "Licenças e confiança técnica",
  licensesIntro:
    "Nomes encontrados no site atual. Sem número, validade ou selo enquanto a documentação não for confirmada.",
  provenance: homeProvenance,
};

export const technicalDeliverables: TechnicalDeliverable[] = [
  {
    id: "work-order",
    title: "Ordem de serviço",
    description:
      "Escopo, local e o que foi realizado, reunidos em um registro do atendimento.",
    provenance: homeProvenance,
  },
  {
    id: "technical-report",
    title: "Relatório técnico ou fotográfico",
    description:
      "Registro da execução e das evidências, quando o serviço pede esse documento.",
    provenance: homeProvenance,
  },
  {
    id: "certificate",
    title: "Certificado ou atestado",
    description:
      "Documento emitido conforme o tipo de serviço, quando aplicável.",
    provenance: homeProvenance,
  },
];

export const closingCta = {
  title: "Conte o que você precisa.",
  description:
    "A SERVSAM avalia o serviço adequado ao local e às condições do atendimento. O formulário do site ainda não envia a mensagem: nesta etapa o pedido fica só na tela. O WhatsApp segue como caminho direto.",
  primaryLabel: "Solicitar orçamento",
  primaryHref: "/contato",
  secondaryLabel: "Falar no WhatsApp",
  provenance: homeProvenance,
};
