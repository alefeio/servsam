/**
 * @vitest-environment node
 *
 * Integração 11B.2 — OS persistentes. Orgs descartáveis.
 * Exige migration `service_order` no banco alvo.
 * Com guard permitido, ausência de tabela = FALHA (não skip silencioso).
 */
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { integrationDatabaseGuard } from "@/lib/db/test-guard";
import type { AuthenticatedUser } from "@/lib/platform/access";

loadEnv({ path: ".env.local" });

const orgIds: string[] = [];

type Actor = AuthenticatedUser;

async function createTenant(
  label: string,
  permissions: string[],
): Promise<Actor> {
  const { getPrisma } = await import("@/lib/db/prisma");
  const prisma = getPrisma();
  const organizationId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const now = new Date();
  await prisma.organization.create({
    data: {
      id: organizationId,
      name: `Teste OS ${label}`,
      slug: `teste-os-${organizationId}`,
    },
  });
  orgIds.push(organizationId);
  await prisma.user.create({
    data: {
      id: userId,
      name: `Ator OS ${label}`,
      email: `${userId}@teste.servsam.local`,
      emailVerified: true,
      organizationId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });
  return {
    id: userId,
    name: `Ator OS ${label}`,
    email: `${userId}@teste.servsam.local`,
    organizationId,
    isActive: true,
    permissions: new Set(permissions),
    roleCodes: ["TESTE"],
    roleNames: ["Teste"],
  };
}

async function assertServiceOrderTableReady(): Promise<void> {
  const { getPrisma } = await import("@/lib/db/prisma");
  try {
    await getPrisma().$queryRawUnsafe(`SELECT 1 FROM "service_order" LIMIT 1`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Migration 11B.2 ausente no banco de teste (tabela service_order). ${detail}`,
    );
  }
}

const proposalInput = (customerId: string) => ({
  customerId,
  title: "Pacote OS integração",
  validUntil: "2099-12-31",
  discountCents: 0,
  items: [
    {
      description: "Serviço Alfa",
      quantity: 1,
      unitPriceCents: 10000,
    },
    {
      description: "Serviço Beta",
      quantity: 2,
      unitPriceCents: 5000,
    },
  ],
});

const guard = integrationDatabaseGuard();

describe.skipIf(!guard.allowed)("ordens de serviço persistentes (11B.2)", () => {
  let owner: Actor;
  let outsider: Actor;
  let viewer: Actor;

  beforeAll(async () => {
    if (!guard.allowed) throw new Error(guard.reason);
    // Fail-closed: suíte de OS com banco permitido exige tabela real.
    await assertServiceOrderTableReady();
    const { PERMISSIONS } = await import("@/lib/platform/permissions");
    const keys = PERMISSIONS.map((permission) => permission.key);
    owner = await createTenant("principal", keys);
    outsider = await createTenant("externa", keys);
    viewer = await createTenant("viewer", [
      "service_order.view",
      "contract.view",
      "customer.view",
      "proposal.view",
    ]);
  }, 120_000);

  afterAll(async () => {
    if (orgIds.length === 0) return;
    const { getPrisma } = await import("@/lib/db/prisma");
    const prisma = getPrisma();
    for (const organizationId of orgIds) {
      await prisma.auditLog.deleteMany({ where: { organizationId } });
      await prisma.serviceOrder.deleteMany({ where: { organizationId } });
      await prisma.engagementItem.deleteMany({ where: { organizationId } });
      await prisma.engagement.deleteMany({ where: { organizationId } });
      await prisma.receivedPurchaseOrderItem.deleteMany({
        where: { organizationId },
      });
      await prisma.receivedPurchaseOrder.deleteMany({
        where: { organizationId },
      });
      await prisma.proposalItem.deleteMany({ where: { organizationId } });
      await prisma.proposal.deleteMany({ where: { organizationId } });
      await prisma.customerUnit.deleteMany({ where: { organizationId } });
      await prisma.customerContact.deleteMany({ where: { organizationId } });
      await prisma.customer.deleteMany({ where: { organizationId } });
      await prisma.documentSequence.deleteMany({ where: { organizationId } });
      await prisma.user.deleteMany({ where: { organizationId } });
      await prisma.organization.delete({ where: { id: organizationId } });
    }
  });

  it(
    "emite OS por orçamento e O.C., duas OS, isolamento, duplicação, cancelamento e reemissão",
    async () => {
      const { createCustomer } = await import("@/lib/platform/customers");
      const { createProposal, transitionProposal } =
        await import("@/lib/platform/proposals");
      const {
        createEngagementFromProposal,
        createEngagementFromPurchaseOrder,
        getEngagementDetail,
      } = await import("@/lib/platform/engagements");
      const { createPurchaseOrder } =
        await import("@/lib/platform/purchase-orders");
      const {
        createServiceOrder,
        cancelServiceOrder,
        getServiceOrderDetail,
        getServiceOrdersByEngagement,
      } = await import("@/lib/platform/service-orders");
      const { getPrisma } = await import("@/lib/db/prisma");
      const { PermissionError } =
        await import("@/lib/platform/permission-error");

      const customer = await createCustomer(owner, {
        legalName: "Cliente OS proposta",
      });
      if (!customer.ok) throw new Error("customer");
      const draft = await createProposal(
        owner,
        proposalInput(customer.data.id),
        new Date("2026-11-24T12:00:00Z"),
      );
      if (!draft.ok) throw new Error("proposal");
      expect(
        (await transitionProposal(owner, draft.data.id, "sent")).ok,
      ).toBe(true);
      expect(
        (await transitionProposal(owner, draft.data.id, "accepted")).ok,
      ).toBe(true);
      const engagement = await createEngagementFromProposal(owner, {
        proposalId: draft.data.id,
      });
      expect(engagement.ok).toBe(true);
      if (!engagement.ok) return;

      const detail = await getEngagementDetail(owner, engagement.data.id);
      expect(detail?.items).toHaveLength(2);
      const itemA = detail!.items[0]!;
      const itemB = detail!.items[1]!;

      const first = await createServiceOrder(
        owner,
        {
          engagementId: engagement.data.id,
          engagementItemId: itemA.id,
        },
        new Date("2026-11-24T13:00:00Z"),
      );
      expect(first.ok).toBe(true);
      if (!first.ok) return;
      expect(first.data.code).toMatch(/^OS-2026-\d{4}$/);

      const duplicate = await createServiceOrder(owner, {
        engagementId: engagement.data.id,
        engagementItemId: itemA.id,
      });
      expect(duplicate.ok).toBe(false);

      const [raceA, raceB] = await Promise.all([
        createServiceOrder(owner, {
          engagementId: engagement.data.id,
          engagementItemId: itemA.id,
        }),
        createServiceOrder(owner, {
          engagementId: engagement.data.id,
          engagementItemId: itemA.id,
        }),
      ]);
      expect(raceA.ok).toBe(false);
      expect(raceB.ok).toBe(false);

      const second = await createServiceOrder(owner, {
        engagementId: engagement.data.id,
        engagementItemId: itemB.id,
      });
      expect(second.ok).toBe(true);
      if (!second.ok) return;
      expect(second.data.id).not.toBe(first.data.id);
      expect(second.data.code).not.toBe(first.data.code);

      const byEngagement = await getServiceOrdersByEngagement(
        owner,
        engagement.data.id,
      );
      expect(byEngagement).toHaveLength(2);

      await expect(
        createServiceOrder(viewer, {
          engagementId: engagement.data.id,
          engagementItemId: itemA.id,
        }),
      ).rejects.toBeInstanceOf(PermissionError);

      expect(
        (
          await createServiceOrder(outsider, {
            engagementId: engagement.data.id,
            engagementItemId: itemA.id,
          })
        ).ok,
      ).toBe(false);

      const otherCustomer = await createCustomer(owner, {
        legalName: "Cliente CTR cancelada",
      });
      if (!otherCustomer.ok) throw new Error("other");
      const otherProposal = await createProposal(
        owner,
        proposalInput(otherCustomer.data.id),
      );
      if (!otherProposal.ok) throw new Error("other proposal");
      await transitionProposal(owner, otherProposal.data.id, "sent");
      await transitionProposal(owner, otherProposal.data.id, "accepted");
      const otherEngagement = await createEngagementFromProposal(owner, {
        proposalId: otherProposal.data.id,
      });
      if (!otherEngagement.ok) throw new Error("other engagement");
      await getPrisma().engagement.update({
        where: { id: otherEngagement.data.id },
        data: { status: "cancelled" },
      });
      const otherDetail = await getEngagementDetail(
        owner,
        otherEngagement.data.id,
      );
      const blocked = await createServiceOrder(owner, {
        engagementId: otherEngagement.data.id,
        engagementItemId: otherDetail!.items[0]!.id,
      });
      expect(blocked.ok).toBe(false);

      const cross = await createServiceOrder(owner, {
        engagementId: engagement.data.id,
        engagementItemId: otherDetail!.items[0]!.id,
      });
      expect(cross.ok).toBe(false);

      const ocCustomer = await createCustomer(owner, {
        legalName: "Cliente OS OC",
      });
      if (!ocCustomer.ok) throw new Error("oc customer");
      const oc = await createPurchaseOrder(owner, {
        customerId: ocCustomer.data.id,
        externalNumber: `OC-OS-${Date.now()}`,
        receivedAt: "2026-11-20",
        description: "O.C. para OS",
        items: [
          {
            description: "Serviço OC único",
            quantity: 1,
            unitPriceCents: 9000,
          },
        ],
      });
      if (!oc.ok) throw new Error("oc");
      const ocEngagement = await createEngagementFromPurchaseOrder(owner, {
        purchaseOrderId: oc.data.id,
      });
      if (!ocEngagement.ok) throw new Error("oc engagement");
      const ocDetail = await getEngagementDetail(owner, ocEngagement.data.id);
      const ocOs = await createServiceOrder(owner, {
        engagementId: ocEngagement.data.id,
        engagementItemId: ocDetail!.items[0]!.id,
      });
      expect(ocOs.ok).toBe(true);

      const cancel = await cancelServiceOrder(owner, {
        serviceOrderId: first.data.id,
        reason: "Teste cancelamento",
      });
      expect(cancel.ok).toBe(true);
      const cancelledDetail = await getServiceOrderDetail(owner, first.data.id);
      expect(cancelledDetail?.status).toBe("cancelled");
      expect(cancelledDetail?.cancellationReason).toBe("Teste cancelamento");

      const reissue = await createServiceOrder(owner, {
        engagementId: engagement.data.id,
        engagementItemId: itemA.id,
      });
      expect(reissue.ok).toBe(true);
      if (!reissue.ok) return;
      expect(reissue.data.code).not.toBe(first.data.code);
      expect(reissue.data.id).not.toBe(first.data.id);

      const afterReissue = await getServiceOrdersByEngagement(
        owner,
        engagement.data.id,
      );
      expect(afterReissue).toHaveLength(3);
      expect(
        afterReissue.filter((order) => order.status === "cancelled"),
      ).toHaveLength(1);

      const audits = await getPrisma().auditLog.findMany({
        where: {
          organizationId: owner.organizationId,
          entityType: "ServiceOrder",
          entityId: first.data.id,
        },
        orderBy: { createdAt: "asc" },
      });
      expect(audits.map((entry) => entry.action)).toEqual([
        "SERVICE_ORDER_CREATED",
        "SERVICE_ORDER_CANCELLED",
      ]);
    },
    180_000,
  );
});
