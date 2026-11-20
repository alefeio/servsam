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

const presentationCandidates = customerRows.filter((row) => row.kind === "OTHER" && !row.archived);
const residueActive = customerRows.filter((row) => row.kind !== "OTHER" && !row.archived);
const residueArchived = customerRows.filter((row) => row.kind !== "OTHER" && row.archived);

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
      },
      presentationCandidates,
      residueActive,
      residueArchived,
      proposalHints: proposals.map((proposal) => ({
        code: proposal.code,
        status: proposal.status,
        archived: Boolean(proposal.deletedAt),
        titleHint: proposal.title.slice(0, 48),
        totalCents: proposal.totalCents,
        createdAt: proposal.createdAt,
      })),
      presentationProposal: {
        keep: "Clientes OTHER ativos + orçamentos aceitos/enviados limpos para roteiro",
        softArchiveResidue: "Arquivar ou soft-delete seletivo dos [E2E]/[GATEF] após autorização",
        never: ["TRUNCATE", "migrate reset", "apagar AuditLog", "Production"],
      },
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
