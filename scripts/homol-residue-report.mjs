/**
 * Read-only: lista resíduos de teste no HOMOL (E2E/Gate F). Sem exclusão.
 */
import { buildHomolEnv } from "./lib/homol-env.mjs";

const { env, targetHostHash } = buildHomolEnv();
Object.assign(process.env, env);

const { getPrisma } = await import("../src/lib/db/prisma.ts");
const prisma = getPrisma();

const customers = await prisma.customer.findMany({
  select: {
    id: true,
    legalName: true,
    tradeName: true,
    deletedAt: true,
    createdAt: true,
    _count: { select: { proposals: true, contacts: true, units: true } },
  },
  orderBy: { createdAt: "desc" },
  take: 100,
});

const isResidue = (name) => /\[E2E\]|\[GATEF\]|Homol|Condom/i.test(name);

const residueCustomers = customers.filter((customer) =>
  isResidue(`${customer.legalName} ${customer.tradeName ?? ""}`),
);

const residueIds = new Set(residueCustomers.map((customer) => customer.id));

const proposals = await prisma.proposal.findMany({
  where: {
    OR: [
      { customerId: { in: [...residueIds] } },
      { title: { contains: "[E2E]", mode: "insensitive" } },
      { title: { contains: "[GATEF]", mode: "insensitive" } },
    ],
  },
  select: {
    code: true,
    title: true,
    status: true,
    deletedAt: true,
    createdAt: true,
    customerId: true,
  },
  orderBy: { createdAt: "desc" },
  take: 100,
});

console.log(
  JSON.stringify(
    {
      targetHostHash,
      scannedCustomers: customers.length,
      residueCustomers: residueCustomers.map((customer) => ({
        nameHint: customer.legalName.slice(0, 48),
        archived: Boolean(customer.deletedAt),
        proposals: customer._count.proposals,
        contacts: customer._count.contacts,
        units: customer._count.units,
        createdAt: customer.createdAt,
      })),
      residueProposals: proposals.map((proposal) => ({
        code: proposal.code,
        status: proposal.status,
        archived: Boolean(proposal.deletedAt),
        titleHint: proposal.title.slice(0, 48),
        createdAt: proposal.createdAt,
      })),
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
