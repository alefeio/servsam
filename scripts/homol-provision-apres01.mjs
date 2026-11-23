/**
 * Provisionamento APRES-01 (estratégia B) — massa fictícia [APRES] no HOMOL.
 *
 * Dry-run (padrão — seguro):
 *   npx tsx scripts/homol-provision-apres01.mjs
 *   npx tsx scripts/homol-provision-apres01.mjs --dry-run
 *
 * Execução de escrita (só com autorização explícita posterior):
 *   CONFIRM=YES APRES_DATA_AUTHORIZE=YES npx tsx scripts/homol-provision-apres01.mjs
 *
 * Nunca imprime URLs, senhas ou PII completa. Não cria usuários nem altera papéis.
 */
import { createHash } from "node:crypto";
import { buildHomolEnv, HOMOL_ENV_FILE } from "./lib/homol-env.mjs";

const EXPECTED_HOMOL_HOST_HASH = "22e5c2dd2d93";
const forceDryRun = process.argv.includes("--dry-run");
const confirm = (process.env.CONFIRM ?? "").trim().toUpperCase() === "YES";
const authorized =
  (process.env.APRES_DATA_AUTHORIZE ?? "").trim().toUpperCase() === "YES";
const execute = !forceDryRun && confirm && authorized;

const { env, targetHostHash } = buildHomolEnv();
Object.assign(process.env, env);

if (process.env.VERCEL_ENV === "production" || process.env.DATABASE_ENV === "production") {
  console.error(JSON.stringify({ ok: false, reason: "refusing_production" }));
  process.exit(1);
}
if (process.env.DATABASE_ENV !== "preview") {
  console.error(
    JSON.stringify({
      ok: false,
      reason: "DATABASE_ENV must be preview",
      databaseEnv: process.env.DATABASE_ENV ?? null,
    }),
  );
  process.exit(1);
}
if (targetHostHash !== EXPECTED_HOMOL_HOST_HASH) {
  console.error(
    JSON.stringify({
      ok: false,
      reason: "unexpected_homol_host_hash",
      targetHostHash,
      expected: EXPECTED_HOMOL_HOST_HASH,
      source: HOMOL_ENV_FILE,
    }),
  );
  process.exit(1);
}

function sha(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

const { getPrisma } = await import("../src/lib/db/prisma.ts");
const {
  APRES_01_SCENARIOS,
  buildApresProvisionPlan,
  expectedIndicatorDeltas,
  proposalTotalCents,
} = await import("../src/lib/platform/apres-01-plan.ts");
const {
  addCustomerContact,
  addCustomerUnit,
  createCustomer,
} = await import("../src/lib/platform/customers.ts");
const {
  createProposal,
  transitionProposal,
} = await import("../src/lib/platform/proposals.ts");

const prisma = getPrisma();

const organization = await prisma.organization.findUnique({
  where: { slug: "servsam" },
  select: { id: true, slug: true },
});
if (!organization) {
  console.error(JSON.stringify({ ok: false, reason: "organization_missing" }));
  process.exit(1);
}

const actorEmailHint = (process.env.APRES_ACTOR_EMAIL ?? "").trim().toLowerCase();
const actorUser = await prisma.user.findFirst({
  where: {
    organizationId: organization.id,
    isActive: true,
    ...(actorEmailHint ? { email: actorEmailHint } : {}),
    userRoles: { some: { role: { code: "DIRETORIA" } } },
  },
  include: {
    userRoles: {
      include: {
        role: {
          include: { rolePermissions: { include: { permission: true } } },
        },
      },
    },
  },
  orderBy: { createdAt: "asc" },
});

if (!actorUser) {
  console.error(JSON.stringify({ ok: false, reason: "diretoria_actor_missing" }));
  process.exit(1);
}

const permissions = new Set();
const roleCodes = [];
const roleNames = [];
for (const link of actorUser.userRoles) {
  roleCodes.push(link.role.code);
  roleNames.push(link.role.name);
  for (const grant of link.role.rolePermissions) {
    permissions.add(grant.permission.key);
  }
}

const actor = {
  id: actorUser.id,
  name: actorUser.name,
  email: actorUser.email,
  organizationId: actorUser.organizationId,
  isActive: actorUser.isActive,
  permissions,
  roleCodes,
  roleNames,
};

const customers = await prisma.customer.findMany({
  where: { organizationId: organization.id },
  select: {
    id: true,
    legalName: true,
    deletedAt: true,
    contacts: { select: { id: true, name: true, deletedAt: true } },
    units: { select: { id: true, name: true, deletedAt: true } },
  },
});

const proposals = await prisma.proposal.findMany({
  where: { organizationId: organization.id },
  select: {
    id: true,
    title: true,
    status: true,
    customerId: true,
    deletedAt: true,
  },
});

const baseline = {
  customersActive: customers.filter((item) => !item.deletedAt).length,
  proposalsTotal: proposals.filter((item) => !item.deletedAt).length,
  proposalsByStatus: proposals
    .filter((item) => !item.deletedAt)
    .reduce((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {}),
  apresCustomers: customers.filter(
    (item) => !item.deletedAt && item.legalName.includes("[APRES]"),
  ).length,
};

const plan = buildApresProvisionPlan(APRES_01_SCENARIOS, customers, proposals);
const deltas = expectedIndicatorDeltas(plan);

const report = {
  ok: true,
  mode: execute ? "execute" : "dry-run",
  databaseEnv: "preview",
  homolSource: HOMOL_ENV_FILE,
  targetHostHash,
  productionContact: false,
  organizationSlug: organization.slug,
  actorEmailHash: sha(actor.email.toLowerCase()),
  actorRoles: roleCodes,
  authorization: {
    CONFIRM: confirm,
    APRES_DATA_AUTHORIZE: authorized,
    forceDryRun,
    writeEnabled: execute,
  },
  baseline,
  planSummary: plan.summary,
  expectedDeltas: deltas,
  scenarioHints: APRES_01_SCENARIOS.map((scenario) => ({
    key: scenario.key,
    customerHint: scenario.customer.legalName,
    proposalHint: scenario.proposal.title,
    targetStatus: scenario.proposal.targetStatus,
    totalCents: proposalTotalCents(scenario),
  })),
  scenarioPlans: plan.scenarios.map((item) => ({
    scenarioKey: item.scenarioKey,
    expectedProposalStatus: item.expectedProposalStatus,
    actions: item.actions.map((action) => {
      if (action.type === "noop" || action.type === "conflict") {
        return { type: action.type, reason: action.reason };
      }
      if (action.type === "transition_proposal") {
        return {
          type: action.type,
          from: action.from,
          to: action.to,
          proposalIdHash: action.proposalId ? sha(action.proposalId) : null,
        };
      }
      return { type: action.type };
    }),
  })),
  requires: {
    confirmEnv: "CONFIRM=YES",
    authorizeEnv: "APRES_DATA_AUTHORIZE=YES",
    note: "Escrita bloqueada até autorização explícita. Sem usuários, papéis, migrations ou limpeza.",
  },
};

if (!execute) {
  console.log(
    JSON.stringify(
      {
        ...report,
        status: "awaiting_authorization",
        message:
          "Dry-run concluído. Nenhuma escrita. Para provisionar: CONFIRM=YES APRES_DATA_AUTHORIZE=YES",
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
  process.exit(0);
}

if (plan.summary.conflicts > 0) {
  console.error(
    JSON.stringify({
      ok: false,
      reason: "plan_has_conflicts",
      conflicts: plan.summary.conflicts,
    }),
  );
  await prisma.$disconnect();
  process.exit(1);
}

const results = [];

for (const scenario of APRES_01_SCENARIOS) {
  const scenarioPlan = plan.scenarios.find(
    (item) => item.scenarioKey === scenario.key,
  );
  if (!scenarioPlan) continue;

  let customerId =
    customers.find(
      (item) => item.legalName === scenario.customer.legalName && !item.deletedAt,
    )?.id ?? null;
  let unitId =
    customers
      .find((item) => item.id === customerId)
      ?.units.find(
        (item) => item.name === scenario.unit.name && !item.deletedAt,
      )?.id ?? null;
  let proposalId =
    proposals.find(
      (item) =>
        item.customerId === customerId &&
        item.title === scenario.proposal.title &&
        !item.deletedAt,
    )?.id ?? null;

  for (const action of scenarioPlan.actions) {
    if (action.type === "noop") {
      results.push({ scenarioKey: scenario.key, action: "noop", reason: action.reason });
      continue;
    }
    if (action.type === "conflict") {
      results.push({
        scenarioKey: scenario.key,
        action: "conflict",
        reason: action.reason,
      });
      continue;
    }
    if (action.type === "create_customer") {
      const created = await createCustomer(actor, {
        legalName: scenario.customer.legalName,
        tradeName: scenario.customer.tradeName,
        segment: scenario.customer.segment,
        notes: scenario.customer.notes,
      });
      if (!created.ok) throw new Error(created.message);
      customerId = created.data.id;
      results.push({
        scenarioKey: scenario.key,
        action: "create_customer",
        idHash: sha(customerId),
      });
      continue;
    }
    if (action.type === "create_contact") {
      if (!customerId) throw new Error("customerId_missing_for_contact");
      const created = await addCustomerContact(actor, customerId, {
        name: scenario.contact.name,
        roleTitle: scenario.contact.roleTitle,
        email: scenario.contact.email,
        phone: scenario.contact.phone,
        isPrimary: true,
      });
      if (!created.ok) throw new Error(created.message);
      results.push({
        scenarioKey: scenario.key,
        action: "create_contact",
        idHash: sha(created.data.id),
      });
      continue;
    }
    if (action.type === "create_unit") {
      if (!customerId) throw new Error("customerId_missing_for_unit");
      const created = await addCustomerUnit(actor, customerId, {
        name: scenario.unit.name,
        addressLine: scenario.unit.addressLine,
        city: scenario.unit.city,
        state: scenario.unit.state,
        postalCode: scenario.unit.postalCode,
        notes: scenario.unit.notes,
      });
      if (!created.ok) throw new Error(created.message);
      unitId = created.data.id;
      results.push({
        scenarioKey: scenario.key,
        action: "create_unit",
        idHash: sha(unitId),
      });
      continue;
    }
    if (action.type === "create_proposal") {
      if (!customerId) throw new Error("customerId_missing_for_proposal");
      const created = await createProposal(actor, {
        customerId,
        customerUnitId: unitId ?? undefined,
        title: scenario.proposal.title,
        validUntil: scenario.proposal.validUntil,
        paymentTerms: scenario.proposal.paymentTerms,
        commercialConditions: scenario.proposal.commercialConditions,
        observations: scenario.proposal.observations,
        discountCents: scenario.proposal.discountCents,
        items: scenario.proposal.items,
      });
      if (!created.ok) throw new Error(created.message);
      proposalId = created.data.id;
      results.push({
        scenarioKey: scenario.key,
        action: "create_proposal",
        code: created.data.code,
        idHash: sha(proposalId),
      });
      continue;
    }
    if (action.type === "transition_proposal") {
      const id = action.proposalId ?? proposalId;
      if (!id) throw new Error("proposalId_missing_for_transition");
      const changed = await transitionProposal(actor, id, action.to);
      if (!changed.ok) throw new Error(changed.message);
      results.push({
        scenarioKey: scenario.key,
        action: "transition_proposal",
        from: action.from,
        to: action.to,
        idHash: sha(id),
      });
    }
  }
}

const afterCustomers = await prisma.customer.count({
  where: { organizationId: organization.id, deletedAt: null },
});
const afterProposals = await prisma.proposal.groupBy({
  by: ["status"],
  where: { organizationId: organization.id, deletedAt: null },
  _count: { _all: true },
});

console.log(
  JSON.stringify(
    {
      ...report,
      status: "executed",
      results,
      after: {
        customersActive: afterCustomers,
        proposalsByStatus: Object.fromEntries(
          afterProposals.map((row) => [row.status, row._count._all]),
        ),
      },
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
