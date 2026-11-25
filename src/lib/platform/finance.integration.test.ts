/**
 * @vitest-environment node
 *
 * Integração 11B.4 FIN-F0 — billing + receipts. Banco isolado Docker.
 */
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { integrationDatabaseGuard } from "@/lib/db/test-guard";
import type { AuthenticatedUser } from "@/lib/platform/access";
import { seedGrantsFor } from "@/lib/platform/permissions";

loadEnv({ path: ".env.local" });

const orgIds: string[] = [];

type Actor = AuthenticatedUser;

async function createTenant(
  label: string,
  role: "ADMINISTRATIVO" | "FINANCEIRO" | "GERENCIA" | "DIRETORIA" | "CUSTOM",
  customKeys?: string[],
): Promise<Actor> {
  const { getPrisma } = await import("@/lib/db/prisma");
  const prisma = getPrisma();
  const organizationId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const now = new Date();
  await prisma.organization.create({
    data: {
      id: organizationId,
      name: `Teste Fin ${label}`,
      slug: `teste-fin-${organizationId}`,
    },
  });
  orgIds.push(organizationId);
  await prisma.user.create({
    data: {
      id: userId,
      name: `Ator Fin ${label}`,
      email: `${userId}@teste.servsam.local`,
      emailVerified: true,
      organizationId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });
  const permissions =
    role === "CUSTOM"
      ? new Set(customKeys ?? [])
      : new Set(seedGrantsFor(role).map((g) => g.key));
  return {
    id: userId,
    name: `Ator Fin ${label}`,
    email: `${userId}@teste.servsam.local`,
    organizationId,
    isActive: true,
    permissions,
    roleCodes: [role === "CUSTOM" ? "TESTE" : role],
    roleNames: [role],
  };
}

async function assertFinanceTablesReady(): Promise<void> {
  const { getPrisma } = await import("@/lib/db/prisma");
  try {
    await getPrisma().$queryRawUnsafe(`SELECT 1 FROM "billing_request" LIMIT 1`);
    await getPrisma().$queryRawUnsafe(`SELECT 1 FROM "receipt_entry" LIMIT 1`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Migration 11B.4 ausente no banco de teste. ${detail}`);
  }
}

async function createEngagementFromProposal(actor: Actor, title: string) {
  const { createCustomer } = await import("@/lib/platform/customers");
  const { createProposal, transitionProposal } =
    await import("@/lib/platform/proposals");
  const { createEngagementFromProposal: createEng } =
    await import("@/lib/platform/engagements");

  const customer = await createCustomer(actor, {
    legalName: `[FIN] ${title} ${crypto.randomUUID().slice(0, 6)}`,
  });
  if (!customer.ok) throw new Error(customer.message);
  const proposal = await createProposal(actor, {
    customerId: customer.data.id,
    title,
    validUntil: "2099-12-31",
    discountCents: 0,
    items: [
      {
        description: "Serviço financeiro teste",
        quantity: 1,
        unitPriceCents: 100_000,
      },
    ],
  });
  if (!proposal.ok) throw new Error(proposal.message);
  const sent = await transitionProposal(actor, proposal.data.id, "sent");
  if (!sent.ok) throw new Error(sent.message);
  const accepted = await transitionProposal(actor, proposal.data.id, "accepted");
  if (!accepted.ok) throw new Error(accepted.message);
  const engagement = await createEng(actor, { proposalId: proposal.data.id });
  if (!engagement.ok) throw new Error(engagement.message);
  return { customerId: customer.data.id, engagementId: engagement.data.id };
}

async function createEngagementFromPo(actor: Actor) {
  const { createCustomer } = await import("@/lib/platform/customers");
  const { createPurchaseOrder } =
    await import("@/lib/platform/purchase-orders");
  const { createEngagementFromPurchaseOrder } =
    await import("@/lib/platform/engagements");

  const customer = await createCustomer(actor, {
    legalName: `[FIN] OC ${crypto.randomUUID().slice(0, 6)}`,
  });
  if (!customer.ok) throw new Error(customer.message);
  const po = await createPurchaseOrder(actor, {
    customerId: customer.data.id,
    externalNumber: `OC-FIN-${crypto.randomUUID().slice(0, 6)}`,
    receivedAt: "2026-11-25",
    description: "OC financeira teste",
    items: [
      {
        description: "Item OC fin",
        quantity: 1,
        unitPriceCents: 80_000,
      },
    ],
  });
  if (!po.ok) throw new Error(po.message);
  const engagement = await createEngagementFromPurchaseOrder(actor, {
    purchaseOrderId: po.data.id,
  });
  if (!engagement.ok) throw new Error(engagement.message);
  return { engagementId: engagement.data.id };
}

const guard = integrationDatabaseGuard();

describe.skipIf(!guard.allowed)("financeiro FIN-F0 persistente (11B.4)", () => {
  let commercial: Actor;
  let finance: Actor;
  let outsider: Actor;
  let viewerOnly: Actor;

  beforeAll(async () => {
    if (!guard.allowed) throw new Error(guard.reason);
    await assertFinanceTablesReady();
    commercial = await createTenant("comercial", "ADMINISTRATIVO");

    const { getPrisma } = await import("@/lib/db/prisma");
    const prisma = getPrisma();
    const financeUserId = crypto.randomUUID();
    const now = new Date();
    await prisma.user.create({
      data: {
        id: financeUserId,
        name: "Ator Fin financeiro",
        email: `${financeUserId}@teste.servsam.local`,
        emailVerified: true,
        organizationId: commercial.organizationId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    });
    finance = {
      id: financeUserId,
      name: "Ator Fin financeiro",
      email: `${financeUserId}@teste.servsam.local`,
      organizationId: commercial.organizationId,
      isActive: true,
      permissions: new Set(seedGrantsFor("FINANCEIRO").map((g) => g.key)),
      roleCodes: ["FINANCEIRO"],
      roleNames: ["FINANCEIRO"],
    };

    const viewerUserId = crypto.randomUUID();
    await prisma.user.create({
      data: {
        id: viewerUserId,
        name: "Ator Fin viewer",
        email: `${viewerUserId}@teste.servsam.local`,
        emailVerified: true,
        organizationId: commercial.organizationId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    });
    viewerOnly = {
      id: viewerUserId,
      name: "Ator Fin viewer",
      email: `${viewerUserId}@teste.servsam.local`,
      organizationId: commercial.organizationId,
      isActive: true,
      permissions: new Set(["contract.view", "customer.view"]),
      roleCodes: ["TESTE"],
      roleNames: ["TESTE"],
    };

    outsider = await createTenant("externa", "DIRETORIA");
  }, 120_000);

  afterAll(async () => {
    if (orgIds.length === 0) return;
    const { getPrisma } = await import("@/lib/db/prisma");
    const prisma = getPrisma();
    await prisma.receiptEntry.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.billingRequest.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.serviceAppointment.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.serviceOrder.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.engagementItem.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.engagement.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.receivedPurchaseOrderItem.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.receivedPurchaseOrder.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.proposalItem.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.proposal.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.customer.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.auditLog.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.documentSequence.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.user.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
  }, 120_000);

  it(
    "fluxo proposta e O.C., permissões, confirmação, OS sem sinal e concorrência",
    async () => {
      const {
        createBillingRequest,
        processBillingRequest,
        createReceiptEntry,
        confirmReceipt,
        rejectReceipt,
        reverseReceipt,
        getEngagementFinanceSummary,
        getFinanceDashboard,
      } = await import("@/lib/platform/finance");
      const { createServiceOrder } = await import("@/lib/platform/service-orders");
      const { getEngagementDetail } = await import("@/lib/platform/engagements");
      const { PermissionError } = await import(
        "@/lib/platform/permission-error"
      );

      const fromProposal = await createEngagementFromProposal(
        commercial,
        "Pacote FIN proposta",
      );
      const fromPo = await createEngagementFromPo(commercial);

      const billing = await createBillingRequest(commercial, {
        engagementId: fromProposal.engagementId,
        description: "Providências NF teste",
        referenceAmountCents: 100_000,
        idempotencyKey: `bill-${fromProposal.engagementId}`,
      });
      expect(billing.ok).toBe(true);

      const dupBilling = await createBillingRequest(commercial, {
        engagementId: fromProposal.engagementId,
        description: "Providências NF teste",
        idempotencyKey: `bill-${fromProposal.engagementId}`,
      });
      expect(dupBilling.ok).toBe(true);
      if (billing.ok && dupBilling.ok) {
        expect(dupBilling.data.id).toBe(billing.data.id);
      }

      const secondBilling = await createBillingRequest(commercial, {
        engagementId: fromProposal.engagementId,
        description: "Segunda providência legítima",
        idempotencyKey: `bill-${fromProposal.engagementId}-2`,
      });
      expect(secondBilling.ok).toBe(true);
      if (billing.ok && secondBilling.ok) {
        expect(secondBilling.data.id).not.toBe(billing.data.id);
      }

      await expect(
        confirmReceipt(commercial, {
          receiptEntryId: "x",
          confirmedAmountCents: 1,
        }),
      ).rejects.toBeInstanceOf(PermissionError);

      await expect(
        getFinanceDashboard(commercial),
      ).rejects.toBeInstanceOf(PermissionError);

      const processed = await processBillingRequest(finance, {
        billingRequestId: billing.ok ? billing.data.id : "",
        invoiceIssuedExternally: true,
        externalDocumentRef: "NF-EXT-1",
      });
      expect(processed.ok).toBe(true);

      const receipt = await createReceiptEntry(commercial, {
        engagementId: fromProposal.engagementId,
        kind: "signal",
        amountCents: 30_000,
        referenceDate: "2026-11-25",
        paymentMethod: "pix",
        idempotencyKey: `rcpt-${fromProposal.engagementId}-1`,
      });
      expect(receipt.ok).toBe(true);

      const over = await createReceiptEntry(commercial, {
        engagementId: fromProposal.engagementId,
        kind: "installment",
        amountCents: 80_000,
        referenceDate: "2026-11-26",
      });
      expect(over.ok).toBe(false);

      const confirmed = await confirmReceipt(finance, {
        receiptEntryId: receipt.ok ? receipt.data.id : "",
        confirmedAmountCents: 30_000,
      });
      expect(confirmed.ok).toBe(true);

      const confirmedAgain = await confirmReceipt(finance, {
        receiptEntryId: receipt.ok ? receipt.data.id : "",
        confirmedAmountCents: 30_000,
      });
      expect(confirmedAgain.ok).toBe(true);

      const [createRaceA, createRaceB] = await Promise.all([
        createReceiptEntry(commercial, {
          engagementId: fromProposal.engagementId,
          kind: "installment",
          amountCents: 60_000,
          referenceDate: "2026-11-27",
          idempotencyKey: `race-create-a-${fromProposal.engagementId}`,
        }),
        createReceiptEntry(commercial, {
          engagementId: fromProposal.engagementId,
          kind: "installment",
          amountCents: 60_000,
          referenceDate: "2026-11-27",
          idempotencyKey: `race-create-b-${fromProposal.engagementId}`,
        }),
      ]);
      const createOk = [createRaceA, createRaceB].filter((row) => row.ok);
      const createFail = [createRaceA, createRaceB].filter((row) => !row.ok);
      expect(createOk.length).toBe(1);
      expect(createFail.length).toBe(1);
      expect(createFail[0] && !createFail[0].ok ? createFail[0].message : "").toMatch(
        /saldo/i,
      );

      const remainingReceipt = await createReceiptEntry(commercial, {
        engagementId: fromProposal.engagementId,
        kind: "installment",
        amountCents: 10_000,
        referenceDate: "2026-11-28",
        idempotencyKey: `race-confirm-${fromProposal.engagementId}`,
      });
      expect(remainingReceipt.ok).toBe(true);

      const [raceA, raceB] = await Promise.all([
        confirmReceipt(finance, {
          receiptEntryId: remainingReceipt.ok ? remainingReceipt.data.id : "",
          confirmedAmountCents: 10_000,
        }),
        confirmReceipt(finance, {
          receiptEntryId: remainingReceipt.ok ? remainingReceipt.data.id : "",
          confirmedAmountCents: 10_000,
        }),
      ]);
      // Uma confirma e a outra é idempotente (already confirmed).
      expect([raceA, raceB].every((row) => row.ok)).toBe(true);

      const summary = await getEngagementFinanceSummary(
        commercial,
        fromProposal.engagementId,
      );
      expect(summary).not.toBeNull();
      expect(summary!.confirmedCents).toBeGreaterThan(0);
      expect(summary!.confirmedCents).toBeLessThanOrEqual(100_000);

      const detail = await getEngagementDetail(
        commercial,
        fromProposal.engagementId,
      );
      expect(detail).not.toBeNull();
      const itemId = detail!.items[0]!.id;
      const osWithoutSignal = await createServiceOrder(commercial, {
        engagementId: fromProposal.engagementId,
        engagementItemId: itemId,
      });
      expect(osWithoutSignal.ok).toBe(true);

      const poBilling = await createBillingRequest(commercial, {
        engagementId: fromPo.engagementId,
        description: "NF da O.C.",
      });
      expect(poBilling.ok).toBe(true);

      const pendingReject = await createReceiptEntry(commercial, {
        engagementId: fromPo.engagementId,
        kind: "other",
        amountCents: 10_000,
        referenceDate: "2026-11-25",
      });
      expect(pendingReject.ok).toBe(true);
      const rejected = await rejectReceipt(finance, {
        receiptEntryId: pendingReject.ok ? pendingReject.data.id : "",
        reason: "Comprovante inconsistente",
      });
      expect(rejected.ok).toBe(true);

      const reverse = await reverseReceipt(finance, {
        receiptEntryId: receipt.ok ? receipt.data.id : "",
        reason: "Estorno administrativo de teste",
      });
      expect(reverse.ok).toBe(true);

      const dash = await getFinanceDashboard(finance, {});
      expect(dash.indicators.processedBilling).toBeGreaterThanOrEqual(1);

      const iso = await createBillingRequest(outsider, {
        engagementId: fromProposal.engagementId,
        description: "cruzado",
      });
      expect(iso.ok).toBe(false);

      await expect(
        createBillingRequest(viewerOnly, {
          engagementId: fromProposal.engagementId,
          description: "sem manage",
        }),
      ).rejects.toBeInstanceOf(PermissionError);

      const { getPrisma } = await import("@/lib/db/prisma");
      const audits = await getPrisma().auditLog.findMany({
        where: {
          organizationId: commercial.organizationId,
          action: {
            in: [
              "BILLING_REQUEST_CREATED",
              "BILLING_REQUEST_PROCESSED",
              "RECEIPT_REVIEW_REQUESTED",
              "RECEIPT_CONFIRMED",
              "RECEIPT_REJECTED",
              "RECEIPT_REVERSED",
            ],
          },
        },
      });
      expect(audits.length).toBeGreaterThanOrEqual(5);

      const {
        cancelBillingRequest,
        createReceiptEntry: createReceipt,
        confirmReceipt: confirmPartial,
        getFinanceDashboard: dashFn,
      } = await import("@/lib/platform/finance");

      const otherCommercialId = crypto.randomUUID();
      const now = new Date();
      await getPrisma().user.create({
        data: {
          id: otherCommercialId,
          name: "Outro comercial",
          email: `${otherCommercialId}@teste.servsam.local`,
          emailVerified: true,
          organizationId: commercial.organizationId,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      });
      const otherCommercial: Actor = {
        id: otherCommercialId,
        name: "Outro comercial",
        email: `${otherCommercialId}@teste.servsam.local`,
        organizationId: commercial.organizationId,
        isActive: true,
        permissions: new Set(seedGrantsFor("ADMINISTRATIVO").map((g) => g.key)),
        roleCodes: ["ADMINISTRATIVO"],
        roleNames: ["ADMINISTRATIVO"],
      };

      const ownBilling = await createBillingRequest(otherCommercial, {
        engagementId: fromPo.engagementId,
        description: "NF do outro comercial",
        idempotencyKey: `bill-other-${fromPo.engagementId}`,
      });
      expect(ownBilling.ok).toBe(true);
      const cancelByPeer = await cancelBillingRequest(commercial, {
        billingRequestId: ownBilling.ok ? ownBilling.data.id : "",
        reason: "tentativa indevida",
      });
      expect(cancelByPeer.ok).toBe(false);
      const cancelByOwner = await cancelBillingRequest(otherCommercial, {
        billingRequestId: ownBilling.ok ? ownBilling.data.id : "",
        reason: "desistiu da solicitação",
      });
      expect(cancelByOwner.ok).toBe(true);

      const partialEng = await createEngagementFromProposal(
        commercial,
        "Pacote parcial",
      );
      const pendingPartial = await createReceipt(commercial, {
        engagementId: partialEng.engagementId,
        kind: "signal",
        amountCents: 40_000,
        referenceDate: "2026-11-20",
        idempotencyKey: `partial-${partialEng.engagementId}`,
      });
      expect(pendingPartial.ok).toBe(true);
      const partialConfirm = await confirmPartial(finance, {
        receiptEntryId: pendingPartial.ok ? pendingPartial.data.id : "",
        confirmedAmountCents: 25_000,
      });
      expect(partialConfirm.ok).toBe(true);
      const partialRow = await getPrisma().receiptEntry.findUnique({
        where: { id: pendingPartial.ok ? pendingPartial.data.id : "" },
      });
      expect(partialRow?.requestedAmountCents).toBe(40_000);
      expect(partialRow?.amountCents).toBe(25_000);

      const bulkEng = await createEngagementFromProposal(
        commercial,
        "Pacote indicadores",
      );
      for (let i = 0; i < 210; i += 1) {
        await getPrisma().receiptEntry.create({
          data: {
            id: crypto.randomUUID(),
            organizationId: commercial.organizationId,
            engagementId: bulkEng.engagementId,
            customerId: bulkEng.customerId,
            kind: "other",
            amountCents: 100,
            requestedAmountCents: 100,
            referenceDate: new Date("2026-11-01T12:00:00.000Z"),
            status: "confirmed",
            confirmedManually: true,
            confirmedAt: new Date("2026-11-30T15:00:00.000Z"),
            requestedById: commercial.id,
            requestedAt: new Date("2026-11-01T12:00:00.000Z"),
            confirmedById: finance.id,
            createdById: commercial.id,
            updatedById: finance.id,
          },
        });
      }
      const dashFull = await dashFn(finance, {});
      expect(dashFull.indicators.confirmedCents).toBeGreaterThanOrEqual(21_000);
      expect(dashFull.receipts.length).toBeLessThanOrEqual(200);
      const dashByConfirm = await dashFn(finance, {
        from: new Date("2026-11-30T03:00:00.000Z"),
        to: new Date("2026-12-01T03:00:00.000Z"),
      });
      expect(dashByConfirm.indicators.confirmedCents).toBeGreaterThanOrEqual(
        21_000,
      );
    },
    300_000,
  );
});
