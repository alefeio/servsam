import { createProvenance } from "@/lib/content/provenance";
import type { CommercialProcessStep } from "@/types/content";

const processProvenance = createProvenance({
  sourceType: "BRIEFING_REQUIREMENT",
  notes: "Processo comercial demonstrativo definido para a Sprint 1. Não representa SLA contratual.",
});

export const commercialProcessSteps: CommercialProcessStep[] = [
  {
    id: "understand",
    order: 1,
    title: "Entender a necessidade",
    description:
      "Conversamos sobre o ambiente, o tipo de serviço e as condições do local.",
    provenance: processProvenance,
  },
  {
    id: "evaluate",
    order: 2,
    title: "Avaliar o serviço",
    description:
      "A equipe técnica analisa o escopo adequado para a demanda apresentada.",
    provenance: processProvenance,
  },
  {
    id: "propose",
    order: 3,
    title: "Apresentar proposta",
    description:
      "A proposta reúne serviços, condições comerciais e prazos para alinhamento.",
    provenance: processProvenance,
  },
  {
    id: "schedule",
    order: 4,
    title: "Programar atendimento",
    description:
      "Com a proposta aprovada, o atendimento é organizado em data e horário combinados.",
    provenance: processProvenance,
  },
];
