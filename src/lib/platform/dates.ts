/** Datas de negócio no fuso de Brasília. O banco guarda instantes UTC. */

export const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

/** Apresentação da agenda operacional (Sprint 11B.3). Belém = UTC−3 o ano todo. */
export const SCHEDULE_TIME_ZONE = "America/Belem";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-12-31" vira o último instante daquele dia em Brasília (UTC-3, sem horário de verão desde 2019). */
export function endOfBusinessDay(dateOnly: string): Date | null {
  if (!DATE_ONLY.test(dateOnly)) return null;
  const parsed = new Date(`${dateOnly}T23:59:59.999-03:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  const roundTrip = toDateInputValue(parsed);
  return roundTrip === dateOnly ? parsed : null;
}

/** Valor para `<input type="date">` no fuso de Brasília. */
export function toDateInputValue(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDateBr(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BUSINESS_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeBr(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BUSINESS_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Data/hora da agenda em America/Belem. */
export function formatScheduleDateTime(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SCHEDULE_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Valor para `<input type="datetime-local">` no fuso da agenda. */
export function toScheduleDateTimeLocalValue(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHEDULE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/**
 * Interpreta `YYYY-MM-DDTHH:mm` como horário civil em America/Belem (UTC−3).
 * Retorna instante UTC para persistência.
 */
export function parseScheduleDateTimeLocal(
  value: string,
): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d, h, min] = match;
  const parsed = new Date(
    `${y}-${m}-${d}T${h}:${min}:00.000-03:00`,
  );
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function businessYear(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: BUSINESS_TIME_ZONE,
      year: "numeric",
    }).format(date),
  );
}
