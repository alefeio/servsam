import { createProvenance } from "@/lib/content/provenance";
import type { DemoPublicTender } from "@/types/demo-entities";

const provenance = createProvenance({
  sourceType: "DEMO_FICTIONAL",
  notes: "Licitação fictícia para fluxo público demonstrativo.",
});

function defaultChecklist(): DemoPublicTender["documentChecklist"] {
  return [
    { id: "doc-certidoes", label: "Certidões negativas", checked: false },
    { id: "doc-balanco", label: "Balanço patrimonial (DEMO)", checked: false },
    { id: "doc-proposta", label: "Proposta técnica e comercial", checked: false },
    { id: "doc-art", label: "ART/RRT do responsável técnico", checked: false },
    { id: "doc-habilitacao", label: "Documentos de habilitação", checked: false },
  ];
}

function tender(
  index: number,
  seed: Omit<DemoPublicTender, "code" | "provenance" | "documentChecklist"> & {
    documentChecklist?: DemoPublicTender["documentChecklist"];
  },
): DemoPublicTender {
  return {
    ...seed,
    code: `LIC-DEMO-${String(index).padStart(3, "0")}`,
    documentChecklist: seed.documentChecklist ?? defaultChecklist(),
    provenance,
  };
}

export const demoPublicTenders: DemoPublicTender[] = [
  tender(1, {
    id: "tender-001",
    title: "Higienização de reservatórios - rede escolar",
    organAlias: "Prefeitura de Ananindeua (DEMO)",
    estimatedValue: 185000,
    stage: "documentation",
    publicationDate: "2026-08-01",
    submissionDeadline: "2026-09-15",
    openingDate: "2026-09-20",
    documentChecklist: defaultChecklist().map((item, idx) => ({
      ...item,
      checked: idx < 2,
    })),
  }),
  tender(2, {
    id: "tender-002",
    title: "Controle integrado de pragas - unidades de saúde",
    organAlias: "Secretaria Municipal de Saúde (DEMO)",
    estimatedValue: 320000,
    stage: "submitted",
    publicationDate: "2026-07-10",
    submissionDeadline: "2026-08-25",
    openingDate: "2026-09-02",
    documentChecklist: defaultChecklist().map((item) => ({ ...item, checked: true })),
  }),
  tender(3, {
    id: "tender-003",
    title: "Saneamento de áreas comuns - condomínios públicos",
    organAlias: "Companhia de Habitação (DEMO)",
    estimatedValue: 96000,
    stage: "evaluation",
    publicationDate: "2026-06-15",
    submissionDeadline: "2026-08-10",
    openingDate: "2026-08-18",
    documentChecklist: defaultChecklist().map((item) => ({ ...item, checked: true })),
  }),
  tender(4, {
    id: "tender-004",
    title: "Desratização e desinsetização - terminal rodoviário",
    organAlias: "Agência de Transporte (DEMO)",
    estimatedValue: 54000,
    stage: "won",
    publicationDate: "2026-05-01",
    submissionDeadline: "2026-06-20",
    openingDate: "2026-06-28",
    clientId: "client-galeria-comercial",
    proposalId: "prop-008",
    documentChecklist: defaultChecklist().map((item) => ({ ...item, checked: true })),
  }),
  tender(5, {
    id: "tender-005",
    title: "Limpeza de poços tubulares - bairros periféricos",
    organAlias: "Prefeitura de Belém (DEMO)",
    estimatedValue: 210000,
    stage: "prospecting",
    publicationDate: "2026-08-20",
    submissionDeadline: "2026-10-05",
    openingDate: "2026-10-12",
  }),
  tender(6, {
    id: "tender-006",
    title: "Higienização de caixas d'água - hospitais regionais",
    organAlias: "Secretaria de Saúde do Estado (DEMO)",
    estimatedValue: 450000,
    stage: "lost",
    publicationDate: "2026-04-01",
    submissionDeadline: "2026-05-30",
    openingDate: "2026-06-10",
    documentChecklist: defaultChecklist().map((item) => ({ ...item, checked: true })),
  }),
  tender(7, {
    id: "tender-007",
    title: "Dedetização de áreas externas - parques municipais",
    organAlias: "Secretaria de Meio Ambiente (DEMO)",
    estimatedValue: 78000,
    stage: "documentation",
    publicationDate: "2026-08-12",
    submissionDeadline: "2026-09-30",
    openingDate: "2026-10-08",
    documentChecklist: defaultChecklist().map((item, idx) => ({
      ...item,
      checked: idx === 0,
    })),
  }),
];
