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

export type DemoServiceFamily =
  | "rsv"
  | "cip"
  | "water-collection"
  | "ete"
  | "water-monitoring"
  | "well";

export type DemoFormalizationKind =
  | "signed-proposal"
  | "client-work-order"
  | "purchase-order"
  | "service-purchase-order"
  | "other";

export type DemoLabeledValue = {
  label: string;
  value: string;
};

export type DemoProposalFormalization = {
  statusLabel: string;
  kind: DemoFormalizationKind;
  kindLabel: string;
  documentCode: string;
  receivedAt: string;
  note: string;
};

export type DemoProposalNarrative = {
  technicalScope: string[];
  procedures: string[];
  contractorDuties: string[];
  specificConditions: string[];
  includedDeliverables: string[];
  technicalResponsibleId?: string;
};

export type PaymentSignalStatus = "pending" | "confirmed";

/**
 * Sinal demonstrativo após o aceite.
 * Recomendado quando aplicável; não bloqueia universalmente a emissão da OS.
 * Comercial solicita; Financeiro confirma — eventos simulados, sem cobrança real.
 */
export type DemoPaymentSignal = {
  status: PaymentSignalStatus;
  amount: number;
  registeredAt: string;
  confirmedAt?: string;
  note?: string;
  financialTransactionId?: string;
  /** Papel que registrou a solicitação (simulado). */
  requestedByRole?: "comercial";
  /** Papel que confirmou o recebimento (simulado). */
  confirmedByRole?: "financeiro";
};

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
  serviceFamily?: DemoServiceFamily;
  formalization?: DemoProposalFormalization;
  narrative?: DemoProposalNarrative;
  /** Sinal opcional/recomendado; não é pré-requisito universal da OS. */
  paymentSignal?: DemoPaymentSignal;
  /**
   * Valor de exemplo da fixture para solicitação financeira (não é percentual padrão).
   * Só usado se o Comercial informar explicitamente ou aceitar o exemplo da massa.
   */
  demoSignalExampleAmount?: number;
  /** O.C. recebida do cliente neste orçamento avulso (≠ OS). */
  receivedPurchaseOrder?: DemoReceivedPurchaseOrderRef;
}>;

export type DemoProposalItem = Provenanced<{
  id: string;
  proposalId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}>;

export type WorkOrderStatus =
  | "issued"
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
  /** Ausente enquanto a OS está só emitida, aguardando agendamento. */
  scheduledAt?: string;
  issuedAt?: string;
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
  serviceFamily?: DemoServiceFamily;
  familyFields?: DemoLabeledValue[];
  visits?: DemoWorkOrderVisit[];
  technicalResponsibleId?: string;
  clientResponsible?: string;
  vehicleId?: string;
  /** Histórico demonstrativo de agendamentos/remarcações. */
  scheduleHistory?: DemoScheduleChange[];
  /** O.C. de origem quando a OS não veio de orçamento interno. */
  purchaseOrderId?: string;
}>;

export type DemoScheduleChange = {
  recordedAt: string;
  previousScheduledAt?: string;
  scheduledAt: string;
  technicianAlias: string;
  note?: string;
};

export type DemoWorkOrderVisit = {
  id: string;
  scheduledAt: string;
  place: string;
  team: string;
  vehicleId: string;
  status: "done" | "in_progress" | "scheduled";
};

export type ContractStatus = "active" | "expiring" | "expired";
export type ContractPeriodicity = "monthly" | "quarterly" | "semiannual" | "annual";

export type DemoContractVisit = {
  id: string;
  scheduledDate: string;
  serviceName: string;
  workOrderId?: string;
};

/**
 * Referência à O.C. recebida do contratante.
 * Documento do cliente — não é a OS interna nem o orçamento SERVSAM.
 */
export type DemoReceivedPurchaseOrderRef = {
  code: string;
  /** Mantido por compatibilidade com fixtures antigos. */
  issuedAt: string;
  receivedAt?: string;
  statusLabel: string;
  amount: number;
  note: string;
  engagementKind?: "avulso" | "periodico" | "oc-direta";
};

/** @deprecated Preferir DemoReceivedPurchaseOrderRef — alias de compatibilidade. */
export type DemoContractPurchaseOrder = DemoReceivedPurchaseOrderRef;

/**
 * O.C. recebida como entidade demonstrativa (pode existir sem orçamento interno).
 */
export type DemoReceivedPurchaseOrder = Provenanced<{
  id: string;
  code: string;
  clientId: string;
  serviceName: string;
  categoryId: "water-sanitation" | "environmental-pest";
  receivedAt: string;
  statusLabel: string;
  amount: number;
  note: string;
  engagementKind: "avulso" | "periodico" | "oc-direta";
  proposalId?: string;
  contractId?: string;
  workOrderId?: string;
  withoutInternalProposal?: boolean;
}>;

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
  purchaseOrder?: DemoReceivedPurchaseOrderRef;
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
  cycle?: DemoDocumentCycle;
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

export type DemoEmployeeHrKind =
  | "vacation"
  | "absence"
  | "medical_certificate"
  | "warning"
  | "suspension"
  | "occurrence";

/** Registro de RH demonstrativo. Sem dados clínicos sensíveis. */
export type DemoEmployeeHrRecord = {
  id: string;
  kind: DemoEmployeeHrKind;
  title: string;
  startedAt: string;
  endedAt?: string;
  note: string;
};

export type DemoEmployee = Provenanced<{
  id: string;
  name: string;
  role: string;
  phone: string;
  documents: DemoEmployeeDocument[];
  trainings?: string[];
  /** Mantido por compatibilidade com massa antiga no navegador. */
  warnings: string[];
  hrRecords?: DemoEmployeeHrRecord[];
  identityDocument?: string;
  situation?: string;
}>;

export type DemoVehicle = Provenanced<{
  id: string;
  internalCode: string;
  kind: string;
  model: string;
  plate: string;
  status: string;
}>;

export type DemoTechnicalResponsible = Provenanced<{
  id: string;
  name: string;
  education: string;
  council: string;
  registration: string;
  specialty: string;
  families: string[];
}>;

export type DemoRegulatoryCredential = Provenanced<{
  id: string;
  organ: string;
  kind: string;
  number: string;
  validUntil: string;
  status: string;
  usedBy: string[];
}>;

export type DemoCertificateTemplate = "reservoir" | "well" | "pest" | "waste";

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
  template?: DemoCertificateTemplate;
  validityLabel?: string;
  details?: DemoLabeledValue[];
  technicalResponsibleId?: string;
}>;

export type DemoReportSection = {
  title: string;
  body: string;
};

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
  sections?: DemoReportSection[];
  photosPerPage?: number;
}>;

export type DemoClientRating = "Excelente" | "Bom" | "Razoável" | "Pouco razoável";

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
  rating?: DemoClientRating;
  ratingNote?: string;
  familyFields?: DemoLabeledValue[];
}>;

export type DemoPreServiceKind = "notice" | "entry-authorization" | "awareness";

export type DemoPreServiceDocument = Provenanced<{
  id: string;
  workOrderId: string;
  clientId: string;
  kind: DemoPreServiceKind;
  title: string;
  summary: string;
  lines: string[];
}>;

export type DemoEnvironmentalProcessStatus =
  | "documents-pending"
  | "preparing"
  | "filed"
  | "under-review"
  | "pending-issue"
  | "completed";

export type DemoEnvironmentalProcess = Provenanced<{
  id: string;
  code: string;
  clientId: string;
  title: string;
  unit: string;
  technicalResponsibleId: string;
  organ: string;
  status: DemoEnvironmentalProcessStatus;
  checklist: DemoWorkOrderChecklistItem[];
  notes: string;
}>;

export type DemoDocumentCycle =
  | "commercial"
  | "pre-service"
  | "operation"
  | "post-service"
  | "regulatory";

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
  vehicles: DemoVehicle[];
  technicalResponsibles: DemoTechnicalResponsible[];
  regulatoryCredentials: DemoRegulatoryCredential[];
  preServiceDocuments: DemoPreServiceDocument[];
  environmentalProcesses: DemoEnvironmentalProcess[];
  /** O.C. recebidas do cliente (avulsa, periódica ou sem orçamento interno). */
  receivedPurchaseOrders: DemoReceivedPurchaseOrder[];
}>;
