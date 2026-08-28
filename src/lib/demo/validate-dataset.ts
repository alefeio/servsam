import type { DemoDataset } from "@/types/demo-entities";

export type DatasetValidationIssue = {
  entity: string;
  id: string;
  field: string;
  message: string;
};

export function validateDemoDataset(dataset: DemoDataset): DatasetValidationIssue[] {
  const issues: DatasetValidationIssue[] = [];
  const clientIds = new Set(dataset.clients.map((item) => item.id));
  const opportunityIds = new Set(dataset.opportunities.map((item) => item.id));
  const proposalIds = new Set(dataset.proposals.map((item) => item.id));
  const contractIds = new Set(dataset.contracts.map((item) => item.id));
  const workOrderIds = new Set(dataset.workOrders.map((item) => item.id));
  const clientUnitIds = new Set(dataset.clientUnits.map((item) => item.id));
  const productIds = new Set(dataset.products.map((item) => item.id));

  function requireReference(
    entity: string,
    id: string,
    field: string,
    value: string | undefined,
    allowed: Set<string>,
  ) {
    if (!value) {
      return;
    }
    if (!allowed.has(value)) {
      issues.push({
        entity,
        id,
        field,
        message: `Referência "${value}" não encontrada.`,
      });
    }
  }

  for (const opportunity of dataset.opportunities) {
    requireReference(
      "opportunity",
      opportunity.id,
      "clientId",
      opportunity.clientId,
      clientIds,
    );
  }

  for (const unit of dataset.clientUnits) {
    requireReference("clientUnit", unit.id, "clientId", unit.clientId, clientIds);
  }

  for (const lead of dataset.leads) {
    requireReference("lead", lead.id, "clientId", lead.clientId, clientIds);
    requireReference(
      "lead",
      lead.id,
      "opportunityId",
      lead.opportunityId,
      opportunityIds,
    );
  }

  for (const proposal of dataset.proposals) {
    requireReference(
      "proposal",
      proposal.id,
      "clientId",
      proposal.clientId,
      clientIds,
    );
    requireReference(
      "proposal",
      proposal.id,
      "opportunityId",
      proposal.opportunityId,
      opportunityIds,
    );
  }

  for (const item of dataset.proposalItems) {
    requireReference(
      "proposalItem",
      item.id,
      "proposalId",
      item.proposalId,
      proposalIds,
    );
  }

  for (const workOrder of dataset.workOrders) {
    requireReference(
      "workOrder",
      workOrder.id,
      "clientId",
      workOrder.clientId,
      clientIds,
    );
    requireReference(
      "workOrder",
      workOrder.id,
      "clientUnitId",
      workOrder.clientUnitId,
      clientUnitIds,
    );
    requireReference(
      "workOrder",
      workOrder.id,
      "proposalId",
      workOrder.proposalId,
      proposalIds,
    );
    requireReference(
      "workOrder",
      workOrder.id,
      "contractId",
      workOrder.contractId,
      contractIds,
    );

    for (const material of workOrder.plannedMaterials) {
      requireReference(
        "workOrder",
        workOrder.id,
        "plannedMaterials.productId",
        material.productId,
        productIds,
      );
    }
  }

  for (const contract of dataset.contracts) {
    requireReference(
      "contract",
      contract.id,
      "clientId",
      contract.clientId,
      clientIds,
    );

    for (const visit of contract.scheduledVisits) {
      requireReference(
        "contract",
        contract.id,
        "scheduledVisits.workOrderId",
        visit.workOrderId,
        workOrderIds,
      );
    }
  }

  for (const document of dataset.documents) {
    requireReference(
      "document",
      document.id,
      "clientId",
      document.clientId,
      clientIds,
    );
    requireReference(
      "document",
      document.id,
      "contractId",
      document.contractId,
      contractIds,
    );
  }

  for (const transaction of dataset.financialTransactions) {
    requireReference(
      "financialTransaction",
      transaction.id,
      "clientId",
      transaction.clientId,
      clientIds,
    );
    requireReference(
      "financialTransaction",
      transaction.id,
      "contractId",
      transaction.contractId,
      contractIds,
    );
    requireReference(
      "financialTransaction",
      transaction.id,
      "workOrderId",
      transaction.workOrderId,
      workOrderIds,
    );
  }

  for (const movement of dataset.stockMovements) {
    requireReference(
      "stockMovement",
      movement.id,
      "productId",
      movement.productId,
      productIds,
    );
    requireReference(
      "stockMovement",
      movement.id,
      "workOrderId",
      movement.workOrderId,
      workOrderIds,
    );
  }

  for (const tender of dataset.publicTenders) {
    requireReference("publicTender", tender.id, "clientId", tender.clientId, clientIds);
    requireReference(
      "publicTender",
      tender.id,
      "proposalId",
      tender.proposalId,
      proposalIds,
    );
  }

  return issues;
}

export function assertDemoDatasetValid(dataset: DemoDataset): void {
  const issues = validateDemoDataset(dataset);
  if (issues.length > 0) {
    const summary = issues
      .map((issue) => `${issue.entity}/${issue.id}.${issue.field}: ${issue.message}`)
      .join("\n");
    throw new Error(`Massa demonstrativa inválida:\n${summary}`);
  }
}
