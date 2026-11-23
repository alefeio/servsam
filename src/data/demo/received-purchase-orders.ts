import { createProvenance } from "@/lib/content/provenance";
import type { DemoReceivedPurchaseOrder } from "@/types/demo-entities";

const provenance = createProvenance({
  sourceType: "DEMO_FICTIONAL",
  notes:
    "O.C. recebida do contratante — documento do cliente, distinta do orçamento SERVSAM e da OS.",
});

export const demoReceivedPurchaseOrders: DemoReceivedPurchaseOrder[] = [
  {
    id: "oc-demo-avulso-001",
    code: "OC-DEMO-AVL-014",
    clientId: "client-hotel-amazonas",
    serviceName: "Higienização de reservatórios (avulso)",
    categoryId: "water-sanitation",
    receivedAt: "2026-08-27",
    statusLabel: "Recebida",
    amount: 9800,
    engagementKind: "avulso",
    proposalId: "prop-005",
    workOrderId: "os-demo-04",
    note:
      "O.C. recebida no serviço avulso do Hotel Amazonas Plaza. Formaliza a contratação junto ao orçamento DEMO-005 e à OS os-demo-04 (mesmo serviço). Não é a OS.",
    provenance,
  },
  {
    id: "oc-demo-direta-001",
    code: "OC-DEMO-DIR-021",
    clientId: "client-escola-baia-verde",
    serviceName: "Sanitização emergencial de refeitório",
    categoryId: "environmental-pest",
    receivedAt: "2026-08-20",
    statusLabel: "Recebida",
    amount: 3900,
    engagementKind: "oc-direta",
    withoutInternalProposal: true,
    note:
      "Contratação originada de O.C. do cliente sem orçamento interno prévio obrigatório. Dados demonstrativos.",
    provenance,
  },
  {
    id: "oc-demo-periodico-001",
    code: "OC-DEMO-CT-001",
    clientId: "client-rio-guama",
    serviceName: "Plano trimestral de higienização",
    categoryId: "water-sanitation",
    receivedAt: "2026-01-05",
    statusLabel: "Vigente",
    amount: 33600,
    engagementKind: "periodico",
    contractId: "contract-001",
    workOrderId: "os-demo-01",
    note:
      "O.C. do contrato periódico. Programa visitas e serviços; OS por visita física distinta permanece pendente de validação do cliente.",
    provenance,
  },
];
