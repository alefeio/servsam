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

export type ConflictAcceptanceContext = {
  employeeId: string;
  startsAt: Date;
  endsAt: Date;
  conflicts: readonly ConflictDetail[];
};

/**
 * Token vinculado ao colaborador, janela solicitada e ao conjunto atual
 * de conflitos (id + horários). Qualquer mudança exige novo aceite.
 */
export function conflictAcceptanceToken(
  context: ConflictAcceptanceContext,
): string {
  const conflictPart = context.conflicts
    .map(
      (row) =>
        `${row.id}@${row.startsAt.toISOString()}@${row.endsAt.toISOString()}@${row.serviceOrderCode}`,
    )
    .sort()
    .join("|");
  return [
    context.employeeId,
    context.startsAt.toISOString(),
    context.endsAt.toISOString(),
    conflictPart,
  ].join("::");
}

/** @deprecated use conflictAcceptanceToken — mantido para leitura de erros legados. */
export function conflictKeysFromDetails(
  details: readonly ConflictDetail[],
): string {
  return details
    .map((row) => row.id)
    .sort()
    .join(",");
}

export function encodeConflictError(
  context: ConflictAcceptanceContext,
): string {
  const token = conflictAcceptanceToken(context);
  const lines = context.conflicts.map((row) => {
    const start = formatScheduleDateTime(row.startsAt);
    const end = formatScheduleDateTime(row.endsAt);
    return `• ${row.serviceOrderCode} · ${start} — ${end} · ${row.employeeName}`;
  });
  return `${CONFLICT_MESSAGE}\n${lines.join("\n")}\n[conflictToken:${token}]`;
}

export function parseConflictTokenFromError(
  error: string | null | undefined,
): string | null {
  if (!error) return null;
  const match = /\[conflictToken:([^\]]+)\]/.exec(error);
  if (match?.[1]?.trim()) return match[1].trim();
  // Compatibilidade com erros gerados antes desta correção.
  const legacy = /\[conflictKeys:([^\]]+)\]/.exec(error);
  return legacy?.[1]?.trim() || null;
}

/** Alias usado pelos formulários. */
export function parseConflictKeysFromError(
  error: string | null | undefined,
): string | null {
  return parseConflictTokenFromError(error);
}

export function isConflictError(error: string | null | undefined): boolean {
  if (!error) return false;
  return (
    error.includes(CONFLICT_MESSAGE) &&
    (error.includes("[conflictToken:") || error.includes("[conflictKeys:"))
  );
}

/** Texto amigável sem o token interno. */
export function conflictErrorForDisplay(
  error: string | null | undefined,
): string | undefined {
  if (!error) return undefined;
  return error
    .replace(/\n\[conflictToken:[^\]]+\]\s*$/, "")
    .replace(/\n\[conflictKeys:[^\]]+\]\s*$/, "")
    .trim();
}
