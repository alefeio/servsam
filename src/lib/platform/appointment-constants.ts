import { formatScheduleDateTime } from "@/lib/platform/dates";

/** Alerta operacional de sobreposição (não é bloqueio universal). */
export const CONFLICT_MESSAGE =
  "Este colaborador já possui outro serviço agendado neste horário.";

export type ConflictDetail = {
  id: string;
  serviceOrderCode: string;
  startsAt: Date;
  endsAt: Date;
  employeeId: string;
  employeeName: string;
};

export function conflictKeysFromDetails(
  details: readonly ConflictDetail[],
): string {
  return details
    .map((row) => row.id)
    .sort()
    .join(",");
}

export function encodeConflictError(details: ConflictDetail[]): string {
  const keys = conflictKeysFromDetails(details);
  const lines = details.map((row) => {
    const start = formatScheduleDateTime(row.startsAt);
    const end = formatScheduleDateTime(row.endsAt);
    return `• ${row.serviceOrderCode} · ${start} — ${end} · ${row.employeeName}`;
  });
  return `${CONFLICT_MESSAGE}\n${lines.join("\n")}\n[conflictKeys:${keys}]`;
}

export function parseConflictKeysFromError(
  error: string | null | undefined,
): string | null {
  if (!error) return null;
  const match = /\[conflictKeys:([^\]]+)\]/.exec(error);
  return match?.[1]?.trim() || null;
}

export function isConflictError(error: string | null | undefined): boolean {
  if (!error) return false;
  return (
    error.includes(CONFLICT_MESSAGE) && error.includes("[conflictKeys:")
  );
}

/** Texto amigável sem o token interno de chaves. */
export function conflictErrorForDisplay(
  error: string | null | undefined,
): string | undefined {
  if (!error) return undefined;
  return error.replace(/\n\[conflictKeys:[^\]]+\]\s*$/, "").trim();
}
