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

const IDEMPOTENCY_CONFLICT_MESSAGE =
  "Chave de idempotência reutilizada com conteúdo diferente.";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function billingIntentMatches(
  existing: {
    engagementId: string;
    description: string;
    notes: string | null;
    referenceAmountCents: number | null;
  },
  input: {
    engagementId: string;
    description: string;
    notes?: string;
    referenceAmountCents?: number | null;
  },
): boolean {
  return (
    existing.engagementId === input.engagementId &&
    existing.description === input.description &&
    normalizeOptionalText(existing.notes) ===
      normalizeOptionalText(input.notes) &&
    (existing.referenceAmountCents ?? null) ===
      (input.referenceAmountCents ?? null)
  );
}

function receiptIntentMatches(
  existing: {
    engagementId: string;
    kind: string;
    requestedAmountCents: number;
    referenceDate: Date;
    paymentMethod: string | null;
    proofReference: string | null;
    notes: string | null;
  },
  input: {
    engagementId: string;
    kind: string;
    amountCents: number;
    paymentMethod?: string | null;
    proofReference?: string;
    notes?: string;
  },
  referenceDate: Date,
): boolean {
  return (
    existing.engagementId === input.engagementId &&
    existing.kind === input.kind &&
    existing.requestedAmountCents === input.amountCents &&
    existing.referenceDate.getTime() === referenceDate.getTime() &&
    (existing.paymentMethod ?? null) === (input.paymentMethod ?? null) &&
    normalizeOptionalText(existing.proofReference) ===
      normalizeOptionalText(input.proofReference) &&
    normalizeOptionalText(existing.notes) ===
      normalizeOptionalText(input.notes)
  );
}

/** Valida calendário real (rejeita 2026-02-31 etc.). */
export function isValidCalendarDate(dateOnly: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return false;
  const [year, month, day] = dateOnly.split("-").map(Number);
  if (!year || !month || !day) return false;
  const dt = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

function parseReferenceDate(dateOnly: string): Date {
  if (!isValidCalendarDate(dateOnly)) {
    throw new Error("Data de referência inválida.");
  }
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!, 12, 0, 0));
}

/** Limites de dia civil em America/Belem (UTC−3 fixo). `end` = exclusivo (início do dia seguinte). */
export function parseBelemDayBound(
  dateOnly: string,
  end: boolean,
): Date | undefined {
  if (!isValidCalendarDate(dateOnly)) return undefined;
  const [y, m, d] = dateOnly.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  // 00:00 Belem = 03:00 UTC
  const startUtcMs = Date.UTC(y, m - 1, d, 3, 0, 0);
  if (!end) return new Date(startUtcMs);
  return new Date(Date.UTC(y, m - 1, d + 1, 3, 0, 0));
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

      await lockEngagementFinance(
        tx,
        actor.organizationId,
        engagement.id,
      );

      if (parsed.data.idempotencyKey) {
        const existing = await tx.billingRequest.findFirst({
          where: {
            organizationId: actor.organizationId,
            idempotencyKey: parsed.data.idempotencyKey,
            deletedAt: null,
          },
          select: {
            id: true,
            engagementId: true,
            description: true,
            notes: true,
            referenceAmountCents: true,
          },
        });
        if (existing) {
          if (!billingIntentMatches(existing, parsed.data)) {
            throw new Error(IDEMPOTENCY_CONFLICT_MESSAGE);
          }
          return { id: existing.id, replay: true as const };
        }
      }

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
      return { id, replay: false as const };
    });
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    if (isUniqueViolation(error)) {
      if (parsed.data.idempotencyKey) {
        const existing = await prisma.billingRequest.findFirst({
          where: {
            organizationId: actor.organizationId,
            idempotencyKey: parsed.data.idempotencyKey,
            deletedAt: null,
          },
          select: {
            id: true,
            engagementId: true,
            description: true,
            notes: true,
            referenceAmountCents: true,
          },
        });
        if (existing) {
          if (!billingIntentMatches(existing, parsed.data)) {
            return fail(IDEMPOTENCY_CONFLICT_MESSAGE);
          }
          return { ok: true, data: { id: existing.id } };
        }
      }
      return fail("Esta solicitação já foi registrada (reenvio bloqueado).");
    }
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message === IDEMPOTENCY_CONFLICT_MESSAGE ||
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

      await lockEngagementFinance(
        tx,
        actor.organizationId,
        current.engagementId,
      );

      const refreshed = await tx.billingRequest.findFirst({
        where: {
          id: current.id,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
      });
      if (!refreshed) throw new Error(NOT_FOUND_MESSAGE);
      if (refreshed.status === "cancelled" || refreshed.status === "processed") {
        throw new Error("Solicitação já encerrada.");
      }

      const now = new Date();
      if (parsed.data.markUnderReview && refreshed.status === "requested") {
        const moved = await tx.billingRequest.updateMany({
          where: {
            id: refreshed.id,
            organizationId: actor.organizationId,
            status: "requested",
            deletedAt: null,
          },
          data: {
            status: "under_review",
            notes: parsed.data.notes || refreshed.notes,
            updatedById: actor.id,
          },
        });
        if (moved.count !== 1) {
          throw new Error("Solicitação já encerrada.");
        }
        await writeAudit(
          {
            organizationId: actor.organizationId,
            actorUserId: actor.id,
            action: "BILLING_REQUEST_UNDER_REVIEW",
            entityType: "BillingRequest",
            entityId: refreshed.id,
            metadata: { engagementId: refreshed.engagementId },
          },
          tx,
        );
        return { id: refreshed.id };
      }

      const processed = await tx.billingRequest.updateMany({
        where: {
          id: refreshed.id,
          organizationId: actor.organizationId,
          status: { in: ["requested", "under_review"] },
          deletedAt: null,
        },
        data: {
          status: "processed",
          invoiceIssuedExternally: parsed.data.invoiceIssuedExternally,
          externalDocumentRef: parsed.data.invoiceIssuedExternally
            ? parsed.data.externalDocumentRef?.trim() || null
            : null,
          notes: parsed.data.notes || refreshed.notes,
          processedById: actor.id,
          processedAt: now,
          updatedById: actor.id,
        },
      });
      if (processed.count !== 1) {
        throw new Error("Solicitação já encerrada.");
      }
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "BILLING_REQUEST_PROCESSED",
          entityType: "BillingRequest",
          entityId: refreshed.id,
          metadata: {
            engagementId: refreshed.engagementId,
            invoiceIssuedExternally: parsed.data.invoiceIssuedExternally,
            externalDocumentRef: parsed.data.invoiceIssuedExternally
              ? parsed.data.externalDocumentRef?.trim() || null
              : null,
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

      await lockEngagementFinance(
        tx,
        actor.organizationId,
        current.engagementId,
      );

      const refreshed = await tx.billingRequest.findFirst({
        where: {
          id: current.id,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
      });
      if (!refreshed) throw new Error(NOT_FOUND_MESSAGE);
      if (refreshed.status === "processed") {
        throw new Error(
          "Solicitação já processada. Peça correção ao Financeiro se necessário.",
        );
      }
      if (refreshed.status === "cancelled") {
        throw new Error("Solicitação já cancelada.");
      }
      // finance.manage: qualquer pendente da org.
      // contract.manage: somente a própria solicitação.
      if (!canFinance) {
        if (!canContract || refreshed.requestedById !== actor.id) {
          throw new PermissionError(DENIED_MESSAGE);
        }
      }

      const now = new Date();
      const cancelled = await tx.billingRequest.updateMany({
        where: {
          id: refreshed.id,
          organizationId: actor.organizationId,
          status: { in: ["requested", "under_review"] },
          deletedAt: null,
        },
        data: {
          status: "cancelled",
          cancelledById: actor.id,
          cancelledAt: now,
          cancellationReason: parsed.data.reason,
          updatedById: actor.id,
        },
      });
      if (cancelled.count !== 1) {
        throw new Error("Solicitação já encerrada.");
      }
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "BILLING_REQUEST_CANCELLED",
          entityType: "BillingRequest",
          entityId: refreshed.id,
          metadata: {
            engagementId: refreshed.engagementId,
            reason: parsed.data.reason,
          },
        },
        tx,
      );
      return { id: refreshed.id };
    });
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof PermissionError) return fail(error.message);
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message.includes("processada") ||
        error.message.includes("cancelada") ||
        error.message.includes("encerrada")
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

      await lockEngagementFinance(
        tx,
        actor.organizationId,
        engagement.id,
      );

      const referenceDate = parseReferenceDate(parsed.data.referenceDate);

      if (parsed.data.idempotencyKey) {
        const existing = await tx.receiptEntry.findFirst({
          where: {
            organizationId: actor.organizationId,
            idempotencyKey: parsed.data.idempotencyKey,
            deletedAt: null,
          },
          select: {
            id: true,
            engagementId: true,
            kind: true,
            requestedAmountCents: true,
            referenceDate: true,
            paymentMethod: true,
            proofReference: true,
            notes: true,
          },
        });
        if (existing) {
          if (!receiptIntentMatches(existing, parsed.data, referenceDate)) {
            throw new Error(IDEMPOTENCY_CONFLICT_MESSAGE);
          }
          return { id: existing.id, replay: true as const };
        }
      }

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
          requestedAmountCents: parsed.data.amountCents,
          referenceDate,
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
            requestedAmountCents: parsed.data.amountCents,
          },
        },
        tx,
      );
      return { id, replay: false as const };
    });
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    if (isUniqueViolation(error)) {
      if (parsed.data.idempotencyKey) {
        const referenceDate = parseReferenceDate(parsed.data.referenceDate);
        const existing = await prisma.receiptEntry.findFirst({
          where: {
            organizationId: actor.organizationId,
            idempotencyKey: parsed.data.idempotencyKey,
            deletedAt: null,
          },
          select: {
            id: true,
            engagementId: true,
            kind: true,
            requestedAmountCents: true,
            referenceDate: true,
            paymentMethod: true,
            proofReference: true,
            notes: true,
          },
        });
        if (existing) {
          if (!receiptIntentMatches(existing, parsed.data, referenceDate)) {
            return fail(IDEMPOTENCY_CONFLICT_MESSAGE);
          }
          return { ok: true, data: { id: existing.id } };
        }
      }
      return fail("Este recebimento já foi registrado (reenvio bloqueado).");
    }
    if (error instanceof Error) {
      if (
        error.message === NOT_FOUND_MESSAGE ||
        error.message === IDEMPOTENCY_CONFLICT_MESSAGE ||
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

  if (parsed.data.confirmedAmountCents == null) {
    return fail("Informe o valor efetivamente confirmado em centavos.");
  }

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

      await lockEngagementFinance(
        tx,
        actor.organizationId,
        current.engagementId,
      );

      const refreshed = await tx.receiptEntry.findFirst({
        where: {
          id: current.id,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
      });
      if (!refreshed) throw new Error(NOT_FOUND_MESSAGE);
      if (refreshed.status === "confirmed") {
        return { id: refreshed.id, already: true as const };
      }
      if (refreshed.status !== "pending") {
        throw new Error("Somente recebimentos pendentes podem ser confirmados.");
      }

      const amount = parsed.data.confirmedAmountCents!;
      if (amount <= 0) throw new Error("Valor confirmado inválido.");
      if (amount > refreshed.requestedAmountCents) {
        throw new Error(
          "Valor confirmado não pode superar o valor informado pelo Comercial.",
        );
      }

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
      const updated = await tx.receiptEntry.updateMany({
        where: {
          id: refreshed.id,
          organizationId: actor.organizationId,
          status: "pending",
          deletedAt: null,
        },
        data: {
          status: "confirmed",
          amountCents: amount,
          confirmedById: actor.id,
          confirmedAt: now,
          confirmedManually: true,
          updatedById: actor.id,
        },
      });
      if (updated.count !== 1) {
        throw new Error("Somente recebimentos pendentes podem ser confirmados.");
      }
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "RECEIPT_CONFIRMED",
          entityType: "ReceiptEntry",
          entityId: refreshed.id,
          metadata: {
            engagementId: engagement.id,
            requestedAmountCents: refreshed.requestedAmountCents,
            confirmedAmountCents: amount,
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
        error.message.includes("inválido") ||
        error.message.includes("superar")
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

      await lockEngagementFinance(
        tx,
        actor.organizationId,
        current.engagementId,
      );

      const now = new Date();
      const rejected = await tx.receiptEntry.updateMany({
        where: {
          id: current.id,
          organizationId: actor.organizationId,
          status: "pending",
          deletedAt: null,
        },
        data: {
          status: "rejected",
          rejectedById: actor.id,
          rejectedAt: now,
          rejectionReason: parsed.data.reason,
          updatedById: actor.id,
        },
      });
      if (rejected.count !== 1) {
        throw new Error("Somente recebimentos pendentes podem ser rejeitados.");
      }
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

      await lockEngagementFinance(
        tx,
        actor.organizationId,
        current.engagementId,
      );

      const refreshed = await tx.receiptEntry.findFirst({
        where: {
          id: current.id,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
      });
      if (!refreshed) throw new Error(NOT_FOUND_MESSAGE);
      if (refreshed.status !== "pending") {
        throw new Error(
          "Somente lançamentos pendentes podem ser cancelados. Use reversão para confirmados.",
        );
      }
      if (!canFinance && refreshed.requestedById !== actor.id) {
        throw new PermissionError(DENIED_MESSAGE);
      }
      const now = new Date();
      const cancelled = await tx.receiptEntry.updateMany({
        where: {
          id: refreshed.id,
          organizationId: actor.organizationId,
          status: "pending",
          deletedAt: null,
        },
        data: {
          status: "cancelled",
          cancelledById: actor.id,
          cancelledAt: now,
          cancellationReason: parsed.data.reason,
          updatedById: actor.id,
        },
      });
      if (cancelled.count !== 1) {
        throw new Error(
          "Somente lançamentos pendentes podem ser cancelados. Use reversão para confirmados.",
        );
      }
      await writeAudit(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.id,
          action: "RECEIPT_CANCELLED",
          entityType: "ReceiptEntry",
          entityId: refreshed.id,
          metadata: {
            engagementId: refreshed.engagementId,
            reason: parsed.data.reason,
          },
        },
        tx,
      );
      return { id: refreshed.id };
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

      await lockEngagementFinance(
        tx,
        actor.organizationId,
        current.engagementId,
      );
      const refreshed = await tx.receiptEntry.findFirst({
        where: {
          id: current.id,
          organizationId: actor.organizationId,
          deletedAt: null,
        },
      });
      if (!refreshed || refreshed.status !== "confirmed") {
        throw new Error("Somente recebimentos confirmados podem ser revertidos.");
      }
      const now = new Date();
      const reversed = await tx.receiptEntry.updateMany({
        where: {
          id: refreshed.id,
          organizationId: actor.organizationId,
          status: "confirmed",
          deletedAt: null,
        },
        data: {
          status: "reversed",
          reversedById: actor.id,
          reversedAt: now,
          reversalReason: parsed.data.reason,
          updatedById: actor.id,
        },
      });
      if (reversed.count !== 1) {
        throw new Error("Somente recebimentos confirmados podem ser revertidos.");
      }
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
            requestedAmountCents: refreshed.requestedAmountCents,
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

  const billingBase: Prisma.BillingRequestWhereInput = {
    organizationId: org,
    deletedAt: null,
    ...(filter.customerId ? { customerId: filter.customerId } : {}),
    ...(filter.engagementId ? { engagementId: filter.engagementId } : {}),
    ...(filter.from || filter.to
      ? {
          requestedAt: {
            ...(filter.from ? { gte: filter.from } : {}),
            ...(filter.to ? { lt: filter.to } : {}),
          },
        }
      : {}),
  };

  const billingListWhere: Prisma.BillingRequestWhereInput = {
    ...billingBase,
    ...(filter.billingStatus
      ? {
          status: filter.billingStatus as
            | "requested"
            | "under_review"
            | "processed"
            | "cancelled",
        }
      : {}),
  };

  const receiptScope: Prisma.ReceiptEntryWhereInput = {
    organizationId: org,
    deletedAt: null,
    ...(filter.customerId ? { customerId: filter.customerId } : {}),
    ...(filter.engagementId ? { engagementId: filter.engagementId } : {}),
    ...(filter.receiptKind
      ? {
          kind: filter.receiptKind as "signal" | "installment" | "other",
        }
      : {}),
  };

  // Pendentes: filtro temporal por referenceDate (data declarada pelo Comercial).
  const pendingWhere: Prisma.ReceiptEntryWhereInput = {
    ...receiptScope,
    status: "pending",
    ...(filter.from || filter.to
      ? {
          referenceDate: {
            ...(filter.from ? { gte: filter.from } : {}),
            ...(filter.to ? { lt: filter.to } : {}),
          },
        }
      : {}),
  };

  // Confirmados: filtro temporal por confirmedAt (quando o Financeiro registrou).
  const confirmedWhere: Prisma.ReceiptEntryWhereInput = {
    ...receiptScope,
    status: "confirmed",
    ...(filter.from || filter.to
      ? {
          confirmedAt: {
            ...(filter.from ? { gte: filter.from } : {}),
            ...(filter.to ? { lt: filter.to } : {}),
          },
        }
      : {}),
  };

  const periodRange =
    filter.from || filter.to
      ? {
          ...(filter.from ? { gte: filter.from } : {}),
          ...(filter.to ? { lt: filter.to } : {}),
        }
      : null;

  const receiptListWhere: Prisma.ReceiptEntryWhereInput = (() => {
    if (!filter.receiptStatus) {
      if (!periodRange) return receiptScope;
      // Mistura de estados: cada status usa sua data semântica (não ocultar
      // confirmações do indicador que usam confirmedAt).
      return {
        ...receiptScope,
        OR: [
          { status: "pending", referenceDate: periodRange },
          { status: "confirmed", confirmedAt: periodRange },
          {
            status: { in: ["rejected", "cancelled"] },
            referenceDate: periodRange,
          },
          { status: "reversed", confirmedAt: periodRange },
        ],
      };
    }
    const status = filter.receiptStatus as
      | "pending"
      | "confirmed"
      | "rejected"
      | "cancelled"
      | "reversed";
    if (!periodRange) {
      return { ...receiptScope, status };
    }
    if (status === "confirmed" || status === "reversed") {
      return { ...receiptScope, status, confirmedAt: periodRange };
    }
    return { ...receiptScope, status, referenceDate: periodRange };
  })();

  const [
    pendingBilling,
    processedBilling,
    pendingAgg,
    confirmedAgg,
    billingRequests,
    receipts,
  ] = await Promise.all([
    prisma.billingRequest.count({
      where: {
        ...billingBase,
        status: { in: ["requested", "under_review"] },
      },
    }),
    prisma.billingRequest.count({
      where: {
        ...billingBase,
        status: "processed",
      },
    }),
    prisma.receiptEntry.aggregate({
      where: pendingWhere,
      _count: { _all: true },
      _sum: { amountCents: true },
    }),
    prisma.receiptEntry.aggregate({
      where: confirmedWhere,
      _count: { _all: true },
      _sum: { amountCents: true },
    }),
    prisma.billingRequest.findMany({
      where: billingListWhere,
      include: {
        engagement: { select: { id: true, code: true, title: true } },
        customer: { select: { id: true, legalName: true } },
      },
      orderBy: { requestedAt: "desc" },
      take: 200,
    }),
    prisma.receiptEntry.findMany({
      where: receiptListWhere,
      include: {
        engagement: { select: { id: true, code: true, title: true } },
        customer: { select: { id: true, legalName: true } },
      },
      orderBy: [{ referenceDate: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
  ]);

  return {
    indicators: {
      pendingBilling,
      processedBilling,
      pendingReceipts: pendingAgg._count._all,
      pendingReceiptsCents: pendingAgg._sum.amountCents ?? 0,
      confirmedCents: confirmedAgg._sum.amountCents ?? 0,
      confirmedReceipts: confirmedAgg._count._all,
      /** Indicadores usam agregação completa; listas abaixo podem estar limitadas. */
      listsLimitedTo: 200 as const,
      pendingUsesReferenceDate: true as const,
      confirmedUsesConfirmedAt: true as const,
    },
    billingRequests,
    receipts,
  };
}
