import { storyUnits } from "@/data/demo/operational-story";
import { createProvenance } from "@/lib/content/provenance";
import type { DemoClientUnit } from "@/types/demo-entities";

const provenance = createProvenance({
  sourceType: "DEMO_FICTIONAL",
  notes: "Unidade fictícia de cliente para ficha com múltiplos endereços.",
});

export const demoClientUnits: DemoClientUnit[] = [
  {
    id: "unit-rio-guama-torre-a",
    clientId: "client-rio-guama",
    name: "Torre A",
    address: "Av. Augusto Montenegro, 1000",
    city: "Belém",
    provenance,
  },
  {
    id: "unit-rio-guama-torre-b",
    clientId: "client-rio-guama",
    name: "Torre B",
    address: "Av. Augusto Montenegro, 1020",
    city: "Belém",
    provenance,
  },
  {
    id: "unit-clinica-horizonte-sede",
    clientId: "client-clinica-horizonte",
    name: "Unidade sede",
    address: "Travessa Dom Romão, 120",
    city: "Belém",
    provenance,
  },
  {
    id: "unit-clinica-horizonte-anexo",
    clientId: "client-clinica-horizonte",
    name: "Anexo diagnóstico",
    address: "Travessa Dom Romão, 128",
    city: "Belém",
    provenance,
  },
  {
    id: "unit-hospital-norte-bloco-a",
    clientId: "client-hospital-norte",
    name: "Bloco A - Internação",
    address: "Av. Generalíssimo Deodoro, 450",
    city: "Belém",
    provenance,
  },
  {
    id: "unit-hospital-norte-bloco-b",
    clientId: "client-hospital-norte",
    name: "Bloco B - Ambulatorial",
    address: "Av. Generalíssimo Deodoro, 460",
    city: "Belém",
    provenance,
  },
  {
    id: "unit-industria-porto-planta",
    clientId: "client-industria-porto-verde",
    name: "Planta principal",
    address: "Rod. Augusto Montenegro, km 8",
    city: "Ananindeua",
    provenance,
  },
  {
    id: "unit-industria-porto-logistica",
    clientId: "client-industria-porto-verde",
    name: "Centro logístico",
    address: "Rod. Augusto Montenegro, km 9",
    city: "Ananindeua",
    provenance,
  },
  {
    id: "unit-hotel-amazonas-torre",
    clientId: "client-hotel-amazonas",
    name: "Torre hóspedes",
    address: "Av. Presidente Vargas, 800",
    city: "Belém",
    provenance,
  },
  ...storyUnits,
];
