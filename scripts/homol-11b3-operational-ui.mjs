/**
 * Aceite operacional 11B.3 — UI real contra Next local apontado ao HOMOL.
 * Não é a suíte e2e Docker. Não imprime credenciais.
 *
 * Pré-requisito: node scripts/homol-11b3-start-local-ui.mjs (porta 3463)
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

const BASE = process.env.HOMOL_QA_BASE_URL || "http://127.0.0.1:3463";
const PREFIX = "[HOMOL-QA-11B3]";
const outDir = resolve("docs/architecture/v1/artifacts-11b3-operational");
mkdirSync(outDir, { recursive: true });

function sha12(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function belemDateOnly(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Belem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function belemPlusDays(days) {
  const now = new Date();
  const shifted = new Date(now.getTime() + days * 86_400_000);
  return belemDateOnly(shifted);
}

async function shot(page, name) {
  const path = resolve(outDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function login(page, email, password) {
  await page.goto(`${BASE}/sistema/login`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/sistema\/?$/, { timeout: 90_000 });
}

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "").trim();
  const password = process.env.SEED_ADMIN_PASSWORD || "";
  if (!email || !password) {
    console.error(JSON.stringify({ ok: false, reason: "SEED_* ausente" }));
    process.exit(1);
  }

  const day = belemPlusDays(2);
  const rescheduleDay = belemPlusDays(3);
  const customerName = `${PREFIX} Cliente validação agenda`;
  const employeeName = `${PREFIX} Técnico de validação`;
  const jobTitle = "Técnico operacional de teste";
  const proposalTitle = `${PREFIX} Orçamento validação agenda`;

  const ids = {
    customerId: null,
    proposalId: null,
    engagementId: null,
    serviceOrderId: null,
    serviceOrderCode: null,
    employeeId: null,
    appointmentId: null,
    appointmentRescheduledId: null,
  };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.setDefaultTimeout(90_000);
  page.on("dialog", (dialog) => void dialog.accept());

  try {
    await login(page, email, password);
    await shot(page, "01-home");

    const nav = page.getByRole("navigation", { name: "Sistema", exact: true });

    // Colaborador
    await nav.getByRole("link", { name: "Colaboradores" }).click();
    await page.getByRole("link", { name: "Novo colaborador" }).click();
    await page.getByLabel("Nome completo").fill(employeeName);
    await page.getByLabel("Função / cargo").fill(jobTitle);
    await page.getByRole("button", { name: "Cadastrar colaborador" }).click();
    await page.waitForURL(/\/sistema\/colaboradores\/(?!novo$)[^/?#]+/);
    ids.employeeId = page.url().split("/").pop().split("?")[0];
    await shot(page, "02-employee");

    // Cliente
    await nav.getByRole("link", { name: "Clientes" }).click();
    await page.getByRole("link", { name: "Novo cliente" }).first().click();
    await page.getByLabel("Nome ou razão social").fill(customerName);
    await page.getByRole("button", { name: "Cadastrar cliente" }).click();
    await page.waitForURL(/\/sistema\/clientes\/(?!novo$)[^/?#]+/);
    ids.customerId = page.url().split("/").pop().split("?")[0];
    await shot(page, "03-customer");

    // Orçamento (1 item)
    await nav.getByRole("link", { name: "Orçamentos" }).click();
    await page.getByRole("link", { name: "Novo orçamento" }).click();
    await page.getByLabel("Cliente", { exact: true }).selectOption({ label: customerName });
    await page.getByLabel("Título").fill(proposalTitle);
    await page.getByLabel("Descrição 1").fill(`${PREFIX} Dedetização de validação`);
    await page.getByLabel("Quantidade").first().fill("1");
    await page.getByLabel("Valor unitário (R$)").first().fill("1.500,00");
    await page.getByRole("button", { name: "Criar rascunho" }).click();
    await page.waitForURL(/\/sistema\/orcamentos\/(?!novo$)[^/?#]+/);
    ids.proposalId = page.url().split("/").pop().split("?")[0];
    await page.getByRole("button", { name: "Marcar como enviado" }).click();
    await page.getByRole("button", { name: "Registrar aceite" }).waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Registrar aceite" }).click();
    await page.getByRole("button", { name: "Gerar contratação" }).waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Gerar contratação" }).click();
    await page.waitForURL(/\/sistema\/contratacoes\/[^/?#]+/);
    ids.engagementId = page.url().split("/").pop().split("?")[0];
    await shot(page, "04-engagement");

    // Emitir OS
    await page.getByRole("button", { name: "Emitir OS" }).click();
    await page.waitForURL(/\/sistema\/ordens-servico\/[^/?#]+/);
    ids.serviceOrderId = page.url().split("/").pop().split("?")[0];
    const osHeading = page.getByRole("heading", { name: /OS-\d{4}-\d{4}/ });
    await osHeading.waitFor({ state: "visible" });
    ids.serviceOrderCode = ((await osHeading.innerText()).match(/OS-\d{4}-\d{4}/) || [])[0];
    await page.getByRole("definition").filter({ hasText: "Emitida" }).waitFor();
    await shot(page, "05-os-issued");

    // Agendar
    const startLocal = `${day}T09:00`;
    const endLocal = `${day}T11:00`;
    await page.getByLabel("Início").fill(startLocal);
    await page.getByLabel("Término").fill(endLocal);
    await page
      .locator("#employeeId-create")
      .selectOption({ label: `${employeeName} · ${jobTitle}` });
    await page.getByRole("button", { name: "Confirmar agendamento" }).click();
    await page.getByRole("definition").filter({ hasText: "Agendada" }).waitFor({ timeout: 120_000 });
    await shot(page, "06-os-scheduled");

    // Agenda Dia/Semana/Mês
    for (const view of ["day", "week", "month"]) {
      await page.goto(
        `${BASE}/sistema/agenda?view=${view}&data=${day}&status=scheduled&os=${encodeURIComponent(ids.serviceOrderCode)}&layout=calendario`,
      );
      await page
        .getByRole("link", { name: new RegExp(ids.serviceOrderCode) })
        .first()
        .waitFor({ state: "visible", timeout: 60_000 });
      await shot(page, `07-agenda-${view}`);
    }
    await page.goto(
      `${BASE}/sistema/agenda?view=week&data=${day}&status=scheduled&os=${encodeURIComponent(ids.serviceOrderCode)}&layout=lista`,
    );
    await page.getByRole("link", { name: ids.serviceOrderCode }).waitFor();
    await page.getByRole("cell", { name: employeeName }).waitFor();
    await shot(page, "08-agenda-lista");

    // Remarcar
    await page.goto(`${BASE}/sistema/ordens-servico/${ids.serviceOrderId}`);
    await page.getByLabel("Novo início").fill(`${rescheduleDay}T14:00`);
    await page.getByLabel("Novo término").fill(`${rescheduleDay}T16:00`);
    await page
      .getByLabel("Motivo da remarcação")
      .fill(`${PREFIX} Cliente remarcou validação operacional`);
    await page.getByRole("button", { name: "Remarcar" }).click();
    await page.waitForURL(/\/sistema\/agenda\/[^/?#]+/);
    ids.appointmentRescheduledId = page.url().split("/").pop().split("?")[0];
    await shot(page, "09-appointment-detail-rescheduled");
    await page.getByRole("link", { name: "Abrir OS" }).click();
    await page
      .getByText(`${PREFIX} Cliente remarcou validação operacional`)
      .waitFor();
    await page.getByRole("definition").filter({ hasText: "Agendada" }).waitFor();
    await shot(page, "10-os-after-reschedule");

    for (const view of ["day", "week", "month"]) {
      await page.goto(
        `${BASE}/sistema/agenda?view=${view}&data=${rescheduleDay}&status=scheduled&os=${encodeURIComponent(ids.serviceOrderCode)}&layout=calendario`,
      );
      await page
        .getByRole("link", { name: new RegExp(ids.serviceOrderCode) })
        .first()
        .waitFor({ state: "visible", timeout: 60_000 });
      await shot(page, `11-agenda-rescheduled-${view}`);
    }

    // Logout / login persistência
    await page.getByRole("button", { name: "Sair" }).click();
    await page.waitForURL(/\/sistema\/login$/);
    await login(page, email, password);
    await page.goto(
      `${BASE}/sistema/agenda?view=week&data=${rescheduleDay}&status=scheduled&os=${encodeURIComponent(ids.serviceOrderCode)}&layout=lista`,
    );
    await page.getByRole("link", { name: ids.serviceOrderCode }).waitFor();
    await shot(page, "12-after-relogin");

    // Cancelar agendamento
    await page.goto(`${BASE}/sistema/ordens-servico/${ids.serviceOrderId}`);
    await page.getByRole("button", { name: "Cancelar agendamento" }).click();
    await page
      .getByLabel("Motivo do cancelamento")
      .fill(`${PREFIX} Encerramento do aceite operacional`);
    await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
    await page.getByRole("definition").filter({ hasText: "Emitida" }).waitFor({ timeout: 120_000 });
    await shot(page, "13-os-back-to-issued");

    // Cancelar OS
    const reasonOptional = page.getByLabel("Motivo (opcional)");
    if (await reasonOptional.count()) {
      await reasonOptional.fill(`${PREFIX} OS de validação encerrada`);
    }
    await page.getByRole("button", { name: "Cancelar OS" }).click();
    await page.getByRole("definition").filter({ hasText: "Cancelada" }).waitFor({ timeout: 120_000 });
    await shot(page, "14-os-cancelled");

    // Inativar colaborador
    await page.goto(`${BASE}/sistema/colaboradores/${ids.employeeId}`);
    const deactivate = page.getByRole("button", { name: /Inativar|Desativar/i });
    if (await deactivate.count()) {
      await deactivate.first().click();
      await page.waitForTimeout(1500);
      await shot(page, "15-employee-inactivated");
    } else {
      await shot(page, "15-employee-no-inactivate-control");
    }

    const report = {
      ok: true,
      phase: "homol-11b3-operational-ui",
      baseUrl: BASE,
      testerRole: "DIRETORIA",
      testerEmailHash: sha12(email.toLowerCase()),
      prefix: PREFIX,
      schedule: { day, rescheduleDay, startLocal, endLocal },
      ids,
      screenshotsDir: outDir,
    };
    writeFileSync(
      resolve(outDir, "run-result.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
    await browser.close();
    process.exit(0);
  } catch (error) {
    await shot(page, "99-failure").catch(() => null);
    console.error(
      JSON.stringify({
        ok: false,
        reason: error instanceof Error ? error.message : String(error),
        ids,
        url: page.url(),
      }),
    );
    await browser.close();
    process.exit(1);
  }
}

main();
