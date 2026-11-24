import type { Prisma } from "@/generated/prisma/client";
import type { AuthenticatedUser } from "@/lib/platform/access";
import { writeAudit } from "@/lib/platform/audit";
import { businessYear } from "@/lib/platform/dates";
import { PermissionError } from "@/lib/platform/permission-error";
import { hasPermission } from "@/lib/platform/permissions";
import {
  cancelServiceOrderSchema,
  createServiceOrderSchema,
  type CancelServiceOrderInput,
  type CreateServiceOrderInput,
} from "@/lib/platform/service-order-schemas";
import {
  canCancelServiceOrder,
  isServiceOrderStatus,
  type ServiceOrderStatusValue,
} from "@/lib/platform/service-order-state";
import {
  DENIED_MESSAGE,
  NOT_FOUND_MESSAGE,
  fail,
  type ServiceResult,
} from "@/lib/platform/service-result";
import { getPrisma } from "@/lib/db/prisma";

const FIRST_ISSUE = (issues: { message: string }[]) =>
  issues[0]?.message ?? "Revise os dados.";
const SERVICE_ORDER_SEQUENCE_KEY = "service_order";

function assertCan(
  actor: Pick<AuthenticatedUser, "permissions">,
  permission: string,
): void {
  if (!hasPermission(actor.permissions, permission))
    throw new PermissionError(DENIED_MESSAGE);
}

export function formatServiceOrderCode(
  year: number,
  sequence: number,
): string {
  return `OS-${year}-${String(sequence).padStart(4, "0")}`;
}

async function nextServiceOrderCode(
  tx: Prisma.TransactionClient,
  organizationId: string,
  now: Date,
): Promise<string> {
  const year = businessYear(now);
  const sequence = await tx.documentSequence.upsert({
    where: {
      organizationId_key_year: {
        organizationId,
        key: SERVICE_ORDER_SEQUENCE_KEY,
        year,
      },
    },
    update: { lastValue: { increment: 1 } },
    create: {
      id: crypto.randomUUID(),
      organizationId,
      key: SERVICE_ORDER_SEQUENCE_KEY,
      year,
      lastValue: 1,
    },
    select: { lastValue: true },
  });
  return formatServiceOrderCode(year, sequence.lastValue);
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: unknown }).code === "P2002",
  );
}

export type ServiceOrderListFilter = {
  status?: string;
  customerId?: string;
  engagementId?: string;
  query?: string;
};

export async function listServiceOrders(
  actor: AuthenticatedUser,
  filter: ServiceOrderListFilter = {},
) {
  assertCan(actor, "service_order.view");
  const query = filter.query?.trim();
  return getPrisma().serviceOrder.findMany({
    where: {
      organizationId: actor.organizationId,
      deletedAt: null,
      ...(filter.status && isServiceOrderStatus(filter.status)
        ? { status: filter.status }
        : {}),
      ...(filter.customerId ? { customerId: filter.customerId } : {}),
      ...(filter.engagementId ? { engagementId: filter.engagementId } : {}),
      ...(query
        ? {
            OR: [
              { code: { contains: query, mode: "insensitive" as const } },
              {
                description: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
              {
                customer: {
                  legalName: {
                    contains: query,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                engagement: {
                  code: { contains: query, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      customer: { select: { id: true, legalName: true, tradeName: true } },
      engagement: {
        select: {
          id: true,
          code: true,
          origin: true,
          proposal: { select: { id: true, code: true } },
          purchaseOrder: {
            select: { id: true, code: true, externalNumber: true },
          },
        },
      },
      engagementItem: {
        select: { id: true, description: true, position: true },
      },
    },
  });
}

export async function getServiceOrderDetail(
  actor: AuthenticatedUser,
  serviceOrderId: string,
) {
  assertCan(actor, "service_order.view");
  return getPrisma().serviceOrder.findFirst({
    where: {
      id: serviceOrderId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    include: {
      customer: {
        select: { id: true, legalName: true, tradeName: true, deletedAt: true },
      },
      customerUnit: { select: { id: true, name: true } },
      engagement: {
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          origin: true,
          proposal: { select: { id: true, code: true } },
          purchaseOrder: {
            select: { id: true, code: true, externalNumber: true },
          },
        },
      },
      engagementItem: {
        select: {
          id: true,
          position: true,
          description: true,
          quantity: true,
          unitPriceCents: true,
          totalCents: true,
        },
      },
    },
  });
}

export async function getServiceOrdersByEngagement(
  actor: AuthenticatedUser,
  engagementId: string,
) {
  assertCan(actor, "service_order.view");
  return getPrisma().serviceOrder.findMany({
    where: {
      organizationId: actor.organizationId,
      engagementId,
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
    include: {
      engagementItem: {
        select: { id: true, position: true, description: true },
      },
    },
  });
}

export async function getServiceOrderHistory(
  actor: AuthenticatedUser,
  serviceOrderId: string,
) {
  assertCan(actor, "audit.view");
  return getPrisma().auditLog.findMany({
    where: {
      organizationId: actor.organizationId,
      entityType: "ServiceOrder",
      entityId: serviceOrderId,
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

export async function createServiceOrder(
  actor: AuthenticatedUser,
  raw: CreateServiceOrderInput,
  now: Date = new Date(),
): Promise<ServiceResult<{ id: string; code: string }>> {
  assertCan(actor, "service_order.create");
  const parsed = createServiceOrderSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const prisma = getPrisma();
  try {
    const created = await prisma.$transaction(async (tx) => {
      const engagement = await tx.engagement.findFirst({
        where: {
          id: parsed.data.engagementId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
        include: {
          items: { orderBy: { position: "asc" } },
        },
      });
      if (!engagement) throw new Error(NOT_FOUND_MESSAGE);
      if (engagement.status !== "active") {
        throw new Error(
          "Somente contratações ativas podem gerar ordem de serviço.",
        );
      }

      const item = engagement.items.find(
        (row) => row.id === parsed.data.engagementItemId,
      );
      if (!item) {
        throw new Error("Serviço não pertence a esta contratação.");
      }

      const customer = await tx.customer.findFirst({
        where: {
          id: engagement.customerId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!customer) throw new Error("Cliente da contratação não encontrado.");

      if (engagement.customerUnitId) {
        const unit = await tx.customerUnit.findFirst({
          where: {
            id: engagement.customerUnitId,
            customerId: engagement.customerId,
            organizationId: actor.organizationId,
            deletedAt: null,
          },
          select: { id: true },
        });
        if (!unit) {
          throw new Error("Unidade da contratação não encontrada.");
        }
      }

      const existing = await tx.serviceOrder.findFirst({
        where: {
          engagementItemId: item.id,
          organizationId: actor.organizationId,
          deletedAt: null,
          status: { not: "cancelled" },
        },
        select: { id: true, code: true },
      });
      if (existing) {
        throw new Error(
          `Este serviço já possui a OS ${existing.code}.`,
        );
      }

      const code = await nextServiceOrderCode(tx, actor.organizationId, now);
      const id = crypto.randomUUID();
      await tx.serviceOrder.create({
        data: {
          id,
          organizationId: actor.organizationId,
          code,
          engagementId: engagement.id,
          engagementItemId: item.id,
          customerId: engagement.customerId,
          customerUnitId: engagement.customerUnitId,
          description: item.description,
          scopeNotes: parsed.data.scopeNotes ?? null,
          observations: parsed.data.observations ?? null,
          quantity: item.quantity,
          status: "issued",
          issuedAt: now,
          issuedById: actor.id,
          createdById: actor.id,
          updatedById: actor.id,
        },
      });

      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "SERVICE_ORDER_CREATED",
          entityType: "ServiceOrder",
          entityId: id,
          metadata: {
            code,
            engagementId: engagement.id,
            engagementCode: engagement.code,
            engagementItemId: item.id,
            customerId: engagement.customerId,
          },
        },
        tx,
      );

      return { id, code };
    });
    return { ok: true, data: created };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail("Este serviço já possui ordem de serviço ativa.");
    }
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message.includes("contrataç") ||
        error.message.includes("Serviço") ||
        error.message.includes("Cliente") ||
        error.message.includes("Unidade") ||
        error.message.includes("OS ")
      ) {
        return fail(error.message);
      }
    }
    throw error;
  }
}

export async function cancelServiceOrder(
  actor: AuthenticatedUser,
  raw: CancelServiceOrderInput,
  now: Date = new Date(),
): Promise<ServiceResult<{ id: string }>> {
  assertCan(actor, "service_order.update");
  const parsed = cancelServiceOrderSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.serviceOrder.findFirst({
        where: {
          id: parsed.data.serviceOrderId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
      });
      if (!order) throw new Error(NOT_FOUND_MESSAGE);
      if (!canCancelServiceOrder(order.status as ServiceOrderStatusValue)) {
        throw new Error(
          "Esta ordem de serviço não pode ser cancelada no estado atual.",
        );
      }

      await tx.serviceOrder.update({
        where: { id: order.id },
        data: {
          status: "cancelled",
          cancelledAt: now,
          cancelledById: actor.id,
          cancellationReason: parsed.data.reason ?? null,
          updatedById: actor.id,
        },
      });

      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "SERVICE_ORDER_CANCELLED",
          entityType: "ServiceOrder",
          entityId: order.id,
          metadata: {
            code: order.code,
            from: order.status,
            reason: parsed.data.reason ?? null,
          },
        },
        tx,
      );

      return { id: order.id };
    });
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message.includes("cancelada") ||
        error.message.includes("estado")
      ) {
        return fail(error.message);
      }
    }
    throw error;
  }
}
