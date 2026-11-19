/**
 * Gate 2 — inventário detalhado read-only dos resíduos [E2E]/[GATEF] no HOMOL.
 * Não exclui nada. Não imprime segredos, e-mails de usuários seed nem URLs.
 */
import { createHash } from "node:crypto";
import { buildHomolEnv } from "./lib/homol-env.mjs";

const { env, targetHostHash } = buildHomolEnv();
Object.assign(process.env, env);

function sha(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

const { getPrisma } = await import("../src/lib/db/prisma.ts");
const prisma = getPrisma();

const org = await prisma.organization.findUnique({
  where: { slug: "servsam" },
  select: { id: true, name: true, slug: true },
});

const customers = await prisma.customer.findMany({
  where: {
    OR: [
      { legalName: { startsWith: "[E2E]" } },
      { legalName: { startsWith: "[GATEF]" } },
      { tradeName: { startsWith: "[E2E]" } },
      { tradeName: { startsWith: "[GATEF]" } },
    ],
  },
  select: {
    id: true,
    organizationId: true,
    legalName: true,
    tradeName: true,
    document: true,
    segment: true,
    deletedAt: true,
    createdAt: true,
    updatedAt: true,
    contacts: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        deletedAt: true,
      },
    },
    units: {
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        deletedAt: true,
      },
    },
    proposals: {
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        totalCents: true,
        deletedAt: true,
        createdAt: true,
        items: { select: { id: true, description: true, quantity: true, totalCents: true } },
        _count: { select: { items: true } },
      },
    },
  },
  orderBy: { createdAt: "asc" },
});

const report = {
  targetHostHash,
  organization: org
    ? { idHash: sha(org.id), slug: org.slug, name: org.name }
    : null,
  residueCustomerCount: customers.length,
  customers: customers.map((customer) => ({
    idHash: sha(customer.id),
    organizationMatches: org ? customer.organizationId === org.id : false,
    nameHint: customer.legalName.slice(0, 56),
    tradeHint: customer.tradeName?.slice(0, 40) ?? null,
    hasDocument: Boolean(customer.document),
    segment: customer.segment,
    archived: Boolean(customer.deletedAt),
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    source: customer.legalName.startsWith("[E2E]")
      ? "e2e"
      : customer.legalName.startsWith("[GATEF]")
        ? "gatef"
        : "other",
    contacts: customer.contacts.map((contact) => ({
      idHash: sha(contact.id),
      nameHint: contact.name.slice(0, 40),
      hasEmail: Boolean(contact.email),
      hasPhone: Boolean(contact.phone),
      archived: Boolean(contact.deletedAt),
    })),
    units: customer.units.map((unit) => ({
      idHash: sha(unit.id),
      nameHint: unit.name.slice(0, 40),
      city: unit.city,
      state: unit.state,
      archived: Boolean(unit.deletedAt),
    })),
    proposals: customer.proposals.map((proposal) => ({
      idHash: sha(proposal.id),
      code: proposal.code,
      titleHint: proposal.title.slice(0, 48),
      status: proposal.status,
      totalCents: proposal.totalCents,
      itemCount: proposal._count.items,
      archived: Boolean(proposal.deletedAt),
      createdAt: proposal.createdAt,
      items: proposal.items.map((item) => ({
        idHash: sha(item.id),
        descriptionHint: item.description.slice(0, 40),
        quantity: String(item.quantity),
        totalCents: item.totalCents,
      })),
    })),
  })),
};

const audits = await prisma.auditLog.count({
  where: {
    OR: [
      { entityType: "Customer", entityId: { in: customers.map((c) => c.id) } },
      {
        entityType: "Proposal",
        entityId: { in: customers.flatMap((c) => c.proposals.map((p) => p.id)) },
      },
    ],
  },
});

report.relatedAuditLogCount = audits;
report.proposalCodes = customers.flatMap((c) => c.proposals.map((p) => p.code)).sort();
report.summary = {
  e2eCustomers: customers.filter((c) => c.legalName.startsWith("[E2E]")).length,
  gatefCustomers: customers.filter((c) => c.legalName.startsWith("[GATEF]")).length,
  archivedCustomers: customers.filter((c) => c.deletedAt).length,
  activeCustomers: customers.filter((c) => !c.deletedAt).length,
  proposals: customers.reduce((n, c) => n + c.proposals.length, 0),
  acceptedProposals: customers.reduce(
    (n, c) => n + c.proposals.filter((p) => p.status === "accepted").length,
    0,
  ),
  draftProposals: customers.reduce(
    (n, c) => n + c.proposals.filter((p) => p.status === "draft").length,
    0,
  ),
};

console.log(JSON.stringify(report, null, 2));
await prisma.$disconnect();
