import { expect, test } from "@playwright/test";

test("Direção executive overview updates after a demonstrative change", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  await page.goto("/demonstracao/login");
  await page.getByRole("button", { name: "Preencher Direção" }).click();
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();

  await expect(page).toHaveURL(/\/demonstracao$/);
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  await expect(page.getByText("Prioridades da Direção")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Resumo executivo" })).toBeVisible();
  await expect(page.getByText(/Receitas de/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Próximas ações prioritárias" })).toBeVisible();
  await expect(page.getByText("Formalização de orçamentos")).toBeVisible();
  await expect(page.getByText("Documento: OCS-DEMO-014")).toBeVisible();
  await expect(page.getByText("Recorrências e próximas visitas")).toBeVisible();
  await expect(page.getByRole("link", { name: "Residencial Marajó (DEMO)" })).toBeVisible();
  await expect(page.getByText("Orçamentos emitidos")).toBeVisible();

  const proposalAction = page.getByRole("link", { name: /Orçamento aguardando retorno/ }).first();
  if (await proposalAction.count()) {
    await proposalAction.click();
  } else {
    await page.goto("/demonstracao/comercial/propostas/prop-014");
  }

  await expect(page.getByRole("heading", { name: /Orçamento DEMO-/ })).toBeVisible();
  const proposalHeading = await page.getByRole("heading", { name: /Orçamento DEMO-/ }).innerText();
  const proposalCode = proposalHeading.replace("Orçamento ", "").trim();

  await page.getByRole("button", { name: "Aceitar orçamento" }).click();
  await expect(page.getByText("Orçamento aceito")).toBeVisible();

  await page.goto("/demonstracao");
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  await expect(page.getByText(`Orçamento ${proposalCode} enviado`)).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Orçamento aguardando retorno" }).filter({ hasText: proposalCode }),
  ).toHaveCount(0);

  await page.evaluate(() => {
    localStorage.setItem(
      "servsam.demo.dataset",
      localStorage.getItem("servsam.demo.dataset") ?? "",
    );
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  await expect(page.getByText("This page couldn’t load")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Resumo executivo" })).toBeVisible();
  await expect(page.getByText(`Orçamento ${proposalCode} enviado`)).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
