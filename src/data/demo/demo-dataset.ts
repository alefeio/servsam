import { createProvenance } from "@/lib/content/provenance";
import { demoClients } from "@/data/demo/clients";
import { demoClientUnits } from "@/data/demo/client-units";
import { demoContracts } from "@/data/demo/contracts";
import { demoDocuments } from "@/data/demo/documents";
import { demoFinancialTransactions } from "@/data/demo/financial-transactions";
import { demoLeads } from "@/data/demo/leads";
import { demoOpportunities } from "@/data/demo/opportunities";
import { demoProducts } from "@/data/demo/products";
import { demoProposalItems } from "@/data/demo/proposal-items";
import { demoProposals } from "@/data/demo/proposals";
import { demoPublicTenders } from "@/data/demo/public-tenders";
import { demoStockMovements } from "@/data/demo/stock-movements";
import { demoWorkOrders } from "@/data/demo/work-orders";
import type { DemoDataset } from "@/types/demo-entities";

export const seedDemoDataset: DemoDataset = {
  clients: demoClients,
  clientUnits: demoClientUnits,
  leads: demoLeads,
  opportunities: demoOpportunities,
  proposals: demoProposals,
  proposalItems: demoProposalItems,
  workOrders: demoWorkOrders,
  contracts: demoContracts,
  documents: demoDocuments,
  products: demoProducts,
  stockMovements: demoStockMovements,
  publicTenders: demoPublicTenders,
  financialTransactions: demoFinancialTransactions,
  provenance: createProvenance({
    sourceType: "DEMO_FICTIONAL",
    notes:
      "Massa demonstrativa coerente das Sprints 2–6. Indicadores e fluxos derivam destes fixtures.",
  }),
};
