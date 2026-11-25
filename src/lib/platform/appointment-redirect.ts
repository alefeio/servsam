/** Destinos de redirecionamento pós-ação de agenda — só rotas internas de `/sistema`. */

const SISTEMA_PATH =
  /^\/sistema(?:\/(?:ordens-servico|agenda|colaboradores)(?:\/[A-Za-z0-9_-]+)?)?\/?$/;

/**
 * Aceita apenas caminhos relativos seguros sob `/sistema`.
 * Rejeita URLs absolutas, protocolos, `//`, `..` e caminhos fora da whitelist.
 */
export function sanitizeSistemaRedirect(
  candidate: string | null | undefined,
  fallback: string,
): string {
  const value = candidate?.trim() ?? "";
  if (!value) return fallback;
  if (
    value.includes("://") ||
    value.includes("\\") ||
    value.includes("..") ||
    value.startsWith("//") ||
    /^[a-z][a-z0-9+.-]*:/i.test(value)
  ) {
    return fallback;
  }
  if (!value.startsWith("/sistema")) return fallback;
  // Remove query/hash para validar o path; reanexa se path for válido.
  const pathOnly = value.split(/[?#]/, 2)[0] ?? value;
  if (!SISTEMA_PATH.test(pathOnly)) return fallback;
  return pathOnly;
}

export function appointmentCreateRedirect(serviceOrderId: string): string {
  return `/sistema/ordens-servico/${serviceOrderId}`;
}

export function appointmentDetailRedirect(appointmentId: string): string {
  return `/sistema/agenda/${appointmentId}`;
}

export function appointmentCancelRedirect(serviceOrderId: string): string {
  return `/sistema/ordens-servico/${serviceOrderId}`;
}
