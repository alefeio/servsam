/**
 * Provisionamento APRES-01 / APRES-01.1 — massa fictícia [APRES] no HOMOL.
 *
 * Dry-run (padrão):
 *   npx tsx scripts/homol-provision-apres01.mjs
 *   npx tsx scripts/homol-provision-apres01.mjs --dry-run
 *
 * Escrita (autorização humana explícita + ator explícito):
 *   CONFIRM=YES APRES_DATA_AUTHORIZE=YES APRES_ACTOR_EMAIL=alexandrefpenha@gmail.com \
 *     npx tsx scripts/homol-provision-apres01.mjs
 *
 * Gate A: identidade real (system_identifier+database vs HOMOL_APPROVED_INSTANCE_ID).
 * Gate B: APRES_ACTOR_EMAIL obrigatório na escrita; sem auto-seleção; sem seed.
 * Gate C: advisory lock em sessão dedicada (pg.Client), revalidação e retomada.
 *
 * Não imprime URL/senha. Não cria usuários. Não altera papéis. Não roda migration.
 */
import { createHash } from "node:crypto";
import { buildHomolEnv, HOMOL_ENV_FILE } from "./lib/homol-env.mjs";
import {
  assertHomolInstanceIdentity,
  EXPECTED_HOMOL_HOST_HASH,
  HOMOL_APPROVED_INSTANCE_ENV,
} from "./lib/homol-identity.mjs";
import {
  openApresSessionLock,
  pickLockConnectionUrl,
} from "../src/lib/platform/apres-session-lock.ts";

const forceDryRun = process.argv.includes("--dry-run");
const confirm = (process.env.CONFIRM ?? "").trim().toUpperCase() === "YES";
const authorized =
  (process.env.APRES_DATA_AUTHORIZE ?? "").trim().toUpperCase() === "YES";
const execute = !forceDryRun && confirm && authorized;
const mode = execute ? "execute" : "dry-run";

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

const connectionUrl =
  process.env.HOMOL_POSTGRES_URL ||
  process.env.HOMOL_DATABASE_URL ||
  process.env.HOMOL_DATABASE_URL_POOLED;
if (!connectionUrl) {
  console.error(JSON.stringify({ ok: false, reason: "homol_url_missing", source: HOMOL_ENV_FILE }));
  process.exit(1);
}

const identity = await assertHomolInstanceIdentity({
  connectionUrl,
  hostHash: targetHostHash,
  expectedHostHash: EXPECTED_HOMOL_HOST_HASH,
});

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
  classifyScenarioProgress,
  refuseSeedActor,
  requireActorEmail,
  validateApresActor,
} = await import("../src/lib/platform/apres-01-guards.ts");
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

const emailCheck = requireActorEmail(process.env.APRES_ACTOR_EMAIL, mode);
if (mode === "execute" && !emailCheck.ok) {
  console.error(JSON.stringify({ ok: false, phase: "actor", ...emailCheck }));
  process.exit(1);
}

let actor = null;
let actorReport = { status: "not_resolved", ...emailCheck };

if (emailCheck.ok) {
  const seedRefuse = refuseSeedActor(
    emailCheck.email,
    process.env.SEED_ADMIN_EMAIL,
  );
  if (!seedRefuse.ok) {
    console.error(JSON.stringify({ ok: false, phase: "actor", ...seedRefuse }));
    process.exit(1);
  }

  const actorUser = await prisma.user.findFirst({
    where: {
      email: emailCheck.email,
      organizationId: organization.id,
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
  });

  const permissions = new Set();
  const roleCodes = [];
  const roleNames = [];
  if (actorUser) {
    for (const link of actorUser.userRoles) {
      roleCodes.push(link.role.code);
      roleNames.push(link.role.name);
      for (const grant of link.role.rolePermissions) {
        permissions.add(grant.permission.key);
      }
    }
  }

  const validation = validateApresActor(
    actorUser
      ? {
          email: actorUser.email,
          isActive: actorUser.isActive,
          organizationSlug: organization.slug,
          permissions,
          roleCodes,
        }
      : null,
    emailCheck.email,
  );

  if (!validation.ok) {
    if (mode === "execute") {
      console.error(JSON.stringify({ ok: false, phase: "actor", ...validation }));
      process.exit(1);
    }
    actorReport = { status: "invalid_for_write", ...validation };
  } else {
    actor = {
      id: actorUser.id,
      name: actorUser.name,
      email: actorUser.email,
      organizationId: actorUser.organizationId,
      isActive: actorUser.isActive,
      permissions,
      roleCodes,
      roleNames,
    };
    actorReport = {
      status: "resolved",
      emailHash: sha(actor.email.toLowerCase()),
      roles: roleCodes,
    };
  }
}

async function loadSnapshot() {
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
  return { customers, proposals };
}

function footprintFromPlan(plan) {
  return plan.scenarios.map((scenario) => {
    const actions = scenario.actions;
    return {
      scenarioKey: scenario.scenarioKey,
      creates: actions.filter((item) =>
        [
          "create_customer",
          "create_contact",
          "create_unit",
          "create_proposal",
        ].includes(item.type),
      ).length,
      transitions: actions.filter((item) => item.type === "transition_proposal")
        .length,
      conflicts: actions.filter((item) => item.type === "conflict").length,
      noops: actions.filter((item) => item.type === "noop").length,
    };
  });
}

const snapshot = await loadSnapshot();
const plan = buildApresProvisionPlan(
  APRES_01_SCENARIOS,
  snapshot.customers,
  snapshot.proposals,
);
const deltas = expectedIndicatorDeltas(plan);
const progress = classifyScenarioProgress(footprintFromPlan(plan));

const baseline = {
  customersActive: snapshot.customers.filter((item) => !item.deletedAt).length,
  proposalsTotal: snapshot.proposals.filter((item) => !item.deletedAt).length,
  proposalsByStatus: snapshot.proposals
    .filter((item) => !item.deletedAt)
    .reduce((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {}),
  apresCustomers: snapshot.customers.filter(
    (item) => !item.deletedAt && item.legalName.includes("[APRES]"),
  ).length,
};

const reportBase = {
  ok: true,
  mode,
  databaseEnv: "preview",
  homolSource: HOMOL_ENV_FILE,
  identity: {
    hostHash: identity.hostHash,
    instanceId: identity.instanceId,
    approvedEnv: HOMOL_APPROVED_INSTANCE_ENV,
    legacyUrlCompared: identity.legacyUrlCompared === true,
    legacyInstanceCompared: identity.legacyInstanceCompared === true,
    independentMarkers: identity.independentMarkers,
  },
  lockStrategy: {
    type: "postgres_session_advisory_lock",
    client: "dedicated_pg_Client",
    note: "Não usa o pool Prisma; acquire/release na mesma sessão; finally fecha a conexão.",
  },
  productionContact: false,
  organizationSlug: organization.slug,
  actor: actorReport,
  authorization: {
    CONFIRM: confirm,
    APRES_DATA_AUTHORIZE: authorized,
    forceDryRun,
    writeEnabled: execute,
    actorEmailRequiredForWrite: true,
  },
  baseline,
  planSummary: plan.summary,
  expectedDeltas: deltas,
  progress,
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
    actorEnv: "APRES_ACTOR_EMAIL=<autorizado>",
    identityEnv: `${HOMOL_APPROVED_INSTANCE_ENV}=<instanceId>`,
    note: "Escrita bloqueada até autorização. Sem usuários/papéis/migrations/limpeza.",
  },
};

if (!execute) {
  console.log(
    JSON.stringify(
      {
        ...reportBase,
        status: "awaiting_authorization",
        message:
          "Dry-run concluído. Nenhuma escrita. Escrita exige CONFIRM=YES APRES_DATA_AUTHORIZE=YES APRES_ACTOR_EMAIL=...",
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
  process.exit(0);
}

if (!actor) {
  console.error(JSON.stringify({ ok: false, reason: "actor_unresolved_for_execute" }));
  await prisma.$disconnect();
  process.exit(1);
}

if (plan.summary.conflicts > 0) {
  console.error(
    JSON.stringify({
      ok: false,
      reason: "plan_has_conflicts",
      conflicts: plan.summary.conflicts,
      blocked: progress.blocked,
    }),
  );
  await prisma.$disconnect();
  process.exit(1);
}

let lockUrl;
try {
  lockUrl = pickLockConnectionUrl(process.env);
} catch (error) {
  console.error(
    JSON.stringify({
      ok: false,
      reason: error instanceof Error ? error.message : "lock_url_unavailable",
    }),
  );
  await prisma.$disconnect();
  process.exit(1);
}

const sessionLock = await openApresSessionLock(lockUrl.url);
const lockAcquired = await sessionLock.tryAcquire();
if (!lockAcquired) {
  console.error(
    JSON.stringify({
      ok: false,
      reason: "concurrent_apres_provision_lock",
      hint: "Outro provisionamento APRES-01 está em andamento.",
      lockSource: lockUrl.source,
    }),
  );
  await sessionLock.close();
  await prisma.$disconnect();
  process.exit(1);
}

const results = [];
const scenarioReports = [];
let failed = false;

try {
  await sessionLock.assertAlive();

  // Revalidação imediata antes de qualquer escrita.
  const fresh = await loadSnapshot();
  let livePlan = buildApresProvisionPlan(
    APRES_01_SCENARIOS,
    fresh.customers,
    fresh.proposals,
  );
  if (livePlan.summary.conflicts > 0) {
    throw new Error(`revalidation_conflicts:${livePlan.summary.conflicts}`);
  }

  for (const scenario of APRES_01_SCENARIOS) {
    await sessionLock.assertAlive();
    const mid = await loadSnapshot();
    livePlan = buildApresProvisionPlan([scenario], mid.customers, mid.proposals);
    const scenarioPlan = livePlan.scenarios[0];
    if (!scenarioPlan) continue;

    if (scenarioPlan.actions.some((item) => item.type === "conflict")) {
      throw new Error(`conflict_${scenario.key}`);
    }

    let customerId =
      mid.customers.find(
        (item) =>
          item.legalName === scenario.customer.legalName && !item.deletedAt,
      )?.id ?? null;
    let unitId =
      mid.customers
        .find((item) => item.id === customerId)
        ?.units.find(
          (item) => item.name === scenario.unit.name && !item.deletedAt,
        )?.id ?? null;
    let proposalId =
      mid.proposals.find(
        (item) =>
          item.customerId === customerId &&
          item.title === scenario.proposal.title &&
          !item.deletedAt,
      )?.id ?? null;

    const scenarioResult = {
      scenarioKey: scenario.key,
      actions: [],
    };

    for (const action of scenarioPlan.actions) {
      if (action.type === "noop") {
        scenarioResult.actions.push({ type: "noop", reason: action.reason });
        results.push({
          scenarioKey: scenario.key,
          action: "noop",
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
        scenarioResult.actions.push({
          type: "create_customer",
          idHash: sha(customerId),
        });
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
        scenarioResult.actions.push({
          type: "create_contact",
          idHash: sha(created.data.id),
        });
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
        scenarioResult.actions.push({
          type: "create_unit",
          idHash: sha(unitId),
        });
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
        scenarioResult.actions.push({
          type: "create_proposal",
          code: created.data.code,
          idHash: sha(proposalId),
        });
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
        scenarioResult.actions.push({
          type: "transition_proposal",
          from: action.from,
          to: action.to,
          idHash: sha(id),
        });
        results.push({
          scenarioKey: scenario.key,
          action: "transition_proposal",
          from: action.from,
          to: action.to,
          idHash: sha(id),
        });
      }
    }

    scenarioReports.push(scenarioResult);
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
        ...reportBase,
        status: "executed",
        results,
        scenarioReports,
        after: {
          customersActive: afterCustomers,
          proposalsByStatus: Object.fromEntries(
            afterProposals.map((row) => [row.status, row._count._all]),
          ),
        },
        atomicity:
          "Per-service transactions only; resume via idempotent re-run after partial failure.",
        lock: {
          source: lockUrl.source,
          connectionId: sessionLock.connectionId,
          heldAcrossScenarios: true,
        },
      },
      null,
      2,
    ),
  );
} catch (error) {
  failed = true;
  console.error(
    JSON.stringify({
      ok: false,
      status: "partial_or_failed",
      reason: error instanceof Error ? error.message : "unknown_error",
      resultsSoFar: results,
      resume:
        "Corrigir a causa e reexecutar com os mesmos envs; o plano é idempotente por cenário.",
    }),
  );
} finally {
  // Release + close na mesma sessão dedicada (sucesso ou falha).
  await sessionLock.close().catch(() => undefined);
}

await prisma.$disconnect();
process.exit(failed ? 1 : 0);
