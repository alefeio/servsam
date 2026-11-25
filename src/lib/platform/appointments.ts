import type { Prisma } from "@/generated/prisma/client";
import type { AuthenticatedUser } from "@/lib/platform/access";
import { writeAudit } from "@/lib/platform/audit";
import {
  cancelAppointmentSchema,
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  type CancelAppointmentInput,
  type CreateAppointmentInput,
  type RescheduleAppointmentInput,
} from "@/lib/platform/appointment-schemas";
import { parseScheduleDateTimeLocal } from "@/lib/platform/dates";
import { PermissionError } from "@/lib/platform/permission-error";
import { hasPermission } from "@/lib/platform/permissions";
import {
  canScheduleServiceOrder,
  canTransitionServiceOrder,
  type ServiceOrderStatusValue,
} from "@/lib/platform/service-order-state";
import {
  DENIED_MESSAGE,
  NOT_FOUND_MESSAGE,
  fail,
  type ServiceResult,
} from "@/lib/platform/service-result";
import {
  CONFLICT_MESSAGE,
  conflictKeysFromDetails,
  encodeConflictError,
  type ConflictDetail,
} from "@/lib/platform/appointment-constants";
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

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: unknown }).code === "P2002",
  );
}

function parseWindow(startsAtLocal: string, endsAtLocal: string) {
  const startsAt = parseScheduleDateTimeLocal(startsAtLocal);
  const endsAt = parseScheduleDateTimeLocal(endsAtLocal);
  if (!startsAt || !endsAt) {
    throw new Error("Informe data e horário válidos.");
  }
  if (!(startsAt.getTime() < endsAt.getTime())) {
    throw new Error("O início deve ser anterior ao término.");
  }
  return { startsAt, endsAt };
}

async function findEmployeeConflicts(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string;
    employeeId: string;
    startsAt: Date;
    endsAt: Date;
    excludeAppointmentId?: string;
  },
): Promise<ConflictDetail[]> {
  const rows = await tx.serviceAppointment.findMany({
    where: {
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      status: "scheduled",
      deletedAt: null,
      ...(input.excludeAppointmentId
        ? { id: { not: input.excludeAppointmentId } }
        : {}),
      startsAt: { lt: input.endsAt },
      endsAt: { gt: input.startsAt },
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      employeeId: true,
      employee: { select: { fullName: true } },
      serviceOrder: { select: { code: true } },
    },
    take: 10,
  });
  return rows.map((row) => ({
    id: row.id,
    serviceOrderCode: row.serviceOrder.code,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    employeeId: row.employeeId ?? input.employeeId,
    employeeName: row.employee?.fullName ?? "Colaborador",
  }));
}

function assertConflictAccepted(
  conflicts: ConflictDetail[],
  acceptConflict: boolean | undefined,
  acceptConflictKeys: string | undefined,
): void {
  if (conflicts.length === 0) return;
  const expectedKeys = conflictKeysFromDetails(conflicts);
  if (
    !acceptConflict ||
    !acceptConflictKeys ||
    acceptConflictKeys !== expectedKeys
  ) {
    throw new Error(encodeConflictError(conflicts));
  }
}

/**
 * undefined = preservar; null / "" = remover; string = atribuir.
 */
function resolveEmployeeAssignment(
  requested: string | null | undefined,
  currentEmployeeId: string | null,
): string | null {
  if (requested === undefined) return currentEmployeeId;
  if (requested === null || requested === "") return null;
  return requested;
}

export type AppointmentListFilter = {
  from?: Date;
  to?: Date;
  employeeId?: string;
  customerId?: string;
  status?: "scheduled" | "completed" | "cancelled";
  serviceOrderId?: string;
  query?: string;
};

export async function listAppointments(
  actor: AuthenticatedUser,
  filter: AppointmentListFilter = {},
) {
  assertCan(actor, "schedule.view");
  const query = filter.query?.trim();
  return getPrisma().serviceAppointment.findMany({
    where: {
      organizationId: actor.organizationId,
      deletedAt: null,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.employeeId ? { employeeId: filter.employeeId } : {}),
      ...(filter.customerId ? { customerId: filter.customerId } : {}),
      ...(filter.serviceOrderId
        ? { serviceOrderId: filter.serviceOrderId }
        : {}),
      // Interseção com a janela: inclui compromissos que atravessam meia-noite.
      ...(filter.from && filter.to
        ? {
            startsAt: { lt: filter.to },
            endsAt: { gt: filter.from },
          }
        : filter.from
          ? { endsAt: { gt: filter.from } }
          : filter.to
            ? { startsAt: { lt: filter.to } }
            : {}),
      ...(query
        ? {
            OR: [
              {
                serviceOrder: {
                  code: { contains: query, mode: "insensitive" as const },
                },
              },
              {
                serviceOrder: {
                  description: {
                    contains: query,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { startsAt: "asc" },
    take: 500,
    include: {
      employee: {
        select: { id: true, fullName: true, jobTitle: true, isActive: true },
      },
      serviceOrder: {
        select: {
          id: true,
          code: true,
          description: true,
          status: true,
          customer: {
            select: { id: true, legalName: true, tradeName: true },
          },
          customerUnit: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function getAppointmentDetail(
  actor: AuthenticatedUser,
  appointmentId: string,
) {
  assertCan(actor, "schedule.view");
  return getPrisma().serviceAppointment.findFirst({
    where: {
      id: appointmentId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    include: {
      employee: {
        select: { id: true, fullName: true, jobTitle: true, isActive: true },
      },
      serviceOrder: {
        select: {
          id: true,
          code: true,
          description: true,
          status: true,
          customerId: true,
          customerUnitId: true,
          customer: {
            select: { id: true, legalName: true, tradeName: true },
          },
          customerUnit: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function listAppointmentsForServiceOrder(
  actor: AuthenticatedUser,
  serviceOrderId: string,
) {
  assertCan(actor, "schedule.view");
  return getPrisma().serviceAppointment.findMany({
    where: {
      organizationId: actor.organizationId,
      serviceOrderId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      employee: {
        select: { id: true, fullName: true, jobTitle: true, isActive: true },
      },
    },
  });
}

export async function getAppointmentHistory(
  actor: AuthenticatedUser,
  appointmentId: string,
) {
  assertCan(actor, "audit.view");
  return getPrisma().auditLog.findMany({
    where: {
      organizationId: actor.organizationId,
      entityType: "ServiceAppointment",
      entityId: appointmentId,
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      action: true,
      createdAt: true,
      metadata: true,
      actor: { select: { name: true } },
    },
  });
}

export async function getActiveAppointmentForServiceOrder(
  actor: AuthenticatedUser,
  serviceOrderId: string,
) {
  assertCan(actor, "schedule.view");
  return getPrisma().serviceAppointment.findFirst({
    where: {
      organizationId: actor.organizationId,
      serviceOrderId,
      status: "scheduled",
      deletedAt: null,
    },
    include: {
      employee: {
        select: { id: true, fullName: true, jobTitle: true, isActive: true },
      },
    },
  });
}

export type CreateAppointmentResult = {
  id: string;
  conflictWarning?: string;
  conflictingCodes?: string[];
};

export async function createAppointment(
  actor: AuthenticatedUser,
  raw: CreateAppointmentInput,
): Promise<ServiceResult<CreateAppointmentResult>> {
  assertCan(actor, "schedule.create");
  const parsed = createAppointmentSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  let window: { startsAt: Date; endsAt: Date };
  try {
    window = parseWindow(parsed.data.startsAtLocal, parsed.data.endsAtLocal);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Horário inválido.");
  }

  const prisma = getPrisma();
  try {
    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.serviceOrder.findFirst({
        where: {
          id: parsed.data.serviceOrderId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
      });
      if (!order) throw new Error(NOT_FOUND_MESSAGE);
      if (order.status === "cancelled") {
        throw new Error("Ordem de serviço cancelada não pode ser agendada.");
      }
      if (
        !canScheduleServiceOrder(order.status as ServiceOrderStatusValue)
      ) {
        throw new Error(
          "Esta ordem de serviço não está elegível para agendamento.",
        );
      }

      const existingActive = await tx.serviceAppointment.findFirst({
        where: {
          serviceOrderId: order.id,
          status: "scheduled",
          deletedAt: null,
        },
        select: { id: true },
      });
      if (existingActive) {
        throw new Error(
          "Esta OS já possui agendamento vigente. Remarque ou cancele o atual.",
        );
      }

      let employeeId: string | null = null;
      const requestedEmployee = resolveEmployeeAssignment(
        parsed.data.employeeId,
        null,
      );
      if (requestedEmployee) {
        const employee = await tx.employee.findFirst({
          where: {
            id: requestedEmployee,
            organizationId: actor.organizationId,
            deletedAt: null,
          },
        });
        if (!employee) {
          throw new Error("Colaborador não encontrado nesta organização.");
        }
        if (!employee.isActive) {
          throw new Error(
            "Não é possível atribuir agendamento a colaborador inativo.",
          );
        }
        employeeId = employee.id;
      }

      let conflictAccepted = false;
      let conflictingCodes: string[] = [];
      let acceptedConflictKeys: string | null = null;
      if (employeeId) {
        const conflicts = await findEmployeeConflicts(tx, {
          organizationId: actor.organizationId,
          employeeId,
          startsAt: window.startsAt,
          endsAt: window.endsAt,
        });
        if (conflicts.length > 0) {
          assertConflictAccepted(
            conflicts,
            parsed.data.acceptConflict,
            parsed.data.acceptConflictKeys,
          );
          conflictAccepted = true;
          acceptedConflictKeys = conflictKeysFromDetails(conflicts);
          conflictingCodes = conflicts.map((row) => row.serviceOrderCode);
        }
      }

      const id = crypto.randomUUID();
      await tx.serviceAppointment.create({
        data: {
          id,
          organizationId: actor.organizationId,
          serviceOrderId: order.id,
          customerId: order.customerId,
          customerUnitId: order.customerUnitId,
          employeeId,
          startsAt: window.startsAt,
          endsAt: window.endsAt,
          status: "scheduled",
          notes: parsed.data.notes ?? null,
          conflictAccepted,
          createdById: actor.id,
          updatedById: actor.id,
        },
      });

      const previousStatus = order.status as ServiceOrderStatusValue;
      if (previousStatus === "issued") {
        if (!canTransitionServiceOrder(previousStatus, "scheduled")) {
          throw new Error("Transição de estado da OS inválida.");
        }
        await tx.serviceOrder.update({
          where: { id: order.id },
          data: {
            status: "scheduled",
            updatedById: actor.id,
          },
        });
        await writeAudit(
          {
            organizationId: actor.organizationId,
            actorUserId: actor.id,
            action: "SERVICE_ORDER_STATUS_CHANGED",
            entityType: "ServiceOrder",
            entityId: order.id,
            metadata: {
              code: order.code,
              from: previousStatus,
              to: "scheduled",
              cause: "appointment_created",
              appointmentId: id,
            },
          },
          tx,
        );
      }

      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "APPOINTMENT_CREATED",
          entityType: "ServiceAppointment",
          entityId: id,
          metadata: {
            serviceOrderId: order.id,
            serviceOrderCode: order.code,
            startsAt: window.startsAt.toISOString(),
            endsAt: window.endsAt.toISOString(),
            employeeId,
            conflictAccepted,
            acceptedConflictKeys,
            conflictingCodes,
          },
        },
        tx,
      );

      return {
        id,
        conflictWarning: conflictAccepted ? CONFLICT_MESSAGE : undefined,
        conflictingCodes: conflictAccepted ? conflictingCodes : undefined,
      };
    });
    return { ok: true, data: created };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail(
        "Esta OS já possui agendamento vigente. Remarque ou cancele o atual.",
      );
    }
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message.includes(CONFLICT_MESSAGE) ||
        error.message.includes("OS") ||
        error.message.includes("Colaborador") ||
        error.message.includes("agendamento") ||
        error.message.includes("elegível") ||
        error.message.includes("cancelada") ||
        error.message.includes("Transição") ||
        error.message.includes("inativo") ||
        error.message.includes("Confirme novamente")
      ) {
        return fail(error.message);
      }
    }
    throw error;
  }
}

export async function rescheduleAppointment(
  actor: AuthenticatedUser,
  raw: RescheduleAppointmentInput,
  now: Date = new Date(),
): Promise<ServiceResult<CreateAppointmentResult>> {
  assertCan(actor, "schedule.update");
  const parsed = rescheduleAppointmentSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  let window: { startsAt: Date; endsAt: Date };
  try {
    window = parseWindow(parsed.data.startsAtLocal, parsed.data.endsAtLocal);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Horário inválido.");
  }

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.serviceAppointment.findFirst({
        where: {
          id: parsed.data.appointmentId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
        include: {
          serviceOrder: true,
        },
      });
      if (!current) throw new Error(NOT_FOUND_MESSAGE);
      if (current.status !== "scheduled") {
        throw new Error("Somente agendamentos vigentes podem ser remarcados.");
      }
      if (current.serviceOrder.status === "cancelled") {
        throw new Error("Ordem de serviço cancelada não pode ser remarcada.");
      }

      let employeeId = resolveEmployeeAssignment(
        parsed.data.employeeId,
        current.employeeId,
      );
      if (employeeId) {
        const employee = await tx.employee.findFirst({
          where: {
            id: employeeId,
            organizationId: actor.organizationId,
            deletedAt: null,
          },
        });
        if (!employee) {
          throw new Error("Colaborador não encontrado nesta organização.");
        }
        if (!employee.isActive) {
          throw new Error(
            "Não é possível atribuir agendamento a colaborador inativo.",
          );
        }
        employeeId = employee.id;
      }

      let conflictAccepted = false;
      let conflictingCodes: string[] = [];
      let acceptedConflictKeys: string | null = null;
      if (employeeId) {
        const conflicts = await findEmployeeConflicts(tx, {
          organizationId: actor.organizationId,
          employeeId,
          startsAt: window.startsAt,
          endsAt: window.endsAt,
          excludeAppointmentId: current.id,
        });
        if (conflicts.length > 0) {
          assertConflictAccepted(
            conflicts,
            parsed.data.acceptConflict,
            parsed.data.acceptConflictKeys,
          );
          conflictAccepted = true;
          acceptedConflictKeys = conflictKeysFromDetails(conflicts);
          conflictingCodes = conflicts.map((row) => row.serviceOrderCode);
        }
      }

      await tx.serviceAppointment.update({
        where: { id: current.id },
        data: {
          status: "cancelled",
          changeReason: parsed.data.reason,
          cancelledAt: now,
          cancelledById: actor.id,
          updatedById: actor.id,
        },
      });

      const newId = crypto.randomUUID();
      await tx.serviceAppointment.create({
        data: {
          id: newId,
          organizationId: actor.organizationId,
          serviceOrderId: current.serviceOrderId,
          customerId: current.customerId,
          customerUnitId: current.customerUnitId,
          employeeId,
          startsAt: window.startsAt,
          endsAt: window.endsAt,
          status: "scheduled",
          notes: parsed.data.notes ?? current.notes,
          changeReason: null,
          conflictAccepted,
          createdById: actor.id,
          updatedById: actor.id,
        },
      });

      if (current.serviceOrder.status === "issued") {
        await tx.serviceOrder.update({
          where: { id: current.serviceOrderId },
          data: { status: "scheduled", updatedById: actor.id },
        });
      } else {
        await tx.serviceOrder.update({
          where: { id: current.serviceOrderId },
          data: { updatedById: actor.id },
        });
      }

      const assigneeChanged = current.employeeId !== employeeId;
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "APPOINTMENT_RESCHEDULED",
          entityType: "ServiceAppointment",
          entityId: newId,
          metadata: {
            previousAppointmentId: current.id,
            serviceOrderId: current.serviceOrderId,
            serviceOrderCode: current.serviceOrder.code,
            reason: parsed.data.reason,
            before: {
              startsAt: current.startsAt.toISOString(),
              endsAt: current.endsAt.toISOString(),
              employeeId: current.employeeId,
            },
            after: {
              startsAt: window.startsAt.toISOString(),
              endsAt: window.endsAt.toISOString(),
              employeeId,
            },
            conflictAccepted,
            acceptedConflictKeys,
            conflictingCodes,
          },
        },
        tx,
      );
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "APPOINTMENT_CANCELLED",
          entityType: "ServiceAppointment",
          entityId: current.id,
          metadata: {
            reason: parsed.data.reason,
            cause: "reschedule",
            replacedById: newId,
            serviceOrderCode: current.serviceOrder.code,
          },
        },
        tx,
      );
      if (assigneeChanged) {
        await writeAudit(
          {
            organizationId: actor.organizationId,
            actorUserId: actor.id,
            action: "APPOINTMENT_ASSIGNEE_CHANGED",
            entityType: "ServiceAppointment",
            entityId: newId,
            metadata: {
              fromEmployeeId: current.employeeId,
              toEmployeeId: employeeId,
              serviceOrderCode: current.serviceOrder.code,
              cleared: employeeId === null && current.employeeId !== null,
            },
          },
          tx,
        );
      }

      return {
        id: newId,
        conflictWarning: conflictAccepted ? CONFLICT_MESSAGE : undefined,
        conflictingCodes: conflictAccepted ? conflictingCodes : undefined,
      };
    });
    return { ok: true, data: result };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail(
        "Não foi possível remarcar: já existe agendamento vigente para esta OS.",
      );
    }
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message.includes(CONFLICT_MESSAGE) ||
        error.message.includes("agendamento") ||
        error.message.includes("Colaborador") ||
        error.message.includes("cancelada") ||
        error.message.includes("inativo") ||
        error.message.includes("remarcad") ||
        error.message.includes("Confirme novamente")
      ) {
        return fail(error.message);
      }
    }
    throw error;
  }
}

export async function cancelAppointment(
  actor: AuthenticatedUser,
  raw: CancelAppointmentInput,
  now: Date = new Date(),
): Promise<ServiceResult<{ id: string; serviceOrderStatus: string }>> {
  assertCan(actor, "schedule.update");
  const parsed = cancelAppointmentSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.serviceAppointment.findFirst({
        where: {
          id: parsed.data.appointmentId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
        include: { serviceOrder: true },
      });
      if (!current) throw new Error(NOT_FOUND_MESSAGE);
      if (current.status !== "scheduled") {
        throw new Error("Somente agendamentos vigentes podem ser cancelados.");
      }

      await tx.serviceAppointment.update({
        where: { id: current.id },
        data: {
          status: "cancelled",
          changeReason: parsed.data.reason,
          cancelledAt: now,
          cancelledById: actor.id,
          updatedById: actor.id,
        },
      });

      let nextOrderStatus = current.serviceOrder.status;
      if (
        current.serviceOrder.status === "scheduled" &&
        canTransitionServiceOrder("scheduled", "issued")
      ) {
        await tx.serviceOrder.update({
          where: { id: current.serviceOrderId },
          data: {
            status: "issued",
            updatedById: actor.id,
          },
        });
        nextOrderStatus = "issued";
        await writeAudit(
          {
            organizationId: actor.organizationId,
            actorUserId: actor.id,
            action: "SERVICE_ORDER_STATUS_CHANGED",
            entityType: "ServiceOrder",
            entityId: current.serviceOrderId,
            metadata: {
              code: current.serviceOrder.code,
              from: "scheduled",
              to: "issued",
              cause: "appointment_cancelled",
              appointmentId: current.id,
            },
          },
          tx,
        );
      }

      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "APPOINTMENT_CANCELLED",
          entityType: "ServiceAppointment",
          entityId: current.id,
          metadata: {
            reason: parsed.data.reason,
            cause: "cancel",
            serviceOrderCode: current.serviceOrder.code,
            serviceOrderStatus: nextOrderStatus,
          },
        },
        tx,
      );

      return { id: current.id, serviceOrderStatus: nextOrderStatus };
    });
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message.includes("agendamento") ||
        error.message.includes("vigentes")
      ) {
        return fail(error.message);
      }
    }
    throw error;
  }
}

/** Usado ao cancelar OS: encerra compromissos vigentes na mesma transação. */
export async function cancelActiveAppointmentsForServiceOrder(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string;
    serviceOrderId: string;
    actorUserId: string;
    reason: string;
    now: Date;
  },
): Promise<string[]> {
  const active = await tx.serviceAppointment.findMany({
    where: {
      organizationId: input.organizationId,
      serviceOrderId: input.serviceOrderId,
      status: "scheduled",
      deletedAt: null,
    },
    select: { id: true },
  });
  const ids: string[] = [];
  for (const row of active) {
    await tx.serviceAppointment.update({
      where: { id: row.id },
      data: {
        status: "cancelled",
        changeReason: input.reason,
        cancelledAt: input.now,
        cancelledById: input.actorUserId,
        updatedById: input.actorUserId,
      },
    });
    await writeAudit(
      {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: "APPOINTMENT_CANCELLED",
        entityType: "ServiceAppointment",
        entityId: row.id,
        metadata: {
          reason: input.reason,
          cause: "service_order_cancelled",
          serviceOrderId: input.serviceOrderId,
        },
      },
      tx,
    );
    ids.push(row.id);
  }
  return ids;
}
