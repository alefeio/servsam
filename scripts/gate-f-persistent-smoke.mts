/**
 * Gate F — smoke de persistência real no HOMOL (sem UI).
 * Cria cliente/contato/unidade/orçamento, valida no Postgres e auditoria,
 * testa negativa de permissão. Nunca imprime segredos.
 */
import { createHash } from "node:crypto";
import { buildHomolEnv } from "./lib/homol-env.mjs";

const { env, targetHostHash } = buildHomolEnv();
Object.assign(process.env, env);

function sha(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

const { getPrisma } = await import("../src/lib/db/prisma.ts");
const { auth } = await import("../src/lib/platform/auth.ts");
const customers = await import("../src/lib/platform/customers.ts");
const proposals = await import("../src/lib/platform/proposals.ts");
const { hasPermission } = await import("../src/lib/platform/permissions.ts");

const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD;
if (!email || !password) {
  console.error(JSON.stringify({ ok: false, reason: "missing SEED_*" }));
  process.exit(1);
}

const prisma = getPrisma();
const signedIn = await auth.api.signInEmail({
  body: { email, password },
  headers: new Headers(),
});
const user = await prisma.user.findUnique({
  where: { id: signedIn.user.id },
  include: {
    userRoles: {
      include: {
        role: { include: { rolePermissions: { include: { permission: true } } } },
      },
    },
  },
});
if (!user?.isActive) {
  console.error(JSON.stringify({ ok: false, reason: "inactive-user" }));
  process.exit(1);
}

const permissions = new Set<string>(
  user.userRoles.flatMap((link) =>
    link.role.rolePermissions.map((grant) => grant.permission.key),
  ),
);
const actor = {
  id: user.id,
  organizationId: user.organizationId,
  email: user.email,
  name: user.name,
  isActive: user.isActive,
  permissions,
  roleCodes: user.userRoles.map((link) => link.role.code),
};

const stamp = Date.now().toString().slice(-6);
const legalName = `[GATEF] Cliente Homol ${stamp}`;

const created = await customers.createCustomer(actor, {
  legalName,
  tradeName: `Trade ${stamp}`,
  document: undefined,
  segment: "Homologação",
  notes: "Gate F",
});
if (!created.ok || !created.data?.id) {
  console.error(JSON.stringify({ ok: false, step: "createCustomer", created }));
  process.exit(1);
}
const customerId = created.data.id;

const contact = await customers.addCustomerContact(actor, customerId, {
  name: "Contato Gate F",
  roleTitle: "Facilities",
  email: `gatef.${stamp}@exemplo.com.br`,
  phone: "91999990000",
  isPrimary: true,
});
if (!contact.ok) {
  console.error(JSON.stringify({ ok: false, step: "contact" }));
  process.exit(1);
}

const unit = await customers.addCustomerUnit(actor, customerId, {
  name: "Unidade Gate F",
  addressLine: "Av. Teste 100",
  city: "Belém",
  state: "PA",
  postalCode: "66000000",
  notes: undefined,
});
if (!unit.ok || !unit.data?.id) {
  console.error(JSON.stringify({ ok: false, step: "unit" }));
  process.exit(1);
}

const proposal = await proposals.createProposal(actor, {
  customerId,
  customerUnitId: unit.data.id,
  title: `[GATEF] Orçamento ${stamp}`,
  validUntil: undefined,
  paymentTerms: "30 dias",
  commercialConditions: undefined,
  observations: "smoke",
  discountCents: 0,
  items: [
    {
      description: "Serviço A",
      quantity: 2,
      unitPriceCents: 150_000,
    },
  ],
});
if (!proposal.ok || !proposal.data?.id) {
  console.error(JSON.stringify({ ok: false, step: "proposal", proposal }));
  process.exit(1);
}

const reloadedCustomer = await customers.getCustomerDetail(actor, customerId);
const reloadedProposal = await proposals.getProposalDetail(actor, proposal.data.id);

const dbCustomer = await prisma.customer.findFirst({
  where: { id: customerId, organizationId: actor.organizationId },
  include: {
    contacts: { where: { deletedAt: null } },
    units: { where: { deletedAt: null } },
  },
});
const dbProposal = await prisma.proposal.findFirst({
  where: { id: proposal.data.id, organizationId: actor.organizationId },
  include: { items: true },
});
const audits = await prisma.auditLog.count({
  where: {
    organizationId: actor.organizationId,
    entityId: { in: [customerId, contact.data?.id, unit.data.id, proposal.data.id].filter(Boolean) as string[] },
  },
});

const deniedActor = {
  ...actor,
  permissions: new Set(
    [...actor.permissions].filter((key) => !key.startsWith("customer.") && !key.startsWith("proposal.")),
  ),
};
const deniedCreate = await customers.createCustomer(deniedActor, {
  legalName: "Não deve criar",
  tradeName: undefined,
  document: undefined,
  segment: undefined,
  notes: undefined,
});
const deniedView = await customers.listCustomers(deniedActor).then(
  () => ({ ok: true as const }),
  (error: unknown) => ({
    ok: false as const,
    message: error instanceof Error ? error.message : "error",
  }),
);

const report = {
  ok:
    Boolean(reloadedCustomer) &&
    Boolean(reloadedProposal) &&
    dbCustomer?.contacts.length === 1 &&
    dbCustomer.units.length === 1 &&
    dbProposal?.items.length === 1 &&
    dbProposal.totalCents === 300_000 &&
    audits >= 4 &&
    deniedCreate.ok === false &&
    deniedView.ok === false &&
    hasPermission(actor.permissions, "customer.create") &&
    !hasPermission(deniedActor.permissions, "customer.create"),
  targetHostHash,
  customerIdHash: sha(customerId),
  proposalCode: dbProposal?.code ?? null,
  totalCents: dbProposal?.totalCents ?? null,
  contacts: dbCustomer?.contacts.length ?? 0,
  units: dbCustomer?.units.length ?? 0,
  items: dbProposal?.items.length ?? 0,
  audits,
  deniedCreateOk: deniedCreate.ok,
  deniedViewBlocked: deniedView.ok === false,
};

console.log(JSON.stringify(report, null, 2));

await prisma.session.deleteMany({ where: { userId: actor.id } }).catch(() => undefined);
await prisma.$disconnect();
process.exit(report.ok ? 0 : 1);
