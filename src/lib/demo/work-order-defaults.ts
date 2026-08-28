import type {
  DemoWorkOrderChecklistItem,
  DemoWorkOrderPlannedMaterial,
} from "@/types/demo-entities";

export const DEFAULT_PLANNING_CHECKLIST: DemoWorkOrderChecklistItem[] = [
  { id: "chk-access", label: "Confirmar acesso ao local", checked: false },
  { id: "chk-epi", label: "Verificar EPI da equipe", checked: false },
  { id: "chk-materials", label: "Separar materiais previstos", checked: false },
  { id: "chk-window", label: "Validar janela com o cliente", checked: false },
  { id: "chk-register", label: "Registrar OS no sistema", checked: false },
];

export function createDefaultPlanningChecklist(): DemoWorkOrderChecklistItem[] {
  return DEFAULT_PLANNING_CHECKLIST.map((item) => ({ ...item }));
}

export function createDefaultPlannedMaterials(
  categoryId: "water-sanitation" | "environmental-pest",
): DemoWorkOrderPlannedMaterial[] {
  if (categoryId === "water-sanitation") {
    return [
      { productId: "prod-001", quantity: 2 },
      { productId: "prod-005", quantity: 1 },
    ];
  }

  return [
    { productId: "prod-002", quantity: 1 },
    { productId: "prod-003", quantity: 4 },
  ];
}

export const DEMO_FIELD_TEAMS = [
  "Téc. Ana (DEMO)",
  "Téc. Bruno (DEMO)",
  "Téc. Carla (DEMO)",
  "Téc. Diego (DEMO)",
] as const;
