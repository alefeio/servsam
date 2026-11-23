import type { Prisma } from "@/generated/prisma/client";
import type { AuthenticatedUser } from "@/lib/platform/access";
import { writeAudit } from "@/lib/platform/audit";
import { businessYear } from "@/lib/platform/dates";
import { PermissionError } from "@/lib/platform/permission-error";
import { hasPermission } from "@/lib/platform/permissions";
import {
  createEngagementFromProposalSchema,
  createEngagementFromPurchaseOrderSchema,
  type CreateEngagementFromProposalInput,
  type CreateEngagementFromPurchaseOrderInput,
} from "@/lib/platform/engagement-schemas";
import {
  DENIED_MESSAGE,
  NOT_FOUND_MESSAGE,
  fail,
  type ServiceResult,
} from "@/lib/platform/service-result";
import { getPrisma } from "@/lib/db/prisma";

const FIRST_ISSUE = (issues: { message: string }[]) =>
  issues[0]?.message ?? "Revise os dados.";
const ENGAGEMENT_SEQUENCE_KEY = "engagement";

function assertCan(
  actor: Pick<AuthenticatedUser, "permissions">,
  permission: string,
): void {
  if (!hasPermission(actor.permissions, permission))
    throw new PermissionError(DENIED_MESSAGE);
}

export function formatEngagementCode(year: number, sequence: number): string {
  return `CTR-${year}-${String(sequence).padStart(4, "0")}`;
}

async function nextEngagementCode(
  tx: Prisma.TransactionClient,
  organizationId: string,
  now: Date,
): Promise<string> {
  const year = businessYear(now);
  const sequence = await tx.documentSequence.upsert({
    where: {
      organizationId_key_year: {
        organizationId,
        key: ENGAGEMENT_SEQUENCE_KEY,
        year,
      },
    },
    update: { lastValue: { increment: 1 } },
    create: {
      id: crypto.randomUUID(),
      organizationId,
      key: ENGAGEMENT_SEQUENCE_KEY,
      year,
      lastValue: 1,
    },
    select: { lastValue: true },
  });
  return formatEngagementCode(year, sequence.lastValue);
}

export type EngagementListFilter = {
  status?: string;
  customerId?: string;
  query?: string;
};

export async function listEngagements(
  actor: AuthenticatedUser,
  filter: EngagementListFilter = {},
) {
  assertCan(actor, "contract.view");
  const query = filter.query?.trim();
  return getPrisma().engagement.findMany({
    where: {
      organizationId: actor.organizationId,
      deletedAt: null,
      ...(filter.status
        ? { status: filter.status as "active" | "cancelled" }
        : {}),
      ...(filter.customerId ? { customerId: filter.customerId } : {}),
      ...(query
        ? {
            OR: [
              { code: { contains: query, mode: "insensitive" as const } },
              { title: { contains: query, mode: "insensitive" as const } },
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
      proposal: { select: { id: true, code: true } },
      purchaseOrder: {
        select: { id: true, code: true, externalNumber: true },
      },
    },
  });
}

export async function getEngagementDetail(
  actor: AuthenticatedUser,
  engagementId: string,
) {
  assertCan(actor, "contract.view");
  return getPrisma().engagement.findFirst({
    where: {
      id: engagementId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    include: {
      items: { orderBy: { position: "asc" } },
      customer: {
        select: { id: true, legalName: true, tradeName: true, deletedAt: true },
      },
      customerUnit: { select: { id: true, name: true } },
      proposal: { select: { id: true, code: true, title: true, status: true } },
      purchaseOrder: {
        select: {
          id: true,
          code: true,
          externalNumber: true,
          status: true,
        },
      },
    },
  });
}

export async function getEngagementHistory(
  actor: AuthenticatedUser,
  engagementId: string,
) {
  assertCan(actor, "audit.view");
  return getPrisma().auditLog.findMany({
    where: {
      organizationId: actor.organizationId,
      entityType: "Engagement",
      entityId: engagementId,
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

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: unknown }).code === "P2002",
  );
}

export async function createEngagementFromProposal(
  actor: AuthenticatedUser,
  raw: CreateEngagementFromProposalInput,
  now: Date = new Date(),
): Promise<ServiceResult<{ id: string; code: string }>> {
  assertCan(actor, "contract.manage");
  const parsed = createEngagementFromProposalSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const prisma = getPrisma();
  try {
    const created = await prisma.$transaction(async (tx) => {
      const proposal = await tx.proposal.findFirst({
        where: {
          id: parsed.data.proposalId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
        include: {
          items: { orderBy: { position: "asc" } },
          engagement: { select: { id: true, code: true, deletedAt: true } },
        },
      });
      if (!proposal) throw new Error(NOT_FOUND_MESSAGE);
      if (proposal.status !== "accepted") {
        throw new Error(
          "Somente orçamentos aceitos podem gerar contratação.",
        );
      }
      if (proposal.engagement && !proposal.engagement.deletedAt) {
        throw new Error(
          `Este orçamento já possui a contratação ${proposal.engagement.code}.`,
        );
      }
      if (proposal.engagement?.deletedAt) {
        throw new Error(
          "Já existe vínculo histórico de contratação para este orçamento.",
        );
      }
      if (proposal.items.length === 0) {
        throw new Error("O orçamento não possui itens para contratar.");
      }

      const customer = await tx.customer.findFirst({
        where: {
          id: proposal.customerId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!customer) throw new Error("Cliente do orçamento não encontrado.");

      const code = await nextEngagementCode(tx, actor.organizationId, now);
      const id = crypto.randomUUID();
      await tx.engagement.create({
        data: {
          id,
          organizationId: actor.organizationId,
          code,
          customerId: proposal.customerId,
          customerUnitId: proposal.customerUnitId,
          origin: "proposal",
          proposalId: proposal.id,
          title: proposal.title,
          status: "active",
          totalCents: proposal.totalCents,
          notes: parsed.data.notes ?? null,
          createdById: actor.id,
          updatedById: actor.id,
          items: {
            create: proposal.items.map((item) => ({
              id: crypto.randomUUID(),
              organizationId: actor.organizationId,
              position: item.position,
              description: item.description,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              totalCents: item.totalCents,
            })),
          },
        },
      });

      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "ENGAGEMENT_CREATED",
          entityType: "Engagement",
          entityId: id,
          metadata: {
            code,
            origin: "proposal",
            proposalId: proposal.id,
            proposalCode: proposal.code,
            totalCents: proposal.totalCents,
          },
        },
        tx,
      );

      return { id, code };
    });
    return { ok: true, data: created };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail("Este orçamento já possui contratação.");
    }
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message.includes("orçamento") ||
        error.message.includes("contratação") ||
        error.message.includes("Cliente")
      ) {
        return fail(error.message);
      }
    }
    throw error;
  }
}

export async function createEngagementFromPurchaseOrder(
  actor: AuthenticatedUser,
  raw: CreateEngagementFromPurchaseOrderInput,
  now: Date = new Date(),
): Promise<ServiceResult<{ id: string; code: string }>> {
  assertCan(actor, "contract.manage");
  const parsed = createEngagementFromPurchaseOrderSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const prisma = getPrisma();
  try {
    const created = await prisma.$transaction(async (tx) => {
      const purchaseOrder = await tx.receivedPurchaseOrder.findFirst({
        where: {
          id: parsed.data.purchaseOrderId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
        include: {
          items: { orderBy: { position: "asc" } },
          engagement: { select: { id: true, code: true, deletedAt: true } },
        },
      });
      if (!purchaseOrder) throw new Error(NOT_FOUND_MESSAGE);
      if (purchaseOrder.status === "cancelled") {
        throw new Error("O.C. cancelada não pode gerar contratação.");
      }
      if (purchaseOrder.engagement && !purchaseOrder.engagement.deletedAt) {
        throw new Error(
          `Esta O.C. já possui a contratação ${purchaseOrder.engagement.code}.`,
        );
      }
      if (purchaseOrder.engagement?.deletedAt) {
        throw new Error(
          "Já existe vínculo histórico de contratação para esta O.C.",
        );
      }
      if (purchaseOrder.items.length === 0) {
        throw new Error("A O.C. não possui itens para contratar.");
      }

      const customer = await tx.customer.findFirst({
        where: {
          id: purchaseOrder.customerId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!customer) throw new Error("Cliente da O.C. não encontrado.");

      const code = await nextEngagementCode(tx, actor.organizationId, now);
      const id = crypto.randomUUID();
      await tx.engagement.create({
        data: {
          id,
          organizationId: actor.organizationId,
          code,
          customerId: purchaseOrder.customerId,
          customerUnitId: purchaseOrder.customerUnitId,
          origin: "purchase_order",
          purchaseOrderId: purchaseOrder.id,
          title: purchaseOrder.description,
          status: "active",
          totalCents: purchaseOrder.agreedAmountCents,
          notes: parsed.data.notes ?? null,
          createdById: actor.id,
          updatedById: actor.id,
          items: {
            create: purchaseOrder.items.map((item) => ({
              id: crypto.randomUUID(),
              organizationId: actor.organizationId,
              position: item.position,
              description: item.description,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              totalCents: item.totalCents,
            })),
          },
        },
      });

      await tx.receivedPurchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: {
          status: "contracted",
          updatedById: actor.id,
        },
      });

      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "ENGAGEMENT_CREATED",
          entityType: "Engagement",
          entityId: id,
          metadata: {
            code,
            origin: "purchase_order",
            purchaseOrderId: purchaseOrder.id,
            purchaseOrderCode: purchaseOrder.code,
            externalNumber: purchaseOrder.externalNumber,
            totalCents: purchaseOrder.agreedAmountCents,
          },
        },
        tx,
      );

      return { id, code };
    });
    return { ok: true, data: created };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail("Esta O.C. já possui contratação.");
    }
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message.includes("O.C.") ||
        error.message.includes("contratação") ||
        error.message.includes("Cliente")
      ) {
        return fail(error.message);
      }
    }
    throw error;
  }
}
