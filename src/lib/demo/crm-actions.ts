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
  sent: "Enviada",
  accepted: "Aceita",
  rejected: "Recusada",
  expired: "Expirada",
};

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
