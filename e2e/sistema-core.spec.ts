import { config as loadEnv } from "dotenv";
import { expect, test } from "@playwright/test";

loadEnv({ path: ".env.local" });

/**
 * Sprint 11A. Escrita somente em banco isolado (Gate 0 / 11B.2).
 * Cria dados com prefixo "[E2E]" quando o guard permitir.
 */
test("clientes e orçamentos reais: do cadastro ao aceite", async ({ page }) => {
  test.setTimeout(240_000);
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  test.skip(
    process.env.DATABASE_ENV !== "test" ||
      !process.env.E2E_ISOLATED_DATABASE_URL?.trim() ||
      !process.env.E2E_ISOLATED_INSTANCE_ID?.trim() ||
      !email ||
      !password,
    "E2E de escrita exige DATABASE_ENV=test + E2E_ISOLATED_* (não HOMOL compartilhado)",
  );

  const suffix = Date.now().toString().slice(-6);
  const customerName = `[E2E] Condomínio ${suffix}`;

  // Confirmações de ações sensíveis (PREP-01) — aceitar no fluxo automatizado.
  page.on("dialog", (dialog) => {
    void dialog.accept();
  });

  await page.goto("/sistema/login");
  await page.getByLabel("E-mail").fill(email ?? "");
  await page.getByLabel("Senha").fill(password ?? "");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/sistema$/, { timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();

  const nav = page.getByRole("navigation", { name: "Sistema", exact: true });
  await expect(nav.getByRole("link", { name: "Clientes" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Orçamentos" })).toBeVisible();

  // Cliente
  await nav.getByRole("link", { name: "Clientes" }).click();
  await page.getByRole("link", { name: "Novo cliente" }).click();
  await page.getByLabel("Nome ou razão social").fill(customerName);
  await page.getByLabel("CPF ou CNPJ").fill("11.222.333/0001-80");
  await page.getByRole("button", { name: "Cadastrar cliente" }).click();
  await expect(page.getByText("CPF ou CNPJ inválido.")).toBeVisible();
  await page.getByLabel("CPF ou CNPJ").fill("");
  await page.getByRole("button", { name: "Cadastrar cliente" }).click();
  await expect(page.getByRole("heading", { name: customerName })).toBeVisible({ timeout: 30_000 });

  await page.getByText("Novo contato").click();
  await page.getByLabel("Nome", { exact: true }).fill("Maria E2E");
  await page.getByLabel("E-mail").fill("maria.e2e@exemplo.com.br");
  await page.getByRole("button", { name: "Adicionar contato" }).click();
  await expect(page.getByText("Maria E2E")).toBeVisible({ timeout: 30_000 });

  await page.getByText("Nova unidade").click();
  await page.getByLabel("Nome da unidade").fill(`Torre E2E ${suffix}`);
  await page.getByLabel("Cidade").fill("Belém");
  await page.getByLabel("UF").fill("PA");
  await page.getByRole("button", { name: "Adicionar unidade" }).click();
  await expect(page.getByText(`Torre E2E ${suffix}`)).toBeVisible({ timeout: 30_000 });

  // Orçamento
  await page.getByRole("link", { name: "Orçamentos", exact: true }).first().click();
  await page.getByRole("link", { name: "Novo orçamento" }).click();
  await page.getByLabel("Cliente", { exact: true }).selectOption({ label: customerName });
  await page.getByLabel("Título").fill(`[E2E] Controle de pragas ${suffix}`);
  await page.getByLabel("Descrição 1").fill("Aplicação mensal");
  await page.getByLabel("Quantidade").fill("2");
  await page.getByLabel("Valor unitário (R$)").fill("1.500,00");
  await expect(page.getByText("R$ 3.000,00").first()).toBeVisible();
  await page.getByRole("button", { name: "Criar rascunho" }).click();
  await expect(page.getByText(/ORC-\d{4}-\d{4}/).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Rascunho").first()).toBeVisible();
  const proposalUrl = page.url();

  await page.reload();
  await expect(page.getByText(/ORC-\d{4}-\d{4}/).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Rascunho").first()).toBeVisible();

  await page.getByRole("button", { name: "Marcar como enviado" }).click();
  await expect(page.getByRole("button", { name: "Registrar aceite" })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Registrar aceite" }).click();
  await expect(page.getByRole("button", { name: "Criar nova proposta a partir desta" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Aceito não volta")).toBeVisible();

  // Painel lê do banco
  await nav.getByRole("link", { name: "Início" }).click();
  await expect(page.getByRole("heading", { name: "Orçamentos" })).toBeVisible();
  await expect(page.getByText("Aceitos (valor orçado)")).toBeVisible();

  // Logout / login e persistência
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/sistema\/login$/);
  await page.getByLabel("E-mail").fill(email ?? "");
  await page.getByLabel("Senha").fill(password ?? "");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/sistema$/, { timeout: 60_000 });
  await page.goto(proposalUrl);
  await expect(page.getByText(/ORC-\d{4}-\d{4}/).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Aceito").first()).toBeVisible();

  // Segunda sessão (novo contexto) vê o mesmo registro
  const second = await page.context().browser()?.newContext();
  if (second) {
    const page2 = await second.newPage();
    await page2.goto("/sistema/login");
    await page2.getByLabel("E-mail").fill(email ?? "");
    await page2.getByLabel("Senha").fill(password ?? "");
    await page2.getByRole("button", { name: "Entrar" }).click();
    await expect(page2).toHaveURL(/\/sistema$/, { timeout: 60_000 });
    await page2.goto(proposalUrl);
    await expect(page2.getByText(/ORC-\d{4}-\d{4}/).first()).toBeVisible({ timeout: 30_000 });
    await second.close();
  }

  // Limpeza lógica
  await nav.getByRole("link", { name: "Clientes" }).click();
  await page.getByRole("link", { name: customerName }).click();
  await page.getByRole("button", { name: "Arquivar cliente" }).click();
  await expect(page).toHaveURL(/\/sistema\/clientes$/, { timeout: 30_000 });

  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/sistema\/login$/);
});
