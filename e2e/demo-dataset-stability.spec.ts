import { expect, test, type Page } from "@playwright/test";

const DATASET_KEY = "servsam.demo.dataset";

async function loginAs(page: Page, profile: "Direção" | "Compliance") {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  await page.goto("/demonstracao/login");
  await page.getByRole("button", { name: `Preencher ${profile}` }).click();
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();
  await expect(page).toHaveURL(/\/demonstracao$/);
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  expect(pageErrors, `erros JS no login ${profile}`).toEqual([]);
  return pageErrors;
}

test("Direção survives persisted localStorage, mutation and reload", async ({ page }) => {
  const pageErrors = await loginAs(page, "Direção");

  await page.goto("/demonstracao/comercial/propostas/prop-005");
  await expect(page.getByRole("heading", { name: "Orçamento DEMO-005" })).toBeVisible();
  await page.getByRole("button", { name: "Gerar prévia (demo)" }).click();
  await expect(page.getByText("Prévia exibida nesta tela")).toBeVisible();

  const hasDataset = await page.evaluate((key) => Boolean(localStorage.getItem(key)), DATASET_KEY);
  // Even without mutation, inject a stored payload like a returning browser.
  if (!hasDataset) {
    await page.evaluate((key) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          clients: [],
          clientUnits: [],
          leads: [],
          opportunities: [],
          proposals: [],
          proposalItems: [],
          workOrders: [],
          contracts: [],
          documents: [],
          products: [],
          stockMovements: [],
          publicTenders: [],
          financialTransactions: [],
        }),
      );
    }, DATASET_KEY);
  }

  await page.reload();
  await expect(page.getByRole("heading", { name: "Orçamento DEMO-005" })).toBeVisible();
  await expect(page.getByText("OCS-DEMO-014")).toBeVisible();
  await expect(page.getByText("This page couldn’t load")).toHaveCount(0);

  await page.goto("/demonstracao");
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  await page.getByRole("link", { name: "Clientes" }).click();
  await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
  await page.getByRole("link", { name: "Hotel Amazonas Plaza (DEMO)" }).click();
  await expect(page.getByRole("heading", { name: "Hotel Amazonas Plaza (DEMO)" })).toBeVisible();

  await page.getByRole("button", { name: "Restaurar dados demonstrativos" }).click();
  await expect(page.getByRole("heading", { name: "Hotel Amazonas Plaza (DEMO)" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("Compliance opens documents with persisted storage and no JS crash", async ({ page }) => {
  const pageErrors = await loginAs(page, "Compliance");

  await page.evaluate((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        clients: [],
        clientUnits: [],
        leads: [],
        opportunities: [],
        proposals: [],
        proposalItems: [],
        workOrders: [],
        contracts: [],
        documents: [],
        products: [],
        stockMovements: [],
        publicTenders: [],
        financialTransactions: [],
      }),
    );
  }, DATASET_KEY);

  await page.reload();
  await expect(page.getByText("Perfil demo: Compliance")).toBeVisible();
  await page.getByRole("link", { name: "Documentos" }).click();
  await expect(page.getByRole("heading", { name: "Documentos e compliance" })).toBeVisible();
  await expect(page.getByText("This page couldn’t load")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
