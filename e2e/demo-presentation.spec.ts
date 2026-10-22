import { expect, test } from "@playwright/test";

test("client presentation journey opens the connected demo records", async ({ page }) => {
  await page.goto("/demonstracao/login");
  await page.getByLabel("E-mail").fill("direcao@demo.servsam.local");
  await page.getByLabel("Senha").fill("servsam-demo");
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();

  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  await expect(page.getByText("Serviços de hoje")).toBeVisible();
  await expect(page.getByRole("link", { name: "Clientes" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Comercial" })).toBeVisible();

  await page.goto("/demonstracao/clientes/client-hotel-amazonas");
  await expect(page.getByRole("heading", { name: "Hotel Amazonas Plaza (DEMO)" })).toBeVisible();
  await expect(page.getByText("Dados cadastrais")).toBeVisible();
  await expect(page.getByText("04.882.110/0001-36")).toBeVisible();

  await page.goto("/demonstracao/comercial/propostas/prop-005");
  await expect(page.getByRole("heading", { name: "Proposta DEMO-005" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Gerar prévia (demo)" })).toBeVisible();

  await page.goto("/demonstracao/agenda");
  await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Diária" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Semanal" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mensal" })).toBeVisible();

  await page.goto("/demonstracao/ordens-servico/os-demo-04");
  await expect(page.getByRole("link", { name: "Abrir execução" })).toBeVisible();
  await expect(page.getByText("F2")).toBeVisible();

  await page.goto("/demonstracao/ordens-servico/os-demo-04/execucao");
  await expect(page.getByRole("heading", { name: /Execução/ })).toBeVisible();
  await expect(page.getByText("Planejamento", { exact: true })).toBeVisible();
  await expect(page.getByText("No local", { exact: true })).toBeVisible();

  await page.goto("/demonstracao/relatorios/fotograficos/rel-foto-hotel");
  await expect(
    page.getByRole("heading", { name: "Relatório fotográfico de reservatórios" }),
  ).toBeVisible();
  await expect(page.getByText("pendente de validação")).toBeVisible();

  await page.goto("/demonstracao/certificados/cert-hotel-001");
  await expect(page.getByText("Layout fictício")).toBeVisible();

  await page.goto("/demonstracao/financeiro");
  await expect(page.getByRole("heading", { name: "Financeiro gerencial" })).toBeVisible();
  await expect(page.getByText("Até 30 dias")).toBeVisible();

  await page.goto("/demonstracao/colaboradores/emp-bruno");
  await expect(page.getByText("ASO:", { exact: true })).toBeVisible();
  await expect(page.getByText("NR-33:", { exact: true })).toBeVisible();
});
