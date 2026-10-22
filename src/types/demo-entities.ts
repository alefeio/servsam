import type { Provenanced } from "@/types/provenance";

export type DemoRelationshipKind = "one_off" | "contract";

export type DemoClient = Provenanced<{
  id: string;
  alias: string;
  segment: string;
  city: string;
  legalName?: string;
  tradeName?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  responsibleName?: string;
  notes?: string;
  relationshipKind?: DemoRelationshipKind;
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
  | "expired"
  | "cancelled";

export type DemoProposal = Provenanced<{
  id: string;
  code: string;
  opportunityId: string;
  clientId: string;
  status: ProposalStatus;
  value: number;
  sentAt?: string;
  validUntil?: string;
  discountAmount?: number;
  paymentTerms?: string;
  downPayment?: string;
  executionDeadline?: string;
  commercialConditions?: string;
  cancellationFee?: string;
  observations?: string;
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
  serviceTypeLabel?: string;
  vehicleLabel?: string;
  addressLabel?: string;
  scheduleStatusLabel?: string;
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
  servicesSummary?: string;
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
  tradeName?: string;
  activeIngredient?: string;
  chemicalGroup?: string;
  manufacturer?: string;
  anvisaRegistration?: string;
  antidote?: string;
  technicalSheet?: string;
  fispq?: string;
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
  billingStatus?: "open" | "paid" | "overdue" | "negotiated";
  installmentLabel?: string;
}>;

export type DemoEmployeeDocument = {
  label: string;
  status: string;
  expiresAt?: string;
};

export type DemoEmployee = Provenanced<{
  id: string;
  name: string;
  role: string;
  phone: string;
  documents: DemoEmployeeDocument[];
  trainings?: string[];
  warnings: string[];
}>;

export type DemoCertificate = Provenanced<{
  id: string;
  number: string;
  clientId: string;
  workOrderId: string;
  certificateType: string;
  serviceName: string;
  issuedAt?: string;
  validUntil?: string;
  status: "draft" | "issued";
  productId: string;
  technicalResponsible: string;
  licenses: string[];
}>;

export type DemoPhotoReport = Provenanced<{
  id: string;
  clientId: string;
  workOrderId: string;
  title: string;
  technicalDescription: string;
  beforeCondition: string;
  afterCondition: string;
  observations: string;
  nr33: string;
  nr35: string;
  photoSrcs: string[];
  clientResponsible: string;
  technicalResponsible: string;
}>;

export type DemoServiceExecution = Provenanced<{
  id: string;
  workOrderId: string;
  startedAt?: string;
  finishedAt?: string;
  clientResponsible: string;
  acceptance: string;
  observations: string;
  checklist: DemoWorkOrderChecklistItem[];
  usedMaterials: DemoWorkOrderPlannedMaterial[];
  photoSrcs: string[];
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
  employees: DemoEmployee[];
  certificates: DemoCertificate[];
  photoReports: DemoPhotoReport[];
  serviceExecutions: DemoServiceExecution[];
}>;
