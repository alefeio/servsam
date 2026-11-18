export const AWAITING_SCHEDULE_LABEL = "Emitida, aguardando agendamento";

export function formatWorkOrderSchedule(dateIso?: string): string {
  if (!dateIso) {
    return AWAITING_SCHEDULE_LABEL;
  }
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    return AWAITING_SCHEDULE_LABEL;
  }
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatWorkOrderScheduleDay(dateIso?: string): string {
  return dateIso?.slice(0, 10) ?? "sem data";
}

/** Converte ISO local ("2026-09-02T08:30:00") para o valor de input datetime-local. */
export function toDatetimeLocalValue(dateIso?: string): string {
  return dateIso?.slice(0, 16) ?? "";
}

/** Valor de datetime-local ("2026-09-02T08:30") para ISO local sem fuso. */
export function fromDatetimeLocalValue(value: string): string {
  return value.length === 16 ? `${value}:00` : value;
}
