import { createProvenance } from "@/lib/content/provenance";
import type { DemoClient } from "@/types/demo-entities";

const provenance = createProvenance({
  sourceType: "DEMO_FICTIONAL",
  notes: "Cliente fictício para massa demonstrativa da Sprint 2.",
});

export const demoClients: DemoClient[] = [
  {
    id: "client-rio-guama",
    alias: "Condomínio Rio Guamá (DEMO)",
    segment: "Condomínios",
    city: "Belém",
    provenance,
  },
  {
    id: "client-clinica-horizonte",
    alias: "Clínica Horizonte Amazônia (DEMO)",
    segment: "Clínicas",
    city: "Belém",
    provenance,
  },
  {
    id: "client-industria-porto-verde",
    alias: "Indústria Porto Verde (DEMO)",
    segment: "Indústrias",
    city: "Ananindeua",
    provenance,
  },
  {
    id: "client-escola-baia-verde",
    alias: "Escola Baía Verde (DEMO)",
    segment: "Educação",
    city: "Belém",
    provenance,
  },
  {
    id: "client-hotel-amazonas",
    alias: "Hotel Amazonas Plaza (DEMO)",
    segment: "Hotelaria",
    city: "Belém",
    provenance,
  },
  {
    id: "client-supermercado-rio",
    alias: "Supermercado Rio Center (DEMO)",
    segment: "Varejo",
    city: "Ananindeua",
    provenance,
  },
  {
    id: "client-hospital-norte",
    alias: "Hospital Norte Amazônia (DEMO)",
    segment: "Saúde",
    city: "Belém",
    provenance,
  },
  {
    id: "client-condominio-bosque",
    alias: "Condomínio Bosque Real (DEMO)",
    segment: "Condomínios",
    city: "Belém",
    provenance,
  },
  {
    id: "client-fabrica-papel",
    alias: "Fábrica Papel Belém (DEMO)",
    segment: "Indústrias",
    city: "Marituba",
    provenance,
  },
  {
    id: "client-restaurante-mangue",
    alias: "Restaurante Mangue Azul (DEMO)",
    segment: "Alimentação",
    city: "Belém",
    provenance,
  },
  {
    id: "client-galeria-comercial",
    alias: "Galeria Comercial Marajó (DEMO)",
    segment: "Comercial",
    city: "Belém",
    provenance,
  },
  {
    id: "client-clube-nautico",
    alias: "Clube Náutico Ananindeua (DEMO)",
    segment: "Lazer",
    city: "Ananindeua",
    provenance,
  },
];
