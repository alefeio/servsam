import { createProvenance } from "@/lib/content/provenance";
import type { DemoCredentials } from "@/types/demo";

const provenance = createProvenance({
  sourceType: "DEMO_FICTIONAL",
  notes:
    "Credenciais visíveis na tela de login. Não são segredos e não representam autenticação de produção.",
});

export const DEMO_SESSION_STORAGE_KEY = "servsam.demo.session";
export const DEMO_DATASET_STORAGE_KEY = "servsam.demo.dataset";
export const DEMO_RESTORE_FLAG_KEY = "servsam.demo.restoredAt";

export const demoCredentialProfiles: DemoCredentials[] = [
  {
    email: "direcao@demo.servsam.local",
    password: "servsam-demo",
    roleLabel: "Direção",
    provenance,
  },
  {
    email: "compliance@demo.servsam.local",
    password: "servsam-demo",
    roleLabel: "Compliance",
    provenance,
  },
];

/** @deprecated Use demoCredentialProfiles */
export const demoCredentials = demoCredentialProfiles[0];

export function findDemoCredential(email: string, password: string): DemoCredentials | undefined {
  return demoCredentialProfiles.find(
    (profile) => profile.email === email.trim() && profile.password === password,
  );
}
