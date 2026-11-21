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
import { demoReceivedPurchaseOrders } from "@/data/demo/received-purchase-orders";
import { demoStockMovements } from "@/data/demo/stock-movements";
import { demoWorkOrders } from "@/data/demo/work-orders";
import {
  storyCredentials,
  storyPreServiceDocuments,
  storyProcesses,
  storyResponsibles,
  storyVehicles,
} from "@/data/demo/operational-story";
import {
  demoCertificates,
  demoEmployees,
  demoPhotoReports,
  demoServiceExecutions,
} from "@/data/demo/visual-records";
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
  employees: demoEmployees,
  certificates: demoCertificates,
  photoReports: demoPhotoReports,
  serviceExecutions: demoServiceExecutions,
  vehicles: storyVehicles,
  technicalResponsibles: storyResponsibles,
  regulatoryCredentials: storyCredentials,
  preServiceDocuments: storyPreServiceDocuments,
  environmentalProcesses: storyProcesses,
  receivedPurchaseOrders: demoReceivedPurchaseOrders,
  provenance: createProvenance({
    sourceType: "DEMO_FICTIONAL",
    notes:
      "Massa demonstrativa coerente. A Sprint 10 acrescenta a jornada visual do Hotel Amazonas Plaza, ainda só no navegador.",
  }),
};
