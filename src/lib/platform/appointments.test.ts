import { describe, expect, it } from "vitest";
import { CONFLICT_MESSAGE } from "@/lib/platform/appointment-constants";
import {
  cancelAppointmentSchema,
  createAppointmentSchema,
  rescheduleAppointmentSchema,
} from "@/lib/platform/appointment-schemas";
import {
  parseScheduleDateTimeLocal,
  toScheduleDateTimeLocalValue,
} from "@/lib/platform/dates";
import { seedGrantsFor } from "@/lib/platform/permissions";
import {
  canScheduleServiceOrder,
  canTransitionServiceOrder,
} from "@/lib/platform/service-order-state";
import {
  formatScheduleDateOnly,
  isAgendaView,
  resolveAgendaWindow,
  startOfScheduleWeek,
} from "@/lib/platform/schedule-range";

describe("schemas de agendamento (11B.3)", () => {
  it("exige janela e OS", () => {
    expect(
      createAppointmentSchema.safeParse({
        serviceOrderId: "os1",
        startsAtLocal: "2026-11-25T08:00",
        endsAtLocal: "2026-11-25T10:00",
      }).success,
    ).toBe(true);
    expect(
      createAppointmentSchema.safeParse({
        serviceOrderId: "",
        startsAtLocal: "2026-11-25T08:00",
        endsAtLocal: "2026-11-25T10:00",
      }).success,
    ).toBe(false);
  });

  it("exige motivo em remarcação e cancelamento", () => {
    expect(
      rescheduleAppointmentSchema.safeParse({
        appointmentId: "a1",
        startsAtLocal: "2026-11-26T08:00",
        endsAtLocal: "2026-11-26T09:00",
        reason: "Cliente pediu",
      }).success,
    ).toBe(true);
    expect(
      rescheduleAppointmentSchema.safeParse({
        appointmentId: "a1",
        startsAtLocal: "2026-11-26T08:00",
        endsAtLocal: "2026-11-26T09:00",
        reason: "ab",
      }).success,
    ).toBe(false);
    expect(
      cancelAppointmentSchema.safeParse({
        appointmentId: "a1",
        reason: "Chuva",
      }).success,
    ).toBe(true);
  });
});

describe("fuso America/Belem", () => {
  it("converte datetime-local Belém ↔ UTC", () => {
    const utc = parseScheduleDateTimeLocal("2026-11-25T08:00");
    expect(utc).not.toBeNull();
    expect(utc!.toISOString()).toBe("2026-11-25T11:00:00.000Z");
    expect(toScheduleDateTimeLocalValue(utc!)).toBe("2026-11-25T08:00");
  });

  it("detecta sobreposição que atravessa a meia-noite (UTC)", () => {
    const late = parseScheduleDateTimeLocal("2026-11-25T22:00")!;
    const earlyNext = parseScheduleDateTimeLocal("2026-11-26T02:00")!;
    const otherStart = parseScheduleDateTimeLocal("2026-11-26T01:00")!;
    const otherEnd = parseScheduleDateTimeLocal("2026-11-26T03:00")!;
    expect(late.getTime()).toBeLessThan(earlyNext.getTime());
    const overlaps =
      late.getTime() < otherEnd.getTime() &&
      earlyNext.getTime() > otherStart.getTime();
    expect(overlaps).toBe(true);
  });
});

describe("janelas da agenda", () => {
  it("resolve dia/semana/mês", () => {
    expect(isAgendaView("week")).toBe(true);
    const day = resolveAgendaWindow("day", "2026-11-25");
    expect(day.to.getTime() - day.from.getTime()).toBe(86_400_000);

    const weekStart = startOfScheduleWeek(
      parseScheduleDateTimeLocal("2026-11-25T12:00")!,
    );
    expect(formatScheduleDateOnly(weekStart)).toBe("2026-11-23");

    const month = resolveAgendaWindow("month", "2026-11-25");
    expect(formatScheduleDateOnly(month.from)).toBe("2026-11-01");
    expect(formatScheduleDateOnly(month.to)).toBe("2026-12-01");
  });
});

describe("regras de OS para agenda", () => {
  it("permite agendar issued/scheduled e transição issued→scheduled", () => {
    expect(canScheduleServiceOrder("issued")).toBe(true);
    expect(canScheduleServiceOrder("scheduled")).toBe(true);
    expect(canScheduleServiceOrder("cancelled")).toBe(false);
    expect(canTransitionServiceOrder("issued", "scheduled")).toBe(true);
  });
});

describe("permissões e mensagem de conflito", () => {
  it("Administrativo inclui employee.manage e schedule.*", () => {
    const granted = new Set(
      seedGrantsFor("ADMINISTRATIVO").map((grant) => grant.key),
    );
    expect(granted.has("employee.view")).toBe(true);
    expect(granted.has("employee.manage")).toBe(true);
    expect(granted.has("schedule.view")).toBe(true);
    expect(granted.has("schedule.create")).toBe(true);
    expect(granted.has("schedule.update")).toBe(true);
  });

  it("mantém texto de conflito operacional", () => {
    expect(CONFLICT_MESSAGE).toContain("já possui outro serviço agendado");
  });
});
