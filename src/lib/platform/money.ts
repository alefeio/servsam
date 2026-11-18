/**
 * Dinheiro da produção em centavos (inteiro). Nunca float em banco ou em regra.
 * Quantidade de item é decimal com até 3 casas e entra no cálculo como milésimos.
 */

/** Teto de um valor em centavos: cabe em INTEGER do PostgreSQL. */
export const MAX_CENTS = 2_000_000_000;

export type CentsParseResult = { ok: true; cents: number } | { ok: false };

/**
 * Aceita "1234,56", "1.234,56", "1234.56" e "R$ 1.234,56".
 * Rejeita mais de duas casas e valores acima do teto.
 */
export function parseBrlToCents(input: string): CentsParseResult {
  const cleaned = input.replace(/R\$/gi, "").replace(/\s/g, "");
  if (cleaned === "") return { ok: false };
  if (
    !/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$|^\d+\.\d{1,2}$/.test(
      cleaned,
    )
  ) {
    return { ok: false };
  }

  let normalized: string;
  if (cleaned.includes(",")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/^\d+\.\d{1,2}$/.test(cleaned)) {
    normalized = cleaned;
  } else {
    normalized = cleaned.replace(/\./g, "");
  }

  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > MAX_CENTS) return { ok: false };
  return { ok: true, cents };
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/** Valor para preencher campo de formulário ("1234,56"). */
export function centsToInputValue(cents: number): string {
  const whole = Math.trunc(cents / 100);
  const fraction = String(Math.abs(cents % 100)).padStart(2, "0");
  return `${whole},${fraction}`;
}

export function toMilli(quantity: number | string): number {
  const value =
    typeof quantity === "string"
      ? Number(quantity.replace(",", "."))
      : quantity;
  return Math.round(value * 1000);
}

/** Total de uma linha: round(quantidade × preço unitário), em centavos. */
export function lineTotalCents(
  quantity: number | string,
  unitPriceCents: number,
): number {
  const milli = BigInt(toMilli(quantity));
  const total = (milli * BigInt(unitPriceCents) + BigInt(500)) / BigInt(1000);
  return Number(total);
}

export type LineInput = { quantity: number | string; unitPriceCents: number };

export type ProposalTotals =
  | {
      ok: true;
      subtotalCents: number;
      discountCents: number;
      totalCents: number;
    }
  | { ok: false; reason: "overflow" | "discount_exceeds_subtotal" };

export function computeProposalTotals(
  lines: readonly LineInput[],
  discountCents: number,
): ProposalTotals {
  let subtotal = 0;
  for (const line of lines) {
    const total = lineTotalCents(line.quantity, line.unitPriceCents);
    if (total > MAX_CENTS) return { ok: false, reason: "overflow" };
    subtotal += total;
    if (subtotal > MAX_CENTS) return { ok: false, reason: "overflow" };
  }
  if (discountCents > subtotal)
    return { ok: false, reason: "discount_exceeds_subtotal" };
  return {
    ok: true,
    subtotalCents: subtotal,
    discountCents,
    totalCents: subtotal - discountCents,
  };
}
