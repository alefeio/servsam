import {
  formatScheduleDateOnly,
  startOfScheduleDay,
  startOfScheduleWeek,
} from "@/lib/platform/schedule-range";
import { SCHEDULE_TIME_ZONE } from "@/lib/platform/dates";

export const AGENDA_DAY_START_HOUR = 6;
export const AGENDA_DAY_END_HOUR = 22;
export const AGENDA_HOUR_PX = 48;

export type AgendaEventInput = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  serviceOrder: {
    id: string;
    code: string;
    description: string;
    customer: { legalName: string };
  };
  employee: { fullName: string } | null;
};

export type PositionedAgendaEvent = AgendaEventInput & {
  topPx: number;
  heightPx: number;
  column: number;
  columnCount: number;
  dayKey: string;
  clippedStart: Date;
  clippedEnd: Date;
};

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function minutesFromDayStart(date: Date, dayStart: Date): number {
  return (date.getTime() - dayStart.getTime()) / 60_000;
}

export function hourLabels(): number[] {
  const hours: number[] = [];
  for (let hour = AGENDA_DAY_START_HOUR; hour <= AGENDA_DAY_END_HOUR; hour += 1) {
    hours.push(hour);
  }
  return hours;
}

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function weekDayKeys(from: Date): string[] {
  const start = startOfScheduleWeek(from);
  return Array.from({ length: 7 }, (_, index) =>
    formatScheduleDateOnly(addDays(start, index)),
  );
}

export function monthCellKeys(from: Date): string[] {
  const monthStart = startOfScheduleDay(formatScheduleDateOnly(from))!;
  const gridStart = startOfScheduleWeek(monthStart);
  return Array.from({ length: 42 }, (_, index) =>
    formatScheduleDateOnly(addDays(gridStart, index)),
  );
}

export function weekdayShortLabel(dateOnly: string): string {
  const start = startOfScheduleDay(dateOnly)!;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SCHEDULE_TIME_ZONE,
    weekday: "short",
    day: "2-digit",
  }).format(start);
}

/**
 * Posiciona eventos em um dia civil (Belém), cortando ao intervalo visível 06–22.
 * Sobreposições recebem colunas distintas.
 */
export function positionEventsForDay(
  events: AgendaEventInput[],
  dayKey: string,
): PositionedAgendaEvent[] {
  const dayStart = startOfScheduleDay(dayKey)!;
  const dayEnd = addDays(dayStart, 1);
  const visibleStart = new Date(
    dayStart.getTime() + AGENDA_DAY_START_HOUR * 3_600_000,
  );
  const visibleEnd = new Date(
    dayStart.getTime() + AGENDA_DAY_END_HOUR * 3_600_000,
  );

  const intersecting = events
    .filter(
      (event) =>
        event.startsAt.getTime() < dayEnd.getTime() &&
        event.endsAt.getTime() > dayStart.getTime(),
    )
    .map((event) => {
      const clippedStart = new Date(
        Math.max(event.startsAt.getTime(), visibleStart.getTime()),
      );
      const clippedEnd = new Date(
        Math.min(event.endsAt.getTime(), visibleEnd.getTime()),
      );
      const startMin = Math.max(
        0,
        minutesFromDayStart(clippedStart, visibleStart),
      );
      const endMin = Math.max(
        startMin + 20,
        minutesFromDayStart(clippedEnd, visibleStart),
      );
      return {
        ...event,
        dayKey,
        clippedStart,
        clippedEnd,
        topPx: (startMin / 60) * AGENDA_HOUR_PX,
        heightPx: ((endMin - startMin) / 60) * AGENDA_HOUR_PX,
        column: 0,
        columnCount: 1,
      };
    })
    .filter((event) => event.clippedEnd > event.clippedStart)
    .sort(
      (a, b) =>
        a.clippedStart.getTime() - b.clippedStart.getTime() ||
        b.clippedEnd.getTime() - a.clippedEnd.getTime(),
    );

  const active: { end: number; column: number }[] = [];
  let clusterMax = 0;
  const assigned: PositionedAgendaEvent[] = [];

  for (const event of intersecting) {
    const start = event.clippedStart.getTime();
    const end = event.clippedEnd.getTime();
    for (let i = active.length - 1; i >= 0; i -= 1) {
      if (active[i]!.end <= start) active.splice(i, 1);
    }
    const used = new Set(active.map((row) => row.column));
    let column = 0;
    while (used.has(column)) column += 1;
    active.push({ end, column });
    clusterMax = Math.max(clusterMax, active.length);
    assigned.push({ ...event, column, columnCount: 1 });
  }

  for (let i = 0; i < assigned.length; i += 1) {
    const current = assigned[i]!;
    let maxCols = current.column + 1;
    for (let j = 0; j < assigned.length; j += 1) {
      if (i === j) continue;
      const other = assigned[j]!;
      const overlaps =
        current.clippedStart < other.clippedEnd &&
        current.clippedEnd > other.clippedStart;
      if (overlaps) {
        maxCols = Math.max(maxCols, other.column + 1, current.column + 1);
      }
    }
    assigned[i] = { ...current, columnCount: Math.max(maxCols, clusterMax, 1) };
  }

  return assigned;
}

export function eventsByDayKey(
  events: AgendaEventInput[],
): Map<string, AgendaEventInput[]> {
  const map = new Map<string, AgendaEventInput[]>();
  for (const event of events) {
    const startKey = formatScheduleDateOnly(event.startsAt);
    const endKey = formatScheduleDateOnly(
      new Date(event.endsAt.getTime() - 1),
    );
    let cursor = startOfScheduleDay(startKey)!;
    const last = startOfScheduleDay(endKey)!;
    while (cursor.getTime() <= last.getTime()) {
      const key = formatScheduleDateOnly(cursor);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
      cursor = addDays(cursor, 1);
    }
  }
  return map;
}
