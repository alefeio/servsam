import { describe, expect, it } from "vitest";
import { seedGrantsFor } from "@/lib/platform/permissions";
import {
  confirmReceiptSchema,
  createBillingRequestSchema,
  createReceiptEntrySchema,
} from "@/lib/platform/finance-schemas";

describe("FIN-F0 permissões e schemas", () => {
  it("Administrativo solicita sem confirmar; Financeiro confirma", () => {
    const admin = new Set(seedGrantsFor("ADMINISTRATIVO").map((g) => g.key));
    const finance = new Set(seedGrantsFor("FINANCEIRO").map((g) => g.key));
    const gerencia = new Set(seedGrantsFor("GERENCIA").map((g) => g.key));

    expect(admin.has("contract.manage")).toBe(true);
    expect(admin.has("finance.manage")).toBe(false);
    expect(finance.has("finance.manage")).toBe(true);
    expect(finance.has("finance.view")).toBe(true);
    expect(gerencia.has("finance.manage")).toBe(false);
    expect(gerencia.has("contract.view")).toBe(true);
  });

  it("rejeita valores inválidos e exige data", () => {
    expect(
      createReceiptEntrySchema.safeParse({
        engagementId: "e1",
        kind: "signal",
        amountCents: 0,
        referenceDate: "2026-11-25",
      }).success,
    ).toBe(false);
    expect(
      createReceiptEntrySchema.safeParse({
        engagementId: "e1",
        kind: "signal",
        amountCents: -10,
        referenceDate: "2026-11-25",
      }).success,
    ).toBe(false);
    expect(
      createReceiptEntrySchema.safeParse({
        engagementId: "e1",
        kind: "signal",
        amountCents: 15000,
        referenceDate: "25/11/2026",
      }).success,
    ).toBe(false);
    expect(
      createReceiptEntrySchema.safeParse({
        engagementId: "e1",
        kind: "signal",
        amountCents: 15000,
        referenceDate: "2026-11-25",
      }).success,
    ).toBe(true);
  });

  it("aceita solicitação fiscal com valor de referência opcional", () => {
    expect(
      createBillingRequestSchema.safeParse({
        engagementId: "e1",
        description: "Providências de NF",
      }).success,
    ).toBe(true);
    expect(
      confirmReceiptSchema.safeParse({
        receiptEntryId: "r1",
        confirmedAmountCents: 100,
      }).success,
    ).toBe(true);
  });
});
