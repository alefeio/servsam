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
    test.skip(
      true,
      "E2E de escrita 11B.3 só roda com DATABASE_ENV=test + banco isolado",
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
    throw new Error("SEED_ADMIN_EMAIL/PASSWORD obrigatórios para E2E 11B.3");
  }
}

/** Data civil YYYY-MM-DD em America/Belem a partir de um instante. */
function belemDateOnly(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Belem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
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
}

async function createEmployee(
  page: Page,
  fullName: string,
  jobTitle: string,
) {
  const nav = page.getByRole("navigation", { name: "Sistema", exact: true });
  await nav.getByRole("link", { name: "Colaboradores" }).click();
  await page.getByRole("link", { name: "Novo colaborador" }).click();
  await page.getByLabel("Nome completo").fill(fullName);
  await page.getByLabel("Função / cargo").fill(jobTitle);
  await page.getByRole("button", { name: "Cadastrar colaborador" }).click();
  await expect(page).toHaveURL(/\/sistema\/colaboradores\/(?!novo$)[^/?#]+/, {
    timeout: 90_000,
  });
  await expect(page.getByRole("heading", { name: fullName })).toBeVisible({
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
 * Gate 11B.3 — jornada real de agenda no banco isolado.
 */
test.describe("11B.3 agenda operacional real", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(() => {
    assertIsolatedWriteEnvOrSkip();
  });

  test("colaboradores → OS → agenda → remarcação → conflito → cancelamento", async ({
    page,
  }) => {
    test.setTimeout(420_000);
    const suffix = `${Date.now().toString().slice(-6)}-ag`;
    const customerName = `[E2E] Agenda ${suffix}`;
    const employeeA = `Carla E2E ${suffix}`;
    const employeeB = `Diego E2E ${suffix}`;

    page.on("dialog", (dialog) => {
      void dialog.accept();
    });

    await login(page);
    const nav = page.getByRole("navigation", { name: "Sistema", exact: true });
    await expect(nav.getByRole("link", { name: "Agenda" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Colaboradores" })).toBeVisible();

    await createEmployee(page, employeeA, "Técnica de campo");
    await createEmployee(page, employeeB, "Auxiliar");

    await createCustomer(page, customerName);

    await nav.getByRole("link", { name: "Orçamentos" }).click();
    await page.getByRole("link", { name: "Novo orçamento" }).click();
    await page
      .getByLabel("Cliente", { exact: true })
      .selectOption({ label: customerName });
    await page.getByLabel("Título").fill(`[E2E] Agenda ${suffix}`);
    await page.getByLabel("Descrição 1").fill("Dedetização agenda E2E");
    await page.getByLabel("Quantidade").first().fill("1");
    await page.getByLabel("Valor unitário (R$)").first().fill("1.200,00");
    await page.getByRole("button", { name: "Adicionar item" }).click();
    await page.getByLabel("Descrição 2").fill("Desinsetização agenda E2E");
    await page.getByLabel("Quantidade").nth(1).fill("1");
    await page.getByLabel("Valor unitário (R$)").nth(1).fill("900,00");
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
    const engagementUrl = page.url();

    const emitButtons = page.getByRole("button", { name: "Emitir OS" });
    await expect(emitButtons).toHaveCount(2);
    await emitButtons.nth(0).click();
    const firstOsCode = await expectOsDetail(page);
    const firstOsUrl = page.url();

    await expect(
      page.getByRole("definition").filter({ hasText: "Emitida" }),
    ).toBeVisible();

    const day = belemDateOnly(new Date());
    const startA = `${day}T08:00`;
    const endA = `${day}T10:00`;
    const startB = `${day}T09:00`;
    const endB = `${day}T11:00`;
    const rescheduleStart = `${day}T14:00`;
    const rescheduleEnd = `${day}T16:00`;

    await page.getByLabel("Início").fill(startA);
    await page.getByLabel("Término").fill(endA);
    await page
      .locator("#employeeId-create")
      .selectOption({ label: `${employeeA} · Técnica de campo` });
    await page.getByRole("button", { name: "Confirmar agendamento" }).click();

    await expect(
      page.getByRole("definition").filter({ hasText: "Agendada" }),
    ).toBeVisible({ timeout: 90_000 });
    await expect(
      page.getByText(new RegExp(`Responsável:\\s*${employeeA}`)),
    ).toBeVisible();

    for (const view of ["day", "week", "month"] as const) {
      await page.goto(
        `/sistema/agenda?view=${view}&data=${day}&status=scheduled&os=${encodeURIComponent(firstOsCode)}`,
      );
      await expect(page.getByRole("link", { name: firstOsCode })).toBeVisible({
        timeout: 60_000,
      });
      await expect(
        page.getByRole("cell", { name: employeeA }),
      ).toBeVisible();
    }

    await page.goto(engagementUrl);
    await page.getByRole("button", { name: "Emitir OS" }).click();
    const secondOsCode = await expectOsDetail(page);
    expect(secondOsCode).not.toBe(firstOsCode);
    const secondOsUrl = page.url();

    await page.getByLabel("Início").fill(startB);
    await page.getByLabel("Término").fill(endB);
    await page
      .locator("#employeeId-create")
      .selectOption({ label: `${employeeA} · Técnica de campo` });
    await page.getByRole("button", { name: "Confirmar agendamento" }).click();
    await expect(
      page.getByRole("alert").filter({
        hasText:
          "Este colaborador já possui outro serviço agendado neste horário.",
      }),
    ).toBeVisible({ timeout: 60_000 });
    await page.getByLabel("Confirme para salvar mesmo assim").check();
    await page.getByRole("button", { name: "Confirmar agendamento" }).click();
    await expect(
      page.getByRole("definition").filter({ hasText: "Agendada" }),
    ).toBeVisible({ timeout: 90_000 });

    await page.goto(firstOsUrl);
    await page.getByLabel("Novo início").fill(rescheduleStart);
    await page.getByLabel("Novo término").fill(rescheduleEnd);
    await page.getByLabel("Motivo da remarcação").fill("Cliente remarcou E2E");
    await page.getByRole("button", { name: "Remarcar" }).click();
    await expect(page.getByText("Cliente remarcou E2E")).toBeVisible({
      timeout: 90_000,
    });
    await expect(
      page.getByRole("definition").filter({ hasText: "Agendada" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancelar agendamento" }).click();
    await page
      .getByLabel("Motivo do cancelamento")
      .fill("Cancelamento agenda E2E");
    await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
    await expect(
      page.getByRole("definition").filter({ hasText: "Emitida" }),
    ).toBeVisible({ timeout: 90_000 });

    await page.goto(secondOsUrl);
    await expectOsDetail(page);
    await page.getByLabel("Motivo (opcional)").fill("Cancelamento OS agendada E2E");
    await page.getByRole("button", { name: "Cancelar OS" }).click();
    await expect(
      page.getByRole("definition").filter({ hasText: "Cancelada" }),
    ).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText("Não há agendamento vigente")).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/sistema\/login$/);
    await login(page);
    await page.goto(
      `/sistema/agenda?view=week&data=${day}&status=cancelled&os=${encodeURIComponent(firstOsCode)}`,
    );
    await expect(
      page.getByRole("link", { name: firstOsCode }).first(),
    ).toBeVisible({ timeout: 60_000 });
    await page
      .getByRole("navigation", { name: "Sistema", exact: true })
      .getByRole("link", { name: "Colaboradores" })
      .click();
    await expect(page.getByRole("link", { name: employeeA })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("link", { name: employeeB })).toBeVisible();
  });
});
