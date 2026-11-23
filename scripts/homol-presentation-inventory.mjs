/**
 * Inventário somente leitura do HOMOL para PREP-01 (apresentação).
 * Não imprime PII completa nem URLs. Não altera dados.
 */
import { createHash } from "node:crypto";
import { buildHomolEnv } from "./lib/homol-env.mjs";

const { env, targetHostHash } = buildHomolEnv();
Object.assign(process.env, env);
if (process.env.DATABASE_ENV !== "preview") {
  console.error(JSON.stringify({ ok: false, reason: "DATABASE_ENV must be preview" }));
  process.exit(1);
}

function sha(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

function residueKind(name) {
  if (/\[APRES\]/i.test(name)) return "APRES";
  if (/\[E2E\]/i.test(name)) return "E2E";
  if (/\[GATEF\]/i.test(name)) return "GATEF";
  if (/Homol|Condom/i.test(name)) return "TEST_HINT";
  return null;
}

const { getPrisma } = await import("../src/lib/db/prisma.ts");
const prisma = getPrisma();

const org = await prisma.organization.findUnique({
  where: { slug: "servsam" },
  select: { id: true, slug: true },
});
if (!org) {
  console.error(JSON.stringify({ ok: false, reason: "org_missing" }));
  process.exit(1);
}

const [users, customers, proposals, contacts, units, auditCount] = await Promise.all([
  prisma.user.findMany({
    where: { organizationId: org.id },
    select: {
      id: true,
      email: true,
      isActive: true,
      userRoles: { select: { role: { select: { code: true } } } },
      accounts: { select: { providerId: true } },
    },
  }),
  prisma.customer.findMany({
    where: { organizationId: org.id },
    select: {
      id: true,
      legalName: true,
      tradeName: true,
      deletedAt: true,
      createdAt: true,
      _count: { select: { proposals: true, contacts: true, units: true } },
    },
    orderBy: { createdAt: "desc" },
  }),
  prisma.proposal.findMany({
    where: { organizationId: org.id },
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      deletedAt: true,
      totalCents: true,
      createdAt: true,
      customerId: true,
    },
    orderBy: { createdAt: "desc" },
  }),
  prisma.customerContact.count({
    where: { customer: { organizationId: org.id }, deletedAt: null },
  }),
  prisma.customerUnit.count({
    where: { customer: { organizationId: org.id }, deletedAt: null },
  }),
  prisma.auditLog.count({ where: { organizationId: org.id } }),
]);

const byStatus = {};
for (const proposal of proposals) {
  const key = proposal.deletedAt ? `archived:${proposal.status}` : proposal.status;
  byStatus[key] = (byStatus[key] ?? 0) + 1;
}

const customerRows = customers.map((customer) => {
  const name = `${customer.legalName} ${customer.tradeName ?? ""}`;
  const kind = residueKind(name);
  return {
    idHash: sha(customer.id),
    nameHint: customer.legalName.slice(0, 48),
    kind: kind ?? "OTHER",
    archived: Boolean(customer.deletedAt),
    proposals: customer._count.proposals,
    contacts: customer._count.contacts,
    units: customer._count.units,
    createdAt: customer.createdAt,
  };
});

const byKind = (kind, archived) =>
  customerRows.filter((row) => row.kind === kind && row.archived === archived);

const apresActive = byKind("APRES", false);
const apresArchived = byKind("APRES", true);
const e2eActive = byKind("E2E", false);
const e2eArchived = byKind("E2E", true);
const gatefActive = byKind("GATEF", false);
const gatefArchived = byKind("GATEF", true);
const otherActive = byKind("OTHER", false);
const otherArchived = byKind("OTHER", true);
const testHintActive = byKind("TEST_HINT", false);
const residueActive = customerRows.filter(
  (row) => !row.archived && (row.kind === "E2E" || row.kind === "GATEF" || row.kind === "TEST_HINT"),
);
const residueArchived = customerRows.filter(
  (row) => row.archived && (row.kind === "E2E" || row.kind === "GATEF" || row.kind === "TEST_HINT"),
);

const proposalClasses = proposals.map((proposal) => {
  let kind = "OTHER";
  if (/\[APRES\]/i.test(proposal.title)) kind = "APRES";
  else if (/\[E2E\]/i.test(proposal.title)) kind = "E2E";
  else if (/\[GATEF\]/i.test(proposal.title)) kind = "GATEF";
  return {
    code: proposal.code,
    status: proposal.status,
    archived: Boolean(proposal.deletedAt),
    kind,
    titleHint: proposal.title.slice(0, 48),
    totalCents: proposal.totalCents,
    createdAt: proposal.createdAt,
  };
});

console.log(
  JSON.stringify(
    {
      ok: true,
      targetHostHash,
      organizationSlug: org.slug,
      users: users.map((user) => ({
        emailHash: sha(user.email.toLowerCase()),
        isActive: user.isActive,
        roles: user.userRoles.map((link) => link.role.code),
        hasCredential: user.accounts.some((account) => account.providerId === "credential"),
      })),
      counts: {
        users: users.length,
        customersTotal: customers.length,
        customersActive: customers.filter((c) => !c.deletedAt).length,
        customersArchived: customers.filter((c) => c.deletedAt).length,
        contactsActive: contacts,
        unitsActive: units,
        proposalsTotal: proposals.length,
        proposalsByStatus: byStatus,
        auditLogs: auditCount,
        byKindActive: {
          APRES: apresActive.length,
          E2E: e2eActive.length,
          GATEF: gatefActive.length,
          TEST_HINT: testHintActive.length,
          OTHER: otherActive.length,
        },
        byKindArchived: {
          APRES: apresArchived.length,
          E2E: e2eArchived.length,
          GATEF: gatefArchived.length,
          OTHER: otherArchived.length,
        },
      },
      apresActive,
      apresArchived,
      e2eActive,
      e2eArchived,
      gatefActive,
      gatefArchived,
      otherActive,
      presentationCandidates: otherActive,
      residueActive,
      residueArchived,
      proposalHints: proposalClasses,
      panelNote:
        "O Painel de /sistema contabiliza todos os clientes ativos e orçamentos não arquivados do ambiente, inclusive resíduos E2E/GATEF. Não altera indicadores oficiais para maquiar a apresentação.",
      presentationProposal: {
        keep: "Usar filtros/navegação direta nos registros [APRES]; narrar E2E/GATEF como técnicos",
        softArchiveResidue: "Arquivar ou soft-delete seletivo dos [E2E]/[GATEF] após autorização",
        never: ["TRUNCATE", "migrate reset", "apagar AuditLog", "Production", "seed sem aprovação"],
      },
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
