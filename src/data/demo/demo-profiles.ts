import { createProvenance } from "@/lib/content/provenance";

const provenance = createProvenance({
  sourceType: "DEMO_FICTIONAL",
  notes: "Perfis representativos do ambiente demo. Sem RBAC real.",
});

export type DemoProfile = {
  id: string;
  roleLabel: string;
  email: string;
  description: string;
  modules: string[];
  provenance: ReturnType<typeof createProvenance>;
};

export const demoProfiles: DemoProfile[] = [
  {
    id: "profile-direction",
    roleLabel: "Direção",
    email: "direcao@demo.servsam.local",
    description:
      "Visão executiva do negócio: dashboard, financeiro, contratos e relatórios consolidados.",
    modules: [
      "Visão geral",
      "Financeiro",
      "Contratos",
      "Relatórios",
      "Configurações",
    ],
    provenance,
  },
  {
    id: "profile-compliance",
    roleLabel: "Compliance",
    email: "compliance@demo.servsam.local",
    description:
      "Governança documental, alertas de vencimento e acompanhamento de licitações.",
    modules: ["Documentos", "Contratos", "Licitações", "Relatórios"],
    provenance,
  },
];

export function findDemoProfileByEmail(email: string): DemoProfile | undefined {
  return demoProfiles.find((profile) => profile.email === email);
}
