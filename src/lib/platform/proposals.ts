import type { Prisma } from "@/generated/prisma/client";
import type { AuthenticatedUser } from "@/lib/platform/access";
import { writeAudit } from "@/lib/platform/audit";
import { businessYear, endOfBusinessDay } from "@/lib/platform/dates";
import { computeProposalTotals, lineTotalCents } from "@/lib/platform/money";
import { PermissionError } from "@/lib/platform/permission-error";
import { hasPermission } from "@/lib/platform/permissions";
import {
  proposalInputSchema,
  rejectionSchema,
  type ProposalInput,
} from "@/lib/platform/proposal-schemas";
import {
  canRevise,
  checkTransition,
  isEditable,
  isProposalStatus,
  permissionForTransition,
  type ProposalStatusValue,
} from "@/lib/platform/proposal-state";
import {
  buildProposalSummary,
  type ProposalStatusGroup,
  type ProposalSummary,
} from "@/lib/platform/proposal-summary";
import {
  DENIED_MESSAGE,
  NOT_FOUND_MESSAGE,
  denyWithout,
  fail,
  type ServiceResult,
} from "@/lib/platform/service-result";
import { getPrisma } from "@/lib/db/prisma";

const FIRST_ISSUE = (issues: { message: string }[]) =>
  issues[0]?.message ?? "Revise os dados.";
const PROPOSAL_SEQUENCE_KEY = "proposal";

function assertCan(
  actor: Pick<AuthenticatedUser, "permissions">,
  permission: string,
): void {
  if (!hasPermission(actor.permissions, permission))
    throw new PermissionError(DENIED_MESSAGE);
}

export function formatProposalCode(year: number, sequence: number): string {
  return `ORC-${year}-${String(sequence).padStart(4, "0")}`;
}

async function nextProposalCode(
  tx: Prisma.TransactionClient,
  organizationId: string,
  now: Date,
): Promise<string> {
  const year = businessYear(now);
  const sequence = await tx.documentSequence.upsert({
    where: {
      organizationId_key_year: {
        organizationId,
        key: PROPOSAL_SEQUENCE_KEY,
        year,
      },
    },
    update: { lastValue: { increment: 1 } },
    create: {
      id: crypto.randomUUID(),
      organizationId,
      key: PROPOSAL_SEQUENCE_KEY,
      year,
      lastValue: 1,
    },
    select: { lastValue: true },
  });
  return formatProposalCode(year, sequence.lastValue);
}

/* ------------------------------------------------------------------ leitura */

export type ProposalListFilter = {
  status?: string;
  customerId?: string;
  query?: string;
};

export async function listProposals(
  actor: AuthenticatedUser,
  filter: ProposalListFilter = {},
) {
  assertCan(actor, "proposal.view");
  const query = filter.query?.trim();
  return getPrisma().proposal.findMany({
    where: {
      organizationId: actor.organizationId,
      deletedAt: null,
      ...(filter.status && isProposalStatus(filter.status)
        ? { status: filter.status }
        : {}),
      ...(filter.customerId ? { customerId: filter.customerId } : {}),
      ...(query
        ? {
            OR: [
              { code: { contains: query, mode: "insensitive" as const } },
              { title: { contains: query, mode: "insensitive" as const } },
              {
                customer: {
                  legalName: { contains: query, mode: "insensitive" as const },
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
    },
  });
}

export async function getProposalDetail(
  actor: AuthenticatedUser,
  proposalId: string,
) {
  assertCan(actor, "proposal.view");
  return getPrisma().proposal.findFirst({
    where: {
      id: proposalId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    include: {
      items: { orderBy: { position: "asc" } },
      customer: {
        select: { id: true, legalName: true, tradeName: true, deletedAt: true },
      },
      customerUnit: { select: { id: true, name: true } },
      supersedes: { select: { id: true, code: true } },
      successors: {
        where: { deletedAt: null },
        select: { id: true, code: true, status: true },
        orderBy: { createdAt: "asc" },
      },
      engagement: {
        select: { id: true, code: true, status: true, deletedAt: true },
      },
    },
  });
}

/** Trilha de auditoria da proposta. Só quem tem `audit.view`. */
export async function getProposalHistory(
  actor: AuthenticatedUser,
  proposalId: string,
) {
  assertCan(actor, "audit.view");
  return getPrisma().auditLog.findMany({
    where: {
      organizationId: actor.organizationId,
      entityType: "Proposal",
      entityId: proposalId,
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

/** Painel do `/sistema`. Lê do banco, nunca do demo. */
export async function getProposalSummary(
  actor: AuthenticatedUser,
  now: Date = new Date(),
): Promise<ProposalSummary> {
  assertCan(actor, "proposal.view");
  const prisma = getPrisma();
  const [groups, sentPastValidity] = await Promise.all([
    prisma.proposal.groupBy({
      by: ["status"],
      where: { organizationId: actor.organizationId, deletedAt: null },
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
    prisma.proposal.count({
      where: {
        organizationId: actor.organizationId,
        deletedAt: null,
        status: "sent",
        validUntil: { lt: now },
      },
    }),
  ]);

  const normalized: ProposalStatusGroup[] = groups.map((group) => ({
    status: group.status,
    count: group._count._all,
    totalCents: group._sum.totalCents ?? 0,
  }));
  return buildProposalSummary(normalized, sentPastValidity);
}

/* ------------------------------------------------------------------ escrita */

type ValidatedProposal = {
  data: ReturnType<typeof proposalInputSchema.parse>;
  validUntil: Date | null;
  totalCents: number;
  discountCents: number;
};

function validateProposalInput(
  input: ProposalInput,
): { ok: true; value: ValidatedProposal } | { ok: false; message: string } {
  const parsed = proposalInputSchema.safeParse(input);
  if (!parsed.success) return fail(FIRST_ISSUE(parsed.error.issues));

  const totals = computeProposalTotals(
    parsed.data.items,
    parsed.data.discountCents,
  );
  if (!totals.ok) {
    return fail(
      totals.reason === "overflow"
        ? "O valor total excede o limite permitido."
        : "O desconto não pode ser maior que o subtotal.",
    );
  }

  const validUntil = parsed.data.validUntil
    ? endOfBusinessDay(parsed.data.validUntil)
    : null;
  return {
    ok: true,
    value: {
      data: parsed.data,
      validUntil,
      totalCents: totals.totalCents,
      discountCents: totals.discountCents,
    },
  };
}

/** Cliente ativo da organização e, se informada, unidade ativa do mesmo cliente. */
async function checkCustomerScope(
  actor: AuthenticatedUser,
  customerId: string,
  customerUnitId: string | undefined,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const prisma = getPrisma();
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!customer) return fail("Cliente não encontrado ou arquivado.");

  if (customerUnitId) {
    const unit = await prisma.customerUnit.findFirst({
      where: {
        id: customerUnitId,
        customerId,
        organizationId: actor.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!unit) return fail("A unidade não pertence a este cliente.");
  }
  return { ok: true };
}

function itemRows(
  organizationId: string,
  proposalId: string,
  items: ValidatedProposal["data"]["items"],
): Prisma.ProposalItemCreateManyInput[] {
  return items.map((item, index) => ({
    id: crypto.randomUUID(),
    organizationId,
    proposalId,
    position: index + 1,
    description: item.description,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    totalCents: lineTotalCents(item.quantity, item.unitPriceCents),
  }));
}

export async function createProposal(
  actor: AuthenticatedUser,
  input: ProposalInput,
  now: Date = new Date(),
): Promise<ServiceResult<{ id: string; code: string }>> {
  const denied = denyWithout(actor, "proposal.create");
  if (denied) return denied;

  const validated = validateProposalInput(input);
  if (!validated.ok) return validated;
  const { data, validUntil, totalCents, discountCents } = validated.value;

  const scope = await checkCustomerScope(
    actor,
    data.customerId,
    data.customerUnitId,
  );
  if (!scope.ok) return scope;

  const id = crypto.randomUUID();
  const code = await getPrisma().$transaction(async (tx) => {
    const nextCode = await nextProposalCode(tx, actor.organizationId, now);
    await tx.proposal.create({
      data: {
        id,
        organizationId: actor.organizationId,
        code: nextCode,
        customerId: data.customerId,
        customerUnitId: data.customerUnitId,
        title: data.title,
        status: "draft",
        validUntil,
        paymentTerms: data.paymentTerms,
        commercialConditions: data.commercialConditions,
        observations: data.observations,
        discountCents,
        totalCents,
        createdById: actor.id,
        updatedById: actor.id,
      },
    });
    await tx.proposalItem.createMany({
      data: itemRows(actor.organizationId, id, data.items),
    });
    await writeAudit(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "PROPOSAL_CREATED",
        entityType: "Proposal",
        entityId: id,
        metadata: { code: nextCode, customerId: data.customerId, totalCents },
      },
      tx,
    );
    return nextCode;
  });

  return { ok: true, data: { id, code } };
}

export async function updateProposal(
  actor: AuthenticatedUser,
  proposalId: string,
  input: ProposalInput,
): Promise<ServiceResult> {
  const denied = denyWithout(actor, "proposal.update");
  if (denied) return denied;

  const validated = validateProposalInput(input);
  if (!validated.ok) return validated;
  const { data, validUntil, totalCents, discountCents } = validated.value;

  const prisma = getPrisma();
  const current = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    select: { id: true, status: true },
  });
  if (!current) return fail(NOT_FOUND_MESSAGE);
  if (!isEditable(current.status)) {
    return fail(
      "Só rascunho pode ser editado. Para ajustar, crie uma nova proposta.",
    );
  }

  const scope = await checkCustomerScope(
    actor,
    data.customerId,
    data.customerUnitId,
  );
  if (!scope.ok) return scope;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.proposal.updateMany({
      where: {
        id: proposalId,
        organizationId: actor.organizationId,
        status: "draft",
        deletedAt: null,
      },
      data: {
        customerId: data.customerId,
        customerUnitId: data.customerUnitId ?? null,
        title: data.title,
        validUntil,
        paymentTerms: data.paymentTerms ?? null,
        commercialConditions: data.commercialConditions ?? null,
        observations: data.observations ?? null,
        discountCents,
        totalCents,
        updatedById: actor.id,
      },
    });
    if (result.count === 0) return false;

    await tx.proposalItem.deleteMany({
      where: { proposalId, organizationId: actor.organizationId },
    });
    await tx.proposalItem.createMany({
      data: itemRows(actor.organizationId, proposalId, data.items),
    });
    await writeAudit(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "PROPOSAL_UPDATED",
        entityType: "Proposal",
        entityId: proposalId,
        metadata: { totalCents, itemCount: data.items.length },
      },
      tx,
    );
    return true;
  });

  if (!updated)
    return fail("A proposta mudou de situação. Recarregue a página.");
  return { ok: true };
}

export async function transitionProposal(
  actor: AuthenticatedUser,
  proposalId: string,
  to: string,
  options: { reason?: string; now?: Date } = {},
): Promise<ServiceResult> {
  if (!isProposalStatus(to)) return fail("Situação desconhecida.");
  const target: ProposalStatusValue = to;
  const requiredPermission = permissionForTransition(target);
  if (!requiredPermission)
    return fail("Esta mudança de situação não é permitida.");
  const denied = denyWithout(actor, requiredPermission);
  if (denied) return denied;

  const now = options.now ?? new Date();
  const prisma = getPrisma();
  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
      validUntil: true,
      totalCents: true,
      _count: { select: { items: true } },
    },
  });
  if (!proposal) return fail(NOT_FOUND_MESSAGE);

  const check = checkTransition({
    from: proposal.status,
    to: target,
    validUntil: proposal.validUntil,
    itemCount: proposal._count.items,
    totalCents: proposal.totalCents,
    now,
  });
  if (!check.ok) return check;

  let reason: string | undefined;
  if (target === "rejected") {
    const parsedReason = rejectionSchema.safeParse({ reason: options.reason });
    if (!parsedReason.success)
      return fail(FIRST_ISSUE(parsedReason.error.issues));
    reason = parsedReason.data.reason;
  }

  const changed = await prisma.$transaction(async (tx) => {
    const result = await tx.proposal.updateMany({
      where: {
        id: proposalId,
        organizationId: actor.organizationId,
        status: proposal.status,
        deletedAt: null,
      },
      data: {
        status: target,
        updatedById: actor.id,
        ...(target === "sent" ? { sentAt: now } : {}),
        ...(target === "accepted" ||
        target === "rejected" ||
        target === "expired"
          ? { decidedAt: now }
          : {}),
        ...(target === "rejected" ? { rejectionReason: reason ?? null } : {}),
      },
    });
    if (result.count === 0) return false;

    await writeAudit(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "PROPOSAL_STATUS_CHANGED",
        entityType: "Proposal",
        entityId: proposalId,
        metadata: {
          from: proposal.status,
          to: target,
          ...(reason ? { reason } : {}),
        },
      },
      tx,
    );
    return true;
  });

  if (!changed)
    return fail("A proposta mudou de situação. Recarregue a página.");
  return { ok: true };
}

/** Exclusão lógica. Só rascunho: o que já foi enviado fica no histórico. */
export async function archiveProposal(
  actor: AuthenticatedUser,
  proposalId: string,
): Promise<ServiceResult> {
  const denied = denyWithout(actor, "proposal.update");
  if (denied) return denied;

  const prisma = getPrisma();
  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    select: { id: true, status: true },
  });
  if (!proposal) return fail(NOT_FOUND_MESSAGE);
  if (proposal.status !== "draft") {
    return fail(
      "Só rascunho pode ser arquivado. Propostas enviadas permanecem no histórico.",
    );
  }

  const changed = await prisma.$transaction(async (tx) => {
    const result = await tx.proposal.updateMany({
      where: {
        id: proposalId,
        organizationId: actor.organizationId,
        status: "draft",
        deletedAt: null,
      },
      data: { deletedAt: new Date(), updatedById: actor.id },
    });
    if (result.count === 0) return false;
    await writeAudit(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "PROPOSAL_ARCHIVED",
        entityType: "Proposal",
        entityId: proposalId,
        metadata: {},
      },
      tx,
    );
    return true;
  });
  if (!changed)
    return fail("A proposta mudou de situação. Recarregue a página.");
  return { ok: true };
}

/**
 * Aceita não volta; recusada ou expirada pode originar outra. Cria um rascunho novo
 * ligado ao anterior (`supersedesId`) e copia itens e condições. A original não muda.
 */
export async function reviseProposal(
  actor: AuthenticatedUser,
  proposalId: string,
  now: Date = new Date(),
): Promise<ServiceResult<{ id: string; code: string }>> {
  const denied = denyWithout(actor, "proposal.create");
  if (denied) return denied;

  const prisma = getPrisma();
  const source = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      organizationId: actor.organizationId,
      deletedAt: null,
    },
    include: { items: { orderBy: { position: "asc" } } },
  });
  if (!source) return fail(NOT_FOUND_MESSAGE);
  if (!canRevise(source.status)) {
    return fail(
      "Só proposta aceita, recusada ou expirada gera uma nova proposta.",
    );
  }

  const scope = await checkCustomerScope(
    actor,
    source.customerId,
    source.customerUnitId ?? undefined,
  );
  if (!scope.ok) return scope;

  const id = crypto.randomUUID();
  const code = await prisma.$transaction(async (tx) => {
    const nextCode = await nextProposalCode(tx, actor.organizationId, now);
    await tx.proposal.create({
      data: {
        id,
        organizationId: actor.organizationId,
        code: nextCode,
        customerId: source.customerId,
        customerUnitId: source.customerUnitId,
        title: source.title,
        status: "draft",
        validUntil: null,
        paymentTerms: source.paymentTerms,
        commercialConditions: source.commercialConditions,
        observations: source.observations,
        discountCents: source.discountCents,
        totalCents: source.totalCents,
        supersedesId: source.id,
        createdById: actor.id,
        updatedById: actor.id,
      },
    });
    await tx.proposalItem.createMany({
      data: source.items.map((item) => ({
        id: crypto.randomUUID(),
        organizationId: actor.organizationId,
        proposalId: id,
        position: item.position,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        totalCents: item.totalCents,
      })),
    });
    await writeAudit(
      {
        organizationId: actor.organizationId,
        actorUserId: actor.id,
        action: "PROPOSAL_REVISED",
        entityType: "Proposal",
        entityId: id,
        metadata: { supersedes: source.id, code: nextCode },
      },
      tx,
    );
    return nextCode;
  });

  return { ok: true, data: { id, code } };
}
