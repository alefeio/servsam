import { describe, expect, it } from "vitest";
import { seedGrantsFor } from "@/lib/platform/permissions";
import {
  confirmReceiptSchema,
  createBillingRequestSchema,
  createReceiptEntrySchema,
} from "@/lib/platform/finance-schemas";
import {
  parseConfirmedCentsField,
  parseOptionalReferenceReais,
} from "@/lib/platform/finance-parse";
import { isValidCalendarDate, parseBelemDayBound } from "@/lib/platform/finance";
import { MAX_CENTS, parseBrlToCents } from "@/lib/platform/money";

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

  it("rejeita valores inválidos e exige data de calendário real", () => {
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
        amountCents: 15000,
        referenceDate: "2026-02-31",
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
    expect(isValidCalendarDate("2026-02-31")).toBe(false);
    expect(isValidCalendarDate("2026-02-28")).toBe(true);
  });

  it("exige confirmedAmountCents explícito", () => {
    expect(
      confirmReceiptSchema.safeParse({
        receiptEntryId: "r1",
      }).success,
    ).toBe(false);
    expect(
      confirmReceiptSchema.safeParse({
        receiptEntryId: "r1",
        confirmedAmountCents: 100,
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
  });
});

describe("FIN-F0 parsers monetários", () => {
  it("parseBrlToCents cobre formatos BR e rejeita inválidos", () => {
    expect(parseBrlToCents("10,50")).toEqual({ ok: true, cents: 1050 });
    expect(parseBrlToCents("10.50")).toEqual({ ok: true, cents: 1050 });
    expect(parseBrlToCents("1.234,56")).toEqual({ ok: true, cents: 123456 });
    expect(parseBrlToCents("10,555").ok).toBe(false);
    expect(parseBrlToCents("abc").ok).toBe(false);
    expect(parseBrlToCents(String(MAX_CENTS / 100 + 1)).ok).toBe(false);
  });

  it("parseOptionalReferenceReais e confirmed cents", () => {
    expect(parseOptionalReferenceReais("").ok).toBe(true);
    expect(parseOptionalReferenceReais("10,50")).toEqual({
      ok: true,
      cents: 1050,
    });
    expect(parseOptionalReferenceReais("10,555").ok).toBe(false);
    expect(parseConfirmedCentsField("1050")).toEqual({ ok: true, cents: 1050 });
    expect(parseConfirmedCentsField("10,50").ok).toBe(false);
    expect(parseConfirmedCentsField("").ok).toBe(false);
  });

  it("limites America/Belem", () => {
    const start = parseBelemDayBound("2026-11-25", false);
    const end = parseBelemDayBound("2026-11-25", true);
    expect(start?.toISOString()).toBe("2026-11-25T03:00:00.000Z");
    expect(end?.toISOString()).toBe("2026-11-26T03:00:00.000Z");
    expect(parseBelemDayBound("2026-02-31", false)).toBeUndefined();
  });
});
