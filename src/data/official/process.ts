import { createProvenance } from "@/lib/content/provenance";
import type { CommercialProcessStep } from "@/types/content";

const processProvenance = createProvenance({
  sourceType: "BRIEFING_REQUIREMENT",
  needsClientValidation: true,
  notes:
    "Jornada pública revisada em 22/10/2026. Vai até a documentação da entrega. Não inclui financeiro nem histórico interno. Não é prazo contratual.",
});

export const commercialProcessSteps: CommercialProcessStep[] = [
  {
    id: "understand",
    order: 1,
    title: "Entendemos a necessidade",
    description: "Identificamos local, serviço e condições do atendimento.",
    provenance: processProvenance,
  },
  {
    id: "propose",
    order: 2,
    title: "Apresentamos a proposta",
    description: "Escopo, valores, condições e prazo.",
    provenance: processProvenance,
  },
  {
    id: "schedule",
    order: 3,
    title: "Programamos o atendimento",
    description: "Organizamos a data e a execução do serviço.",
    provenance: processProvenance,
  },
  {
    id: "execute",
    order: 4,
    title: "Executamos o serviço",
    description: "A equipe realiza os procedimentos previstos.",
    provenance: processProvenance,
  },
  {
    id: "document",
    order: 5,
    title: "Documentamos a entrega",
    description: "Relatório, registros e certificado, quando aplicáveis.",
    provenance: processProvenance,
  },
];
