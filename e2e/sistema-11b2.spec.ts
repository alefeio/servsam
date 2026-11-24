import { config as loadEnv } from "dotenv";
import { createHash } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

loadEnv({ path: ".env.local" });

const SHARED_HOMOL_HOST_HASH = "22e5c2dd2d93";

function hostHash(url: string): string {
  try {
    return createHash("sha256")
      .update(new URL(url).host)
      .digest("hex")
      .slice(0, 12);
  } catch {
    return "invalid";
  }
}

/**
 * Fail-closed quando DATABASE_ENV=test (homologação 11B.2).
 * Fora de test, a suíte é ignorada (ex.: preview-e2e no HOMOL compartilhado).
 */
function assertIsolatedWriteEnvOrSkip() {
  const label = process.env.DATABASE_ENV?.trim().toLowerCase();
  if (label !== "test") {
    test.skip(
      true,
      "E2E de escrita 11B.2 só roda com DATABASE_ENV=test + banco isolado",
    );
    return;
  }

  const isolated = process.env.E2E_ISOLATED_DATABASE_URL?.trim();
  const instanceId = process.env.E2E_ISOLATED_INSTANCE_ID?.trim();
  const approved =
    process.env.E2E_APPROVED_INSTANCE_ID?.trim() || instanceId;
  if (!isolated) {
    throw new Error(
      "DATABASE_ENV=test sem E2E_ISOLATED_DATABASE_URL — falha explícita",
    );
  }
  if (!instanceId) {
    throw new Error(
      "DATABASE_ENV=test sem E2E_ISOLATED_INSTANCE_ID — falha explícita",
    );
  }
  if (instanceId !== approved) {
    throw new Error("E2E_ISOLATED_INSTANCE_ID ≠ fingerprint aprovado");
  }
  if (hostHash(isolated) === SHARED_HOMOL_HOST_HASH) {
    throw new Error("URL isolada aponta para host hash do HOMOL compartilhado");
  }
  if (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD) {
    throw new Error("SEED_ADMIN_EMAIL/PASSWORD obrigatórios para E2E 11B.2");
  }
}

async function login(page: Page) {
  const email = process.env.SEED_ADMIN_EMAIL ?? "";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  await page.goto("/sistema/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/sistema$/, { timeout: 60_000 });
}

async function createCustomer(page: Page, customerName: string) {
  const nav = page.getByRole("navigation", { name: "Sistema", exact: true });
  await nav.getByRole("link", { name: "Clientes" }).click();
  await page.getByRole("link", { name: "Novo cliente" }).first().click();
  await page.getByLabel("Nome ou razão social").fill(customerName);
  await page.getByRole("button", { name: "Cadastrar cliente" }).click();
  await expect(page).toHaveURL(/\/sistema\/clientes\/(?!novo$)[^/?#]+/, {
    timeout: 90_000,
  });
  await expect(page.getByRole("heading", { name: customerName })).toBeVisible({
    timeout: 30_000,
  });
}

async function expectOsDetail(page: Page): Promise<string> {
  await expect(page).toHaveURL(/\/sistema\/ordens-servico\/[^/?#]+/, {
    timeout: 90_000,
  });
  const heading = page.getByRole("heading", { name: /OS-\d{4}-\d{4}/ });
  try {
    await expect(heading).toBeVisible({ timeout: 20_000 });
  } catch {
    await page.reload();
    await expect(heading).toBeVisible({ timeout: 60_000 });
  }
  const code = ((await heading.innerText()).match(/OS-\d{4}-\d{4}/) ?? [])[0];
  expect(code).toBeTruthy();
  return code!;
}

/**
 * Gate 11B.2-QA — jornada real de OS no banco isolado.
 */
test.describe("11B.2 ordens de serviço reais", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(() => {
    assertIsolatedWriteEnvOrSkip();
  });

  test("fluxo OS: proposta → 2 OS → duplicação → cancelamento → reemissão", async ({
    page,
  }) => {
    test.setTimeout(360_000);
    const suffix = `${Date.now().toString().slice(-6)}-os`;
    const customerName = `[E2E] OS ${suffix}`;

    page.on("dialog", (dialog) => {
      void dialog.accept();
    });

    await login(page);
    const nav = page.getByRole("navigation", { name: "Sistema", exact: true });
    await expect(nav.getByRole("link", { name: "Clientes" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Orçamentos" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Contratações" })).toBeVisible();

    await createCustomer(page, customerName);

    await nav.getByRole("link", { name: "Orçamentos" }).click();
    await page.getByRole("link", { name: "Novo orçamento" }).click();
    await page
      .getByLabel("Cliente", { exact: true })
      .selectOption({ label: customerName });
    await page.getByLabel("Título").fill(`[E2E] OS dual ${suffix}`);
    await page.getByLabel("Descrição 1").fill("Serviço Alfa E2E");
    await page.getByLabel("Quantidade").first().fill("1");
    await page.getByLabel("Valor unitário (R$)").first().fill("1.100,00");
    await page.getByRole("button", { name: "Adicionar item" }).click();
    await page.getByLabel("Descrição 2").fill("Serviço Beta E2E");
    await page.getByLabel("Quantidade").nth(1).fill("1");
    await page.getByLabel("Valor unitário (R$)").nth(1).fill("800,00");
    await page.getByRole("button", { name: "Criar rascunho" }).click();
    await expect(page).toHaveURL(/\/sistema\/orcamentos\/(?!novo$)[^/?#]+/, {
      timeout: 120_000,
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
    await expect(page.getByText("Serviço Alfa E2E")).toBeVisible();
    await expect(page.getByText("Serviço Beta E2E")).toBeVisible();
    const engagementUrl = page.url();

    const emitButtons = page.getByRole("button", { name: "Emitir OS" });
    await expect(emitButtons).toHaveCount(2);
    await emitButtons.nth(0).click();
    const firstOsCode = await expectOsDetail(page);

    await page.goto(engagementUrl);
    await expect(page.getByRole("button", { name: "Emitir OS" })).toHaveCount(
      1,
      { timeout: 30_000 },
    );
    // Só resta o botão do 2º serviço (1ª linha já tem OS ativa).
    await page.getByRole("button", { name: "Emitir OS" }).click();
    const secondOsCode = await expectOsDetail(page);
    expect(secondOsCode).not.toBe(firstOsCode);

    await page.goto(engagementUrl);
    await expect(page.getByRole("button", { name: "Emitir OS" })).toHaveCount(
      0,
      { timeout: 30_000 },
    );
    await expect(page.getByRole("link", { name: firstOsCode! })).toBeVisible();
    await expect(page.getByRole("link", { name: secondOsCode! })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("link", { name: firstOsCode })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("link", { name: secondOsCode })).toBeVisible();

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/sistema\/login$/);
    await login(page);
    await page.goto(engagementUrl);
    await expect(page.getByRole("link", { name: firstOsCode })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("link", { name: secondOsCode })).toBeVisible();

    await page.getByRole("link", { name: firstOsCode }).click();
    await expect(page).toHaveURL(/\/sistema\/ordens-servico\/[^/?#]+/);
    await page.getByLabel("Motivo (opcional)").fill("Cancelamento E2E QA");
    await page.getByRole("button", { name: "Cancelar OS" }).click();
    await expect(
      page.getByRole("definition").filter({ hasText: "Cancelada" }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByText("Motivo do cancelamento: Cancelamento E2E QA"),
    ).toBeVisible();

    await page.goto(engagementUrl);
    await expect(page.getByText("Ordens de serviço canceladas")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Motivo: Cancelamento E2E QA/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reemitir OS" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Reemitir OS" }).click();
    const reissuedCode = await expectOsDetail(page);
    expect(reissuedCode).not.toBe(firstOsCode);
    expect(reissuedCode).not.toBe(secondOsCode);

    await page.goto(engagementUrl);
    await expect(page.getByRole("link", { name: firstOsCode })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("link", { name: secondOsCode })).toBeVisible();
    await expect(page.getByRole("link", { name: reissuedCode })).toBeVisible();
    await expect(page.getByText("Ordens de serviço canceladas")).toBeVisible();
  });

  test("fluxo OS a partir de O.C. recebida", async ({ page }) => {
    test.setTimeout(300_000);
    const suffix = `${Date.now().toString().slice(-6)}-oc`;
    const customerName = `[E2E] OS-OC ${suffix}`;
    const externalNumber = `OC-OS-${suffix}`;

    page.on("dialog", (dialog) => {
      void dialog.accept();
    });

    await login(page);
    const nav = page.getByRole("navigation", { name: "Sistema", exact: true });
    await createCustomer(page, customerName);

    await nav.getByRole("link", { name: "Ordens de compra" }).click();
    await page.getByRole("link", { name: "Registrar O.C." }).click();
    await page
      .getByLabel("Cliente", { exact: true })
      .selectOption({ label: customerName });
    await page.getByLabel("Número da O.C. do cliente").fill(externalNumber);
    await page.getByLabel("Data de recebimento").fill("2026-11-20");
    await page
      .locator('textarea[name="description"]')
      .fill(`O.C. OS ${suffix}`);
    await page
      .locator('input[name="itemDescription"]')
      .first()
      .fill("Serviço OC E2E");
    await page.locator('input[name="itemQuantity"]').first().fill("1");
    await page.locator('input[name="itemUnitPrice"]').first().fill("950,00");
    await page.getByRole("button", { name: "Registrar O.C. recebida" }).click();
    await expect(
      page.getByRole("button", { name: "Gerar contratação" }),
    ).toBeVisible({ timeout: 60_000 });
    await page.getByRole("button", { name: "Gerar contratação" }).click();
    await expect(page).toHaveURL(/\/sistema\/contratacoes\/[^/?#]+/, {
      timeout: 60_000,
    });
    await expect(
      page.getByRole("definition").filter({ hasText: "O.C. recebida" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Emitir OS" }).click();
    await expectOsDetail(page);
    await page
      .getByRole("link", { name: /CTR-\d{4}-\d{4}/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/sistema\/contratacoes\/[^/?#]+/);
    await expect(page.getByRole("button", { name: "Emitir OS" })).toHaveCount(
      0,
    );
  });
});


