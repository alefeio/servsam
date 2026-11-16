import { describe, expect, it } from "vitest";
import { isDemoNavActive, matchesDemoHref } from "@/lib/demo/demo-nav";

describe("demo navigation active matching", () => {
  it("matches nested client, proposal, OS and process routes", () => {
    expect(matchesDemoHref("/demonstracao/clientes/client-hotel-amazonas", "/demonstracao/clientes")).toBe(true);
    expect(isDemoNavActive("/demonstracao/clientes/client-hotel-amazonas", "/demonstracao/clientes")).toBe(true);

    expect(
      isDemoNavActive("/demonstracao/comercial/propostas/prop-005", "/demonstracao/comercial/propostas"),
    ).toBe(true);
    expect(isDemoNavActive("/demonstracao/comercial/propostas/prop-005", "/demonstracao/comercial")).toBe(false);

    expect(isDemoNavActive("/demonstracao/ordens-servico/os-demo-04", "/demonstracao/ordens-servico")).toBe(true);
    expect(
      isDemoNavActive("/demonstracao/ordens-servico/os-demo-04/execucao", "/demonstracao/ordens-servico"),
    ).toBe(true);
    expect(
      isDemoNavActive("/demonstracao/ordens-servico/os-demo-04/pre-servico", "/demonstracao/ordens-servico"),
    ).toBe(true);

    expect(
      isDemoNavActive("/demonstracao/relatorios/fotograficos/rel-foto-hotel", "/demonstracao/relatorios/fotograficos"),
    ).toBe(true);
    expect(
      isDemoNavActive("/demonstracao/relatorios/fotograficos/rel-foto-hotel", "/demonstracao/relatorios"),
    ).toBe(false);

    expect(isDemoNavActive("/demonstracao/certificados/cert-hotel-001", "/demonstracao/certificados")).toBe(true);
    expect(isDemoNavActive("/demonstracao/processos/proc-outorga-iara", "/demonstracao/processos")).toBe(true);
  });

  it("keeps the root visão geral exact", () => {
    expect(isDemoNavActive("/demonstracao", "/demonstracao")).toBe(true);
    expect(isDemoNavActive("/demonstracao/clientes", "/demonstracao")).toBe(false);
  });
});
