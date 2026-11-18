import { describe, expect, it } from "vitest";
import { seedDemoDataset } from "@/data/demo/demo-dataset";
import {
  advanceOpportunityStage,
  confirmPaymentSignal,
  filterLeadsByStatus,
  getProposalItemsTotal,
  markOpportunityLost,
  markOpportunityWon,
  registerPaymentSignal,
  reopenOpportunity,
  updateLeadStatus,
  updateOpportunityStage,
  updateProposalStatus,
} from "@/lib/demo/crm-actions";

describe("CRM demo actions", () => {
  it("updates lead status", () => {
    const lead = seedDemoDataset.leads.find((item) => item.status === "new");
    expect(lead).toBeDefined();

    const updated = updateLeadStatus(seedDemoDataset, lead!.id, "qualified");
    const changed = updated.leads.find((item) => item.id === lead!.id);

    expect(changed?.status).toBe("qualified");
  });

  it("filters leads by status", () => {
    const qualified = filterLeadsByStatus(seedDemoDataset, "qualified");
    expect(qualified.every((lead) => lead.status === "qualified")).toBe(true);
    expect(filterLeadsByStatus(seedDemoDataset, "all").length).toBe(
      seedDemoDataset.leads.length,
    );
  });

  it("advances opportunity stage in order", () => {
    const opportunity = seedDemoDataset.opportunities.find(
      (item) => item.stage === "lead",
    );
    expect(opportunity).toBeDefined();

    const updated = advanceOpportunityStage(seedDemoDataset, opportunity!.id);
    const changed = updated.opportunities.find((item) => item.id === opportunity!.id);

    expect(changed?.stage).toBe("qualified");
    expect(changed?.updatedAt).toBe("2026-08-28");
  });

  it("marks opportunity won, lost and reopens to negotiation", () => {
    const opportunity = seedDemoDataset.opportunities[0];

    const won = markOpportunityWon(seedDemoDataset, opportunity.id);
    expect(
      won.opportunities.find((item) => item.id === opportunity.id)?.stage,
    ).toBe("closed_won");

    const lost = markOpportunityLost(won, opportunity.id);
    expect(
      lost.opportunities.find((item) => item.id === opportunity.id)?.stage,
    ).toBe("closed_lost");

    const reopened = reopenOpportunity(lost, opportunity.id);
    expect(
      reopened.opportunities.find((item) => item.id === opportunity.id)?.stage,
    ).toBe("negotiation");
  });

  it("does not advance closed opportunities", () => {
    const closed = seedDemoDataset.opportunities.find(
      (item) => item.stage === "closed_won" || item.stage === "closed_lost",
    );
    expect(closed).toBeDefined();

    const updated = advanceOpportunityStage(seedDemoDataset, closed!.id);
    expect(
      updated.opportunities.find((item) => item.id === closed!.id)?.stage,
    ).toBe(closed!.stage);
  });

  it("updates proposal status and sets sentAt when sent", () => {
    const draft = seedDemoDataset.proposals.find((item) => item.status === "draft");
    expect(draft).toBeDefined();

    const sent = updateProposalStatus(seedDemoDataset, draft!.id, "sent");
    const changed = sent.proposals.find((item) => item.id === draft!.id);

    expect(changed?.status).toBe("sent");
    expect(changed?.sentAt).toBe("2026-08-28");
  });

  it("calculates proposal items total", () => {
    const proposalWithItems = seedDemoDataset.proposals.find((proposal) =>
      seedDemoDataset.proposalItems.some((item) => item.proposalId === proposal.id),
    );
    expect(proposalWithItems).toBeDefined();

    const expected = seedDemoDataset.proposalItems
      .filter((item) => item.proposalId === proposalWithItems!.id)
      .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    expect(getProposalItemsTotal(seedDemoDataset, proposalWithItems!.id)).toBe(
      expected,
    );
  });

  it("allows direct stage update", () => {
    const opportunity = seedDemoDataset.opportunities[0];
    const updated = updateOpportunityStage(
      seedDemoDataset,
      opportunity.id,
      "proposal",
    );

    expect(
      updated.opportunities.find((item) => item.id === opportunity.id)?.stage,
    ).toBe("proposal");
  });

  it("registers and confirms a payment signal without real billing", () => {
    const draft = seedDemoDataset.proposals.find((item) => item.status === "draft");
    expect(draft).toBeDefined();

    const accepted = updateProposalStatus(seedDemoDataset, draft!.id, "accepted");
    const withSignal = registerPaymentSignal(accepted, draft!.id);
    const pending = withSignal.proposals.find((item) => item.id === draft!.id);
    expect(pending?.paymentSignal?.status).toBe("pending");
    expect(pending?.paymentSignal?.amount).toBe(Math.round(draft!.value * 0.5));

    const confirmed = confirmPaymentSignal(withSignal, draft!.id);
    const proposal = confirmed.proposals.find((item) => item.id === draft!.id);
    expect(proposal?.paymentSignal?.status).toBe("confirmed");
    expect(proposal?.paymentSignal?.financialTransactionId).toBeDefined();
    expect(
      confirmed.financialTransactions.some(
        (item) => item.id === proposal?.paymentSignal?.financialTransactionId,
      ),
    ).toBe(true);
  });
});
