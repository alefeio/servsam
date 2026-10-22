import { createProvenance } from "@/lib/content/provenance";
import type {
  DemoCertificate,
  DemoEmployee,
  DemoPhotoReport,
  DemoServiceExecution,
} from "@/types/demo-entities";

const provenance = createProvenance({
  sourceType: "DEMO_FICTIONAL",
  notes:
    "Registros da Sprint 10 para validação visual. Não são cadastro de produção nem documento oficial.",
});

export const demoEmployees: DemoEmployee[] = [
  {
    id: "emp-ana",
    name: "Ana Ribeiro (DEMO)",
    role: "Técnica de saneamento",
    phone: "(91) 99100-2001",
    documents: [
      { label: "ASO", status: "Válido", expiresAt: "2026-12-10" },
      { label: "NR-33", status: "Válido", expiresAt: "2027-02-01" },
      { label: "NR-35", status: "Vence em breve", expiresAt: "2026-09-18" },
      { label: "Ficha de EPI", status: "Entregue em agosto" },
    ],
    trainings: ["Reciclagem de higienização de reservatórios em junho de 2026 (fictício)."],
    warnings: ["Nenhuma advertência neste fixture."],
    provenance,
  },
  {
    id: "emp-bruno",
    name: "Bruno Alves (DEMO)",
    role: "Técnico de controle de pragas",
    phone: "(91) 99200-2002",
    documents: [
      { label: "ASO", status: "Vencido", expiresAt: "2026-07-30" },
      { label: "NR-33", status: "Pendente" },
      { label: "NR-35", status: "Válido", expiresAt: "2027-01-12" },
      { label: "Ficha de EPI", status: "Atualizar luva química" },
    ],
    trainings: ["Integração em controle de pragas em março de 2026 (fictício)."],
    warnings: ["Advertência demonstrativa de 12/06 por atraso de checklist. Não é registro trabalhista."],
    provenance,
  },
];

export const demoCertificates: DemoCertificate[] = [
  {
    id: "cert-hotel-001",
    number: "AT-DEMO-2026-014",
    clientId: "client-hotel-amazonas",
    workOrderId: "os-demo-04",
    certificateType: "Atestado de higienização de reservatório",
    serviceName: "Higienização de reservatórios",
    status: "draft",
    productId: "prod-001",
    technicalResponsible: "Responsável técnico demonstrativo",
    licenses: [
      "Licença sanitária — informada no site atual, documentação pendente de validação",
      "Registro profissional — pendente de validação",
    ],
    provenance,
  },
];

export const demoPhotoReports: DemoPhotoReport[] = [
  {
    id: "rel-foto-hotel",
    clientId: "client-hotel-amazonas",
    workOrderId: "os-demo-04",
    title: "Relatório fotográfico de reservatórios",
    technicalDescription:
      "Abertura, remoção de sedimento, lavagem e desinfecção dos reservatórios da torre de hóspedes. Texto fictício para validar a organização da página.",
    beforeCondition: "Sedimento visível no fundo e tampa sem vedação adequada.",
    afterCondition: "Reservatório lavado, desinfetado e tampa recolocada.",
    observations: "Recomendar nova inspeção no próximo ciclo do contrato.",
    nr33: "Espaço confinado sinalizado. Entrada com vigia e permissão de trabalho demonstrativa.",
    nr35: "Acesso à laje com linha de vida e cinto. Registro visual, sem medição real.",
    photoSrcs: [
      "/images/services/higienizacao-caixas-dagua.jpg",
      "/images/editorial/caixas-dagua.jpg",
      "/images/services/desinfeccao-reservatorios.jpg",
      "/images/editorial/qualidade-agua.jpg",
      "/images/services/analise-qualidade-agua.jpg",
      "/images/services/tratamento-agua-eta.jpg",
    ],
    clientResponsible: "Marina Costa (DEMO)",
    technicalResponsible: "Ana Ribeiro (DEMO)",
    provenance,
  },
];

export const demoServiceExecutions: DemoServiceExecution[] = [
  {
    id: "exec-os-demo-04",
    workOrderId: "os-demo-04",
    startedAt: "2026-08-28T10:12:00",
    clientResponsible: "Marina Costa (DEMO)",
    acceptance: "Aguardando aceite do responsável do hotel.",
    observations: "Equipe no local. A desinfecção ainda não foi concluída neste fixture.",
    checklist: [
      { id: "exec-1", label: "Isolar a área e sinalizar o reservatório", checked: true },
      { id: "exec-2", label: "Registrar condição antes", checked: true },
      { id: "exec-3", label: "Aplicar produto e anotar quantidade", checked: false },
      { id: "exec-4", label: "Coletar aceite e assinatura", checked: false },
    ],
    usedMaterials: [{ productId: "prod-001", quantity: 8 }],
    photoSrcs: [
      "/images/services/higienizacao-caixas-dagua.jpg",
      "/images/editorial/caixas-dagua.jpg",
    ],
    provenance,
  },
];
