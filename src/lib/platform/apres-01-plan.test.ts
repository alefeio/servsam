import { describe, expect, it } from "vitest";
import {
  APRES_01_SCENARIOS,
  buildApresProvisionPlan,
  expectedIndicatorDeltas,
  proposalTotalCents,
  type ApresExistingCustomer,
  type ApresExistingProposal,
} from "@/lib/platform/apres-01-plan";

describe("APRES-01 plan", () => {
  it("defines three fictional scenarios with [APRES] markers and target statuses", () => {
    expect(APRES_01_SCENARIOS).toHaveLength(3);
    expect(APRES_01_SCENARIOS.map((item) => item.key)).toEqual([
      "APRES-A",
      "APRES-B",
      "APRES-C",
    ]);
    for (const scenario of APRES_01_SCENARIOS) {
      expect(scenario.customer.legalName.startsWith("[APRES]")).toBe(true);
      expect(scenario.proposal.title.startsWith("[APRES]")).toBe(true);
      expect(scenario.contact.email.endsWith("@apresentacao.servsam.local")).toBe(
        true,
      );
    }
    expect(APRES_01_SCENARIOS[0].proposal.targetStatus).toBe("accepted");
    expect(APRES_01_SCENARIOS[1].proposal.targetStatus).toBe("sent");
    expect(APRES_01_SCENARIOS[2].proposal.targetStatus).toBe("draft");
  });

  it("computes proposal totals without inventing a 50% rule", () => {
    expect(proposalTotalCents(APRES_01_SCENARIOS[0])).toBe(450_000);
    expect(proposalTotalCents(APRES_01_SCENARIOS[1])).toBe(680_000);
    expect(proposalTotalCents(APRES_01_SCENARIOS[2])).toBe(12 * 45_000 + 4 * 80_000);
  });

  it("plans full creation on empty snapshot", () => {
    const plan = buildApresProvisionPlan(APRES_01_SCENARIOS, [], []);
    expect(plan.summary.createCustomers).toBe(3);
    expect(plan.summary.createContacts).toBe(3);
    expect(plan.summary.createUnits).toBe(3);
    expect(plan.summary.createProposals).toBe(3);
    expect(plan.summary.transitions).toBe(3); // A: sent+accepted, B: sent
    expect(plan.summary.conflicts).toBe(0);

    const deltas = expectedIndicatorDeltas(plan);
    expect(deltas.customersActive).toBe(3);
    expect(deltas.proposalsTotal).toBe(3);
    expect(deltas.proposalsAccepted).toBe(1);
    expect(deltas.proposalsSent).toBe(1);
    expect(deltas.proposalsDraft).toBe(1);
  });

  it("is idempotent when scenarios already exist at target", () => {
    const customers: ApresExistingCustomer[] = APRES_01_SCENARIOS.map(
      (scenario, index) => ({
        id: `cust-${index}`,
        legalName: scenario.customer.legalName,
        deletedAt: null,
        contacts: [{ id: `ct-${index}`, name: scenario.contact.name, deletedAt: null }],
        units: [{ id: `un-${index}`, name: scenario.unit.name, deletedAt: null }],
      }),
    );
    const proposals: ApresExistingProposal[] = APRES_01_SCENARIOS.map(
      (scenario, index) => ({
        id: `prop-${index}`,
        title: scenario.proposal.title,
        status: scenario.proposal.targetStatus,
        customerId: `cust-${index}`,
        deletedAt: null,
      }),
    );

    const plan = buildApresProvisionPlan(APRES_01_SCENARIOS, customers, proposals);
    expect(plan.summary.createCustomers).toBe(0);
    expect(plan.summary.createContacts).toBe(0);
    expect(plan.summary.createUnits).toBe(0);
    expect(plan.summary.createProposals).toBe(0);
    expect(plan.summary.transitions).toBe(0);
    expect(plan.summary.conflicts).toBe(0);
    expect(plan.summary.noops).toBeGreaterThan(0);
    expect(expectedIndicatorDeltas(plan).customersActive).toBe(0);
  });

  it("only transitions when proposal exists below target", () => {
    const scenario = APRES_01_SCENARIOS[0];
    const customers: ApresExistingCustomer[] = [
      {
        id: "cust-a",
        legalName: scenario.customer.legalName,
        deletedAt: null,
        contacts: [{ id: "ct-a", name: scenario.contact.name }],
        units: [{ id: "un-a", name: scenario.unit.name }],
      },
    ];
    const proposals: ApresExistingProposal[] = [
      {
        id: "prop-a",
        title: scenario.proposal.title,
        status: "draft",
        customerId: "cust-a",
        deletedAt: null,
      },
    ];

    const plan = buildApresProvisionPlan([scenario], customers, proposals);
    expect(plan.summary.createProposals).toBe(0);
    expect(plan.summary.transitions).toBe(2);
    expect(
      plan.scenarios[0].actions.filter((item) => item.type === "transition_proposal"),
    ).toEqual([
      expect.objectContaining({ from: "draft", to: "sent", proposalId: "prop-a" }),
      expect.objectContaining({ from: "sent", to: "accepted", proposalId: "prop-a" }),
    ]);
  });

  it("reports conflict instead of forcing accepted backwards", () => {
    const scenario = APRES_01_SCENARIOS[1];
    const customers: ApresExistingCustomer[] = [
      {
        id: "cust-b",
        legalName: scenario.customer.legalName,
        deletedAt: null,
        contacts: [{ id: "ct-b", name: scenario.contact.name }],
        units: [{ id: "un-b", name: scenario.unit.name }],
      },
    ];
    const proposals: ApresExistingProposal[] = [
      {
        id: "prop-b",
        title: scenario.proposal.title,
        status: "accepted",
        customerId: "cust-b",
        deletedAt: null,
      },
    ];

    const plan = buildApresProvisionPlan([scenario], customers, proposals);
    expect(plan.summary.conflicts).toBe(1);
    expect(plan.summary.transitions).toBe(0);
  });
});
