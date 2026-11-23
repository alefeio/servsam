/**
 * Plano idempotente da massa fictícia APRES-01 (estratégia B).
 * Módulo puro: sem Prisma, sem I/O. A escrita real fica no script Homol.
 */

export const APRES_MARKER = "[APRES]";

export type ApresProposalTarget = "draft" | "sent" | "accepted";

export type ApresScenarioDefinition = {
  key: "APRES-A" | "APRES-B" | "APRES-C";
  customer: {
    legalName: string;
    tradeName: string;
    segment: string;
    notes: string;
  };
  contact: {
    name: string;
    roleTitle: string;
    email: string;
    phone: string;
  };
  unit: {
    name: string;
    addressLine: string;
    city: string;
    state: "PA";
    postalCode: string;
    notes: string;
  };
  proposal: {
    title: string;
    targetStatus: ApresProposalTarget;
    validUntil: string;
    paymentTerms: string;
    commercialConditions: string;
    observations: string;
    discountCents: number;
    items: Array<{
      description: string;
      quantity: number;
      unitPriceCents: number;
    }>;
  };
};

/** Três cenários fictícios estáveis — identificação por nome legal e título. */
export const APRES_01_SCENARIOS: readonly ApresScenarioDefinition[] = [
  {
    key: "APRES-A",
    customer: {
      legalName: "[APRES] Condomínio Demonstrativo Verde",
      tradeName: "CD Verde (fictício)",
      segment: "Condomínio residencial",
      notes:
        "Cenário APRES-A. Massa fictícia de apresentação. Sem PII real. scenarioKey:APRES-A",
    },
    contact: {
      name: "Contato Demonstrativo Alfa",
      roleTitle: "Síndico (fictício)",
      email: "contato.apres.a@apresentacao.servsam.local",
      phone: "91987651001",
    },
    unit: {
      name: "Torre Demonstrativa A",
      addressLine: "Rua Fictícia das Acácias, 100",
      city: "Belém",
      state: "PA",
      postalCode: "66010000",
      notes: "Endereço inventado para apresentação. Não corresponde a imóvel real.",
    },
    proposal: {
      title: "[APRES] Higienização avulsa — Condomínio Demonstrativo Verde",
      targetStatus: "accepted",
      validUntil: "2099-12-31",
      paymentTerms: "Pagamento demonstrativo em até 15 dias após aceite (fictício).",
      commercialConditions:
        "Serviço avulso de higienização. O.S. e execução ficam fora deste provisionamento.",
      observations: "Cenário A: origem comercial da futura OS. scenarioKey:APRES-A",
      discountCents: 0,
      items: [
        {
          description: "Higienização de reservatório (serviço avulso demonstrativo)",
          quantity: 1,
          unitPriceCents: 450_000,
        },
      ],
    },
  },
  {
    key: "APRES-B",
    customer: {
      legalName: "[APRES] Hotel Demonstrativo Horizonte",
      tradeName: "Hotel Horizonte (fictício)",
      segment: "Hotelaria",
      notes:
        "Cenário APRES-B. Massa fictícia de apresentação. Sem PII real. scenarioKey:APRES-B",
    },
    contact: {
      name: "Contato Demonstrativo Beta",
      roleTitle: "Governança (fictício)",
      email: "contato.apres.b@apresentacao.servsam.local",
      phone: "91987651002",
    },
    unit: {
      name: "Unidade Hoteleira Demonstrativa",
      addressLine: "Avenida Fictícia do Porto, 200",
      city: "Belém",
      state: "PA",
      postalCode: "66020000",
      notes: "Endereço inventado. O.C. externa só na DEMO-HF.1 (/demonstracao).",
    },
    proposal: {
      title: "[APRES] Sanitização — Hotel Demonstrativo Horizonte",
      targetStatus: "sent",
      validUntil: "2099-12-31",
      paymentTerms: "Condições comerciais fictícias para apresentação.",
      commercialConditions:
        "Orçamento enviado/em negociação. Sem O.C. persistente nesta sprint.",
      observations: "Cenário B: sanitização. scenarioKey:APRES-B",
      discountCents: 0,
      items: [
        {
          description: "Sanitização de áreas comuns (demonstrativo)",
          quantity: 1,
          unitPriceCents: 680_000,
        },
      ],
    },
  },
  {
    key: "APRES-C",
    customer: {
      legalName: "[APRES] Empresa Demonstrativo Porto Industrial",
      tradeName: "Porto Industrial (fictício)",
      segment: "Indústria",
      notes:
        "Cenário APRES-C. Massa fictícia de apresentação. Sem PII real. scenarioKey:APRES-C",
    },
    contact: {
      name: "Contato Demonstrativo Gama",
      roleTitle: "Facilities (fictício)",
      email: "contato.apres.c@apresentacao.servsam.local",
      phone: "91987651003",
    },
    unit: {
      name: "Planta Demonstrativa 1",
      addressLine: "Distrito Fictício Industrial, km 3",
      city: "Ananindeua",
      state: "PA",
      postalCode: "67010000",
      notes:
        "Endereço inventado. Contrato/recorrência só na demonstração até as sprints próprias.",
    },
    proposal: {
      title: "[APRES] Serviços periódicos — Empresa Demonstrativo Porto Industrial",
      targetStatus: "draft",
      validUntil: "2099-12-31",
      paymentTerms: "Rascunho comercial fictício.",
      commercialConditions:
        "Pacote periódico demonstrativo. Contrato não é criado neste provisionamento.",
      observations: "Cenário C: rascunho periódico. scenarioKey:APRES-C",
      discountCents: 0,
      items: [
        {
          description: "Controle periódico de áreas externas (mensal fictício)",
          quantity: 12,
          unitPriceCents: 45_000,
        },
        {
          description: "Monitoramento de pontos críticos (trimestral fictício)",
          quantity: 4,
          unitPriceCents: 80_000,
        },
      ],
    },
  },
] as const;

export type ApresExistingCustomer = {
  id: string;
  legalName: string;
  deletedAt: Date | string | null;
  contacts: Array<{ id: string; name: string; deletedAt?: Date | string | null }>;
  units: Array<{ id: string; name: string; deletedAt?: Date | string | null }>;
};

export type ApresExistingProposal = {
  id: string;
  title: string;
  status: string;
  customerId: string;
  deletedAt: Date | string | null;
};

export type ApresPlanAction =
  | { type: "create_customer"; scenarioKey: ApresScenarioDefinition["key"] }
  | {
      type: "create_contact";
      scenarioKey: ApresScenarioDefinition["key"];
      customerId: string | null;
    }
  | {
      type: "create_unit";
      scenarioKey: ApresScenarioDefinition["key"];
      customerId: string | null;
    }
  | {
      type: "create_proposal";
      scenarioKey: ApresScenarioDefinition["key"];
      customerId: string | null;
      unitId: string | null;
    }
  | {
      type: "transition_proposal";
      scenarioKey: ApresScenarioDefinition["key"];
      proposalId: string | null;
      from: string;
      to: ApresProposalTarget;
    }
  | {
      type: "noop";
      scenarioKey: ApresScenarioDefinition["key"];
      reason: string;
    }
  | {
      type: "conflict";
      scenarioKey: ApresScenarioDefinition["key"];
      reason: string;
    };

export type ApresScenarioPlan = {
  scenarioKey: ApresScenarioDefinition["key"];
  actions: ApresPlanAction[];
  expectedProposalStatus: ApresProposalTarget;
};

export type ApresProvisionPlan = {
  scenarios: ApresScenarioPlan[];
  summary: {
    createCustomers: number;
    createContacts: number;
    createUnits: number;
    createProposals: number;
    transitions: number;
    noops: number;
    conflicts: number;
  };
};

function isActive(deletedAt: Date | string | null | undefined): boolean {
  return deletedAt == null;
}

function transitionPath(
  from: string,
  to: ApresProposalTarget,
): ApresProposalTarget[] {
  if (from === to) return [];
  if (from === "draft" && to === "sent") return ["sent"];
  if (from === "draft" && to === "accepted") return ["sent", "accepted"];
  if (from === "sent" && to === "accepted") return ["accepted"];
  return [];
}

/** Calcula ações idempotentes a partir do snapshot atual. */
export function buildApresProvisionPlan(
  scenarios: readonly ApresScenarioDefinition[],
  customers: readonly ApresExistingCustomer[],
  proposals: readonly ApresExistingProposal[],
): ApresProvisionPlan {
  const scenarioPlans: ApresScenarioPlan[] = [];

  for (const scenario of scenarios) {
    const actions: ApresPlanAction[] = [];
    const customer = customers.find(
      (item) =>
        item.legalName === scenario.customer.legalName && isActive(item.deletedAt),
    );

    const customerId: string | null = customer?.id ?? null;
    let unitId: string | null = null;

    if (!customer) {
      actions.push({ type: "create_customer", scenarioKey: scenario.key });
      actions.push({
        type: "create_contact",
        scenarioKey: scenario.key,
        customerId: null,
      });
      actions.push({
        type: "create_unit",
        scenarioKey: scenario.key,
        customerId: null,
      });
      actions.push({
        type: "create_proposal",
        scenarioKey: scenario.key,
        customerId: null,
        unitId: null,
      });
      if (scenario.proposal.targetStatus !== "draft") {
        const path = transitionPath("draft", scenario.proposal.targetStatus);
        let from: string = "draft";
        for (const to of path) {
          actions.push({
            type: "transition_proposal",
            scenarioKey: scenario.key,
            proposalId: null,
            from,
            to,
          });
          from = to;
        }
      }
    } else {
      const activeContacts = customer.contacts.filter((item) =>
        isActive(item.deletedAt),
      );
      const activeUnits = customer.units.filter((item) => isActive(item.deletedAt));
      const contact = activeContacts.find(
        (item) => item.name === scenario.contact.name,
      );
      const unit = activeUnits.find((item) => item.name === scenario.unit.name);
      unitId = unit?.id ?? null;

      if (!contact) {
        actions.push({
          type: "create_contact",
          scenarioKey: scenario.key,
          customerId,
        });
      } else {
        actions.push({
          type: "noop",
          scenarioKey: scenario.key,
          reason: "contact_exists",
        });
      }

      if (!unit) {
        actions.push({
          type: "create_unit",
          scenarioKey: scenario.key,
          customerId,
        });
      } else {
        actions.push({
          type: "noop",
          scenarioKey: scenario.key,
          reason: "unit_exists",
        });
      }

      const proposal = proposals.find(
        (item) =>
          item.customerId === customerId &&
          item.title === scenario.proposal.title &&
          isActive(item.deletedAt),
      );

      if (!proposal) {
        actions.push({
          type: "create_proposal",
          scenarioKey: scenario.key,
          customerId,
          unitId,
        });
        if (scenario.proposal.targetStatus !== "draft") {
          const path = transitionPath("draft", scenario.proposal.targetStatus);
          let from: string = "draft";
          for (const to of path) {
            actions.push({
              type: "transition_proposal",
              scenarioKey: scenario.key,
              proposalId: null,
              from,
              to,
            });
            from = to;
          }
        }
      } else if (proposal.status === scenario.proposal.targetStatus) {
        actions.push({
          type: "noop",
          scenarioKey: scenario.key,
          reason: "proposal_already_at_target",
        });
      } else {
        const path = transitionPath(
          proposal.status,
          scenario.proposal.targetStatus,
        );
        if (path.length === 0) {
          actions.push({
            type: "conflict",
            scenarioKey: scenario.key,
            reason: `proposal_status_${proposal.status}_cannot_reach_${scenario.proposal.targetStatus}`,
          });
        } else {
          let from = proposal.status;
          for (const to of path) {
            actions.push({
              type: "transition_proposal",
              scenarioKey: scenario.key,
              proposalId: proposal.id,
              from,
              to,
            });
            from = to;
          }
        }
      }
    }

    scenarioPlans.push({
      scenarioKey: scenario.key,
      actions,
      expectedProposalStatus: scenario.proposal.targetStatus,
    });
  }

  const flat = scenarioPlans.flatMap((item) => item.actions);
  return {
    scenarios: scenarioPlans,
    summary: {
      createCustomers: flat.filter((item) => item.type === "create_customer").length,
      createContacts: flat.filter((item) => item.type === "create_contact").length,
      createUnits: flat.filter((item) => item.type === "create_unit").length,
      createProposals: flat.filter((item) => item.type === "create_proposal").length,
      transitions: flat.filter((item) => item.type === "transition_proposal").length,
      noops: flat.filter((item) => item.type === "noop").length,
      conflicts: flat.filter((item) => item.type === "conflict").length,
    },
  };
}

export function proposalTotalCents(scenario: ApresScenarioDefinition): number {
  const itemsTotal = scenario.proposal.items.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitPriceCents),
    0,
  );
  return Math.max(0, itemsTotal - scenario.proposal.discountCents);
}

export function expectedIndicatorDeltas(plan: ApresProvisionPlan): {
  customersActive: number;
  proposalsDraft: number;
  proposalsSent: number;
  proposalsAccepted: number;
  proposalsTotal: number;
  contacts: number;
  units: number;
} {
  return {
    customersActive: plan.summary.createCustomers,
    proposalsDraft: APRES_01_SCENARIOS.filter(
      (scenario) =>
        scenario.proposal.targetStatus === "draft" &&
        plan.scenarios
          .find((item) => item.scenarioKey === scenario.key)
          ?.actions.some((action) => action.type === "create_proposal"),
    ).length,
    proposalsSent: APRES_01_SCENARIOS.filter(
      (scenario) =>
        scenario.proposal.targetStatus === "sent" &&
        plan.scenarios
          .find((item) => item.scenarioKey === scenario.key)
          ?.actions.some(
            (action) =>
              action.type === "create_proposal" ||
              (action.type === "transition_proposal" && action.to === "sent"),
          ),
    ).length,
    proposalsAccepted: APRES_01_SCENARIOS.filter(
      (scenario) =>
        scenario.proposal.targetStatus === "accepted" &&
        plan.scenarios
          .find((item) => item.scenarioKey === scenario.key)
          ?.actions.some(
            (action) =>
              action.type === "create_proposal" ||
              (action.type === "transition_proposal" && action.to === "accepted"),
          ),
    ).length,
    proposalsTotal: plan.summary.createProposals,
    contacts: plan.summary.createContacts,
    units: plan.summary.createUnits,
  };
}
