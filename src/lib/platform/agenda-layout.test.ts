import { describe, expect, it } from "vitest";
import {
  eventsByDayKey,
  positionEventsForDay,
  type AgendaEventInput,
} from "@/lib/platform/agenda-layout";
import { parseScheduleDateTimeLocal } from "@/lib/platform/dates";
import {
  resolveAgendaWindow,
  formatScheduleDateOnly,
} from "@/lib/platform/schedule-range";

function event(
  id: string,
  start: string,
  end: string,
): AgendaEventInput {
  return {
    id,
    startsAt: parseScheduleDateTimeLocal(start)!,
    endsAt: parseScheduleDateTimeLocal(end)!,
    serviceOrder: {
      id: `os-${id}`,
      code: `OS-${id}`,
      description: "Serviço",
      customer: { legalName: "Cliente" },
    },
    employee: { fullName: "Carla" },
  };
}

describe("filtro visual e janelas Belém", () => {
  it("compromisso 23h–02h aparece nos dois dias", () => {
    const overnight = event("1", "2026-11-25T23:00", "2026-11-26T02:00");
    const byDay = eventsByDayKey([overnight]);
    expect(byDay.has("2026-11-25")).toBe(true);
    expect(byDay.has("2026-11-26")).toBe(true);
  });

  it("posiciona sobreposições em colunas distintas", () => {
    const a = event("a", "2026-11-25T08:00", "2026-11-25T10:00");
    const b = event("b", "2026-11-25T09:00", "2026-11-25T11:00");
    const positioned = positionEventsForDay([a, b], "2026-11-25");
    expect(positioned).toHaveLength(2);
    const columns = new Set(positioned.map((row) => row.column));
    expect(columns.size).toBe(2);
  });

  it("limites exatos de dia/semana/mês em America/Belem", () => {
    const day = resolveAgendaWindow("day", "2026-11-25");
    expect(formatScheduleDateOnly(day.from)).toBe("2026-11-25");
    expect(formatScheduleDateOnly(day.to)).toBe("2026-11-26");

    const week = resolveAgendaWindow("week", "2026-11-25");
    expect(formatScheduleDateOnly(week.from)).toBe("2026-11-23");
    expect(formatScheduleDateOnly(week.to)).toBe("2026-11-30");

    const month = resolveAgendaWindow("month", "2026-11-25");
    expect(formatScheduleDateOnly(month.from)).toBe("2026-11-01");
    expect(formatScheduleDateOnly(month.to)).toBe("2026-12-01");
  });
});
