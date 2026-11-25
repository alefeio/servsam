import Link from "next/link";
import {
  AGENDA_DAY_END_HOUR,
  AGENDA_DAY_START_HOUR,
  AGENDA_HOUR_PX,
  eventsByDayKey,
  formatHourLabel,
  hourLabels,
  monthCellKeys,
  positionEventsForDay,
  weekDayKeys,
  weekdayShortLabel,
  type AgendaEventInput,
} from "@/lib/platform/agenda-layout";
import { formatScheduleDateTime } from "@/lib/platform/dates";
import {
  formatScheduleDateOnly,
  type AgendaView,
} from "@/lib/platform/schedule-range";
import { cn } from "@/lib/utils";

const OVERLAP_COLORS = [
  "border-navy/40 bg-navy/10",
  "border-amber-500/50 bg-amber-100/80",
  "border-emerald-600/40 bg-emerald-50",
  "border-rose-500/40 bg-rose-50",
];

function EventBlock({
  event,
  className,
}: {
  event: ReturnType<typeof positionEventsForDay>[number];
  className?: string;
}) {
  const widthPct = 100 / event.columnCount;
  const leftPct = event.column * widthPct;
  return (
    <Link
      href={`/sistema/agenda/${event.id}`}
      title={`${event.serviceOrder.code} · ${event.serviceOrder.customer.legalName}`}
      className={cn(
        "absolute overflow-hidden rounded-md border px-1.5 py-1 text-[11px] leading-tight shadow-sm hover:brightness-95",
        OVERLAP_COLORS[event.column % OVERLAP_COLORS.length],
        className,
      )}
      style={{
        top: event.topPx,
        height: Math.max(event.heightPx, 22),
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
      }}
    >
      <span className="font-semibold text-navy">{event.serviceOrder.code}</span>
      <span className="block truncate text-foreground/90">
        {event.serviceOrder.customer.legalName}
      </span>
      <span className="block truncate text-muted-foreground">
        {event.employee?.fullName ?? "Sem atribuição"}
      </span>
    </Link>
  );
}

function DayTimeline({
  dayKey,
  events,
}: {
  dayKey: string;
  events: AgendaEventInput[];
}) {
  const hours = hourLabels();
  const positioned = positionEventsForDay(events, dayKey);
  const height =
    (AGENDA_DAY_END_HOUR - AGENDA_DAY_START_HOUR) * AGENDA_HOUR_PX;
  return (
    <div className="grid grid-cols-[3rem_1fr] overflow-hidden rounded-xl border border-border bg-background">
      <div className="border-r border-border bg-muted/30">
        {hours.map((hour) => (
          <div
            key={hour}
            className="border-b border-border/60 px-1 text-[10px] text-muted-foreground"
            style={{ height: AGENDA_HOUR_PX }}
          >
            {formatHourLabel(hour)}
          </div>
        ))}
      </div>
      <div className="relative" style={{ height }}>
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute inset-x-0 border-b border-border/50"
            style={{
              top: (hour - AGENDA_DAY_START_HOUR) * AGENDA_HOUR_PX,
              height: AGENDA_HOUR_PX,
            }}
          />
        ))}
        {positioned.map((event) => (
          <EventBlock key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

export function AgendaCalendar({
  view,
  windowFrom,
  events,
  focusDate,
  queryBase,
}: {
  view: AgendaView;
  windowFrom: Date;
  events: AgendaEventInput[];
  focusDate: string;
  queryBase: Record<string, string>;
}) {
  const byDay = eventsByDayKey(events);

  if (view === "day") {
    return <DayTimeline dayKey={focusDate} events={events} />;
  }

  if (view === "week") {
    const days = weekDayKeys(windowFrom);
    const hours = hourLabels();
    const height =
      (AGENDA_DAY_END_HOUR - AGENDA_DAY_START_HOUR) * AGENDA_HOUR_PX;
    return (
      <div className="overflow-x-auto rounded-xl border border-border bg-background">
        <div
          className="grid min-w-[56rem]"
          style={{ gridTemplateColumns: `3rem repeat(7, minmax(0, 1fr))` }}
        >
          <div className="border-b border-r border-border bg-muted/30" />
          {days.map((day) => (
            <div
              key={day}
              className="border-b border-r border-border bg-muted/20 px-2 py-2 text-center text-xs font-medium capitalize"
            >
              <Link
                href={`/sistema/agenda?${new URLSearchParams({
                  ...queryBase,
                  view: "day",
                  data: day,
                }).toString()}`}
                className="text-navy hover:underline"
              >
                {weekdayShortLabel(day)}
              </Link>
            </div>
          ))}
          <div className="border-r border-border bg-muted/30">
            {hours.map((hour) => (
              <div
                key={hour}
                className="border-b border-border/60 px-1 text-[10px] text-muted-foreground"
                style={{ height: AGENDA_HOUR_PX }}
              >
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>
          {days.map((day) => {
            const positioned = positionEventsForDay(byDay.get(day) ?? [], day);
            return (
              <div
                key={day}
                className="relative border-r border-border"
                style={{ height }}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute inset-x-0 border-b border-border/40"
                    style={{
                      top: (hour - AGENDA_DAY_START_HOUR) * AGENDA_HOUR_PX,
                      height: AGENDA_HOUR_PX,
                    }}
                  />
                ))}
                {positioned.map((event) => (
                  <EventBlock key={`${day}-${event.id}`} event={event} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const cells = monthCellKeys(windowFrom);
  const focusMonth = focusDate.slice(0, 7);
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-background">
      <div className="grid min-w-[48rem] grid-cols-7">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((label) => (
          <div
            key={label}
            className="border-b border-r border-border bg-muted/30 px-2 py-2 text-center text-xs font-medium"
          >
            {label}
          </div>
        ))}
        {cells.map((day) => {
          const inMonth = day.startsWith(focusMonth);
          const dayEvents = byDay.get(day) ?? [];
          return (
            <div
              key={day}
              className={cn(
                "min-h-28 border-b border-r border-border p-1.5",
                inMonth ? "bg-background" : "bg-muted/20 text-muted-foreground",
              )}
            >
              <Link
                href={`/sistema/agenda?${new URLSearchParams({
                  ...queryBase,
                  view: "day",
                  data: day,
                }).toString()}`}
                className="mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium hover:bg-navy/10 hover:text-navy"
              >
                {day.slice(-2)}
              </Link>
              <ul className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <li key={`${day}-${event.id}`}>
                    <Link
                      href={`/sistema/agenda/${event.id}`}
                      className="block truncate rounded border border-navy/20 bg-navy/5 px-1 py-0.5 text-[10px] text-navy hover:bg-navy/10"
                    >
                      {formatScheduleDateTime(event.startsAt).slice(-5)}{" "}
                      {event.serviceOrder.code}
                    </Link>
                  </li>
                ))}
                {dayEvents.length > 3 ? (
                  <li className="text-[10px] text-muted-foreground">
                    +{dayEvents.length - 3} mais
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
        Clique no dia para a visão diária · clique no compromisso para o
        detalhe. Fuso America/Belém.
        {focusDate ? ` · foco ${formatScheduleDateOnly(windowFrom)}` : ""}
      </p>
    </div>
  );
}
