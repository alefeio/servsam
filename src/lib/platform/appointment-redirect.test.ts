import { describe, expect, it } from "vitest";
import {
  appointmentCreateRedirect,
  sanitizeSistemaRedirect,
} from "@/lib/platform/appointment-redirect";

describe("sanitizeSistemaRedirect", () => {
  const fallback = "/sistema/agenda";

  it("aceita rotas internas autorizadas", () => {
    expect(
      sanitizeSistemaRedirect("/sistema/ordens-servico/abc", fallback),
    ).toBe("/sistema/ordens-servico/abc");
    expect(sanitizeSistemaRedirect("/sistema/agenda/xyz", fallback)).toBe(
      "/sistema/agenda/xyz",
    );
  });

  it("rejeita URLs externas e protocolos", () => {
    expect(
      sanitizeSistemaRedirect("https://evil.example/phish", fallback),
    ).toBe(fallback);
    expect(sanitizeSistemaRedirect("//evil.example", fallback)).toBe(fallback);
    expect(sanitizeSistemaRedirect("javascript:alert(1)", fallback)).toBe(
      fallback,
    );
    expect(sanitizeSistemaRedirect("/sistema/../etc/passwd", fallback)).toBe(
      fallback,
    );
    expect(sanitizeSistemaRedirect("/demonstracao/agenda", fallback)).toBe(
      fallback,
    );
  });

  it("usa fallback derivado no servidor", () => {
    expect(appointmentCreateRedirect("os-1")).toBe(
      "/sistema/ordens-servico/os-1",
    );
  });
});
