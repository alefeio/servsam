import { createProvenance } from "@/lib/content/provenance";
import {
  createDefaultPlannedMaterials,
  createDefaultPlanningChecklist,
} from "@/lib/demo/work-order-defaults";
import type { DemoWorkOrder } from "@/types/demo-entities";

const provenance = createProvenance({
  sourceType: "DEMO_FICTIONAL",
  notes: "Ordem de serviço fictícia para agenda e produtividade demonstrativa.",
});

type WorkOrderSeed = Omit<
  DemoWorkOrder,
  "code" | "teamAliases" | "plannedMaterials" | "planningChecklist" | "provenance"
> &
  Partial<
    Pick<
      DemoWorkOrder,
      | "teamAliases"
      | "plannedMaterials"
      | "planningChecklist"
      | "clientUnitId"
      | "proposalId"
      | "completedAt"
      | "notes"
    >
  >;

function completedChecklist() {
  return createDefaultPlanningChecklist().map((item) => ({ ...item, checked: true }));
}

function workOrder(index: number, seed: WorkOrderSeed): DemoWorkOrder {
  const isCompleted = seed.status === "completed";

  return {
    ...seed,
    code: `OS-DEMO-${String(index).padStart(3, "0")}`,
    teamAliases: seed.teamAliases ?? [seed.technicianAlias],
    plannedMaterials:
      seed.plannedMaterials ?? createDefaultPlannedMaterials(seed.categoryId),
    planningChecklist: isCompleted
      ? completedChecklist()
      : (seed.planningChecklist ?? createDefaultPlanningChecklist()),
    completedAt: isCompleted ? (seed.completedAt ?? seed.scheduledAt.slice(0, 10)) : seed.completedAt,
    provenance,
  };
}

export const demoWorkOrders: DemoWorkOrder[] = [
  workOrder(1, {
    id: "os-demo-01",
    clientId: "client-rio-guama",
    clientUnitId: "unit-rio-guama-torre-a",
    contractId: "contract-001",
    serviceName: "Higienização de caixas d'água",
    categoryId: "water-sanitation",
    status: "scheduled",
    scheduledAt: "2026-09-02T08:30:00",
    technicianAlias: "Téc. Ana (DEMO)",
    teamAliases: ["Téc. Ana (DEMO)", "Téc. Bruno (DEMO)"],
  }),
  workOrder(2, {
    id: "os-demo-02",
    clientId: "client-clinica-horizonte",
    clientUnitId: "unit-clinica-horizonte-sede",
    contractId: "contract-002",
    serviceName: "Sanitização de ambientes",
    categoryId: "environmental-pest",
    status: "scheduled",
    scheduledAt: "2026-09-03T14:00:00",
    technicianAlias: "Téc. Bruno (DEMO)",
    teamAliases: ["Téc. Bruno (DEMO)", "Téc. Diego (DEMO)"],
  }),
  workOrder(3, {
    id: "os-demo-03",
    clientId: "client-industria-porto-verde",
    clientUnitId: "unit-industria-porto-planta",
    contractId: "contract-003",
    serviceName: "Desratização",
    categoryId: "environmental-pest",
    status: "scheduled",
    scheduledAt: "2026-09-04T09:00:00",
    technicianAlias: "Téc. Carla (DEMO)",
  }),
  workOrder(4, {
    id: "os-demo-04",
    clientId: "client-hotel-amazonas",
    contractId: "contract-004",
    serviceName: "Higienização de reservatórios",
    categoryId: "water-sanitation",
    status: "in_progress",
    scheduledAt: "2026-08-28T10:00:00",
    technicianAlias: "Téc. Ana (DEMO)",
    planningChecklist: createDefaultPlanningChecklist().map((item, idx) => ({
      ...item,
      checked: idx < 3,
    })),
  }),
  workOrder(5, {
    id: "os-demo-05",
    clientId: "client-hospital-norte",
    contractId: "contract-005",
    serviceName: "Desinsetização de áreas críticas",
    categoryId: "environmental-pest",
    status: "completed",
    scheduledAt: "2026-08-20T07:30:00",
    technicianAlias: "Téc. Bruno (DEMO)",
    completedAt: "2026-08-20",
  }),
  workOrder(6, {
    id: "os-demo-06",
    clientId: "client-supermercado-rio",
    serviceName: "Higienização de reservatório superior",
    categoryId: "water-sanitation",
    status: "completed",
    scheduledAt: "2026-08-15T11:00:00",
    technicianAlias: "Téc. Carla (DEMO)",
    completedAt: "2026-08-15",
  }),
  workOrder(7, {
    id: "os-demo-07",
    clientId: "client-galeria-comercial",
    contractId: "contract-006",
    serviceName: "Desinsetização mensal",
    categoryId: "environmental-pest",
    status: "completed",
    scheduledAt: "2026-08-10T16:00:00",
    technicianAlias: "Téc. Diego (DEMO)",
    completedAt: "2026-08-10",
  }),
  workOrder(8, {
    id: "os-demo-08",
    clientId: "client-clube-nautico",
    serviceName: "Desinfecção de vestiários",
    categoryId: "water-sanitation",
    status: "scheduled",
    scheduledAt: "2026-09-05T08:00:00",
    technicianAlias: "Téc. Diego (DEMO)",
  }),
  workOrder(9, {
    id: "os-demo-09",
    clientId: "client-fabrica-papel",
    contractId: "contract-003",
    serviceName: "Saneamento de área industrial",
    categoryId: "water-sanitation",
    status: "overdue",
    scheduledAt: "2026-08-22T13:00:00",
    technicianAlias: "Téc. Carla (DEMO)",
  }),
  workOrder(10, {
    id: "os-demo-10",
    clientId: "client-condominio-bosque",
    serviceName: "Inspeção de reservatórios",
    categoryId: "water-sanitation",
    status: "scheduled",
    scheduledAt: "2026-09-06T09:30:00",
    technicianAlias: "Téc. Ana (DEMO)",
  }),
  workOrder(11, {
    id: "os-demo-11",
    clientId: "client-escola-baia-verde",
    serviceName: "Dedetização de pátio",
    categoryId: "environmental-pest",
    status: "scheduled",
    scheduledAt: "2026-09-07T15:00:00",
    technicianAlias: "Téc. Bruno (DEMO)",
  }),
  workOrder(12, {
    id: "os-demo-12",
    clientId: "client-restaurante-mangue",
    serviceName: "Sanitização de cozinha",
    categoryId: "environmental-pest",
    status: "cancelled",
    scheduledAt: "2026-08-05T18:00:00",
    technicianAlias: "Téc. Diego (DEMO)",
    notes: "Cancelada a pedido do cliente (demonstração).",
  }),
  workOrder(13, {
    id: "os-demo-13",
    clientId: "client-rio-guama",
    clientUnitId: "unit-rio-guama-torre-b",
    contractId: "contract-001",
    serviceName: "Desinfecção de reservatórios",
    categoryId: "water-sanitation",
    status: "completed",
    scheduledAt: "2026-08-05T08:00:00",
    technicianAlias: "Téc. Ana (DEMO)",
    completedAt: "2026-08-05",
  }),
  workOrder(14, {
    id: "os-demo-14",
    clientId: "client-clinica-horizonte",
    contractId: "contract-002",
    serviceName: "Controle de roedores",
    categoryId: "environmental-pest",
    status: "completed",
    scheduledAt: "2026-08-01T14:30:00",
    technicianAlias: "Téc. Bruno (DEMO)",
    completedAt: "2026-08-01",
  }),
  workOrder(15, {
    id: "os-demo-15",
    clientId: "client-industria-porto-verde",
    contractId: "contract-003",
    serviceName: "Limpeza de poço tubular",
    categoryId: "water-sanitation",
    status: "completed",
    scheduledAt: "2026-07-28T09:00:00",
    technicianAlias: "Téc. Carla (DEMO)",
    completedAt: "2026-07-28",
  }),
  workOrder(16, {
    id: "os-demo-16",
    clientId: "client-hotel-amazonas",
    contractId: "contract-004",
    serviceName: "Tratamento de água",
    categoryId: "water-sanitation",
    status: "completed",
    scheduledAt: "2026-07-20T10:30:00",
    technicianAlias: "Téc. Ana (DEMO)",
    completedAt: "2026-07-20",
  }),
  workOrder(17, {
    id: "os-demo-17",
    clientId: "client-hospital-norte",
    contractId: "contract-005",
    serviceName: "Sanitização de UTIs",
    categoryId: "environmental-pest",
    status: "scheduled",
    scheduledAt: "2026-09-08T06:00:00",
    technicianAlias: "Téc. Bruno (DEMO)",
  }),
  workOrder(18, {
    id: "os-demo-18",
    clientId: "client-galeria-comercial",
    contractId: "contract-006",
    serviceName: "Desratização de subsolo",
    categoryId: "environmental-pest",
    status: "scheduled",
    scheduledAt: "2026-09-09T11:30:00",
    technicianAlias: "Téc. Diego (DEMO)",
  }),
];
