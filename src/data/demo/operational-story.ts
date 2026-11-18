import { createProvenance } from "@/lib/content/provenance";
import type {
  DemoClient,
  DemoClientUnit,
  DemoEnvironmentalProcess,
  DemoOpportunity,
  DemoPreServiceDocument,
  DemoProposal,
  DemoRegulatoryCredential,
  DemoTechnicalResponsible,
  DemoVehicle,
} from "@/types/demo-entities";

const provenance = createProvenance({
  sourceType: "DEMO_FICTIONAL",
  notes:
    "Massa da Sprint 10.1 para validar o fluxo visto nos documentos do cliente. Nomes, placas e registros são fictícios. Nenhum arquivo original entra aqui.",
});

export const storyClients: DemoClient[] = [
  {
    id: "client-pousada-murucutu",
    alias: "Pousada Murucutu (DEMO)",
    segment: "Hotelaria",
    city: "Belém",
    legalName: "Pousada Murucutu Demonstração Ltda.",
    tradeName: "Pousada Murucutu",
    documentNumber: "11.203.440/0001-90",
    email: "operacao@pousada-murucutu.demo",
    phone: "(91) 98810-4410",
    responsibleName: "Lívia Pantoja (DEMO)",
    relationshipKind: "one_off",
    notes: "Cliente fictício para validar CIP, declaração de ciência e certificado de pragas.",
    provenance,
  },
  {
    id: "client-sitio-iara",
    alias: "Sítio Iara (DEMO)",
    segment: "Rural",
    city: "Santa Izabel",
    legalName: "Sítio Iara Demonstração Ltda.",
    tradeName: "Sítio Iara",
    documentNumber: "22.880.115/0001-07",
    email: "contato@sitio-iara.demo",
    phone: "(91) 98820-7721",
    responsibleName: "Pedro Iara (DEMO)",
    relationshipKind: "one_off",
    notes: "Cliente fictício para validar se Processos significa assessoria ambiental de outorga.",
    provenance,
  },
  {
    id: "client-residencial-marajo",
    alias: "Residencial Marajó (DEMO)",
    segment: "Condomínios",
    city: "Ananindeua",
    legalName: "Residencial Marajó Demonstração",
    tradeName: "Residencial Marajó",
    documentNumber: "33.410.902/0001-61",
    email: "sindico@residencial-marajo.demo",
    phone: "(91) 98830-1188",
    responsibleName: "Sílvia Marajó (DEMO)",
    relationshipKind: "contract",
    notes: "Cliente fictício para visitas recorrentes e monitoramento de produtos sanitizantes.",
    provenance,
  },
];

export const storyUnits: DemoClientUnit[] = [
  {
    id: "unit-pousada-murucutu",
    clientId: "client-pousada-murucutu",
    name: "Bloco hóspedes",
    address: "Rua do Demo, 120",
    city: "Belém",
    provenance,
  },
  {
    id: "unit-sitio-iara-poco",
    clientId: "client-sitio-iara",
    name: "Poço demonstrativo 01",
    address: "Ramal das Águas, km 4",
    city: "Santa Izabel",
    provenance,
  },
  {
    id: "unit-residencial-marajo-eta",
    clientId: "client-residencial-marajo",
    name: "Casa de máquinas",
    address: "Alameda do Fixture, 40",
    city: "Ananindeua",
    provenance,
  },
];

export const storyOpportunities: DemoOpportunity[] = [
  {
    id: "opp-cip-murucutu",
    clientId: "client-pousada-murucutu",
    title: "Controle de vetores da pousada",
    stage: "closed_won",
    categoryId: "environmental-pest",
    estimatedValue: 2400,
    createdAt: "2026-08-10",
    updatedAt: "2026-08-20",
    provenance,
  },
  {
    id: "opp-poco-iara",
    clientId: "client-sitio-iara",
    title: "Higienização de poço e apoio à outorga",
    stage: "proposal",
    categoryId: "water-sanitation",
    estimatedValue: 6100,
    createdAt: "2026-08-12",
    updatedAt: "2026-08-22",
    provenance,
  },
  {
    id: "opp-marajo",
    clientId: "client-residencial-marajo",
    title: "Monitoramento mensal da casa de máquinas",
    stage: "closed_won",
    categoryId: "water-sanitation",
    estimatedValue: 1800,
    createdAt: "2026-07-01",
    updatedAt: "2026-07-15",
    provenance,
  },
];

export const storyProposals: DemoProposal[] = [
  {
    id: "prop-cip-murucutu",
    code: "DEMO-CIP-014",
    opportunityId: "opp-cip-murucutu",
    clientId: "client-pousada-murucutu",
    status: "accepted",
    value: 2400,
    sentAt: "2026-08-18",
    validUntil: "2026-09-18",
    paymentTerms: "À vista após o serviço",
    executionDeadline: "Até 7 dias após a formalização",
    commercialConditions: "Condição desta proposta: afastamento de 6 horas após a pulverização.",
    cancellationFee: "15% nesta proposta, se o cancelamento ocorrer no dia.",
    observations: "Condições de cancelamento e pagamento variam por proposta. Este percentual não é regra global.",
    serviceFamily: "cip",
    formalization: {
      statusLabel: "Aprovada",
      kind: "signed-proposal",
      kindLabel: "Proposta assinada",
      documentCode: "ACEITE-DEMO-014",
      receivedAt: "2026-08-21",
      note: "Forma demonstrativa. Confirmar com o cliente se proposta assinada libera o agendamento.",
    },
    narrative: {
      technicalScope: ["Desinsetização das áreas comuns e desratização do depósito."],
      procedures: ["Inspeção, aplicação localizada e registro de incidência."],
      contractorDuties: ["Afastar pessoas e alimentos durante o período combinado."],
      specificConditions: ["Taxa de cancelamento desta proposta: 15% no dia do serviço."],
      includedDeliverables: ["Certificado de controle de pragas", "Declaração de ciência"],
      technicalResponsibleId: "resp-quimico",
    },
    provenance,
  },
];

export const storyVehicles: DemoVehicle[] = [
  { id: "veh-f1", internalCode: "F1", kind: "Carro", model: "Sedan demonstrativo", plate: "DEMO-1A11", status: "Disponível", provenance },
  { id: "veh-f2", internalCode: "F2", kind: "Utilitário", model: "Fiorino demonstrativo", plate: "DEMO-2B22", status: "Em serviço", provenance },
  { id: "veh-f3", internalCode: "F3", kind: "Carro", model: "Hatch demonstrativo", plate: "DEMO-3C33", status: "Disponível", provenance },
  { id: "veh-saveiro", internalCode: "Saveiro", kind: "Utilitário", model: "Saveiro demonstrativa", plate: "DEMO-4D44", status: "Disponível", provenance },
  { id: "veh-kombi", internalCode: "Kombi", kind: "Utilitário", model: "Kombi demonstrativa", plate: "DEMO-5E55", status: "Manutenção", provenance },
  { id: "veh-moto", internalCode: "M1", kind: "Motocicleta", model: "Moto de apoio DEMO", plate: "DEMO-6F66", status: "Disponível", provenance },
];

export const storyResponsibles: DemoTechnicalResponsible[] = [
  {
    id: "resp-quimico",
    name: "Helena Duarte (DEMO)",
    education: "Engenheira química",
    council: "CRQ",
    registration: "CRQ-DEMO-1044",
    specialty: "CIP, reservatórios e saneamento",
    families: ["CIP", "RSV", "ETE", "Monitoramento"],
    provenance,
  },
  {
    id: "resp-geologo",
    name: "Caio Mendes (DEMO)",
    education: "Engenheiro geólogo",
    council: "CREA",
    registration: "CREA-DEMO-22091",
    specialty: "Poços e outorga",
    families: ["Poço", "Outorga"],
    provenance,
  },
];

export const storyCredentials: DemoRegulatoryCredential[] = [
  {
    id: "cred-sanitaria",
    organ: "Vigilância sanitária (DEMO)",
    kind: "Licença sanitária",
    number: "LS-DEMO-0000",
    validUntil: "2027-03-01",
    status: "Número fictício para validar o campo",
    usedBy: ["CIP", "RSV"],
    provenance,
  },
  {
    id: "cred-crea",
    organ: "CREA (DEMO)",
    kind: "Registro profissional",
    number: "CREA-DEMO-0000",
    validUntil: "2027-06-01",
    status: "Número fictício para validar o campo",
    usedBy: ["Poço", "Outorga"],
    provenance,
  },
];

export const storyPreServiceDocuments: DemoPreServiceDocument[] = [
  {
    id: "pre-hotel-aviso",
    workOrderId: "os-demo-04",
    clientId: "client-hotel-amazonas",
    kind: "notice",
    title: "Informativo de serviço",
    summary: "Aviso fictício à manutenção do hotel sobre a higienização da torre.",
    lines: [
      "Data: 28/08/2026, a partir das 10h.",
      "Serviço: higienização de reservatórios da torre de hóspedes.",
      "Impacto: reservatório elevado fora de uso durante o procedimento.",
      "Segurança: área isolada. Não é o texto operacional original da empresa.",
    ],
    provenance,
  },
  {
    id: "pre-hotel-entrada",
    workOrderId: "os-demo-04",
    clientId: "client-hotel-amazonas",
    kind: "entry-authorization",
    title: "Autorização de entrada",
    summary: "Equipe e veículo fictícios autorizados a entrar na torre.",
    lines: [
      "Unidade: torre de hóspedes.",
      "Data: 28/08/2026.",
      "Profissional: Ana Ribeiro (DEMO), técnica de saneamento. Documento: DOC-DEMO-ANA.",
      "Veículo: F2, placa DEMO-2B22.",
    ],
    provenance,
  },
  {
    id: "pre-cip-ciencia",
    workOrderId: "os-cip-01",
    clientId: "client-pousada-murucutu",
    kind: "awareness",
    title: "Declaração de ciência",
    summary: "Ciência fictícia do responsável sobre o período de afastamento após a pulverização.",
    lines: [
      "Período de afastamento demonstrativo: 6 horas.",
      "Orientação: não repor alimentos na área tratada antes do prazo combinado.",
      "Responsável: Lívia Pantoja (DEMO). Assinatura apenas reservada na prévia.",
    ],
    provenance,
  },
];

export const storyProcesses: DemoEnvironmentalProcess[] = [
  {
    id: "proc-outorga-iara",
    code: "PROC-DEMO-001",
    clientId: "client-sitio-iara",
    title: "Outorga de direito de uso de recursos hídricos",
    unit: "Poço demonstrativo 01",
    technicalResponsibleId: "resp-geologo",
    organ: "Órgão ambiental (DEMO)",
    status: "documents-pending",
    checklist: [
      { id: "out-1", label: "Requerimento", checked: true },
      { id: "out-2", label: "Formulário técnico", checked: true },
      { id: "out-3", label: "Fotos do poço", checked: false },
      { id: "out-4", label: "Coordenadas", checked: false },
      { id: "out-5", label: "ART", checked: false },
      { id: "out-6", label: "Protocolo", checked: false },
    ],
    notes:
      "Ainda não está confirmado que Processos significa outorga. Os itens do checklist são fictícios.",
    provenance,
  },
];

export const hotelProposalStory: Pick<
  DemoProposal,
  "formalization" | "narrative" | "serviceFamily" | "observations" | "paymentSignal"
> = {
  serviceFamily: "rsv",
  observations:
    "Orçamento-guia. Após o aceite, o sinal confirmado libera a emissão da OS; o agendamento é um passo separado.",
  paymentSignal: {
    status: "confirmed",
    amount: 4900,
    registeredAt: "2026-06-06",
    confirmedAt: "2026-06-06",
    note: "Sinal demonstrativo (50% do orçamento). Não é cobrança real. Exceções à exigência ainda precisam de validação.",
    financialTransactionId: "fin-signal-005",
  },
  formalization: {
    statusLabel: "Aprovada",
    kind: "service-purchase-order",
    kindLabel: "Ordem de Compra de Serviço",
    documentCode: "OCS-DEMO-014",
    receivedAt: "2026-08-27",
    note: "Formalização do orçamento avulso (OCS). Distinta da O.C. vinculada a contratos periódicos.",
  },
  narrative: {
    technicalScope: [
      "Dois reservatórios elevados de 10.000 L e uma cisterna de 20.000 L na torre de hóspedes.",
    ],
    procedures: ["Esvaziamento, remoção de sedimento, lavagem, desinfecção e registro fotográfico."],
    contractorDuties: ["Liberar acesso à laje e indicar o responsável no local."],
    specificConditions: [
      "Cancelamento desta proposta comercial: 30% com menos de 48 horas. Outras propostas podem ter condição diferente.",
    ],
    includedDeliverables: [
      "Relatório técnico/fotográfico",
      "Atestado de reservatório",
      "ART quando aplicável",
    ],
    technicalResponsibleId: "resp-quimico",
  },
};
