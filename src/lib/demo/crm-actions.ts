import type {
  DemoDataset,
  LeadStatus,
  OpportunityStage,
  ProposalStatus,
} from "@/types/demo-entities";

const DEMO_TODAY = "2026-08-28";

export const OPPORTUNITY_STAGE_ORDER: OpportunityStage[] = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
];

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
  lead: "Lead",
  qualified: "Qualificado",
  proposal: "Proposta",
  negotiation: "Negociação",
  closed_won: "Fechado",
  closed_lost: "Perdido",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Novo",
  qualified: "Qualificado",
  converted: "Convertido",
  discarded: "Descartado",
};

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  accepted: "Aceito",
  rejected: "Recusado",
  expired: "Expirado",
  cancelled: "Cancelado",
};

/** Labels de UI para Orçamento (entidade interna DemoProposal). */
export const BUDGET_STATUS_LABELS = PROPOSAL_STATUS_LABELS;

export const KANBAN_STAGES: OpportunityStage[] = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
];

function withUpdatedTimestamp<T extends { updatedAt: string }>(entity: T): T {
  return { ...entity, updatedAt: DEMO_TODAY };
}

export function updateLeadStatus(
  dataset: DemoDataset,
  leadId: string,
  status: LeadStatus,
): DemoDataset {
  return {
    ...dataset,
    leads: dataset.leads.map((lead) =>
      lead.id === leadId ? { ...lead, status } : lead,
    ),
  };
}

export function updateOpportunityStage(
  dataset: DemoDataset,
  opportunityId: string,
  stage: OpportunityStage,
): DemoDataset {
  return {
    ...dataset,
    opportunities: dataset.opportunities.map((opportunity) =>
      opportunity.id === opportunityId
        ? withUpdatedTimestamp({ ...opportunity, stage })
        : opportunity,
    ),
  };
}

export function advanceOpportunityStage(
  dataset: DemoDataset,
  opportunityId: string,
): DemoDataset {
  const opportunity = dataset.opportunities.find((item) => item.id === opportunityId);
  if (!opportunity) {
    return dataset;
  }
  const index = OPPORTUNITY_STAGE_ORDER.indexOf(opportunity.stage);
  if (index < 0 || index >= OPPORTUNITY_STAGE_ORDER.length - 1) {
    return dataset;
  }
  const nextStage = OPPORTUNITY_STAGE_ORDER[index + 1];
  if (nextStage === "closed_lost") {
    return dataset;
  }
  return updateOpportunityStage(dataset, opportunityId, nextStage);
}

export function markOpportunityWon(
  dataset: DemoDataset,
  opportunityId: string,
): DemoDataset {
  return updateOpportunityStage(dataset, opportunityId, "closed_won");
}

export function markOpportunityLost(
  dataset: DemoDataset,
  opportunityId: string,
): DemoDataset {
  return updateOpportunityStage(dataset, opportunityId, "closed_lost");
}

export function reopenOpportunity(
  dataset: DemoDataset,
  opportunityId: string,
): DemoDataset {
  return updateOpportunityStage(dataset, opportunityId, "negotiation");
}

export function updateProposalStatus(
  dataset: DemoDataset,
  proposalId: string,
  status: ProposalStatus,
): DemoDataset {
  return {
    ...dataset,
    proposals: dataset.proposals.map((proposal) => {
      if (proposal.id !== proposalId) {
        return proposal;
      }
      const sentAt =
        status === "sent" && !proposal.sentAt ? DEMO_TODAY : proposal.sentAt;
      return { ...proposal, status, sentAt };
    }),
  };
}

function nextFinancialId(dataset: DemoDataset): string {
  const numbers = dataset.financialTransactions
    .map((item) => Number.parseInt(item.id.replace(/\D/g, ""), 10))
    .filter((value) => !Number.isNaN(value));
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `fin-signal-${String(next).padStart(3, "0")}`;
}

/** Registra o sinal como pendente após o aceite (sem cobrança real). */
export function registerPaymentSignal(
  dataset: DemoDataset,
  proposalId: string,
  amount?: number,
): DemoDataset {
  const proposal = dataset.proposals.find((item) => item.id === proposalId);
  if (!proposal || proposal.status !== "accepted") {
    return dataset;
  }
  if (proposal.paymentSignal?.status === "confirmed") {
    return dataset;
  }

  const signalAmount =
    amount ??
    proposal.paymentSignal?.amount ??
    Math.round(proposal.value * 0.5);

  return {
    ...dataset,
    proposals: dataset.proposals.map((item) =>
      item.id === proposalId
        ? {
            ...item,
            paymentSignal: {
              status: "pending",
              amount: signalAmount,
              registeredAt: DEMO_TODAY,
              note: "Sinal registrado na demonstração. Sem cobrança real. Confirme para liberar a emissão da OS.",
            },
          }
        : item,
    ),
  };
}

/** Confirma o sinal e cria lançamento financeiro mínimo demonstrativo. */
export function confirmPaymentSignal(
  dataset: DemoDataset,
  proposalId: string,
): DemoDataset {
  const proposal = dataset.proposals.find((item) => item.id === proposalId);
  if (!proposal || proposal.status !== "accepted") {
    return dataset;
  }

  const amount =
    proposal.paymentSignal?.amount ?? Math.round(proposal.value * 0.5);
  const existingTxId = proposal.paymentSignal?.financialTransactionId;
  const opportunity = dataset.opportunities.find(
    (item) => item.id === proposal.opportunityId,
  );
  const categoryId = opportunity?.categoryId ?? "water-sanitation";

  let financialTransactions = dataset.financialTransactions;
  let financialTransactionId = existingTxId;

  if (!financialTransactionId) {
    financialTransactionId = nextFinancialId(dataset);
    financialTransactions = [
      ...dataset.financialTransactions,
      {
        id: financialTransactionId,
        clientId: proposal.clientId,
        type: "revenue" as const,
        description: `Sinal do orçamento ${proposal.code} (demonstrativo)`,
        amount,
        dueDate: DEMO_TODAY,
        paidAt: DEMO_TODAY,
        categoryId,
        billingStatus: "paid" as const,
        installmentLabel: "sinal",
        provenance: proposal.provenance,
      },
    ];
  }

  return {
    ...dataset,
    financialTransactions,
    proposals: dataset.proposals.map((item) =>
      item.id === proposalId
        ? {
            ...item,
            paymentSignal: {
              status: "confirmed",
              amount,
              registeredAt: item.paymentSignal?.registeredAt ?? DEMO_TODAY,
              confirmedAt: DEMO_TODAY,
              note: "Sinal confirmado na demonstração. Libera a emissão da OS. Exceções à exigência ainda precisam de validação.",
              financialTransactionId,
            },
          }
        : item,
    ),
  };
}

export function getProposalItemsTotal(
  dataset: DemoDataset,
  proposalId: string,
): number {
  return dataset.proposalItems
    .filter((item) => item.proposalId === proposalId)
    .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function filterLeadsByStatus(
  dataset: DemoDataset,
  status: LeadStatus | "all",
) {
  if (status === "all") {
    return dataset.leads;
  }
  return dataset.leads.filter((lead) => lead.status === status);
}
