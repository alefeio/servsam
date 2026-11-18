import { expect, test, devices } from "@playwright/test";

const DATASET_KEY = "servsam.demo.dataset";

const iPhone12 = devices["iPhone 12"];
const mobileDevice = {
  viewport: iPhone12.viewport,
  userAgent: iPhone12.userAgent,
  deviceScaleFactor: iPhone12.deviceScaleFactor,
  isMobile: iPhone12.isMobile,
  hasTouch: iPhone12.hasTouch,
};

async function loginAs(page: import("@playwright/test").Page, profile: "Direção" | "Compliance") {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  await page.goto("/demonstracao/login");
  await page.getByRole("button", { name: `Preencher ${profile}` }).click();
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();
  await expect(page).toHaveURL(/\/demonstracao$/);
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  return pageErrors;
}

async function openMobileMenu(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Abrir menu de navegação" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Fluxo", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Apoio", { exact: true })).toBeVisible();
}

async function goViaMobileMenu(page: import("@playwright/test").Page, label: string, heading?: string | RegExp) {
  await openMobileMenu(page);
  await page.getByRole("dialog").getByRole("link", { name: label, exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  if (heading) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
}

test.describe("demo mobile navigation", () => {
  test.use(mobileDevice);

  test("Direção can open the sheet menu and reach nested modules", async ({ page }) => {
    const pageErrors = await loginAs(page, "Direção");

    await expect(page.getByTestId("demo-desktop-sidebar")).toBeHidden();
    await expect(page.getByRole("button", { name: "Abrir menu de navegação" })).toBeVisible();

    const box = await page.getByRole("button", { name: "Abrir menu de navegação" }).boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    await openMobileMenu(page);
    await expect(page.getByRole("dialog").getByRole("link", { name: "Processos ambientais (DEMO)" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await openMobileMenu(page);
    await page.getByRole("button", { name: "Fechar menu" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await goViaMobileMenu(page, "Clientes", "Clientes");
    await page.getByRole("link", { name: "Hotel Amazonas Plaza (DEMO)" }).click();
    await expect(page.getByRole("heading", { name: "Hotel Amazonas Plaza (DEMO)" })).toBeVisible();

    await openMobileMenu(page);
    await expect(
      page.getByRole("dialog").getByRole("link", { name: "Clientes", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await page.getByRole("dialog").getByRole("link", { name: "Orçamentos", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Orçamentos" })).toBeVisible();

    await goViaMobileMenu(page, "Agenda", "Agenda");
    await goViaMobileMenu(page, "Ordens de serviço", /Ordens de serviço|Ordem/);
    await page.goto("/demonstracao/ordens-servico/os-demo-04");
    await expect(page.getByRole("link", { name: "Abrir execução" })).toBeVisible();

    await openMobileMenu(page);
    await expect(
      page.getByRole("dialog").getByRole("link", { name: "Ordens de serviço", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await page.getByRole("button", { name: "Fechar menu" }).click();

    await page.goto("/demonstracao/ordens-servico/os-demo-04/execucao");
    await expect(page.getByRole("heading", { name: /Execução/ })).toBeVisible();
    await openMobileMenu(page);
    await expect(
      page.getByRole("dialog").getByRole("link", { name: "Ordens de serviço", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await page.getByRole("button", { name: "Fechar menu" }).click();

    await goViaMobileMenu(page, "Certificados", "Certificados");
    await goViaMobileMenu(page, "Financeiro", "Financeiro gerencial");
    await goViaMobileMenu(page, "Processos ambientais (DEMO)", /Processos ambientais/);

    await openMobileMenu(page);
    const menuBox = await page.getByRole("dialog").boundingBox();
    expect(menuBox).toBeTruthy();
    await page.getByRole("dialog").locator("nav").evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await expect(page.getByRole("dialog").getByRole("button", { name: "Sair da demonstração" })).toBeVisible();
    await page.getByRole("button", { name: "Fechar menu" }).click();

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
    await expect(page.getByRole("heading", { name: /Processos ambientais|Visão geral|Financeiro/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir menu de navegação" })).toBeVisible();
    await expect(page.getByText("This page couldn’t load")).toHaveCount(0);

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth + 1;
    });
    expect(overflow).toBe(false);
    expect(pageErrors.filter((error) => error.includes("#185")).length).toBe(0);
    expect(pageErrors).toEqual([]);
  });

  test("Compliance can open mobile menu and reach documents", async ({ page }) => {
    const pageErrors = await loginAs(page, "Compliance");
    await openMobileMenu(page);
    await page.getByRole("dialog").getByRole("link", { name: "Documentos", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Documentos e compliance" })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });
});

test.describe("demo desktop navigation shell", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("keeps sidebar on desktop and hides the mobile trigger", async ({ page }) => {
    const pageErrors = await loginAs(page, "Direção");
    await expect(page.getByTestId("demo-desktop-sidebar")).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir menu de navegação" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Restaurar dados demonstrativos" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sair da demonstração" })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});
