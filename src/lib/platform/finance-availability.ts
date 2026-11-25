import { PermissionError } from "@/lib/platform/permission-error";

export type FinanceModuleState =
  | { status: "ready" }
  | {
      status: "unavailable";
      reason: "migration" | "connection" | "unknown";
      message: string;
    }
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

export function classifyFinanceQueryError(error: unknown): FinanceModuleState {
  if (error instanceof PermissionError) {
    return { status: "forbidden", message: error.message };
  }

  const code = prismaCode(error);
  const text = errorText(error).toLowerCase();

  if (
    code === "P2021" ||
    ((text.includes("billing_request") || text.includes("receipt_entry")) &&
      (text.includes("does not exist") ||
        text.includes("não existe") ||
        text.includes("relation") ||
        text.includes("undefined_table")))
  ) {
    return {
      status: "unavailable",
      reason: "migration",
      message:
        "Módulo financeiro FIN-F0 indisponível neste ambiente (schema pendente de autorização HOMOL).",
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
        "Não foi possível consultar o financeiro (falha de conexão com o banco).",
    };
  }

  return {
    status: "unavailable",
    reason: "unknown",
    message:
      "Não foi possível carregar o financeiro. Contratações e OS permanecem disponíveis.",
  };
}

export function logFinanceQueryFailure(context: string, error: unknown): void {
  const code = prismaCode(error);
  const message = errorText(error).slice(0, 240);
  console.error(
    JSON.stringify({
      phase: "finance-query-failure",
      context,
      code: code ?? null,
      message,
    }),
  );
}
