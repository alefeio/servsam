import type { Provenanced } from "@/types/provenance";

export type DemoClient = Provenanced<{
  id: string;
  alias: string;
  segment: string;
  city: string;
}>;

export type DemoClientUnit = Provenanced<{
  id: string;
  clientId: string;
  name: string;
  address: string;
  city: string;
}>;

export type LeadStatus = "new" | "qualified" | "converted" | "discarded";

export type DemoLead = Provenanced<{
  id: string;
  contactName: string;
  companyAlias: string;
  segment: string;
  source: string;
  status: LeadStatus;
  clientId?: string;
  opportunityId?: string;
  createdAt: string;
}>;

export type OpportunityStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type DemoOpportunity = Provenanced<{
  id: string;
  clientId: string;
  title: string;
  stage: OpportunityStage;
  categoryId: "water-sanitation" | "environmental-pest";
  estimatedValue: number;
  createdAt: string;
  updatedAt: string;
}>;

export type ProposalStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired";

export type DemoProposal = Provenanced<{
  id: string;
  code: string;
  opportunityId: string;
  clientId: string;
  status: ProposalStatus;
  value: number;
  sentAt?: string;
  validUntil?: string;
}>;

export type DemoProposalItem = Provenanced<{
  id: string;
  proposalId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}>;

export type WorkOrderStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "overdue"
  | "cancelled";

export type DemoWorkOrderPlannedMaterial = {
  productId: string;
  quantity: number;
};

export type DemoWorkOrderChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

export type DemoWorkOrder = Provenanced<{
  id: string;
  code: string;
  clientId: string;
  clientUnitId?: string;
  proposalId?: string;
  contractId?: string;
  serviceName: string;
  categoryId: "water-sanitation" | "environmental-pest";
  status: WorkOrderStatus;
  scheduledAt: string;
  technicianAlias: string;
  teamAliases: string[];
  plannedMaterials: DemoWorkOrderPlannedMaterial[];
  planningChecklist: DemoWorkOrderChecklistItem[];
  completedAt?: string;
  notes?: string;
}>;

export type ContractStatus = "active" | "expiring" | "expired";
export type ContractPeriodicity = "monthly" | "quarterly" | "semiannual" | "annual";

export type DemoContractVisit = {
  id: string;
  scheduledDate: string;
  serviceName: string;
  workOrderId?: string;
};

export type DemoContract = Provenanced<{
  id: string;
  code: string;
  clientId: string;
  title: string;
  startDate: string;
  endDate: string;
  periodicity: ContractPeriodicity;
  monthlyValue: number;
  adjustmentIndex: string;
  nextAdjustmentDate?: string;
  status: ContractStatus;
  scheduledVisits: DemoContractVisit[];
}>;

export type DemoDocument = Provenanced<{
  id: string;
  clientId: string;
  contractId?: string;
  name: string;
  type: string;
  responsibleAlias: string;
  issuedAt?: string;
  expiresAt: string;
}>;

export type DemoProduct = Provenanced<{
  id: string;
  name: string;
  category: string;
  unit: string;
  stockQuantity: number;
  minimumStock: number;
  expiryDate?: string;
  lotCode?: string;
}>;

export type StockMovementType = "inbound" | "outbound" | "adjustment";

export type DemoStockMovement = Provenanced<{
  id: string;
  productId: string;
  workOrderId?: string;
  type: StockMovementType;
  quantity: number;
  occurredAt: string;
  notes: string;
}>;

export type PublicTenderStage =
  | "prospecting"
  | "documentation"
  | "submitted"
  | "evaluation"
  | "won"
  | "lost";

export type DemoTenderChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

export type DemoPublicTender = Provenanced<{
  id: string;
  code: string;
  title: string;
  organAlias: string;
  estimatedValue: number;
  stage: PublicTenderStage;
  publicationDate: string;
  submissionDeadline: string;
  openingDate?: string;
  clientId?: string;
  proposalId?: string;
  documentChecklist: DemoTenderChecklistItem[];
}>;

export type FinancialTransactionType = "revenue" | "receivable" | "expense";

export type DemoFinancialTransaction = Provenanced<{
  id: string;
  clientId: string;
  contractId?: string;
  workOrderId?: string;
  type: FinancialTransactionType;
  description: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
  categoryId: "water-sanitation" | "environmental-pest";
}>;

export type DemoDataset = Provenanced<{
  clients: DemoClient[];
  clientUnits: DemoClientUnit[];
  leads: DemoLead[];
  opportunities: DemoOpportunity[];
  proposals: DemoProposal[];
  proposalItems: DemoProposalItem[];
  workOrders: DemoWorkOrder[];
  contracts: DemoContract[];
  documents: DemoDocument[];
  products: DemoProduct[];
  stockMovements: DemoStockMovement[];
  publicTenders: DemoPublicTender[];
  financialTransactions: DemoFinancialTransaction[];
}>;
