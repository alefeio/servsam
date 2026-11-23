import type {
  ContactInput,
  CustomerInput,
  UnitInput,
} from "@/lib/platform/customer-schemas";
import { parseBrlToCents } from "@/lib/platform/money";
import type { PurchaseOrderInput } from "@/lib/platform/purchase-order-schemas";
import type { ProposalInput } from "@/lib/platform/proposal-schemas";

/** Leitura de FormData em objetos tipados. Validação de regra fica nos schemas Zod. */

type FormSource = {
  get(name: string): unknown;
  getAll(name: string): unknown[];
};

function text(form: FormSource, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

export function parseCustomerForm(form: FormSource): CustomerInput {
  return {
    legalName: text(form, "legalName"),
    tradeName: text(form, "tradeName"),
    document: text(form, "document"),
    segment: text(form, "segment"),
    notes: text(form, "notes"),
  };
}

export function parseContactForm(form: FormSource): ContactInput {
  return {
    name: text(form, "name"),
    roleTitle: text(form, "roleTitle"),
    email: text(form, "email"),
    phone: text(form, "phone"),
    isPrimary:
      text(form, "isPrimary") === "on" || text(form, "isPrimary") === "true",
  };
}

export function parseUnitForm(form: FormSource): UnitInput {
  return {
    name: text(form, "name"),
    addressLine: text(form, "addressLine"),
    city: text(form, "city"),
    state: text(form, "state"),
    postalCode: text(form, "postalCode"),
    notes: text(form, "notes"),
  };
}

export type ProposalFormResult =
  { ok: true; input: ProposalInput } | { ok: false; message: string };

function parseQuantity(raw: string): number | null {
  const normalized = raw.trim().replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,3})?$/.test(normalized)) return null;
  return Number(normalized);
}

export function parseProposalForm(form: FormSource): ProposalFormResult {
  const descriptions = form.getAll("itemDescription").map(String);
  const quantities = form.getAll("itemQuantity").map(String);
  const prices = form.getAll("itemUnitPrice").map(String);

  const items: ProposalInput["items"] = [];
  for (let index = 0; index < descriptions.length; index += 1) {
    const description = descriptions[index]?.trim() ?? "";
    const quantityRaw = quantities[index]?.trim() ?? "";
    const priceRaw = prices[index]?.trim() ?? "";
    if (!description && !quantityRaw && !priceRaw) continue;

    const quantity = parseQuantity(quantityRaw);
    if (quantity === null) {
      return {
        ok: false,
        message: `Item ${items.length + 1}: quantidade inválida.`,
      };
    }
    const price = parseBrlToCents(priceRaw);
    if (!price.ok) {
      return {
        ok: false,
        message: `Item ${items.length + 1}: valor unitário inválido.`,
      };
    }
    items.push({ description, quantity, unitPriceCents: price.cents });
  }

  const discountRaw = text(form, "discount").trim();
  let discountCents = 0;
  if (discountRaw) {
    const discount = parseBrlToCents(discountRaw);
    if (!discount.ok) return { ok: false, message: "Desconto inválido." };
    discountCents = discount.cents;
  }

  return {
    ok: true,
    input: {
      customerId: text(form, "customerId"),
      customerUnitId: text(form, "customerUnitId"),
      title: text(form, "title"),
      validUntil: text(form, "validUntil"),
      paymentTerms: text(form, "paymentTerms"),
      commercialConditions: text(form, "commercialConditions"),
      observations: text(form, "observations"),
      discountCents,
      items,
    },
  };
}

export type PurchaseOrderFormResult =
  | { ok: true; input: PurchaseOrderInput }
  | { ok: false; message: string };

export function parsePurchaseOrderForm(
  form: FormSource,
): PurchaseOrderFormResult {
  const descriptions = form.getAll("itemDescription").map(String);
  const quantities = form.getAll("itemQuantity").map(String);
  const prices = form.getAll("itemUnitPrice").map(String);

  const items: PurchaseOrderInput["items"] = [];
  for (let index = 0; index < descriptions.length; index += 1) {
    const description = descriptions[index]?.trim() ?? "";
    const quantityRaw = quantities[index]?.trim() ?? "";
    const priceRaw = prices[index]?.trim() ?? "";
    if (!description && !quantityRaw && !priceRaw) continue;

    const quantity = parseQuantity(quantityRaw);
    if (quantity === null) {
      return {
        ok: false,
        message: `Item ${items.length + 1}: quantidade inválida.`,
      };
    }
    const price = parseBrlToCents(priceRaw);
    if (!price.ok) {
      return {
        ok: false,
        message: `Item ${items.length + 1}: valor unitário inválido.`,
      };
    }
    items.push({ description, quantity, unitPriceCents: price.cents });
  }

  const agreedRaw = text(form, "agreedAmount").trim();
  let agreedAmountCents: number | undefined;
  if (agreedRaw) {
    const agreed = parseBrlToCents(agreedRaw);
    if (!agreed.ok) return { ok: false, message: "Valor acordado inválido." };
    agreedAmountCents = agreed.cents;
  }

  return {
    ok: true,
    input: {
      customerId: text(form, "customerId"),
      customerUnitId: text(form, "customerUnitId"),
      externalNumber: text(form, "externalNumber"),
      receivedAt: text(form, "receivedAt"),
      description: text(form, "description"),
      observations: text(form, "observations"),
      documentReference: text(form, "documentReference"),
      agreedAmountCents,
      items,
    },
  };
}
