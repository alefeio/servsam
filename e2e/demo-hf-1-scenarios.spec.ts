import { expect, test, type Page } from "@playwright/test";

const DATASET_KEY = "servsam.demo.dataset";

async function loginDirecao(page: Page) {
  await page.goto("/demonstracao/login");
  await expect(page.getByLabel("E-mail")).toBeVisible({ timeout: 60_000 });
  await page.getByLabel("E-mail").fill("direcao@demo.servsam.local");
  await page.getByLabel("Senha").fill("servsam-demo");
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();
  await expect(page).toHaveURL(/\/demonstracao$/);
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
}

async function restoreDemoData(page: Page) {
  await page.getByRole("button", { name: "Restaurar dados demonstrativos" }).first().click();
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
}

async function clearDatasetOnce(page: Page) {
  await page.goto("/demonstracao/login");
  await page.evaluate((key) => {
    window.localStorage.removeItem(key);
  }, DATASET_KEY);
}

test.describe("DEMO-HF.1 presentation journeys", () => {
  test("Cenário A: emit OS from DEMO-001 without signal and persist without duplication", async ({
    page,
  }) => {
    await clearDatasetOnce(page);
    await loginDirecao(page);
    await restoreDemoData(page);

    await page.goto("/demonstracao/comercial/propostas/prop-001");
    await expect(page.getByRole("heading", { name: "Orçamento DEMO-001" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Emitir OS" })).toBeEnabled();
    await page.getByRole("button", { name: "Emitir OS" }).click();
    await expect(page.getByRole("link", { name: /Abrir OS OS-DEMO-/ }).first()).toBeVisible();

    const storedAfterIssue = await page.evaluate((key) => localStorage.getItem(key), DATASET_KEY);
    expect(storedAfterIssue).toBeTruthy();
    const linked = JSON.parse(storedAfterIssue!).workOrders.filter(
      (item: { proposalId?: string }) => item.proposalId === "prop-001",
    );
    expect(linked).toHaveLength(1);
    const workOrderId = linked[0].id as string;

    await page.reload();
    await expect(page.getByRole("heading", { name: "Orçamento DEMO-001" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Emitir OS" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Abrir OS OS-DEMO-/ }).first()).toBeVisible();

    await page.goto(`/demonstracao/ordens-servico/${workOrderId}`);
    await expect(page.getByRole("heading", { name: /OS-DEMO-/ })).toBeVisible();

    const afterReload = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return 0;
      return JSON.parse(raw).workOrders.filter(
        (item: { proposalId?: string }) => item.proposalId === "prop-001",
      ).length;
    }, DATASET_KEY);
    expect(afterReload).toBe(1);
  });

  test("Cenário B: O.C. direta → OS → agendar → remarcar with history persistence", async ({
    page,
  }) => {
    await clearDatasetOnce(page);
    await loginDirecao(page);
    await restoreDemoData(page);

    await page.goto("/demonstracao/comercial/ordens-compra");
    await expect(page.getByRole("heading", { name: "Ordens de compra recebidas" })).toBeVisible();
    await expect(page.getByText("OC-DEMO-DIR-021")).toBeVisible();

    await page.getByRole("button", { name: "Emitir OS a partir da O.C." }).click();
    await expect(page.getByRole("button", { name: "Emitir OS a partir da O.C." })).toHaveCount(0);

    const workOrderId = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return (
        data.receivedPurchaseOrders.find(
          (item: { id: string }) => item.id === "oc-demo-direta-001",
        )?.workOrderId ?? null
      );
    }, DATASET_KEY);
    expect(workOrderId).toBeTruthy();

    await page.goto(`/demonstracao/ordens-servico/${workOrderId}`);
    await expect(page.getByRole("heading", { name: /Sanitização emergencial/ })).toBeVisible();
    await page.locator('input[type="datetime-local"]').first().fill("2026-09-15T09:00");
    await page.getByRole("button", { name: "Agendar OS (simulado)" }).click();
    await expect(page.getByText(/Agendado:/)).toBeVisible();

    await page.locator('input[type="datetime-local"]').first().fill("2026-09-16T14:30");
    await page.getByRole("button", { name: "Remarcar OS (simulado)" }).click();
    await expect(page.getByText(/Remarcado:/)).toBeVisible();

    const historyCount = await page.evaluate(
      ({ key, id }) => {
        const raw = localStorage.getItem(key);
        if (!raw) return 0;
        const data = JSON.parse(raw);
        const wo = data.workOrders.find((item: { id: string }) => item.id === id);
        return wo?.scheduleHistory?.length ?? 0;
      },
      { key: DATASET_KEY, id: workOrderId },
    );
    expect(historyCount).toBeGreaterThanOrEqual(2);

    await page.reload();
    await expect(page.getByText(/Remarcado:/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Remarcar OS (simulado)" })).toBeVisible();
  });

  test("Cenário C: periodic O.C. + Hotel DEMO-005 does not duplicate os-demo-04", async ({
    page,
  }) => {
    await clearDatasetOnce(page);
    await loginDirecao(page);
    await restoreDemoData(page);

    await page.goto("/demonstracao/contratos/contract-001");
    await expect(page.getByText("O.C. recebida no contrato", { exact: true })).toBeVisible();
    await expect(page.getByText("OC-DEMO-CT-001")).toBeVisible();

    await page.goto("/demonstracao/comercial/propostas/prop-005");
    await expect(page.getByRole("heading", { name: "Orçamento DEMO-005" })).toBeVisible();
    await expect(page.getByText("O.C. recebida (avulso)", { exact: true })).toBeVisible();
    await expect(page.getByText("OC-DEMO-AVL-014")).toBeVisible();
    await expect(page.getByRole("button", { name: "Emitir OS" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Abrir OS OS-DEMO-004" }).first()).toBeVisible();

    await page.goto("/demonstracao/comercial/ordens-compra");
    await expect(page.getByRole("button", { name: "Emitir OS a partir da O.C." })).toHaveCount(1);
    await expect(page.getByRole("link", { name: /Abrir OS OS-DEMO-004/ }).first()).toBeVisible();

    await page.goto("/demonstracao/ordens-servico/os-demo-04");
    await expect(page.getByRole("link", { name: "Abrir execução" })).toBeVisible();
    await expect(page.getByText("F2")).toBeVisible();

    await page.goto("/demonstracao/ordens-servico/os-demo-04/execucao");
    await expect(page.getByRole("heading", { name: /Execução/ })).toBeVisible();

    await page.goto("/demonstracao/relatorios/fotograficos/rel-foto-hotel");
    await expect(
      page.getByRole("heading", { name: "Relatório fotográfico de reservatórios" }),
    ).toBeVisible();

    await page.goto("/demonstracao/certificados/cert-hotel-001");
    await expect(page.getByText("Layout fictício")).toBeVisible();

    await page.goto("/demonstracao/comercial/ordens-compra");
    await page.getByRole("link", { name: /Abrir OS OS-DEMO-004/ }).first().click();
    await expect(page).toHaveURL(/os-demo-04/);

    const prop005Count = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return 1;
      return JSON.parse(raw).workOrders.filter(
        (item: { proposalId?: string }) => item.proposalId === "prop-005",
      ).length;
    }, DATASET_KEY);
    expect(prop005Count).toBe(1);
  });
});

test("DEMO-HF.1 mobile viewport: O.C. list and Hotel proposal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await clearDatasetOnce(page);

  await page.getByLabel("E-mail").fill("direcao@demo.servsam.local");
  await page.getByLabel("Senha").fill("servsam-demo");
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();

  await page.getByRole("button", { name: "Abrir menu de navegação" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Comercial", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Comercial" })).toBeVisible();

  await page.goto("/demonstracao/comercial/ordens-compra");
  await expect(page.getByRole("heading", { name: "Ordens de compra recebidas" })).toBeVisible();
  await expect(page.getByText("OC-DEMO-DIR-021")).toBeVisible();

  await page.goto("/demonstracao/comercial/propostas/prop-005");
  await expect(page.getByRole("heading", { name: "Orçamento DEMO-005" })).toBeVisible();
  await expect(page.getByText("This page couldn’t load")).toHaveCount(0);
});
