import { PermissionError } from "@/lib/platform/permission-error";

export type ServiceOrderModuleState =
  | { status: "ready" }
  | { status: "unavailable"; reason: "migration" | "connection" | "unknown"; message: string }
  | { status: "forbidden"; message: string };

function prismaCode(error: unknown): string | undefined {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }
  return undefined;
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/** Classifica falha ao consultar OS sem expor segredos na UI. */
export function classifyServiceOrderQueryError(
  error: unknown,
): ServiceOrderModuleState {
  if (error instanceof PermissionError) {
    return { status: "forbidden", message: error.message };
  }

  const code = prismaCode(error);
  const text = errorText(error).toLowerCase();

  if (
    code === "P2021" ||
    (text.includes("service_order") &&
      (text.includes("does not exist") ||
        text.includes("não existe") ||
        text.includes("relation") ||
        text.includes("undefined_table")))
  ) {
    return {
      status: "unavailable",
      reason: "migration",
      message:
        "Módulo de ordens de serviço indisponível neste ambiente (schema pendente).",
    };
  }

  if (
    code === "P1001" ||
    code === "P1000" ||
    code === "P1017" ||
    text.includes("can't reach database") ||
    text.includes("connection") ||
    text.includes("econnrefused") ||
    text.includes("timeout")
  ) {
    return {
      status: "unavailable",
      reason: "connection",
      message:
        "Não foi possível consultar ordens de serviço (falha de conexão com o banco).",
    };
  }

  return {
    status: "unavailable",
    reason: "unknown",
    message:
      "Não foi possível carregar ordens de serviço. Clientes, orçamentos e contratações permanecem disponíveis.",
  };
}

/** Log técnico sem URL/senha — só código e mensagem sanitizada. */
export function logServiceOrderQueryFailure(
  context: string,
  error: unknown,
): void {
  const code = prismaCode(error) ?? "n/a";
  const message = errorText(error)
    .replace(/postgresql:\/\/[^\s]+/gi, "[redacted-url]")
    .replace(/:[^:@/\s]+@/g, ":***@")
    .slice(0, 400);
  console.error(`[service-orders] ${context} code=${code} message=${message}`);
}
