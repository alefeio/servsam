import type { AuthenticatedUser } from "@/lib/platform/access";
import { writeAudit } from "@/lib/platform/audit";
import {
  employeeInputSchema,
  type EmployeeInput,
} from "@/lib/platform/employee-schemas";
import { PermissionError } from "@/lib/platform/permission-error";
import { hasPermission } from "@/lib/platform/permissions";
import {
  DENIED_MESSAGE,
  NOT_FOUND_MESSAGE,
  fail,
  type ServiceResult,
} from "@/lib/platform/service-result";
import { getPrisma } from "@/lib/db/prisma";

const FIRST_ISSUE = (issues: { message: string }[]) =>
  issues[0]?.message ?? "Revise os dados.";

function assertCan(
  actor: Pick<AuthenticatedUser, "permissions">,
  permission: string,
): void {
  if (!hasPermission(actor.permissions, permission))
    throw new PermissionError(DENIED_MESSAGE);
}

export type EmployeeListFilter = {
  query?: string;
  includeInactive?: boolean;
};

export async function listEmployees(
  actor: AuthenticatedUser,
  filter: EmployeeListFilter = {},
) {
  assertCan(actor, "employee.view");
  const query = filter.query?.trim();
  return getPrisma().employee.findMany({
    where: {
      organizationId: actor.organizationId,
      deletedAt: null,
      ...(filter.includeInactive ? {} : { isActive: true }),
      ...(query
        ? {
            OR: [
              { fullName: { contains: query, mode: "insensitive" as const } },
              { jobTitle: { contains: query, mode: "insensitive" as const } },
              { email: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
    take: 300,
  });
}

/** Opções ativas para seletores de agenda. */
export async function listActiveEmployeeOptions(actor: AuthenticatedUser) {
  assertCan(actor, "employee.view");
  return getPrisma().employee.findMany({
    where: {
      organizationId: actor.organizationId,
      deletedAt: null,
      isActive: true,
    },
    orderBy: { fullName: "asc" },
    take: 300,
    select: { id: true, fullName: true, jobTitle: true },
  });
}

export async function getEmployeeDetail(
  actor: AuthenticatedUser,
  employeeId: string,
) {
  assertCan(actor, "employee.view");
  return getPrisma().employee.findFirst({
    where: {
      id: employeeId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
  });
}

export async function getEmployeeHistory(
  actor: AuthenticatedUser,
  employeeId: string,
) {
  assertCan(actor, "audit.view");
  return getPrisma().auditLog.findMany({
    where: {
      organizationId: actor.organizationId,
      entityType: "Employee",
      entityId: employeeId,
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      action: true,
      createdAt: true,
      metadata: true,
      actor: { select: { name: true } },
    },
  });
}

export async function createEmployee(
  actor: AuthenticatedUser,
  raw: EmployeeInput,
): Promise<ServiceResult<{ id: string }>> {
  assertCan(actor, "employee.manage");
  const parsed = employeeInputSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const id = crypto.randomUUID();
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    await tx.employee.create({
      data: {
        id,
        organizationId: actor.organizationId,
        fullName: parsed.data.fullName,
        jobTitle: parsed.data.jobTitle,
        phone: parsed.data.phone ?? null,
        email: parsed.data.email ?? null,
        notes: parsed.data.notes ?? null,
        isActive: parsed.data.isActive ?? true,
        createdById: actor.id,
        updatedById: actor.id,
      },
    });
    await writeAudit(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "EMPLOYEE_CREATED",
        entityType: "Employee",
        entityId: id,
        metadata: {
          fullName: parsed.data.fullName,
          jobTitle: parsed.data.jobTitle,
          isActive: parsed.data.isActive ?? true,
        },
      },
      tx,
    );
  });
  return { ok: true, data: { id } };
}

export async function updateEmployee(
  actor: AuthenticatedUser,
  employeeId: string,
  raw: EmployeeInput,
): Promise<ServiceResult<{ id: string }>> {
  assertCan(actor, "employee.manage");
  const parsed = employeeInputSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const prisma = getPrisma();
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.employee.findFirst({
        where: {
          id: employeeId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
      });
      if (!existing) throw new Error(NOT_FOUND_MESSAGE);

      const nextActive = parsed.data.isActive ?? existing.isActive;
      await tx.employee.update({
        where: { id: existing.id },
        data: {
          fullName: parsed.data.fullName,
          jobTitle: parsed.data.jobTitle,
          phone: parsed.data.phone ?? null,
          email: parsed.data.email ?? null,
          notes: parsed.data.notes ?? null,
          isActive: nextActive,
          updatedById: actor.id,
        },
      });
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "EMPLOYEE_UPDATED",
          entityType: "Employee",
          entityId: existing.id,
          metadata: {
            before: {
              fullName: existing.fullName,
              jobTitle: existing.jobTitle,
              isActive: existing.isActive,
              phone: existing.phone,
              email: existing.email,
            },
            after: {
              fullName: parsed.data.fullName,
              jobTitle: parsed.data.jobTitle,
              isActive: nextActive,
              phone: parsed.data.phone ?? null,
              email: parsed.data.email ?? null,
            },
          },
        },
        tx,
      );
    });
    return { ok: true, data: { id: employeeId } };
  } catch (error) {
    if (error instanceof Error && error.message === NOT_FOUND_MESSAGE) {
      return fail(NOT_FOUND_MESSAGE);
    }
    throw error;
  }
}
