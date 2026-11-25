import { parseBrlToCents } from "@/lib/platform/money";

/**
 * Campo de centavos inteiros (confirmação financeira).
 * Não aplica heurística de reais — rejeita texto monetário formatado.
 */
export function parseConfirmedCentsField(
  raw: string,
): { ok: true; cents: number } | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: "Informe o valor confirmado em centavos." };
  }
  if (!/^\d+$/.test(trimmed)) {
    return {
      ok: false,
      message:
        "Valor confirmado deve ser inteiro em centavos (somente dígitos).",
    };
  }
  const cents = Number(trimmed);
  if (!Number.isSafeInteger(cents) || cents <= 0) {
    return { ok: false, message: "Valor confirmado inválido." };
  }
  return { ok: true, cents };
}

export function parseOptionalReferenceReais(
  raw: string,
): { ok: true; cents: number | undefined } | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, cents: undefined };
  const parsed = parseBrlToCents(trimmed);
  if (!parsed.ok) {
    return {
      ok: false,
      message: "Valor de referência inválido. Use o formato 1.234,56.",
    };
  }
  if (parsed.cents <= 0) {
    return { ok: false, message: "Valor de referência deve ser maior que zero." };
  }
  return { ok: true, cents: parsed.cents };
}
