import { describe, expect, it } from "vitest";
import { formatEngagementCode } from "@/lib/platform/engagements";
import {
  createEngagementFromProposalSchema,
  createEngagementFromPurchaseOrderSchema,
} from "@/lib/platform/engagement-schemas";
import { formatPurchaseOrderCode } from "@/lib/platform/purchase-orders";
import { purchaseOrderInputSchema } from "@/lib/platform/purchase-order-schemas";
import { seedGrantsFor } from "@/lib/platform/permissions";

describe("numeração comercial 11B.1", () => {
  it("formata CTR e OC com ano e sequência", () => {
    expect(formatEngagementCode(2026, 1)).toBe("CTR-2026-0001");
    expect(formatEngagementCode(2026, 42)).toBe("CTR-2026-0042");
    expect(formatPurchaseOrderCode(2026, 7)).toBe("OC-2026-0007");
  });
});

describe("schemas de contratação e O.C.", () => {
  it("exige orçamento ou O.C. para gerar contratação", () => {
    expect(
      createEngagementFromProposalSchema.safeParse({ proposalId: "p1" })
        .success,
    ).toBe(true);
    expect(
      createEngagementFromProposalSchema.safeParse({ proposalId: "" }).success,
    ).toBe(false);
    expect(
      createEngagementFromPurchaseOrderSchema.safeParse({
        purchaseOrderId: "oc1",
      }).success,
    ).toBe(true);
  });

  it("valida O.C. recebida com itens e data", () => {
    const base = {
      customerId: "c1",
      externalNumber: "12345",
      receivedAt: "2026-11-20",
      description: "Serviços de controle de pragas",
      items: [
        {
          description: "Aplicação mensal",
          quantity: 1,
          unitPriceCents: 10000,
        },
      ],
    };
    expect(purchaseOrderInputSchema.safeParse(base).success).toBe(true);
    expect(
      purchaseOrderInputSchema.safeParse({ ...base, items: [] }).success,
    ).toBe(false);
    expect(
      purchaseOrderInputSchema.safeParse({
        ...base,
        receivedAt: "20/11/2026",
      }).success,
    ).toBe(false);
    expect(
      purchaseOrderInputSchema.safeParse({
        ...base,
        externalNumber: "",
      }).success,
    ).toBe(false);
  });
});

describe("permissões de contratação no seed", () => {
  it("Administrativo opera visualização e gestão de contrato", () => {
    const granted = new Set(
      seedGrantsFor("ADMINISTRATIVO").map((grant) => grant.key),
    );
    expect(granted.has("contract.view")).toBe(true);
    expect(granted.has("contract.manage")).toBe(true);
  });
});
