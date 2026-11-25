import type { Prisma } from "@/generated/prisma/client";
import type { AuthenticatedUser } from "@/lib/platform/access";
import { writeAudit } from "@/lib/platform/audit";
import {
  cancelBillingRequestSchema,
  cancelReceiptSchema,
  confirmReceiptSchema,
  createBillingRequestSchema,
  createReceiptEntrySchema,
  processBillingRequestSchema,
  rejectReceiptSchema,
  reverseReceiptSchema,
  type CancelBillingRequestInput,
  type CancelReceiptInput,
  type ConfirmReceiptInput,
  type CreateBillingRequestInput,
  type CreateReceiptEntryInput,
  type ProcessBillingRequestInput,
  type RejectReceiptInput,
  type ReverseReceiptInput,
} from "@/lib/platform/finance-schemas";
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

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function parseReferenceDate(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split("-").map(Number);
  if (!year || !month || !day) throw new Error("Data de referência inválida.");
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

async function lockEngagementFinance(
  tx: Prisma.TransactionClient,
  organizationId: string,
  engagementId: string,
): Promise<void> {
  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(
      hashtext(${`servsam:finance:${organizationId}`}),
      hashtext(${engagementId})
    )
  `;
}

async function sumAllocatedCents(
  tx: Prisma.TransactionClient,
  organizationId: string,
  engagementId: string,
  statuses: Array<"pending" | "confirmed">,
  excludeId?: string,
): Promise<number> {
  const rows = await tx.receiptEntry.findMany({
    where: {
      organizationId,
      engagementId,
      status: { in: statuses },
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { amountCents: true },
  });
  return rows.reduce((sum, row) => sum + row.amountCents, 0);
}

export type FinanceSummary = {
  contractedCents: number;
  confirmedCents: number;
  pendingCents: number;
  referenceBalanceCents: number;
  billingOpen: number;
  billingProcessed: number;
  receiptsPending: number;
  receiptsConfirmed: number;
};

export async function getEngagementFinanceSummary(
  actor: AuthenticatedUser,
  engagementId: string,
): Promise<FinanceSummary | null> {
  assertCan(actor, "contract.view");
  const prisma = getPrisma();
  const engagement = await prisma.engagement.findFirst({
    where: {
      id: engagementId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    select: { id: true, totalCents: true },
  });
  if (!engagement) return null;

  const [billing, receipts] = await Promise.all([
    prisma.billingRequest.groupBy({
      by: ["status"],
      where: {
        organizationId: actor.organizationId,
        engagementId,
        deletedAt: null,
      },
      _count: { _all: true },
    }),
    prisma.receiptEntry.findMany({
      where: {
        organizationId: actor.organizationId,
        engagementId,
        deletedAt: null,
      },
      select: { status: true, amountCents: true },
    }),
  ]);

  const billingOpen = billing
    .filter((row) => row.status === "requested" || row.status === "under_review")
    .reduce((sum, row) => sum + row._count._all, 0);
  const billingProcessed =
    billing.find((row) => row.status === "processed")?._count._all ?? 0;
  const confirmedCents = receipts
    .filter((row) => row.status === "confirmed")
    .reduce((sum, row) => sum + row.amountCents, 0);
  const pendingCents = receipts
    .filter((row) => row.status === "pending")
    .reduce((sum, row) => sum + row.amountCents, 0);

  return {
    contractedCents: engagement.totalCents,
    confirmedCents,
    pendingCents,
    referenceBalanceCents: Math.max(0, engagement.totalCents - confirmedCents),
    billingOpen,
    billingProcessed,
    receiptsPending: receipts.filter((row) => row.status === "pending").length,
    receiptsConfirmed: receipts.filter((row) => row.status === "confirmed")
      .length,
  };
}

export async function listBillingRequestsForEngagement(
  actor: AuthenticatedUser,
  engagementId: string,
) {
  assertCan(actor, "contract.view");
  return getPrisma().billingRequest.findMany({
    where: {
      organizationId: actor.organizationId,
      engagementId,
      deletedAt: null,
    },
    orderBy: { requestedAt: "desc" },
  });
}

export async function listReceiptsForEngagement(
  actor: AuthenticatedUser,
  engagementId: string,
) {
  assertCan(actor, "contract.view");
  return getPrisma().receiptEntry.findMany({
    where: {
      organizationId: actor.organizationId,
      engagementId,
      deletedAt: null,
    },
    orderBy: [{ referenceDate: "desc" }, { createdAt: "desc" }],
  });
}

export async function createBillingRequest(
  actor: AuthenticatedUser,
  raw: CreateBillingRequestInput,
): Promise<ServiceResult<{ id: string }>> {
  assertCan(actor, "contract.manage");
  const parsed = createBillingRequestSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const prisma = getPrisma();
  try {
    const created = await prisma.$transaction(async (tx) => {
      const engagement = await tx.engagement.findFirst({
        where: {
          id: parsed.data.engagementId,
          organizationId: actor.organizationId,
          deletedAt: null,
          status: "active",
        },
      });
      if (!engagement) throw new Error(NOT_FOUND_MESSAGE);

      const id = crypto.randomUUID();
      const now = new Date();
      await tx.billingRequest.create({
        data: {
          id,
          organizationId: actor.organizationId,
          engagementId: engagement.id,
          customerId: engagement.customerId,
          requestType: "invoice_provision",
          description: parsed.data.description,
          notes: parsed.data.notes || null,
          referenceAmountCents: parsed.data.referenceAmountCents ?? null,
          status: "requested",
          requestedById: actor.id,
          requestedAt: now,
          idempotencyKey: parsed.data.idempotencyKey ?? null,
          createdById: actor.id,
          updatedById: actor.id,
        },
      });
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "BILLING_REQUEST_CREATED",
          entityType: "BillingRequest",
          entityId: id,
          metadata: {
            engagementId: engagement.id,
            engagementCode: engagement.code,
            referenceAmountCents: parsed.data.referenceAmountCents ?? null,
          },
        },
        tx,
      );
      return { id };
    });
    return { ok: true, data: created };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail("Esta solicitação já foi registrada (reenvio bloqueado).");
    }
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message.includes("Contratação")
      ) {
        return fail(error.message);
      }
    }
    throw error;
  }
}

export async function processBillingRequest(
  actor: AuthenticatedUser,
  raw: ProcessBillingRequestInput,
): Promise<ServiceResult<{ id: string }>> {
  assertCan(actor, "finance.manage");
  const parsed = processBillingRequestSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  if (
    parsed.data.invoiceIssuedExternally &&
    !parsed.data.externalDocumentRef?.trim()
  ) {
    return fail(
      "Informe a referência do documento emitido externamente quando a nota já foi emitida.",
    );
  }

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.billingRequest.findFirst({
        where: {
          id: parsed.data.billingRequestId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
      });
      if (!current) throw new Error(NOT_FOUND_MESSAGE);
      if (current.status === "cancelled" || current.status === "processed") {
        throw new Error("Solicitação já encerrada.");
      }

      const now = new Date();
      if (parsed.data.markUnderReview && current.status === "requested") {
        await tx.billingRequest.update({
          where: { id: current.id },
          data: {
            status: "under_review",
            notes: parsed.data.notes || current.notes,
            updatedById: actor.id,
          },
        });
        await writeAudit(
          {
            organizationId: actor.organizationId,
            actorUserId: actor.id,
            action: "BILLING_REQUEST_UNDER_REVIEW",
            entityType: "BillingRequest",
            entityId: current.id,
            metadata: { engagementId: current.engagementId },
          },
          tx,
        );
        return { id: current.id };
      }

      await tx.billingRequest.update({
        where: { id: current.id },
        data: {
          status: "processed",
          invoiceIssuedExternally: parsed.data.invoiceIssuedExternally,
          externalDocumentRef: parsed.data.invoiceIssuedExternally
            ? parsed.data.externalDocumentRef?.trim() || null
            : null,
          notes: parsed.data.notes || current.notes,
          processedById: actor.id,
          processedAt: now,
          updatedById: actor.id,
        },
      });
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "BILLING_REQUEST_PROCESSED",
          entityType: "BillingRequest",
          entityId: current.id,
          metadata: {
            engagementId: current.engagementId,
            invoiceIssuedExternally: parsed.data.invoiceIssuedExternally,
            externalDocumentRef: parsed.data.invoiceIssuedExternally
              ? parsed.data.externalDocumentRef?.trim() || null
              : null,
          },
        },
        tx,
      );
      return { id: current.id };
    });
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message.includes("encerrada") ||
        error.message.includes("referência")
      ) {
        return fail(error.message);
      }
    }
    throw error;
  }
}

export async function cancelBillingRequest(
  actor: AuthenticatedUser,
  raw: CancelBillingRequestInput,
): Promise<ServiceResult<{ id: string }>> {
  const canFinance = hasPermission(actor.permissions, "finance.manage");
  const canContract = hasPermission(actor.permissions, "contract.manage");
  if (!canFinance && !canContract) throw new PermissionError(DENIED_MESSAGE);

  const parsed = cancelBillingRequestSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.billingRequest.findFirst({
        where: {
          id: parsed.data.billingRequestId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
      });
      if (!current) throw new Error(NOT_FOUND_MESSAGE);
      if (current.status === "processed") {
        throw new Error(
          "Solicitação já processada. Peça correção ao Financeiro se necessário.",
        );
      }
      if (current.status === "cancelled") {
        throw new Error("Solicitação já cancelada.");
      }
      if (
        !canFinance &&
        current.requestedById !== actor.id &&
        !canContract
      ) {
        throw new PermissionError(DENIED_MESSAGE);
      }

      const now = new Date();
      await tx.billingRequest.update({
        where: { id: current.id },
        data: {
          status: "cancelled",
          cancelledById: actor.id,
          cancelledAt: now,
          cancellationReason: parsed.data.reason,
          updatedById: actor.id,
        },
      });
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "BILLING_REQUEST_CANCELLED",
          entityType: "BillingRequest",
          entityId: current.id,
          metadata: {
            engagementId: current.engagementId,
            reason: parsed.data.reason,
          },
        },
        tx,
      );
      return { id: current.id };
    });
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof PermissionError) return fail(error.message);
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message.includes("processada") ||
        error.message.includes("cancelada")
      ) {
        return fail(error.message);
      }
    }
    throw error;
  }
}

export async function createReceiptEntry(
  actor: AuthenticatedUser,
  raw: CreateReceiptEntryInput,
): Promise<ServiceResult<{ id: string }>> {
  assertCan(actor, "contract.manage");
  const parsed = createReceiptEntrySchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const prisma = getPrisma();
  try {
    const created = await prisma.$transaction(async (tx) => {
      const engagement = await tx.engagement.findFirst({
        where: {
          id: parsed.data.engagementId,
          organizationId: actor.organizationId,
          deletedAt: null,
          status: "active",
        },
      });
      if (!engagement) throw new Error(NOT_FOUND_MESSAGE);

      const allocated = await sumAllocatedCents(
        tx,
        actor.organizationId,
        engagement.id,
        ["pending", "confirmed"],
      );
      if (allocated + parsed.data.amountCents > engagement.totalCents) {
        throw new Error(
          "Valor informado ultrapassa o saldo de referência da contratação.",
        );
      }

      const id = crypto.randomUUID();
      const now = new Date();
      await tx.receiptEntry.create({
        data: {
          id,
          organizationId: actor.organizationId,
          engagementId: engagement.id,
          customerId: engagement.customerId,
          kind: parsed.data.kind,
          amountCents: parsed.data.amountCents,
          referenceDate: parseReferenceDate(parsed.data.referenceDate),
          status: "pending",
          paymentMethod: parsed.data.paymentMethod ?? null,
          proofReference: parsed.data.proofReference || null,
          notes: parsed.data.notes || null,
          requestedById: actor.id,
          requestedAt: now,
          idempotencyKey: parsed.data.idempotencyKey ?? null,
          createdById: actor.id,
          updatedById: actor.id,
        },
      });
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "RECEIPT_REVIEW_REQUESTED",
          entityType: "ReceiptEntry",
          entityId: id,
          metadata: {
            engagementId: engagement.id,
            engagementCode: engagement.code,
            kind: parsed.data.kind,
            amountCents: parsed.data.amountCents,
          },
        },
        tx,
      );
      return { id };
    });
    return { ok: true, data: created };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail("Este recebimento já foi registrado (reenvio bloqueado).");
    }
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message.includes("saldo") ||
        error.message.includes("Data")
      ) {
        return fail(error.message);
      }
    }
    throw error;
  }
}

export async function confirmReceipt(
  actor: AuthenticatedUser,
  raw: ConfirmReceiptInput,
): Promise<ServiceResult<{ id: string }>> {
  assertCan(actor, "finance.manage");
  const parsed = confirmReceiptSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.receiptEntry.findFirst({
        where: {
          id: parsed.data.receiptEntryId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
      });
      if (!current) throw new Error(NOT_FOUND_MESSAGE);
      if (current.status === "confirmed") {
        return { id: current.id, already: true as const };
      }
      if (current.status !== "pending") {
        throw new Error("Somente recebimentos pendentes podem ser confirmados.");
      }

      await lockEngagementFinance(
        tx,
        actor.organizationId,
        current.engagementId,
      );

      const refreshed = await tx.receiptEntry.findFirst({
        where: { id: current.id, deletedAt: null },
      });
      if (!refreshed) throw new Error(NOT_FOUND_MESSAGE);
      if (refreshed.status === "confirmed") {
        return { id: refreshed.id, already: true as const };
      }
      if (refreshed.status !== "pending") {
        throw new Error("Somente recebimentos pendentes podem ser confirmados.");
      }

      const amount =
        parsed.data.confirmedAmountCents ?? refreshed.amountCents;
      if (amount <= 0) throw new Error("Valor confirmado inválido.");

      const engagement = await tx.engagement.findFirst({
        where: {
          id: refreshed.engagementId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
      });
      if (!engagement) throw new Error(NOT_FOUND_MESSAGE);

      const confirmed = await sumAllocatedCents(
        tx,
        actor.organizationId,
        engagement.id,
        ["confirmed"],
        refreshed.id,
      );
      if (confirmed + amount > engagement.totalCents) {
        throw new Error(
          "Confirmação ultrapassa o saldo de referência da contratação.",
        );
      }

      const now = new Date();
      await tx.receiptEntry.update({
        where: { id: refreshed.id },
        data: {
          status: "confirmed",
          amountCents: amount,
          confirmedById: actor.id,
          confirmedAt: now,
          confirmedManually: true,
          updatedById: actor.id,
        },
      });
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "RECEIPT_CONFIRMED",
          entityType: "ReceiptEntry",
          entityId: refreshed.id,
          metadata: {
            engagementId: engagement.id,
            amountCents: amount,
            confirmedManually: true,
            note: "Registrado pelo Financeiro — não é conciliação bancária automática.",
          },
        },
        tx,
      );
      return { id: refreshed.id, already: false as const };
    });
    return { ok: true, data: { id: result.id } };
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message.includes("pendentes") ||
        error.message.includes("saldo") ||
        error.message.includes("inválido")
      ) {
        return fail(error.message);
      }
    }
    throw error;
  }
}

export async function rejectReceipt(
  actor: AuthenticatedUser,
  raw: RejectReceiptInput,
): Promise<ServiceResult<{ id: string }>> {
  assertCan(actor, "finance.manage");
  const parsed = rejectReceiptSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.receiptEntry.findFirst({
        where: {
          id: parsed.data.receiptEntryId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
      });
      if (!current) throw new Error(NOT_FOUND_MESSAGE);
      if (current.status !== "pending") {
        throw new Error("Somente recebimentos pendentes podem ser rejeitados.");
      }
      const now = new Date();
      await tx.receiptEntry.update({
        where: { id: current.id },
        data: {
          status: "rejected",
          rejectedById: actor.id,
          rejectedAt: now,
          rejectionReason: parsed.data.reason,
          updatedById: actor.id,
        },
      });
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "RECEIPT_REJECTED",
          entityType: "ReceiptEntry",
          entityId: current.id,
          metadata: {
            engagementId: current.engagementId,
            reason: parsed.data.reason,
          },
        },
        tx,
      );
      return { id: current.id };
    });
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message.includes("pendentes")
      ) {
        return fail(error.message);
      }
    }
    throw error;
  }
}

export async function cancelReceipt(
  actor: AuthenticatedUser,
  raw: CancelReceiptInput,
): Promise<ServiceResult<{ id: string }>> {
  const canFinance = hasPermission(actor.permissions, "finance.manage");
  const canContract = hasPermission(actor.permissions, "contract.manage");
  if (!canFinance && !canContract) throw new PermissionError(DENIED_MESSAGE);

  const parsed = cancelReceiptSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.receiptEntry.findFirst({
        where: {
          id: parsed.data.receiptEntryId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
      });
      if (!current) throw new Error(NOT_FOUND_MESSAGE);
      if (current.status !== "pending") {
        throw new Error(
          "Somente lançamentos pendentes podem ser cancelados. Use reversão para confirmados.",
        );
      }
      if (!canFinance && current.requestedById !== actor.id) {
        throw new PermissionError(DENIED_MESSAGE);
      }
      const now = new Date();
      await tx.receiptEntry.update({
        where: { id: current.id },
        data: {
          status: "cancelled",
          cancelledById: actor.id,
          cancelledAt: now,
          cancellationReason: parsed.data.reason,
          updatedById: actor.id,
        },
      });
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "RECEIPT_CANCELLED",
          entityType: "ReceiptEntry",
          entityId: current.id,
          metadata: {
            engagementId: current.engagementId,
            reason: parsed.data.reason,
          },
        },
        tx,
      );
      return { id: current.id };
    });
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof PermissionError) return fail(error.message);
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message.includes("pendentes") ||
        error.message.includes("reversão")
      ) {
        return fail(error.message);
      }
    }
    throw error;
  }
}

export async function reverseReceipt(
  actor: AuthenticatedUser,
  raw: ReverseReceiptInput,
): Promise<ServiceResult<{ id: string }>> {
  assertCan(actor, "finance.manage");
  const parsed = reverseReceiptSchema.safeParse(raw);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.receiptEntry.findFirst({
        where: {
          id: parsed.data.receiptEntryId,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
      });
      if (!current) throw new Error(NOT_FOUND_MESSAGE);
      if (current.status !== "confirmed") {
        throw new Error("Somente recebimentos confirmados podem ser revertidos.");
      }
      await lockEngagementFinance(
        tx,
        actor.organizationId,
        current.engagementId,
      );
      const refreshed = await tx.receiptEntry.findFirst({
        where: { id: current.id, deletedAt: null },
      });
      if (!refreshed || refreshed.status !== "confirmed") {
        throw new Error("Somente recebimentos confirmados podem ser revertidos.");
      }
      const now = new Date();
      await tx.receiptEntry.update({
        where: { id: refreshed.id },
        data: {
          status: "reversed",
          reversedById: actor.id,
          reversedAt: now,
          reversalReason: parsed.data.reason,
          updatedById: actor.id,
        },
      });
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "RECEIPT_REVERSED",
          entityType: "ReceiptEntry",
          entityId: refreshed.id,
          metadata: {
            engagementId: refreshed.engagementId,
            amountCents: refreshed.amountCents,
            reason: parsed.data.reason,
          },
        },
        tx,
      );
      return { id: refreshed.id };
    });
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message.includes("confirmados")
      ) {
        return fail(error.message);
      }
    }
    throw error;
  }
}

export type FinanceDashboardFilter = {
  from?: Date;
  to?: Date;
  customerId?: string;
  engagementId?: string;
  billingStatus?: string;
  receiptStatus?: string;
  receiptKind?: string;
};

export async function getFinanceDashboard(
  actor: AuthenticatedUser,
  filter: FinanceDashboardFilter = {},
) {
  assertCan(actor, "finance.view");
  const prisma = getPrisma();
  const org = actor.organizationId;

  const billingWhere: Prisma.BillingRequestWhereInput = {
    organizationId: org,
    deletedAt: null,
    ...(filter.customerId ? { customerId: filter.customerId } : {}),
    ...(filter.engagementId ? { engagementId: filter.engagementId } : {}),
    ...(filter.billingStatus
      ? {
          status: filter.billingStatus as
            | "requested"
            | "under_review"
            | "processed"
            | "cancelled",
        }
      : {}),
    ...(filter.from || filter.to
      ? {
          requestedAt: {
            ...(filter.from ? { gte: filter.from } : {}),
            ...(filter.to ? { lt: filter.to } : {}),
          },
        }
      : {}),
  };

  const receiptWhere: Prisma.ReceiptEntryWhereInput = {
    organizationId: org,
    deletedAt: null,
    ...(filter.customerId ? { customerId: filter.customerId } : {}),
    ...(filter.engagementId ? { engagementId: filter.engagementId } : {}),
    ...(filter.receiptStatus
      ? {
          status: filter.receiptStatus as
            | "pending"
            | "confirmed"
            | "rejected"
            | "cancelled"
            | "reversed",
        }
      : {}),
    ...(filter.receiptKind
      ? {
          kind: filter.receiptKind as "signal" | "installment" | "other",
        }
      : {}),
    ...(filter.from || filter.to
      ? {
          referenceDate: {
            ...(filter.from ? { gte: filter.from } : {}),
            ...(filter.to ? { lt: filter.to } : {}),
          },
        }
      : {}),
  };

  const [billingRequests, receipts] = await Promise.all([
    prisma.billingRequest.findMany({
      where: billingWhere,
      include: {
        engagement: { select: { id: true, code: true, title: true } },
        customer: { select: { id: true, legalName: true } },
      },
      orderBy: { requestedAt: "desc" },
      take: 200,
    }),
    prisma.receiptEntry.findMany({
      where: receiptWhere,
      include: {
        engagement: { select: { id: true, code: true, title: true } },
        customer: { select: { id: true, legalName: true } },
      },
      orderBy: [{ referenceDate: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
  ]);

  const pendingBilling = billingRequests.filter(
    (row) => row.status === "requested" || row.status === "under_review",
  ).length;
  const processedBilling = billingRequests.filter(
    (row) => row.status === "processed",
  ).length;
  const pendingReceipts = receipts.filter((row) => row.status === "pending");
  const confirmedReceipts = receipts.filter((row) => row.status === "confirmed");

  return {
    indicators: {
      pendingBilling,
      processedBilling,
      pendingReceipts: pendingReceipts.length,
      pendingReceiptsCents: pendingReceipts.reduce(
        (sum, row) => sum + row.amountCents,
        0,
      ),
      confirmedCents: confirmedReceipts.reduce(
        (sum, row) => sum + row.amountCents,
        0,
      ),
    },
    billingRequests,
    receipts,
  };
}
