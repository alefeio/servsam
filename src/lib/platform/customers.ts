import type { AuthenticatedUser } from "@/lib/platform/access";
import { writeAudit } from "@/lib/platform/audit";
import {
  contactInputSchema,
  customerInputSchema,
  unitInputSchema,
  type ContactInput,
  type CustomerInput,
  type UnitInput,
} from "@/lib/platform/customer-schemas";
import {
  DENIED_MESSAGE,
  NOT_FOUND_MESSAGE,
  denyWithout,
  fail,
  type ServiceResult,
} from "@/lib/platform/service-result";
import { getPrisma } from "@/lib/db/prisma";
import { PermissionError } from "@/lib/platform/permission-error";
import { hasPermission } from "@/lib/platform/permissions";

const FIRST_ISSUE = (issues: { message: string }[]) =>
  issues[0]?.message ?? "Revise os dados.";

function assertCan(
  actor: Pick<AuthenticatedUser, "permissions">,
  permission: string,
): void {
  if (!hasPermission(actor.permissions, permission))
    throw new PermissionError(DENIED_MESSAGE);
}

/* ------------------------------------------------------------------ leitura */

export type CustomerListFilter = { query?: string; includeArchived?: boolean };

export async function listCustomers(
  actor: AuthenticatedUser,
  filter: CustomerListFilter = {},
) {
  assertCan(actor, "customer.view");
  const query = filter.query?.trim();
  return getPrisma().customer.findMany({
    where: {
      organizationId: actor.organizationId,
      ...(filter.includeArchived ? {} : { deletedAt: null }),
      ...(query
        ? {
            OR: [
              { legalName: { contains: query, mode: "insensitive" as const } },
              { tradeName: { contains: query, mode: "insensitive" as const } },
              {
                document: { contains: query.replace(/\D/g, "") || "__none__" },
              },
            ],
          }
        : {}),
    },
    orderBy: { legalName: "asc" },
    take: 200,
    include: {
      _count: {
        select: {
          units: { where: { deletedAt: null } },
          contacts: { where: { deletedAt: null } },
          proposals: { where: { deletedAt: null } },
        },
      },
    },
  });
}

export async function getCustomerDetail(
  actor: AuthenticatedUser,
  customerId: string,
) {
  assertCan(actor, "customer.view");
  return getPrisma().customer.findFirst({
    where: { id: customerId, organizationId: actor.organizationId },
    include: {
      contacts: {
        where: { deletedAt: null },
        orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
      },
      units: { where: { deletedAt: null }, orderBy: { name: "asc" } },
      proposals: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          totalCents: true,
        },
      },
    },
  });
}

/** Clientes ativos com unidades ativas, para os seletores do formulário de orçamento. */
export async function listCustomerOptions(actor: AuthenticatedUser) {
  assertCan(actor, "customer.view");
  const customers = await getPrisma().customer.findMany({
    where: { organizationId: actor.organizationId, deletedAt: null },
    orderBy: { legalName: "asc" },
    take: 500,
    select: {
      id: true,
      legalName: true,
      tradeName: true,
      units: {
        where: { deletedAt: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      },
    },
  });
  return customers.map((customer) => ({
    id: customer.id,
    label: customer.tradeName
      ? `${customer.legalName} (${customer.tradeName})`
      : customer.legalName,
    units: customer.units,
  }));
}
export async function countActiveCustomers(
  actor: AuthenticatedUser,
): Promise<number> {
  assertCan(actor, "customer.view");
  return getPrisma().customer.count({
    where: { organizationId: actor.organizationId, deletedAt: null },
  });
}
/* ------------------------------------------------------------------ cliente */

export async function createCustomer(
  actor: AuthenticatedUser,
  input: CustomerInput,
): Promise<ServiceResult<{ id: string }>> {
  const denied = denyWithout(actor, "customer.create");
  if (denied) return denied;

  const parsed = customerInputSchema.safeParse(input);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const prisma = getPrisma();
  if (parsed.data.document) {
    const duplicate = await prisma.customer.findFirst({
      where: {
        organizationId: actor.organizationId,
        document: parsed.data.document,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (duplicate) return fail("Já existe um cliente com este documento.");
  }

  const id = crypto.randomUUID();
  await prisma.$transaction(async (tx) => {
    await tx.customer.create({
      data: {
        id,
        organizationId: actor.organizationId,
        legalName: parsed.data.legalName,
        tradeName: parsed.data.tradeName,
        document: parsed.data.document,
        segment: parsed.data.segment,
        notes: parsed.data.notes,
        createdById: actor.id,
        updatedById: actor.id,
      },
    });
    await writeAudit(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "CUSTOMER_CREATED",
        entityType: "Customer",
        entityId: id,
        metadata: { legalName: parsed.data.legalName },
      },
      tx,
    );
  });

  return { ok: true, data: { id } };
}

export async function updateCustomer(
  actor: AuthenticatedUser,
  customerId: string,
  input: CustomerInput,
): Promise<ServiceResult> {
  const denied = denyWithout(actor, "customer.update");
  if (denied) return denied;

  const parsed = customerInputSchema.safeParse(input);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const prisma = getPrisma();
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!customer) return fail(NOT_FOUND_MESSAGE);

  if (parsed.data.document) {
    const duplicate = await prisma.customer.findFirst({
      where: {
        organizationId: actor.organizationId,
        document: parsed.data.document,
        deletedAt: null,
        NOT: { id: customerId },
      },
      select: { id: true },
    });
    if (duplicate) return fail("Já existe um cliente com este documento.");
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.customer.updateMany({
      where: {
        id: customerId,
        organizationId: actor.organizationId,
        deletedAt: null,
      },
      data: {
        legalName: parsed.data.legalName,
        tradeName: parsed.data.tradeName ?? null,
        document: parsed.data.document ?? null,
        segment: parsed.data.segment ?? null,
        notes: parsed.data.notes ?? null,
        updatedById: actor.id,
      },
    });
    if (updated.count !== 1) throw new Error(NOT_FOUND_MESSAGE);
    await writeAudit(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "CUSTOMER_UPDATED",
        entityType: "Customer",
        entityId: customerId,
        metadata: { legalName: parsed.data.legalName },
      },
      tx,
    );
  });

  return { ok: true };
}

/** Exclusão lógica. Recusa quando há orçamento em andamento (rascunho ou enviado). */
export async function archiveCustomer(
  actor: AuthenticatedUser,
  customerId: string,
): Promise<ServiceResult> {
  const denied = denyWithout(actor, "customer.update");
  if (denied) return denied;

  const prisma = getPrisma();
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!customer) return fail(NOT_FOUND_MESSAGE);

  try {
    await prisma.$transaction(async (tx) => {
      const open = await tx.proposal.count({
        where: {
          organizationId: actor.organizationId,
          customerId,
          deletedAt: null,
          status: { in: ["draft", "sent"] },
        },
      });
      if (open > 0) {
        throw new Error("OPEN_PROPOSALS");
      }

      const updated = await tx.customer.updateMany({
        where: {
          id: customerId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
        data: { deletedAt: new Date(), updatedById: actor.id },
      });
      if (updated.count !== 1) throw new Error(NOT_FOUND_MESSAGE);
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "CUSTOMER_ARCHIVED",
          entityType: "Customer",
          entityId: customerId,
          metadata: {},
        },
        tx,
      );
    });
  } catch (error) {
    if (error instanceof Error && error.message === "OPEN_PROPOSALS") {
      return fail(
        "Este cliente tem orçamento em andamento. Conclua ou arquive antes.",
      );
    }
    if (error instanceof Error && error.message === NOT_FOUND_MESSAGE) {
      return fail(NOT_FOUND_MESSAGE);
    }
    throw error;
  }
  return { ok: true };
}

export async function restoreCustomer(
  actor: AuthenticatedUser,
  customerId: string,
): Promise<ServiceResult> {
  const denied = denyWithout(actor, "customer.update");
  if (denied) return denied;

  const prisma = getPrisma();
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      organizationId: actor.organizationId,
      deletedAt: { not: null },
    },
    select: { id: true, document: true },
  });
  if (!customer) return fail(NOT_FOUND_MESSAGE);

  if (customer.document) {
    const duplicate = await prisma.customer.findFirst({
      where: {
        organizationId: actor.organizationId,
        document: customer.document,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (duplicate)
      return fail("Já existe outro cliente ativo com este documento.");
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.customer.updateMany({
      where: {
        id: customerId,
        organizationId: actor.organizationId,
        deletedAt: { not: null },
      },
      data: { deletedAt: null, updatedById: actor.id },
    });
    if (updated.count !== 1) throw new Error(NOT_FOUND_MESSAGE);
    await writeAudit(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "CUSTOMER_RESTORED",
        entityType: "Customer",
        entityId: customerId,
        metadata: {},
      },
      tx,
    );
  });
  return { ok: true };
}

/* ------------------------------------------------------------------ contatos */

async function findActiveCustomerId(
  actor: AuthenticatedUser,
  customerId: string,
) {
  const customer = await getPrisma().customer.findFirst({
    where: {
      id: customerId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    select: { id: true },
  });
  return customer?.id ?? null;
}

export async function addCustomerContact(
  actor: AuthenticatedUser,
  customerId: string,
  input: ContactInput,
): Promise<ServiceResult<{ id: string }>> {
  const denied = denyWithout(actor, "customer.update");
  if (denied) return denied;

  const parsed = contactInputSchema.safeParse(input);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));
  if (!(await findActiveCustomerId(actor, customerId)))
    return fail(NOT_FOUND_MESSAGE);

  const id = crypto.randomUUID();
  await getPrisma().$transaction(async (tx) => {
    if (parsed.data.isPrimary) {
      await tx.customerContact.updateMany({
        where: {
          customerId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
        data: { isPrimary: false },
      });
    }
    await tx.customerContact.create({
      data: {
        id,
        organizationId: actor.organizationId,
        customerId,
        name: parsed.data.name,
        roleTitle: parsed.data.roleTitle,
        email: parsed.data.email,
        phone: parsed.data.phone,
        isPrimary: parsed.data.isPrimary,
      },
    });
    await writeAudit(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "CUSTOMER_CONTACT_CREATED",
        entityType: "CustomerContact",
        entityId: id,
        metadata: { customerId },
      },
      tx,
    );
  });
  return { ok: true, data: { id } };
}

export async function updateCustomerContact(
  actor: AuthenticatedUser,
  contactId: string,
  input: ContactInput,
): Promise<ServiceResult> {
  const denied = denyWithout(actor, "customer.update");
  if (denied) return denied;

  const parsed = contactInputSchema.safeParse(input);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const contact = await getPrisma().customerContact.findFirst({
    where: {
      id: contactId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    select: { id: true, customerId: true },
  });
  if (!contact) return fail(NOT_FOUND_MESSAGE);

  await getPrisma().$transaction(async (tx) => {
    if (parsed.data.isPrimary) {
      await tx.customerContact.updateMany({
        where: {
          customerId: contact.customerId,
          organizationId: actor.organizationId,
          deletedAt: null,
          NOT: { id: contactId },
        },
        data: { isPrimary: false },
      });
    }
    const updated = await tx.customerContact.updateMany({
      where: {
        id: contactId,
        organizationId: actor.organizationId,
        deletedAt: null,
      },
      data: {
        name: parsed.data.name,
        roleTitle: parsed.data.roleTitle ?? null,
        email: parsed.data.email ?? null,
        phone: parsed.data.phone ?? null,
        isPrimary: parsed.data.isPrimary,
      },
    });
    if (updated.count !== 1) throw new Error(NOT_FOUND_MESSAGE);
    await writeAudit(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "CUSTOMER_CONTACT_UPDATED",
        entityType: "CustomerContact",
        entityId: contactId,
        metadata: { customerId: contact.customerId },
      },
      tx,
    );
  });
  return { ok: true };
}

export async function archiveCustomerContact(
  actor: AuthenticatedUser,
  contactId: string,
): Promise<ServiceResult<{ customerId: string }>> {
  const denied = denyWithout(actor, "customer.update");
  if (denied) return denied;

  const contact = await getPrisma().customerContact.findFirst({
    where: {
      id: contactId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    select: { id: true, customerId: true },
  });
  if (!contact) return fail(NOT_FOUND_MESSAGE);

  await getPrisma().$transaction(async (tx) => {
    const updated = await tx.customerContact.updateMany({
      where: {
        id: contactId,
        organizationId: actor.organizationId,
        deletedAt: null,
      },
      data: { deletedAt: new Date(), isPrimary: false },
    });
    if (updated.count !== 1) throw new Error(NOT_FOUND_MESSAGE);
    await writeAudit(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "CUSTOMER_CONTACT_ARCHIVED",
        entityType: "CustomerContact",
        entityId: contactId,
        metadata: { customerId: contact.customerId },
      },
      tx,
    );
  });
  return { ok: true, data: { customerId: contact.customerId } };
}

/* ------------------------------------------------------------------ unidades */

export async function addCustomerUnit(
  actor: AuthenticatedUser,
  customerId: string,
  input: UnitInput,
): Promise<ServiceResult<{ id: string }>> {
  const denied = denyWithout(actor, "customer.update");
  if (denied) return denied;

  const parsed = unitInputSchema.safeParse(input);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));
  if (!(await findActiveCustomerId(actor, customerId)))
    return fail(NOT_FOUND_MESSAGE);

  const id = crypto.randomUUID();
  await getPrisma().$transaction(async (tx) => {
    await tx.customerUnit.create({
      data: {
        id,
        organizationId: actor.organizationId,
        customerId,
        name: parsed.data.name,
        addressLine: parsed.data.addressLine,
        city: parsed.data.city,
        state: parsed.data.state,
        postalCode: parsed.data.postalCode,
        notes: parsed.data.notes,
      },
    });
    await writeAudit(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "CUSTOMER_UNIT_CREATED",
        entityType: "CustomerUnit",
        entityId: id,
        metadata: { customerId },
      },
      tx,
    );
  });
  return { ok: true, data: { id } };
}

export async function updateCustomerUnit(
  actor: AuthenticatedUser,
  unitId: string,
  input: UnitInput,
): Promise<ServiceResult> {
  const denied = denyWithout(actor, "customer.update");
  if (denied) return denied;

  const parsed = unitInputSchema.safeParse(input);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const unit = await getPrisma().customerUnit.findFirst({
    where: {
      id: unitId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    select: { id: true, customerId: true },
  });
  if (!unit) return fail(NOT_FOUND_MESSAGE);

  await getPrisma().$transaction(async (tx) => {
    const updated = await tx.customerUnit.updateMany({
      where: {
        id: unitId,
        organizationId: actor.organizationId,
        deletedAt: null,
      },
      data: {
        name: parsed.data.name,
        addressLine: parsed.data.addressLine ?? null,
        city: parsed.data.city ?? null,
        state: parsed.data.state ?? null,
        postalCode: parsed.data.postalCode ?? null,
        notes: parsed.data.notes ?? null,
      },
    });
    if (updated.count !== 1) throw new Error(NOT_FOUND_MESSAGE);
    await writeAudit(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "CUSTOMER_UNIT_UPDATED",
        entityType: "CustomerUnit",
        entityId: unitId,
        metadata: { customerId: unit.customerId },
      },
      tx,
    );
  });
  return { ok: true };
}

export async function archiveCustomerUnit(
  actor: AuthenticatedUser,
  unitId: string,
): Promise<ServiceResult<{ customerId: string }>> {
  const denied = denyWithout(actor, "customer.update");
  if (denied) return denied;

  const unit = await getPrisma().customerUnit.findFirst({
    where: {
      id: unitId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    select: { id: true, customerId: true },
  });
  if (!unit) return fail(NOT_FOUND_MESSAGE);

  try {
    await getPrisma().$transaction(async (tx) => {
      const inUse = await tx.proposal.count({
        where: {
          organizationId: actor.organizationId,
          customerUnitId: unitId,
          deletedAt: null,
          status: { in: ["draft", "sent"] },
        },
      });
      if (inUse > 0) throw new Error("UNIT_IN_USE");

      const updated = await tx.customerUnit.updateMany({
        where: {
          id: unitId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });
      if (updated.count !== 1) throw new Error(NOT_FOUND_MESSAGE);
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "CUSTOMER_UNIT_ARCHIVED",
          entityType: "CustomerUnit",
          entityId: unitId,
          metadata: { customerId: unit.customerId },
        },
        tx,
      );
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNIT_IN_USE") {
      return fail("Há orçamento em andamento usando esta unidade.");
    }
    if (error instanceof Error && error.message === NOT_FOUND_MESSAGE) {
      return fail(NOT_FOUND_MESSAGE);
    }
    throw error;
  }
  return { ok: true, data: { customerId: unit.customerId } };
}
