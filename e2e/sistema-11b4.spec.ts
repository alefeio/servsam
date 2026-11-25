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

function assertIsolatedWriteEnvOrSkip() {
  const label = process.env.DATABASE_ENV?.trim().toLowerCase();
  if (label !== "test") {
    test.skip(true, "E2E 11B.4 só roda com DATABASE_ENV=test + banco isolado");
    return;
  }
  const isolated = process.env.E2E_ISOLATED_DATABASE_URL?.trim();
  const instanceId = process.env.E2E_ISOLATED_INSTANCE_ID?.trim();
  const approved = process.env.E2E_APPROVED_INSTANCE_ID?.trim() || instanceId;
  if (!isolated) throw new Error("E2E_ISOLATED_DATABASE_URL ausente");
  if (!instanceId) throw new Error("E2E_ISOLATED_INSTANCE_ID ausente");
  if (instanceId !== approved) {
    throw new Error("E2E_ISOLATED_INSTANCE_ID ≠ fingerprint aprovado");
  }
  if (hostHash(isolated) === SHARED_HOMOL_HOST_HASH) {
    throw new Error("URL isolada aponta para host hash do HOMOL compartilhado");
  }
  if (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD) {
    throw new Error("SEED_ADMIN_EMAIL/PASSWORD obrigatórios");
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

test.describe("11B.4 financeiro FIN-F0", () => {
  test.beforeEach(() => {
    assertIsolatedWriteEnvOrSkip();
  });

  test("contratação → solicitação fiscal → recebimento → painel", async ({
    page,
  }) => {
    test.setTimeout(420_000);
    const suffix = `${Date.now().toString().slice(-6)}-fin`;
    const customerName = `[E2E] Fin ${suffix}`;

    page.on("dialog", (dialog) => {
      void dialog.accept();
    });

    await login(page);
    const nav = page.getByRole("navigation", { name: "Sistema", exact: true });
    await expect(nav.getByRole("link", { name: "Financeiro" })).toBeVisible();

    await nav.getByRole("link", { name: "Clientes" }).click();
    await page.getByRole("link", { name: "Novo cliente" }).first().click();
    await page.getByLabel("Nome ou razão social").fill(customerName);
    await page.getByRole("button", { name: "Cadastrar cliente" }).click();
    await expect(page).toHaveURL(/\/sistema\/clientes\/(?!novo$)[^/?#]+/, {
      timeout: 90_000,
    });

    await nav.getByRole("link", { name: "Orçamentos" }).click();
    await page.getByRole("link", { name: "Novo orçamento" }).click();
    await page
      .getByLabel("Cliente", { exact: true })
      .selectOption({ label: customerName });
    await page.getByLabel("Título").fill(`[E2E] Fin ${suffix}`);
    await page.getByLabel("Descrição 1").fill("Serviço financeiro E2E");
    await page.getByLabel("Quantidade").first().fill("1");
    await page.getByLabel("Valor unitário (R$)").first().fill("1.000,00");
    await page.getByRole("button", { name: "Criar rascunho" }).click();
    await expect(page).toHaveURL(/\/sistema\/orcamentos\/(?!novo$)[^/?#]+/, {
      timeout: 120_000,
    });
    await page.getByRole("button", { name: "Marcar como enviado" }).click();
    await page.getByRole("button", { name: "Registrar aceite" }).click();
    await page.getByRole("button", { name: "Gerar contratação" }).click();
    await expect(page).toHaveURL(/\/sistema\/contratacoes\/[^/?#]+/, {
      timeout: 120_000,
    });

    await expect(page.getByText("Financeiro (FIN-F0)")).toBeVisible();
    await page
      .getByRole("button", { name: "Solicitar providências" })
      .click();
    await expect(
      page
        .getByRole("heading", { name: "Solicitações de nota" })
        .locator("..")
        .getByText("Solicitada"),
    ).toBeVisible({ timeout: 90_000 });

    const receiptForm = page
      .getByRole("heading", {
        name: "Informar recebimento para conferência",
      })
      .locator("..");
    await receiptForm.getByLabel("Valor (R$)", { exact: true }).fill("300,00");
    await receiptForm
      .getByRole("button", { name: "Enviar para conferência" })
      .click();
    await expect(
      page
        .getByRole("heading", { name: "Recebimentos", exact: true })
        .locator("..")
        .getByText(/Sinal · R\$\s*300,00/),
    ).toBeVisible({ timeout: 90_000 });
    await expect(
      page
        .locator("dt", { hasText: "Aguardando confirmação" })
        .locator("..")
        .getByText(/R\$\s*300,00/),
    ).toBeVisible({ timeout: 30_000 });

    await nav.getByRole("link", { name: "Financeiro" }).click();
    await expect(page).toHaveURL(/\/sistema\/financeiro/);
    await expect(page.getByText("Recebimentos à confirmar")).toBeVisible();
    const receiptsSection = page
      .getByRole("heading", { name: "Recebimentos", exact: true })
      .locator("xpath=following-sibling::*[1]");
    const receiptRow = receiptsSection
      .locator("li")
      .filter({ hasText: customerName })
      .filter({ hasText: /R\$\s*300,00/ });
    await expect(receiptRow.first()).toBeVisible({ timeout: 90_000 });

    await receiptRow
      .first()
      .getByRole("button", { name: /Confirmar/ })
      .click();
    await expect(
      receiptRow.first().getByText("Confirmado pelo Financeiro"),
    ).toBeVisible({ timeout: 90_000 });

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/sistema\/login$/);
    await login(page);
    await nav.getByRole("link", { name: "Financeiro" }).click();
    await expect(
      page
        .getByRole("heading", { name: "Recebimentos", exact: true })
        .locator("xpath=following-sibling::*[1]")
        .locator("li")
        .filter({ hasText: customerName })
        .getByText("Confirmado pelo Financeiro")
        .first(),
    ).toBeVisible({ timeout: 60_000 });
  });
});
