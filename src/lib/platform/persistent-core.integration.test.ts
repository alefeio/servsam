/**
 * @vitest-environment node
 *
 * Integração da Sprint 11A: clientes e orçamentos no PostgreSQL.
 * Só roda com DATABASE_ENV=preview|test e URL HOMOL_* (`npm run test:integration`).
 * Cada execução cria organizações temporárias e remove tudo ao final.
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
      name: `Teste ${label}`,
      slug: `teste-${organizationId}`,
    },
  });
  orgIds.push(organizationId);
  await prisma.user.create({
    data: {
      id: userId,
      name: `Ator ${label}`,
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
    name: `Ator ${label}`,
    email: `${userId}@teste.servsam.local`,
    organizationId,
    isActive: true,
    permissions: new Set(permissions),
    roleCodes: ["TESTE"],
    roleNames: ["Teste"],
  };
}

async function allPermissionKeys(): Promise<string[]> {
  const { PERMISSIONS } = await import("@/lib/platform/permissions");
  return PERMISSIONS.map((permission) => permission.key);
}

const proposalInput = (
  customerId: string,
  overrides: Record<string, unknown> = {},
) => ({
  customerId,
  title: "Controle de pragas mensal",
  validUntil: "2099-12-31",
  discountCents: 1000,
  items: [
    {
      description: "Aplicação em área comum",
      quantity: 2,
      unitPriceCents: 15000,
    },
    { description: "Monitoramento", quantity: 1.5, unitPriceCents: 3333 },
  ],
  ...overrides,
});

describe.skipIf(!integrationDatabaseGuard().allowed)(
  "clientes e orçamentos persistentes",
  () => {
    let owner: Actor;
    let outsider: Actor;

    beforeAll(async () => {
      const guard = integrationDatabaseGuard();
      if (!guard.allowed)
        throw new Error(`Recusando integração: ${guard.reason}`);
      const keys = await allPermissionKeys();
      owner = await createTenant("principal", keys);
      outsider = await createTenant("externa", keys);
    });

    afterAll(async () => {
      if (orgIds.length === 0) return;
      const { getPrisma } = await import("@/lib/db/prisma");
      const prisma = getPrisma();
      for (const organizationId of orgIds) {
        await prisma.auditLog.deleteMany({ where: { organizationId } });
        await prisma.proposalItem.deleteMany({ where: { organizationId } });
        await prisma.proposal.deleteMany({ where: { organizationId } });
        await prisma.customerContact.deleteMany({ where: { organizationId } });
        await prisma.customerUnit.deleteMany({ where: { organizationId } });
        await prisma.customer.deleteMany({ where: { organizationId } });
        await prisma.documentSequence.deleteMany({ where: { organizationId } });
        await prisma.user.deleteMany({ where: { organizationId } });
        await prisma.organization.delete({ where: { id: organizationId } });
      }
    });

    it("cadastra cliente, valida documento, impede duplicado e audita", async () => {
      const { createCustomer, updateCustomer, getCustomerDetail } =
        await import("@/lib/platform/customers");
      const { getPrisma } = await import("@/lib/db/prisma");

      const bad = await createCustomer(owner, {
        legalName: "Doc ruim",
        document: "123",
      });
      expect(bad.ok).toBe(false);

      const created = await createCustomer(owner, {
        legalName: "Condomínio Teste Azul",
        document: "11.222.333/0001-81",
        segment: "Condomínio",
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const duplicate = await createCustomer(owner, {
        legalName: "Outro nome",
        document: "11222333000181",
      });
      expect(duplicate).toEqual({
        ok: false,
        message: "Já existe um cliente com este documento.",
      });

      const updated = await updateCustomer(owner, created.data.id, {
        legalName: "Condomínio Teste Azul Ltda",
        document: "11222333000181",
      });
      expect(updated.ok).toBe(true);

      const detail = await getCustomerDetail(owner, created.data.id);
      expect(detail?.legalName).toBe("Condomínio Teste Azul Ltda");
      expect(detail?.document).toBe("11222333000181");
      expect(detail?.createdById).toBe(owner.id);

      const audits = await getPrisma().auditLog.findMany({
        where: {
          entityId: created.data.id,
          organizationId: owner.organizationId,
        },
        orderBy: { createdAt: "asc" },
      });
      expect(audits.map((entry) => entry.action)).toEqual([
        "CUSTOMER_CREATED",
        "CUSTOMER_UPDATED",
      ]);
      expect(audits.every((entry) => entry.actorUserId === owner.id)).toBe(
        true,
      );
    });

    it("isola por organização: outra organização não vê, não edita e não arquiva", async () => {
      const {
        createCustomer,
        getCustomerDetail,
        listCustomers,
        updateCustomer,
        archiveCustomer,
      } = await import("@/lib/platform/customers");
      const created = await createCustomer(owner, {
        legalName: "Cliente Isolado",
      });
      if (!created.ok) throw new Error("setup");
      const id = created.data.id;

      expect(await getCustomerDetail(outsider, id)).toBeNull();
      expect(
        (await listCustomers(outsider)).some((customer) => customer.id === id),
      ).toBe(false);
      expect(
        (await updateCustomer(outsider, id, { legalName: "Invadido" })).ok,
      ).toBe(false);
      expect((await archiveCustomer(outsider, id)).ok).toBe(false);

      const own = await getCustomerDetail(owner, id);
      expect(own?.legalName).toBe("Cliente Isolado");
    });

    it("recusa ação sem a chave de permissão", async () => {
      const { createCustomer, updateCustomer, listCustomers } =
        await import("@/lib/platform/customers");
      const { PermissionError } =
        await import("@/lib/platform/permission-error");
      const viewer: Actor = {
        ...owner,
        permissions: new Set(["customer.view"]),
      };
      expect(
        (await createCustomer(viewer, { legalName: "Sem permissão" })).ok,
      ).toBe(false);
      expect(
        (await updateCustomer(viewer, "x", { legalName: "Sem permissão" })).ok,
      ).toBe(false);
      const blind: Actor = { ...owner, permissions: new Set<string>() };
      await expect(listCustomers(blind)).rejects.toBeInstanceOf(
        PermissionError,
      );
    });

    it("gerencia contatos e unidades com exclusão lógica", async () => {
      const {
        createCustomer,
        addCustomerContact,
        updateCustomerContact,
        archiveCustomerContact,
        addCustomerUnit,
        archiveCustomerUnit,
        getCustomerDetail,
      } = await import("@/lib/platform/customers");
      const created = await createCustomer(owner, {
        legalName: "Cliente com contatos",
      });
      if (!created.ok) throw new Error("setup");
      const customerId = created.data.id;

      const first = await addCustomerContact(owner, customerId, {
        name: "Maria Souza",
        email: "MARIA@exemplo.com.br",
        isPrimary: true,
      });
      const second = await addCustomerContact(owner, customerId, {
        name: "João Lima",
        isPrimary: true,
      });
      if (!first.ok || !second.ok) throw new Error("contacts");

      let detail = await getCustomerDetail(owner, customerId);
      expect(
        detail?.contacts
          .filter((contact) => contact.isPrimary)
          .map((contact) => contact.name),
      ).toEqual(["João Lima"]);
      expect(
        detail?.contacts.find((contact) => contact.name === "Maria Souza")
          ?.email,
      ).toBe("maria@exemplo.com.br");

      expect(
        (
          await updateCustomerContact(owner, first.data.id, {
            name: "Maria S.",
            isPrimary: true,
          })
        ).ok,
      ).toBe(true);
      detail = await getCustomerDetail(owner, customerId);
      expect(
        detail?.contacts
          .filter((contact) => contact.isPrimary)
          .map((contact) => contact.name),
      ).toEqual(["Maria S."]);

      expect((await archiveCustomerContact(owner, second.data.id)).ok).toBe(
        true,
      );
      detail = await getCustomerDetail(owner, customerId);
      expect(detail?.contacts.map((contact) => contact.name)).toEqual([
        "Maria S.",
      ]);
      expect((await archiveCustomerContact(outsider, first.data.id)).ok).toBe(
        false,
      );

      const { getPrisma } = await import("@/lib/db/prisma");
      const stillThere = await getPrisma().customerContact.findUnique({
        where: { id: second.data.id },
      });
      expect(stillThere?.deletedAt).not.toBeNull();

      const unit = await addCustomerUnit(owner, customerId, {
        name: "Torre B",
        state: "sp",
        postalCode: "01310-100",
      });
      expect(unit.ok).toBe(true);
      if (!unit.ok) return;
      expect(
        (
          await addCustomerUnit(owner, customerId, {
            name: "Ruim",
            state: "ZZ",
          })
        ).ok,
      ).toBe(false);
      expect((await archiveCustomerUnit(owner, unit.data.id)).ok).toBe(true);
      detail = await getCustomerDetail(owner, customerId);
      expect(detail?.units).toHaveLength(0);
    });

    it("calcula totais em centavos, numera e persiste o orçamento", async () => {
      const { createCustomer } = await import("@/lib/platform/customers");
      const { createProposal, getProposalDetail } =
        await import("@/lib/platform/proposals");
      const customer = await createCustomer(owner, {
        legalName: "Cliente do orçamento",
      });
      if (!customer.ok) throw new Error("setup");

      const created = await createProposal(
        owner,
        proposalInput(customer.data.id),
        new Date("2026-11-18T15:00:00Z"),
      );
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      expect(created.data.code).toMatch(/^ORC-2026-\d{4}$/);

      const second = await createProposal(
        owner,
        proposalInput(customer.data.id),
        new Date("2026-11-19T15:00:00Z"),
      );
      if (!second.ok) throw new Error("second");
      expect(Number(second.data.code.slice(-4))).toBe(
        Number(created.data.code.slice(-4)) + 1,
      );

      const detail = await getProposalDetail(owner, created.data.id);
      // 2 × 150,00 + 1,5 × 33,33 (49,995 → 50,00) = 350,00; desconto 10,00; total 340,00
      expect(detail?.items.map((item) => item.totalCents)).toEqual([
        30000, 5000,
      ]);
      expect(detail?.totalCents).toBe(34000);
      expect(detail?.discountCents).toBe(1000);
      expect(detail?.status).toBe("draft");
      expect(Number(detail?.items[1]?.quantity)).toBe(1.5);

      const tooMuch = await createProposal(
        owner,
        proposalInput(customer.data.id, { discountCents: 999999999 }),
      );
      expect(tooMuch).toEqual({
        ok: false,
        message: "O desconto não pode ser maior que o subtotal.",
      });
      const noItems = await createProposal(
        owner,
        proposalInput(customer.data.id, { items: [] }),
      );
      expect(noItems.ok).toBe(false);
    });

    it("recusa orçamento de cliente de outra organização ou arquivado", async () => {
      const { createCustomer, archiveCustomer } =
        await import("@/lib/platform/customers");
      const { createProposal } = await import("@/lib/platform/proposals");
      const foreign = await createCustomer(outsider, {
        legalName: "Cliente externo",
      });
      if (!foreign.ok) throw new Error("setup");
      expect(
        (await createProposal(owner, proposalInput(foreign.data.id))).ok,
      ).toBe(false);

      const own = await createCustomer(owner, {
        legalName: "Cliente a arquivar",
      });
      if (!own.ok) throw new Error("setup");
      expect((await archiveCustomer(owner, own.data.id)).ok).toBe(true);
      expect((await createProposal(owner, proposalInput(own.data.id))).ok).toBe(
        false,
      );

      const unitOwner = await createCustomer(owner, {
        legalName: "Cliente da unidade",
      });
      const unitOther = await createCustomer(owner, {
        legalName: "Outro cliente",
      });
      if (!unitOwner.ok || !unitOther.ok) throw new Error("setup");
      const { addCustomerUnit } = await import("@/lib/platform/customers");
      const unit = await addCustomerUnit(owner, unitOther.data.id, {
        name: "Unidade alheia",
      });
      if (!unit.ok) throw new Error("unit");
      const mismatch = await createProposal(
        owner,
        proposalInput(unitOwner.data.id, { customerUnitId: unit.data.id }),
      );
      expect(mismatch).toEqual({
        ok: false,
        message: "A unidade não pertence a este cliente.",
      });
    });

    it("percorre a máquina de estados: rascunho → enviado → aceito, e gera revisão", async () => {
      const { createCustomer } = await import("@/lib/platform/customers");
      const {
        createProposal,
        updateProposal,
        transitionProposal,
        reviseProposal,
        getProposalDetail,
        archiveProposal,
      } = await import("@/lib/platform/proposals");
      const { getPrisma } = await import("@/lib/db/prisma");
      const customer = await createCustomer(owner, {
        legalName: "Cliente do fluxo",
      });
      if (!customer.ok) throw new Error("setup");
      const created = await createProposal(
        owner,
        proposalInput(customer.data.id),
      );
      if (!created.ok) throw new Error("create");
      const id = created.data.id;

      // não pula etapa
      expect((await transitionProposal(owner, id, "accepted")).ok).toBe(false);
      expect((await transitionProposal(owner, id, "draft")).ok).toBe(false);
      expect((await transitionProposal(owner, id, "inexistente")).ok).toBe(
        false,
      );

      // edita rascunho
      const edited = await updateProposal(
        owner,
        id,
        proposalInput(customer.data.id, {
          title: "Título revisado",
          items: [
            { description: "Único item", quantity: 1, unitPriceCents: 50000 },
          ],
          discountCents: 0,
        }),
      );
      expect(edited.ok).toBe(true);
      const afterEdit = await getProposalDetail(owner, id);
      expect(afterEdit?.title).toBe("Título revisado");
      expect(afterEdit?.items).toHaveLength(1);
      expect(afterEdit?.totalCents).toBe(50000);

      // envia
      const sent = await transitionProposal(owner, id, "sent");
      expect(sent.ok).toBe(true);
      const afterSend = await getProposalDetail(owner, id);
      expect(afterSend?.status).toBe("sent");
      expect(afterSend?.sentAt).not.toBeNull();

      // enviado não edita nem arquiva, nem reenvia
      expect(
        (await updateProposal(owner, id, proposalInput(customer.data.id))).ok,
      ).toBe(false);
      expect((await archiveProposal(owner, id)).ok).toBe(false);
      expect((await transitionProposal(owner, id, "sent")).ok).toBe(false);
      expect((await reviseProposal(owner, id)).ok).toBe(false);

      // aceita
      const accepted = await transitionProposal(owner, id, "accepted");
      expect(accepted.ok).toBe(true);
      const afterAccept = await getProposalDetail(owner, id);
      expect(afterAccept?.status).toBe("accepted");
      expect(afterAccept?.decidedAt).not.toBeNull();

      // aceito não volta
      for (const target of ["draft", "sent", "rejected", "expired"]) {
        expect((await transitionProposal(owner, id, target)).ok).toBe(false);
      }

      // ajuste gera outra proposta, original intacta
      const revised = await reviseProposal(owner, id);
      expect(revised.ok).toBe(true);
      if (!revised.ok) return;
      const revisedDetail = await getProposalDetail(owner, revised.data.id);
      expect(revisedDetail?.status).toBe("draft");
      expect(revisedDetail?.supersedes?.id).toBe(id);
      expect(revisedDetail?.items).toHaveLength(1);
      expect(revisedDetail?.validUntil).toBeNull();
      const original = await getProposalDetail(owner, id);
      expect(original?.status).toBe("accepted");
      expect(original?.successors.map((successor) => successor.id)).toEqual([
        revised.data.id,
      ]);

      // trilha de auditoria da transição
      const transitions = await getPrisma().auditLog.findMany({
        where: { entityId: id, action: "PROPOSAL_STATUS_CHANGED" },
        orderBy: { createdAt: "asc" },
      });
      expect(transitions.map((entry) => entry.metadata)).toEqual([
        { from: "draft", to: "sent" },
        { from: "sent", to: "accepted" },
      ]);

      // rascunho arquiva (exclusão lógica) e some da lista
      expect((await archiveProposal(owner, revised.data.id)).ok).toBe(true);
      expect(await getProposalDetail(owner, revised.data.id)).toBeNull();
      const row = await getPrisma().proposal.findUnique({
        where: { id: revised.data.id },
      });
      expect(row?.deletedAt).not.toBeNull();
    });

    it("recusa com motivo e expira só depois da validade", async () => {
      const { createCustomer } = await import("@/lib/platform/customers");
      const {
        createProposal,
        transitionProposal,
        getProposalDetail,
        reviseProposal,
      } = await import("@/lib/platform/proposals");
      const customer = await createCustomer(owner, {
        legalName: "Cliente da recusa",
      });
      if (!customer.ok) throw new Error("setup");

      const rejectedDraft = await createProposal(
        owner,
        proposalInput(customer.data.id),
      );
      if (!rejectedDraft.ok) throw new Error("create");
      await transitionProposal(owner, rejectedDraft.data.id, "sent");
      const rejected = await transitionProposal(
        owner,
        rejectedDraft.data.id,
        "rejected",
        {
          reason: "Preço acima do orçamento do cliente",
        },
      );
      expect(rejected.ok).toBe(true);
      const rejectedDetail = await getProposalDetail(
        owner,
        rejectedDraft.data.id,
      );
      expect(rejectedDetail?.status).toBe("rejected");
      expect(rejectedDetail?.rejectionReason).toBe(
        "Preço acima do orçamento do cliente",
      );
      expect((await reviseProposal(owner, rejectedDraft.data.id)).ok).toBe(
        true,
      );

      const expiring = await createProposal(
        owner,
        proposalInput(customer.data.id, { validUntil: "2030-06-30" }),
      );
      if (!expiring.ok) throw new Error("create");
      await transitionProposal(owner, expiring.data.id, "sent", {
        now: new Date("2030-01-01T12:00:00Z"),
      });

      const early = await transitionProposal(
        owner,
        expiring.data.id,
        "expired",
        {
          now: new Date("2030-06-30T12:00:00Z"),
        },
      );
      expect(early.ok).toBe(false);

      const lateAccept = await transitionProposal(
        owner,
        expiring.data.id,
        "accepted",
        {
          now: new Date("2030-07-02T12:00:00Z"),
        },
      );
      expect(lateAccept.ok).toBe(false);

      const expired = await transitionProposal(
        owner,
        expiring.data.id,
        "expired",
        {
          now: new Date("2030-07-02T12:00:00Z"),
        },
      );
      expect(expired.ok).toBe(true);
      expect((await getProposalDetail(owner, expiring.data.id))?.status).toBe(
        "expired",
      );
      expect((await reviseProposal(owner, expiring.data.id)).ok).toBe(true);
    });

    it("exige a chave certa por transição e isola por organização", async () => {
      const { createCustomer } = await import("@/lib/platform/customers");
      const {
        createProposal,
        transitionProposal,
        updateProposal,
        listProposals,
        getProposalDetail,
        getProposalHistory,
      } = await import("@/lib/platform/proposals");
      const { PermissionError } =
        await import("@/lib/platform/permission-error");
      const customer = await createCustomer(owner, {
        legalName: "Cliente de permissões",
      });
      if (!customer.ok) throw new Error("setup");
      const created = await createProposal(
        owner,
        proposalInput(customer.data.id),
      );
      if (!created.ok) throw new Error("create");
      const id = created.data.id;

      const editor: Actor = {
        ...owner,
        permissions: new Set(["proposal.view", "proposal.update"]),
      };
      expect((await transitionProposal(editor, id, "sent")).ok).toBe(false);
      expect(
        (await updateProposal(editor, id, proposalInput(customer.data.id))).ok,
      ).toBe(true);

      const sender: Actor = {
        ...owner,
        permissions: new Set(["proposal.view", "proposal.send"]),
      };
      expect((await transitionProposal(sender, id, "sent")).ok).toBe(true);
      expect((await transitionProposal(sender, id, "accepted")).ok).toBe(false);

      const approver: Actor = {
        ...owner,
        permissions: new Set(["proposal.view", "proposal.approve"]),
      };
      expect((await transitionProposal(approver, id, "accepted")).ok).toBe(
        true,
      );

      expect(await getProposalDetail(outsider, id)).toBeNull();
      expect(
        (await listProposals(outsider)).some((proposal) => proposal.id === id),
      ).toBe(false);
      expect((await transitionProposal(outsider, id, "rejected")).ok).toBe(
        false,
      );

      const noAudit: Actor = {
        ...owner,
        permissions: new Set(["proposal.view"]),
      };
      await expect(getProposalHistory(noAudit, id)).rejects.toBeInstanceOf(
        PermissionError,
      );
      const history = await getProposalHistory(owner, id);
      expect(history.map((entry) => entry.action)).toContain(
        "PROPOSAL_STATUS_CHANGED",
      );
    });

    it("o painel lê do banco e respeita a organização", async () => {
      const { getProposalSummary } = await import("@/lib/platform/proposals");
      const { countActiveCustomers } = await import("@/lib/platform/customers");
      const summary = await getProposalSummary(owner);
      expect(summary.totalCount).toBeGreaterThan(0);
      expect(summary.byStatus.accepted.count).toBeGreaterThan(0);
      expect(summary.byStatus.accepted.totalCents).toBeGreaterThan(0);
      expect(summary.byStatus.draft.count).toBeGreaterThan(0);

      const empty = await getProposalSummary(outsider);
      expect(empty.totalCount).toBe(0);

      const future = await getProposalSummary(
        owner,
        new Date("2099-01-01T00:00:00Z"),
      );
      expect(future.sentPastValidity).toBeGreaterThanOrEqual(0);

      expect(await countActiveCustomers(owner)).toBeGreaterThan(0);
      // A organização externa só tem o cliente criado no teste de isolamento.
    expect(await countActiveCustomers(outsider)).toBe(1);
    });

    it("impede arquivar cliente com orçamento em andamento e restaura", async () => {
      const {
        createCustomer,
        archiveCustomer,
        restoreCustomer,
        getCustomerDetail,
        listCustomers,
      } = await import("@/lib/platform/customers");
      const { createProposal, archiveProposal } =
        await import("@/lib/platform/proposals");
      const customer = await createCustomer(owner, {
        legalName: "Cliente arquivável",
        document: "529.982.247-25",
      });
      if (!customer.ok) throw new Error("setup");
      const proposal = await createProposal(
        owner,
        proposalInput(customer.data.id),
      );
      if (!proposal.ok) throw new Error("create");

      const blocked = await archiveCustomer(owner, customer.data.id);
      expect(blocked.ok).toBe(false);

      expect((await archiveProposal(owner, proposal.data.id)).ok).toBe(true);
      expect((await archiveCustomer(owner, customer.data.id)).ok).toBe(true);
      expect(
        (await listCustomers(owner)).some(
          (item) => item.id === customer.data.id,
        ),
      ).toBe(false);
      expect(
        (await listCustomers(owner, { includeArchived: true })).some(
          (item) => item.id === customer.data.id,
        ),
      ).toBe(true);

      // documento liberado pelo arquivamento, e a restauração confere de novo
      const reused = await createCustomer(owner, {
        legalName: "Reaproveita CPF",
        document: "52998224725",
      });
      expect(reused.ok).toBe(true);
      const restoreBlocked = await restoreCustomer(owner, customer.data.id);
      expect(restoreBlocked.ok).toBe(false);

      if (reused.ok) {
        const { archiveCustomer: archiveAgain } =
          await import("@/lib/platform/customers");
        await archiveAgain(owner, reused.data.id);
      }
      expect((await restoreCustomer(owner, customer.data.id)).ok).toBe(true);
      expect(
        (await getCustomerDetail(owner, customer.data.id))?.deletedAt,
      ).toBeNull();
    });
  },
);
