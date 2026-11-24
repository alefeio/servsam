import { describe, expect, it } from "vitest";
import { PermissionError } from "@/lib/platform/permission-error";
import { classifyServiceOrderQueryError } from "@/lib/platform/service-order-availability";

describe("classifyServiceOrderQueryError", () => {
  it("detecta migration ausente sem mascarar como lista vazia", () => {
    const state = classifyServiceOrderQueryError({
      code: "P2021",
      message: 'The table `public.service_order` does not exist',
    });
    expect(state.status).toBe("unavailable");
    if (state.status === "unavailable") {
      expect(state.reason).toBe("migration");
    }
  });

  it("preserva erro de permissão", () => {
    const state = classifyServiceOrderQueryError(
      new PermissionError("Sem permissão"),
    );
    expect(state.status).toBe("forbidden");
  });

  it("sinaliza falha de conexão", () => {
    const state = classifyServiceOrderQueryError({
      code: "P1001",
      message: "Can't reach database server",
    });
    expect(state.status).toBe("unavailable");
    if (state.status === "unavailable") {
      expect(state.reason).toBe("connection");
    }
  });
});
