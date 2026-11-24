/**
 * @vitest-environment node
 *
 * Integração 11B.3 — colaboradores + agendamentos. Orgs descartáveis.
 * Exige migrations employee + service_appointment no banco isolado.
 */
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { integrationDatabaseGuard } from "@/lib/db/test-guard";
import type { AuthenticatedUser } from "@/lib/platform/access";
import { CONFLICT_MESSAGE } from "@/lib/platform/appointment-constants";

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
      name: `Teste Agenda ${label}`,
      slug: `teste-agenda-${organizationId}`,
    },
  });
  orgIds.push(organizationId);
  await prisma.user.create({
    data: {
      id: userId,
      name: `Ator Agenda ${label}`,
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
    name: `Ator Agenda ${label}`,
    email: `${userId}@teste.servsam.local`,
    organizationId,
    isActive: true,
    permissions: new Set(permissions),
    roleCodes: ["TESTE"],
    roleNames: ["Teste"],
  };
}

async function assertAppointmentTablesReady(): Promise<void> {
  const { getPrisma } = await import("@/lib/db/prisma");
  try {
    await getPrisma().$queryRawUnsafe(`SELECT 1 FROM "employee" LIMIT 1`);
    await getPrisma().$queryRawUnsafe(
      `SELECT 1 FROM "service_appointment" LIMIT 1`,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Migration 11B.3 ausente no banco de teste (employee/service_appointment). ${detail}`,
    );
  }
}

async function issueServiceOrder(actor: Actor) {
  const { createCustomer } = await import("@/lib/platform/customers");
  const { createProposal, transitionProposal } =
    await import("@/lib/platform/proposals");
  const { createEngagementFromProposal } =
    await import("@/lib/platform/engagements");
  const { createServiceOrder } = await import("@/lib/platform/service-orders");

  const customer = await createCustomer(actor, {
    legalName: `Cliente Agenda ${crypto.randomUUID().slice(0, 8)}`,
  });
  if (!customer.ok) throw new Error(customer.message);

  const proposal = await createProposal(actor, {
    customerId: customer.data.id,
    title: "Pacote agenda",
    validUntil: "2099-12-31",
    discountCents: 0,
    items: [
      {
        description: "Dedetização agenda",
        quantity: 1,
        unitPriceCents: 15000,
      },
    ],
  });
  if (!proposal.ok) throw new Error(proposal.message);

  const sent = await transitionProposal(actor, proposal.data.id, "sent");
  if (!sent.ok) throw new Error(sent.message);
  const accepted = await transitionProposal(actor, proposal.data.id, "accepted");
  if (!accepted.ok) throw new Error(accepted.message);

  const engagement = await createEngagementFromProposal(actor, {
    proposalId: proposal.data.id,
  });
  if (!engagement.ok) throw new Error(engagement.message);

  const { getEngagementDetail } =
    await import("@/lib/platform/engagements");
  const detail = await getEngagementDetail(actor, engagement.data.id);
  if (!detail?.items[0]) throw new Error("Item da contratação ausente");

  const order = await createServiceOrder(actor, {
    engagementId: engagement.data.id,
    engagementItemId: detail.items[0].id,
  });
  if (!order.ok) throw new Error(order.message);
  return order.data;
}

const guard = integrationDatabaseGuard();

describe.skipIf(!guard.allowed)(
  "agenda operacional persistente (11B.3)",
  () => {
    let owner: Actor;
    let outsider: Actor;
    let viewer: Actor;

    beforeAll(async () => {
      if (!guard.allowed) throw new Error(guard.reason);
      await assertAppointmentTablesReady();
      const { PERMISSIONS } = await import("@/lib/platform/permissions");
      const keys = PERMISSIONS.map((permission) => permission.key);
      owner = await createTenant("principal", keys);
      outsider = await createTenant("externa", keys);
      viewer = await createTenant("viewer", [
        "schedule.view",
        "employee.view",
        "service_order.view",
      ]);
    }, 120_000);

    afterAll(async () => {
      if (orgIds.length === 0) return;
      const { getPrisma } = await import("@/lib/db/prisma");
      const prisma = getPrisma();
      for (const organizationId of orgIds) {
        await prisma.auditLog.deleteMany({ where: { organizationId } });
        await prisma.serviceAppointment.deleteMany({
          where: { organizationId },
        });
        await prisma.serviceOrder.deleteMany({ where: { organizationId } });
        await prisma.engagementItem.deleteMany({ where: { organizationId } });
        await prisma.engagement.deleteMany({ where: { organizationId } });
        await prisma.proposalItem.deleteMany({ where: { organizationId } });
        await prisma.proposal.deleteMany({ where: { organizationId } });
        await prisma.customerUnit.deleteMany({ where: { organizationId } });
        await prisma.customerContact.deleteMany({ where: { organizationId } });
        await prisma.customer.deleteMany({ where: { organizationId } });
        await prisma.employee.deleteMany({ where: { organizationId } });
        await prisma.documentSequence.deleteMany({ where: { organizationId } });
        await prisma.user.deleteMany({ where: { organizationId } });
        await prisma.organization.delete({ where: { id: organizationId } });
      }
    });

    it(
      "colaborador, agendamento, OS scheduled, remarcação, conflito, cancelamento e isolamento",
      async () => {
        const { createEmployee, updateEmployee, getEmployeeDetail } =
          await import("@/lib/platform/employees");
        const {
          createAppointment,
          rescheduleAppointment,
          cancelAppointment,
          listAppointments,
          getActiveAppointmentForServiceOrder,
        } = await import("@/lib/platform/appointments");
        const { getServiceOrderDetail, cancelServiceOrder } =
          await import("@/lib/platform/service-orders");
        const { getPrisma } = await import("@/lib/db/prisma");
        const { PermissionError } =
          await import("@/lib/platform/permission-error");

        await expect(
          createEmployee(viewer, {
            fullName: "Sem permissão",
            jobTitle: "Técnico",
          }),
        ).rejects.toBeInstanceOf(PermissionError);

        const employeeA = await createEmployee(owner, {
          fullName: "Carla Campo",
          jobTitle: "Técnica",
          phone: "91999990000",
        });
        expect(employeeA.ok).toBe(true);
        if (!employeeA.ok) return;

        const employeeB = await createEmployee(owner, {
          fullName: "Diego Apoio",
          jobTitle: "Auxiliar",
        });
        expect(employeeB.ok).toBe(true);
        if (!employeeB.ok) return;

        const inactive = await updateEmployee(owner, employeeB.data.id, {
          fullName: "Diego Apoio",
          jobTitle: "Auxiliar",
          isActive: false,
        });
        expect(inactive.ok).toBe(true);

        const os1 = await issueServiceOrder(owner);
        const os2 = await issueServiceOrder(owner);

        const before = await getServiceOrderDetail(owner, os1.id);
        expect(before?.status).toBe("issued");

        const badWindow = await createAppointment(owner, {
          serviceOrderId: os1.id,
          startsAtLocal: "2026-12-01T10:00",
          endsAtLocal: "2026-12-01T09:00",
          employeeId: employeeA.data.id,
        });
        expect(badWindow.ok).toBe(false);

        const inactiveAssign = await createAppointment(owner, {
          serviceOrderId: os1.id,
          startsAtLocal: "2026-12-01T08:00",
          endsAtLocal: "2026-12-01T10:00",
          employeeId: employeeB.data.id,
        });
        expect(inactiveAssign.ok).toBe(false);

        const created = await createAppointment(owner, {
          serviceOrderId: os1.id,
          startsAtLocal: "2026-12-01T08:00",
          endsAtLocal: "2026-12-01T10:00",
          employeeId: employeeA.data.id,
          notes: "Primeira visita",
        });
        expect(created.ok).toBe(true);
        if (!created.ok) return;

        const afterCreate = await getServiceOrderDetail(owner, os1.id);
        expect(afterCreate?.status).toBe("scheduled");

        const duplicate = await createAppointment(owner, {
          serviceOrderId: os1.id,
          startsAtLocal: "2026-12-02T08:00",
          endsAtLocal: "2026-12-02T09:00",
          employeeId: employeeA.data.id,
        });
        expect(duplicate.ok).toBe(false);

        const secondOs = await createAppointment(owner, {
          serviceOrderId: os2.id,
          startsAtLocal: "2026-12-01T09:00",
          endsAtLocal: "2026-12-01T11:00",
          employeeId: employeeA.data.id,
        });
        expect(secondOs.ok).toBe(false);
        if (!secondOs.ok) {
          expect(secondOs.message).toBe(CONFLICT_MESSAGE);
        }

        const forced = await createAppointment(owner, {
          serviceOrderId: os2.id,
          startsAtLocal: "2026-12-01T09:00",
          endsAtLocal: "2026-12-01T11:00",
          employeeId: employeeA.data.id,
          acceptConflict: true,
        });
        expect(forced.ok).toBe(true);
        if (forced.ok) {
          expect(forced.data.conflictWarning).toBe(CONFLICT_MESSAGE);
        }

        const active = await getActiveAppointmentForServiceOrder(owner, os1.id);
        expect(active?.id).toBe(created.data.id);

        const rescheduled = await rescheduleAppointment(owner, {
          appointmentId: created.data.id,
          startsAtLocal: "2026-12-03T14:00",
          endsAtLocal: "2026-12-03T16:00",
          employeeId: employeeA.data.id,
          reason: "Cliente remarcou",
        });
        expect(rescheduled.ok).toBe(true);
        if (!rescheduled.ok) return;

        const oldRow = await getPrisma().serviceAppointment.findFirst({
          where: { id: created.data.id },
        });
        expect(oldRow?.status).toBe("cancelled");
        expect(oldRow?.changeReason).toBe("Cliente remarcou");

        const stillScheduled = await getServiceOrderDetail(owner, os1.id);
        expect(stillScheduled?.status).toBe("scheduled");

        const cancelled = await cancelAppointment(owner, {
          appointmentId: rescheduled.data.id,
          reason: "Equipe indisponível",
        });
        expect(cancelled.ok).toBe(true);
        if (cancelled.ok) {
          expect(cancelled.data.serviceOrderStatus).toBe("issued");
        }

        const backToIssued = await getServiceOrderDetail(owner, os1.id);
        expect(backToIssued?.status).toBe("issued");

        const outsiderEmployee = await createEmployee(outsider, {
          fullName: "Externo",
          jobTitle: "Técnico",
        });
        expect(outsiderEmployee.ok).toBe(true);
        if (!outsiderEmployee.ok) return;

        const crossOrg = await createAppointment(owner, {
          serviceOrderId: os1.id,
          startsAtLocal: "2026-12-10T08:00",
          endsAtLocal: "2026-12-10T09:00",
          employeeId: outsiderEmployee.data.id,
        });
        expect(crossOrg.ok).toBe(false);

        const outsiderOs = await issueServiceOrder(outsider);
        const crossOs = await createAppointment(owner, {
          serviceOrderId: outsiderOs.id,
          startsAtLocal: "2026-12-10T08:00",
          endsAtLocal: "2026-12-10T09:00",
        });
        expect(crossOs.ok).toBe(false);

        await expect(
          createAppointment(viewer, {
            serviceOrderId: os1.id,
            startsAtLocal: "2026-12-11T08:00",
            endsAtLocal: "2026-12-11T09:00",
          }),
        ).rejects.toBeInstanceOf(PermissionError);

        const week = await listAppointments(owner, {
          from: new Date("2026-12-01T00:00:00.000-03:00"),
          to: new Date("2026-12-08T00:00:00.000-03:00"),
          status: "scheduled",
        });
        expect(week.some((row) => row.serviceOrderId === os2.id)).toBe(true);

        const reissue = await createAppointment(owner, {
          serviceOrderId: os1.id,
          startsAtLocal: "2026-12-12T08:00",
          endsAtLocal: "2026-12-12T09:00",
          employeeId: employeeA.data.id,
        });
        expect(reissue.ok).toBe(true);
        if (!reissue.ok) return;

        const cancelOs = await cancelServiceOrder(owner, {
          serviceOrderId: os1.id,
          reason: "Cliente desistiu",
        });
        expect(cancelOs.ok).toBe(true);

        const afterOsCancel = await getActiveAppointmentForServiceOrder(
          owner,
          os1.id,
        );
        expect(afterOsCancel).toBeNull();

        const emp = await getEmployeeDetail(owner, employeeA.data.id);
        expect(emp?.fullName).toBe("Carla Campo");

        const blockedStatuses = ["in_progress", "completed"] as const;
        for (const status of blockedStatuses) {
          const blockedOs = await issueServiceOrder(owner);
          await getPrisma().serviceOrder.update({
            where: { id: blockedOs.id },
            data: { status },
          });
          const blocked = await createAppointment(owner, {
            serviceOrderId: blockedOs.id,
            startsAtLocal: "2026-12-21T08:00",
            endsAtLocal: "2026-12-21T09:00",
          });
          expect(blocked.ok).toBe(false);
        }

        const audits = await getPrisma().auditLog.findMany({
          where: {
            organizationId: owner.organizationId,
            action: {
              in: [
                "EMPLOYEE_CREATED",
                "APPOINTMENT_CREATED",
                "APPOINTMENT_RESCHEDULED",
                "APPOINTMENT_CANCELLED",
                "SERVICE_ORDER_STATUS_CHANGED",
              ],
            },
          },
        });
        expect(audits.length).toBeGreaterThanOrEqual(5);

        const os3 = await issueServiceOrder(owner);
        const [raceA, raceB] = await Promise.all([
          createAppointment(owner, {
            serviceOrderId: os3.id,
            startsAtLocal: "2026-12-20T08:00",
            endsAtLocal: "2026-12-20T09:00",
          }),
          createAppointment(owner, {
            serviceOrderId: os3.id,
            startsAtLocal: "2026-12-20T10:00",
            endsAtLocal: "2026-12-20T11:00",
          }),
        ]);
        const winners = [raceA, raceB].filter((row) => row.ok);
        expect(winners).toHaveLength(1);
        const activeOs3 = await getActiveAppointmentForServiceOrder(
          owner,
          os3.id,
        );
        expect(activeOs3).not.toBeNull();
      },
      180_000,
    );
  },
);
