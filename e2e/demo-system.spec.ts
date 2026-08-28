import { expect, test } from "@playwright/test";

test("demo login, core modules and logout", async ({ page }) => {
  await page.goto("/demonstracao/login");
  await page.getByLabel("E-mail").fill("direcao@demo.servsam.local");
  await page.getByLabel("Senha").fill("servsam-demo");
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();

  await expect(page).toHaveURL(/\/demonstracao$/);
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  await expect(page.getByText("Perfil demo: Direção")).toBeVisible();

  await page.getByRole("link", { name: "Comercial" }).click();
  await expect(page.getByRole("heading", { name: "Comercial" })).toBeVisible();

  await page.getByRole("link", { name: "Agenda" }).click();
  await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();

  await page.getByRole("link", { name: "Relatórios" }).click();
  await expect(page.getByRole("heading", { name: "Relatórios" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Exportar PDF (demo)" }).first()).toBeVisible();

  await page.getByRole("link", { name: "Configurações" }).click();
  await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
  await expect(page.getByText("Perfil ativo nesta sessão.")).toBeVisible();

  await page.getByRole("button", { name: "Sair da demonstração" }).click();
  await expect(page).toHaveURL(/\/demonstracao\/login/);
});

test("compliance profile can access documents", async ({ page }) => {
  await page.goto("/demonstracao/login");
  await page.getByRole("button", { name: "Preencher Compliance" }).click();
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();

  await expect(page.getByText("Perfil demo: Compliance")).toBeVisible();

  await page.getByRole("link", { name: "Documentos" }).click();
  await expect(page.getByRole("heading", { name: "Documentos e compliance" })).toBeVisible();
});
