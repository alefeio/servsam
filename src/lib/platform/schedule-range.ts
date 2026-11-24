import {
  SCHEDULE_TIME_ZONE,
  toDateInputValue,
} from "@/lib/platform/dates";

export type AgendaView = "day" | "week" | "month";

export function isAgendaView(value: string): value is AgendaView {
  return value === "day" || value === "week" || value === "month";
}

/** Interpreta YYYY-MM-DD como meia-noite em America/Belem (UTC−3). */
export function startOfScheduleDay(dateOnly: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null;
  const parsed = new Date(`${dateOnly}T00:00:00.000-03:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/** Segunda-feira da semana civil em America/Belem. */
export function startOfScheduleWeek(anchor: Date): Date {
  const dateOnly = formatScheduleDateOnly(anchor);
  const start = startOfScheduleDay(dateOnly)!;
  const idx = weekdayIndex(start);
  const delta = idx === 0 ? -6 : 1 - idx;
  return addDays(start, delta);
}

function weekdayIndex(date: Date): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: SCHEDULE_TIME_ZONE,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[name] ?? 0;
}

export function formatScheduleDateOnly(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHEDULE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function resolveAgendaWindow(
  view: AgendaView,
  focusDateOnly: string,
): { from: Date; to: Date; label: string } {
  const focus =
    startOfScheduleDay(focusDateOnly) ??
    startOfScheduleDay(formatScheduleDateOnly(new Date()))!;

  if (view === "day") {
    return {
      from: focus,
      to: addDays(focus, 1),
      label: new Intl.DateTimeFormat("pt-BR", {
        timeZone: SCHEDULE_TIME_ZONE,
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(focus),
    };
  }

  if (view === "week") {
    const from = startOfScheduleWeek(focus);
    return {
      from,
      to: addDays(from, 7),
      label: `Semana de ${formatScheduleDateOnly(from)}`,
    };
  }

  const ymd = formatScheduleDateOnly(focus);
  const [y, m] = ymd.split("-").map(Number);
  const from = new Date(
    `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-01T00:00:00.000-03:00`,
  );
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  const to = new Date(
    `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01T00:00:00.000-03:00`,
  );
  return {
    from,
    to,
    label: new Intl.DateTimeFormat("pt-BR", {
      timeZone: SCHEDULE_TIME_ZONE,
      month: "long",
      year: "numeric",
    }).format(from),
  };
}

export function shiftFocusDate(
  focusDateOnly: string,
  view: AgendaView,
  direction: -1 | 1,
): string {
  const focus =
    startOfScheduleDay(focusDateOnly) ??
    startOfScheduleDay(formatScheduleDateOnly(new Date()))!;
  if (view === "day") {
    return formatScheduleDateOnly(addDays(focus, direction));
  }
  if (view === "week") {
    return formatScheduleDateOnly(addDays(focus, direction * 7));
  }
  const [y, m] = focusDateOnly.split("-").map(Number);
  let month = m + direction;
  let year = y;
  if (month < 1) {
    month = 12;
    year -= 1;
  } else if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
}

/** Mantém compatibilidade com helpers de data de negócio quando necessário. */
export function todayScheduleDateOnly(now: Date = new Date()): string {
  return formatScheduleDateOnly(now);
}

export { toDateInputValue };
