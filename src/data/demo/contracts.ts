import { createProvenance } from "@/lib/content/provenance";
import type { DemoContract } from "@/types/demo-entities";

const provenance = createProvenance({
  sourceType: "DEMO_FICTIONAL",
  notes: "Contrato fictício para alertas, cronograma e vínculo com OS demonstrativas.",
});

function contract(
  index: number,
  seed: Omit<DemoContract, "code" | "provenance" | "scheduledVisits"> & {
    scheduledVisits?: DemoContract["scheduledVisits"];
  },
): DemoContract {
  return {
    ...seed,
    code: `CT-DEMO-${String(index).padStart(3, "0")}`,
    scheduledVisits: seed.scheduledVisits ?? [],
    provenance,
  };
}

export const demoContracts: DemoContract[] = [
  contract(1, {
    id: "contract-001",
    clientId: "client-rio-guama",
    title: "Plano trimestral de higienização",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    periodicity: "quarterly",
    monthlyValue: 2800,
    adjustmentIndex: "IPCA (demonstrativo)",
    nextAdjustmentDate: "2027-01-01",
    status: "active",
    scheduledVisits: [
      {
        id: "visit-001-a",
        scheduledDate: "2026-09-02",
        serviceName: "Higienização de caixas d'água",
        workOrderId: "os-demo-01",
      },
      {
        id: "visit-001-b",
        scheduledDate: "2026-12-05",
        serviceName: "Desinfecção de reservatórios",
        workOrderId: "os-demo-13",
      },
    ],
  }),
  contract(2, {
    id: "contract-002",
    clientId: "client-clinica-horizonte",
    title: "Controle preventivo de pragas",
    startDate: "2026-03-01",
    endDate: "2027-02-28",
    periodicity: "monthly",
    monthlyValue: 4200,
    adjustmentIndex: "IGP-M (demonstrativo)",
    nextAdjustmentDate: "2027-03-01",
    status: "active",
    scheduledVisits: [
      {
        id: "visit-002-a",
        scheduledDate: "2026-09-03",
        serviceName: "Sanitização de ambientes",
        workOrderId: "os-demo-02",
      },
      {
        id: "visit-002-b",
        scheduledDate: "2026-08-01",
        serviceName: "Controle de roedores",
        workOrderId: "os-demo-14",
      },
    ],
  }),
  contract(3, {
    id: "contract-003",
    clientId: "client-industria-porto-verde",
    title: "Saneamento industrial recorrente",
    startDate: "2026-02-01",
    endDate: "2026-09-30",
    periodicity: "monthly",
    monthlyValue: 6150,
    adjustmentIndex: "IPCA (demonstrativo)",
    nextAdjustmentDate: "2026-10-01",
    status: "expiring",
    scheduledVisits: [
      {
        id: "visit-003-a",
        scheduledDate: "2026-09-04",
        serviceName: "Desratização",
        workOrderId: "os-demo-03",
      },
      {
        id: "visit-003-b",
        scheduledDate: "2026-08-22",
        serviceName: "Saneamento de área industrial",
        workOrderId: "os-demo-09",
      },
      {
        id: "visit-003-c",
        scheduledDate: "2026-07-28",
        serviceName: "Limpeza de poço tubular",
        workOrderId: "os-demo-15",
      },
    ],
  }),
  contract(4, {
    id: "contract-004",
    clientId: "client-hotel-amazonas",
    title: "Higienização de reservatórios",
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    periodicity: "semiannual",
    monthlyValue: 3260,
    adjustmentIndex: "IPCA (demonstrativo)",
    status: "active",
    scheduledVisits: [
      {
        id: "visit-004-a",
        scheduledDate: "2026-08-28",
        serviceName: "Higienização de reservatórios",
        workOrderId: "os-demo-04",
      },
      {
        id: "visit-004-b",
        scheduledDate: "2026-07-20",
        serviceName: "Tratamento de água",
        workOrderId: "os-demo-16",
      },
    ],
  }),
  contract(5, {
    id: "contract-005",
    clientId: "client-hospital-norte",
    title: "Sanitização hospitalar",
    startDate: "2026-01-15",
    endDate: "2026-10-15",
    periodicity: "monthly",
    monthlyValue: 5060,
    adjustmentIndex: "IGP-M (demonstrativo)",
    nextAdjustmentDate: "2026-11-15",
    status: "expiring",
    scheduledVisits: [
      {
        id: "visit-005-a",
        scheduledDate: "2026-08-20",
        serviceName: "Desinsetização de áreas críticas",
        workOrderId: "os-demo-05",
      },
      {
        id: "visit-005-b",
        scheduledDate: "2026-09-08",
        serviceName: "Sanitização de UTIs",
        workOrderId: "os-demo-17",
      },
    ],
  }),
  contract(6, {
    id: "contract-006",
    clientId: "client-galeria-comercial",
    title: "Plano mensal de pragas",
    startDate: "2026-05-01",
    endDate: "2027-04-30",
    periodicity: "monthly",
    monthlyValue: 2900,
    adjustmentIndex: "IPCA (demonstrativo)",
    status: "active",
    scheduledVisits: [
      {
        id: "visit-006-a",
        scheduledDate: "2026-08-10",
        serviceName: "Desinsetização mensal",
        workOrderId: "os-demo-07",
      },
      {
        id: "visit-006-b",
        scheduledDate: "2026-09-09",
        serviceName: "Desratização de subsolo",
        workOrderId: "os-demo-18",
      },
    ],
  }),
];
