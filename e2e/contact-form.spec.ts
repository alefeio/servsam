import { expect, test } from "@playwright/test";

test("contact form shows simulated success", async ({ page }) => {
  await page.goto("/contato");
  await page.getByLabel("Nome").fill("Ana Souza");
  await page.getByLabel("Empresa ou condomínio").fill("Condomínio Demo");
  await page.getByLabel("Telefone").fill("91980545097");
  await page.getByLabel("E-mail").fill("ana@example.com");
  await page.getByLabel("Tipo de serviço").selectOption({ label: "Desratização" });
  await page.getByLabel("Cidade").fill("Belém");
  await page.getByLabel("Mensagem").fill("Preciso de uma avaliação técnica do térreo.");
  await page.getByLabel(/Autorizo o uso demonstrativo/).check();
  await page.getByRole("button", { name: "Enviar solicitação demonstrativa" }).click();
  await expect(
    page.getByRole("heading", { name: "Solicitação registrada nesta demonstração" }),
  ).toBeVisible();
});
