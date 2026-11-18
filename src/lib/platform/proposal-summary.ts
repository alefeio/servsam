import {
  PROPOSAL_STATUSES,
  type ProposalStatusValue,
} from "@/lib/platform/proposal-state";

export type ProposalStatusGroup = {
  status: ProposalStatusValue;
  count: number;
  totalCents: number;
};

export type ProposalSummary = {
  byStatus: Record<ProposalStatusValue, { count: number; totalCents: number }>;
  totalCount: number;
  /** Enviados cuja validade já passou. Ainda `sent`: a pessoa precisa marcar como expirado. */
  sentPastValidity: number;
  /** Soma dos enviados que aguardam resposta (pipeline). */
  openPipelineCents: number;
  acceptedCents: number;
};

/** Agrega o resultado de um `groupBy` por status. Puro e testável. */
export function buildProposalSummary(
  groups: readonly ProposalStatusGroup[],
  sentPastValidity: number,
): ProposalSummary {
  const byStatus = Object.fromEntries(
    PROPOSAL_STATUSES.map((status) => [status, { count: 0, totalCents: 0 }]),
  ) as ProposalSummary["byStatus"];

  for (const group of groups) {
    byStatus[group.status].count += group.count;
    byStatus[group.status].totalCents += group.totalCents;
  }

  return {
    byStatus,
    totalCount: PROPOSAL_STATUSES.reduce(
      (sum, status) => sum + byStatus[status].count,
      0,
    ),
    sentPastValidity,
    openPipelineCents: byStatus.sent.totalCents,
    acceptedCents: byStatus.accepted.totalCents,
  };
}
