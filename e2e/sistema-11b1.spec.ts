import { config as loadEnv } from "dotenv";
import { expect, test } from "@playwright/test";

loadEnv({ path: ".env.local" });

function e2eWriteAllowed(): boolean {
  return (
    process.env.DATABASE_ENV === "test" &&
    Boolean(process.env.E2E_ISOLATED_DATABASE_URL?.trim()) &&
    Boolean(process.env.E2E_ISOLATED_INSTANCE_ID?.trim()) &&
    Boolean(process.env.SEED_ADMIN_EMAIL) &&
    Boolean(process.env.SEED_ADMIN_PASSWORD)
  );
}

/**
 * Gate 11B.1 — fluxos A/B. Escrita somente em banco isolado (Gate 0 / 11B.2).
 * Não usa HOMOL compartilhado, /demonstracao nem localStorage.
 */
test.describe("11B.1 contratação e O.C. reais", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(() => {
    test.skip(
      !e2eWriteAllowed(),
      "E2E de escrita exige DATABASE_ENV=test + E2E_ISOLATED_* (não HOMOL compartilhado)",
    );
  });

  test("fluxo A: orçamento aceito gera contratação persistente", async ({
    page,
  }) => {
    test.setTimeout(240_000);
    const email = process.env.SEED_ADMIN_EMAIL ?? "";
    const password = process.env.SEED_ADMIN_PASSWORD ?? "";
    const suffix = `${Date.now().toString().slice(-6)}-a`;
    const customerName = `[E2E] CTR-A ${suffix}`;

    page.on("dialog", (dialog) => {
      void dialog.accept();
    });

    await page.goto("/sistema/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/sistema$/, { timeout: 60_000 });

    const nav = page.getByRole("navigation", { name: "Sistema", exact: true });
    await expect(nav.getByRole("link", { name: "Contratações" })).toBeVisible();
    await expect(
      nav.getByRole("link", { name: "Ordens de compra" }),
    ).toBeVisible();

    await nav.getByRole("link", { name: "Clientes" }).click();
    await page.getByRole("link", { name: "Novo cliente" }).click();
    await page.getByLabel("Nome ou razão social").fill(customerName);
    await page.getByRole("button", { name: "Cadastrar cliente" }).click();
    await expect(page).toHaveURL(/\/sistema\/clientes\/(?!novo$)[^/?#]+/, {
      timeout: 60_000,
    });
    await expect(page.getByRole("heading", { name: customerName })).toBeVisible({
      timeout: 30_000,
    });

    await nav.getByRole("link", { name: "Orçamentos" }).click();
    await page.getByRole("link", { name: "Novo orçamento" }).click();
    await page
      .getByLabel("Cliente", { exact: true })
      .selectOption({ label: customerName });
    await page.getByLabel("Título").fill(`[E2E] Aceite CTR ${suffix}`);
    await page.getByLabel("Descrição 1").fill("Serviço A");
    await page.getByLabel("Quantidade").fill("1");
    await page.getByLabel("Valor unitário (R$)").fill("1.200,00");
    await page.getByRole("button", { name: "Criar rascunho" }).click();
    await expect(page).toHaveURL(/\/sistema\/orcamentos\/(?!novo$)[^/?#]+/, {
      timeout: 120_000,
    });
    await expect(page.getByText(/ORC-\d{4}-\d{4}/).first()).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: "Marcar como enviado" }).click();
    await expect(
      page.getByRole("button", { name: "Registrar aceite" }),
    ).toBeVisible({ timeout: 60_000 });
    await page.getByRole("button", { name: "Registrar aceite" }).click();
    await expect(
      page.getByRole("button", { name: "Gerar contratação" }),
    ).toBeVisible({ timeout: 60_000 });

    await page.getByRole("button", { name: "Gerar contratação" }).click();
    await expect(page).toHaveURL(/\/sistema\/contratacoes\/[^/?#]+/, {
      timeout: 120_000,
    });
    await expect(page.getByText(/CTR-\d{4}-\d{4}/).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("Serviços contratados")).toBeVisible();
    await expect(page.getByText("Serviço A")).toBeVisible();
    const engagementUrl = page.url();
    expect(engagementUrl).toMatch(/\/sistema\/contratacoes\//);

    await page.reload();
    await expect(page.getByText(/CTR-\d{4}-\d{4}/).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("Serviço A")).toBeVisible();

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/sistema\/login$/);
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/sistema$/, { timeout: 60_000 });
    await page.goto(engagementUrl);
    await expect(page.getByText(/CTR-\d{4}-\d{4}/).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("fluxo B: O.C. recebida gera contratação sem orçamento interno", async ({
    page,
  }) => {
    test.setTimeout(240_000);
    const email = process.env.SEED_ADMIN_EMAIL ?? "";
    const password = process.env.SEED_ADMIN_PASSWORD ?? "";
    const suffix = `${Date.now().toString().slice(-6)}-b`;
    const customerName = `[E2E] CTR-B ${suffix}`;
    const externalNumber = `OC-E2E-${suffix}`;

    page.on("dialog", (dialog) => {
      void dialog.accept();
    });

    await page.goto("/sistema/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/sistema$/, { timeout: 60_000 });

    const nav = page.getByRole("navigation", { name: "Sistema", exact: true });

    await nav.getByRole("link", { name: "Clientes" }).click();
    await page.getByRole("link", { name: "Novo cliente" }).click();
    await page.getByLabel("Nome ou razão social").fill(customerName);
    await page.getByRole("button", { name: "Cadastrar cliente" }).click();
    await expect(page).toHaveURL(/\/sistema\/clientes\/(?!novo$)[^/?#]+/, {
      timeout: 60_000,
    });
    await expect(page.getByRole("heading", { name: customerName })).toBeVisible({
      timeout: 30_000,
    });

    await nav.getByRole("link", { name: "Ordens de compra" }).click();
    await page.getByRole("link", { name: "Registrar O.C." }).click();
    await page
      .getByLabel("Cliente", { exact: true })
      .selectOption({ label: customerName });
    await page.getByLabel("Número da O.C. do cliente").fill(externalNumber);
    await page.getByLabel("Data de recebimento").fill("2026-11-20");
    await page
      .getByLabel("Referência do documento")
      .fill(`e-mail E2E ${suffix}`);
    await page.locator('textarea[name="description"]').fill(
      `O.C. E2E serviços ${suffix}`,
    );
    await page.locator('input[name="itemDescription"]').first().fill("Item OC 1");
    await page.locator('input[name="itemQuantity"]').first().fill("1");
    await page.locator('input[name="itemUnitPrice"]').first().fill("900,00");
    await page.getByRole("button", { name: "Registrar O.C. recebida" }).click();

    await expect(
      page.getByRole("heading", {
        name: new RegExp(`OC-\\d{4}-\\d{4} · O\\.C\\. ${externalNumber}`),
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("button", { name: "Gerar contratação" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Gerar contratação" }).click();
    await expect(page).toHaveURL(/\/sistema\/contratacoes\/[^/]+$/, {
      timeout: 60_000,
    });
    await expect(page.getByText(/CTR-\d{4}-\d{4}/).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("definition").filter({ hasText: "O.C. recebida" }),
    ).toBeVisible();
    await expect(page.getByText("Item OC 1")).toBeVisible();
    const engagementUrl = page.url();

    await page.reload();
    await expect(page.getByText(/CTR-\d{4}-\d{4}/).first()).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/sistema\/login$/);
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/sistema$/, { timeout: 60_000 });
    await page.goto(engagementUrl);
    await expect(page.getByText("Item OC 1")).toBeVisible({ timeout: 30_000 });
  });
});
