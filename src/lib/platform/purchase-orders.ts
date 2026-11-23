import type { Prisma } from "@/generated/prisma/client";
import type { AuthenticatedUser } from "@/lib/platform/access";
import { writeAudit } from "@/lib/platform/audit";
import { businessYear, endOfBusinessDay } from "@/lib/platform/dates";
import { computeProposalTotals, lineTotalCents } from "@/lib/platform/money";
import { PermissionError } from "@/lib/platform/permission-error";
import { hasPermission } from "@/lib/platform/permissions";
import {
  purchaseOrderInputSchema,
  type PurchaseOrderInput,
} from "@/lib/platform/purchase-order-schemas";
import {
  DENIED_MESSAGE,
  fail,
  type ServiceResult,
} from "@/lib/platform/service-result";
import { getPrisma } from "@/lib/db/prisma";

const FIRST_ISSUE = (issues: { message: string }[]) =>
  issues[0]?.message ?? "Revise os dados.";
const PURCHASE_ORDER_SEQUENCE_KEY = "purchase_order";

function assertCan(
  actor: Pick<AuthenticatedUser, "permissions">,
  permission: string,
): void {
  if (!hasPermission(actor.permissions, permission))
    throw new PermissionError(DENIED_MESSAGE);
}

export function formatPurchaseOrderCode(
  year: number,
  sequence: number,
): string {
  return `OC-${year}-${String(sequence).padStart(4, "0")}`;
}

async function nextPurchaseOrderCode(
  tx: Prisma.TransactionClient,
  organizationId: string,
  now: Date,
): Promise<string> {
  const year = businessYear(now);
  const sequence = await tx.documentSequence.upsert({
    where: {
      organizationId_key_year: {
        organizationId,
        key: PURCHASE_ORDER_SEQUENCE_KEY,
        year,
      },
    },
    update: { lastValue: { increment: 1 } },
    create: {
      id: crypto.randomUUID(),
      organizationId,
      key: PURCHASE_ORDER_SEQUENCE_KEY,
      year,
      lastValue: 1,
    },
    select: { lastValue: true },
  });
  return formatPurchaseOrderCode(year, sequence.lastValue);
}

export type PurchaseOrderListFilter = {
  status?: string;
  customerId?: string;
  query?: string;
};

export async function listPurchaseOrders(
  actor: AuthenticatedUser,
  filter: PurchaseOrderListFilter = {},
) {
  assertCan(actor, "contract.view");
  const query = filter.query?.trim();
  return getPrisma().receivedPurchaseOrder.findMany({
    where: {
      organizationId: actor.organizationId,
      deletedAt: null,
      ...(filter.status
        ? {
            status: filter.status as
              | "registered"
              | "contracted"
              | "cancelled",
          }
        : {}),
      ...(filter.customerId ? { customerId: filter.customerId } : {}),
      ...(query
        ? {
            OR: [
              { code: { contains: query, mode: "insensitive" as const } },
              {
                externalNumber: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
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
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      customer: { select: { id: true, legalName: true, tradeName: true } },
      engagement: {
        select: { id: true, code: true, status: true, deletedAt: true },
      },
    },
  });
}

export async function getPurchaseOrderDetail(
  actor: AuthenticatedUser,
  purchaseOrderId: string,
) {
  assertCan(actor, "contract.view");
  return getPrisma().receivedPurchaseOrder.findFirst({
    where: {
      id: purchaseOrderId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    include: {
      items: { orderBy: { position: "asc" } },
      customer: {
        select: { id: true, legalName: true, tradeName: true, deletedAt: true },
      },
      customerUnit: { select: { id: true, name: true } },
      engagement: {
        select: { id: true, code: true, status: true, deletedAt: true },
      },
    },
  });
}

export async function getPurchaseOrderHistory(
  actor: AuthenticatedUser,
  purchaseOrderId: string,
) {
  assertCan(actor, "audit.view");
  return getPrisma().auditLog.findMany({
    where: {
      organizationId: actor.organizationId,
      entityType: "ReceivedPurchaseOrder",
      entityId: purchaseOrderId,
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

async function resolveCustomerContext(
  tx: Prisma.TransactionClient,
  organizationId: string,
  customerId: string,
  customerUnitId: string | undefined,
) {
  const customer = await tx.customer.findFirst({
    where: { id: customerId, organizationId, deletedAt: null },
    select: { id: true },
  });
  if (!customer) return { ok: false as const, message: "Cliente não encontrado." };

  if (!customerUnitId) return { ok: true as const, customerUnitId: null };

  const unit = await tx.customerUnit.findFirst({
    where: {
      id: customerUnitId,
      customerId,
      organizationId,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!unit)
    return {
      ok: false as const,
      message: "Unidade não encontrada para este cliente.",
    };
  return { ok: true as const, customerUnitId: unit.id };
}

export async function createPurchaseOrder(
  actor: AuthenticatedUser,
  raw: PurchaseOrderInput,
  now: Date = new Date(),
): Promise<ServiceResult<{ id: string; code: string }>> {
  assertCan(actor, "contract.manage");
  const parsed = purchaseOrderInputSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const input = parsed.data;
  const receivedAt = endOfBusinessDay(input.receivedAt);
  if (!receivedAt) return fail("Data de recebimento inválida.");

  const totals = computeProposalTotals(input.items, 0);
  if (!totals.ok) {
    return fail(
      totals.reason === "overflow"
        ? "O valor total excede o limite permitido."
        : "Revise os valores dos itens.",
    );
  }
  const agreedAmountCents =
    input.agreedAmountCents === undefined
      ? totals.totalCents
      : input.agreedAmountCents;

  const prisma = getPrisma();
  try {
    const created = await prisma.$transaction(async (tx) => {
      const customerCtx = await resolveCustomerContext(
        tx,
        actor.organizationId,
        input.customerId,
        input.customerUnitId,
      );
      if (!customerCtx.ok) throw new Error(customerCtx.message);

      const duplicate = await tx.receivedPurchaseOrder.findFirst({
        where: {
          organizationId: actor.organizationId,
          customerId: input.customerId,
          externalNumber: input.externalNumber,
          deletedAt: null,
        },
        select: { id: true, code: true },
      });
      if (duplicate) {
        throw new Error(
          `Já existe a O.C. ${duplicate.code} com este número externo para o cliente.`,
        );
      }

      const code = await nextPurchaseOrderCode(tx, actor.organizationId, now);
      const id = crypto.randomUUID();
      await tx.receivedPurchaseOrder.create({
        data: {
          id,
          organizationId: actor.organizationId,
          code,
          customerId: input.customerId,
          customerUnitId: customerCtx.customerUnitId,
          externalNumber: input.externalNumber,
          receivedAt,
          description: input.description,
          observations: input.observations ?? null,
          documentReference: input.documentReference ?? null,
          agreedAmountCents,
          status: "registered",
          createdById: actor.id,
          updatedById: actor.id,
          items: {
            create: input.items.map((item, position) => ({
              id: crypto.randomUUID(),
              organizationId: actor.organizationId,
              position,
              description: item.description,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              totalCents: lineTotalCents(item.quantity, item.unitPriceCents),
            })),
          },
        },
      });

      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "PURCHASE_ORDER_CREATED",
          entityType: "ReceivedPurchaseOrder",
          entityId: id,
          metadata: {
            code,
            customerId: input.customerId,
            externalNumber: input.externalNumber,
            agreedAmountCents,
          },
        },
        tx,
      );

      return { id, code };
    });
    return { ok: true, data: created };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível registrar a O.C.";
    if (
      message.startsWith("Já existe") ||
      message.includes("não encontrad") ||
      message.includes("Unidade")
    ) {
      return fail(message);
    }
    const prismaCode =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (prismaCode === "P2002") {
      return fail(
        "Já existe uma O.C. ativa com este número externo para o cliente.",
      );
    }
    throw error;
  }
}
