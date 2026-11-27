/**
 * RELEASE-01 — Aceite operacional FIN-F0 na UI local apontada ao HOMOL.
 * Não migrate/seed/grant. Não emite NF real nem movimenta banco.
 * Pré-requisito: node scripts/homol-11b3-start-local-ui.mjs (porta 3463)
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

const BASE = process.env.HOMOL_QA_BASE_URL || "http://127.0.0.1:3463";
const PREFIX = "[HOMOL-QA-11B4]";
const outDir = resolve("docs/architecture/v1/artifacts-release-01");
mkdirSync(outDir, { recursive: true });

function sha12(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
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

async function readFinanceSummary(page) {
  const section = page.locator("#financeiro-f0").locator("..").locator("..");
  const text = await section.innerText();
  const pick = (label) => {
    const re = new RegExp(`${label}\\s*\\n\\s*R\\$\\s*([\\d.]+,\\d{2})`);
    const m = text.match(re);
    return m ? m[1] : null;
  };
  return {
    contracted: pick("Contratado"),
    confirmed: pick("Confirmado pelo Financeiro"),
    pending: pick("Aguardando confirmação"),
    balance: pick("Saldo de referência"),
    rawSnippet: text.slice(0, 800),
  };
}

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "").trim();
  const password = process.env.SEED_ADMIN_PASSWORD || "";
  if (!email || !password) {
    console.error(JSON.stringify({ ok: false, reason: "SEED_* ausente" }));
    process.exit(1);
  }

  const customerName = `${PREFIX} Empresa de homologação financeira`;
  const proposalTitle = `${PREFIX} Validação financeira`;
  const serviceDesc = "Serviço fictício de homologação";

  const ids = {
    customerId: null,
    proposalId: null,
    engagementId: null,
    billingRequestId: null,
    receiptEntryId: null,
  };

  const evidence = {
    beforeConfirm: null,
    afterConfirm: null,
    afterReverse: null,
    integrity: {},
    navModules: [],
    hostedPreview: "not_in_this_script",
  };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.setDefaultTimeout(90_000);
  page.on("dialog", (dialog) => void dialog.accept());

  try {
    await login(page, email, password);
    await shot(page, "01-painel");

    const nav = page.getByRole("navigation", { name: "Sistema", exact: true });
    for (const name of [
      "Clientes",
      "Orçamentos",
      "Contratações",
      "Ordens de compra",
      "Ordens de serviço",
      "Colaboradores",
      "Agenda",
      "Financeiro",
    ]) {
      await nav.getByRole("link", { name, exact: true }).click();
      await page.waitForURL(/\/sistema\//, { timeout: 60_000 });
      await page.waitForLoadState("networkidle").catch(() => null);
      evidence.navModules.push({ name, url: page.url(), ok: true });
      await shot(
        page,
        `02-nav-${name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")}`,
      );
    }

    // Cliente
    await nav.getByRole("link", { name: "Clientes" }).click();
    await page.getByRole("link", { name: "Novo cliente" }).first().click();
    await page.getByLabel("Nome ou razão social").fill(customerName);
    await page.getByRole("button", { name: "Cadastrar cliente" }).click();
    await page.waitForURL(/\/sistema\/clientes\/(?!novo$)[^/?#]+/);
    ids.customerId = page.url().split("/").pop().split("?")[0];
    await shot(page, "03-customer");

    // Orçamento → Envio → Aceite → Contratação
    await nav.getByRole("link", { name: "Orçamentos" }).click();
    await page.getByRole("link", { name: "Novo orçamento" }).click();
    await page.getByLabel("Cliente", { exact: true }).selectOption({ label: customerName });
    await page.getByLabel("Título").fill(proposalTitle);
    await page.getByLabel("Descrição 1").fill(serviceDesc);
    await page.getByLabel("Quantidade").first().fill("1");
    await page.getByLabel("Valor unitário (R$)").first().fill("1.000,00");
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

    // Solicitação fiscal
    const billingForm = page
      .locator("form")
      .filter({ has: page.getByRole("heading", { name: "Solicitar providências de nota" }) });
    await billingForm.getByLabel("Descrição").fill(
      `${PREFIX} Simulação — solicitar providências fiscais (sem emissão real)`,
    );
    await billingForm.getByLabel("Observações").fill(
      `${PREFIX} Homologação operacional. Não emitir nota fiscal verdadeira.`,
    );
    await billingForm.getByRole("button", { name: "Solicitar providências" }).click();
    await page.getByText("Solicitada", { exact: false }).first().waitFor({ timeout: 60_000 });
    await shot(page, "05-billing-requested");

    // Em análise
    const markReview = page.getByLabel("Marcar em análise (sem processar)");
    await markReview.check();
    await page.getByRole("button", { name: "Registrar processamento" }).first().click();
    await page.getByText("Em análise", { exact: false }).first().waitFor({ timeout: 60_000 });
    await shot(page, "06-billing-under-review");

    // Processamento administrativo sem emissão fiscal real
    await page.getByLabel("Marcar em análise (sem processar)").uncheck().catch(() => {});
    const processNotes = page.locator('textarea[name="notes"]').first();
    await processNotes.fill(
      `${PREFIX} Processamento administrativo simulado — sem emissão fiscal real nem serviço externo.`,
    );
    await page.getByRole("button", { name: "Registrar processamento" }).first().click();
    await page.getByText("Processada", { exact: false }).first().waitFor({ timeout: 60_000 });
    await shot(page, "07-billing-processed");

    // Abrir no painel Financeiro
    await nav.getByRole("link", { name: "Financeiro" }).click();
    await page.getByText(PREFIX, { exact: false }).first().waitFor({ timeout: 60_000 });
    await shot(page, "08-financeiro-panel-billing");

    // Voltar à contratação — informar sinal R$ 400
    await page.goto(`${BASE}/sistema/contratacoes/${ids.engagementId}`);
    const receiptForm = page
      .locator("form")
      .filter({
        has: page.getByRole("heading", {
          name: "Informar recebimento para conferência",
        }),
      });
    await receiptForm.getByLabel("Valor (R$)").fill("400,00");
    await receiptForm.getByLabel("Observações").fill(
      `${PREFIX} Sinal fictício R$ 400,00 para conferência — sem movimentação bancária.`,
    );
    await receiptForm.getByLabel("Referência textual (opcional)").fill(
      `${PREFIX} protocolo-simulado-400`,
    );
    await receiptForm.getByRole("button", { name: "Enviar para conferência" }).click();
    await page.getByText("Aguardando confirmação").first().waitFor({ timeout: 60_000 });
    await page.waitForTimeout(1500);
    evidence.beforeConfirm = await readFinanceSummary(page);
    await shot(page, "09-receipt-pending-400");

    // Integridade: valor acima do saldo disponível (400 pendente → disponível 600)
    await receiptForm.getByLabel("Valor (R$)").fill("700,00");
    await receiptForm.getByRole("button", { name: "Enviar para conferência" }).click();
    await page
      .getByText(/ultrapassa o saldo|saldo de referência/i)
      .first()
      .waitFor({ timeout: 60_000 });
    evidence.integrity.overBalanceRejected = true;
    await shot(page, "10-integrity-over-balance");

    // Confirmação parcial R$ 250 (DIRETORIA tem finance.manage)
    const confirmInput = page.getByLabel("Valor efetivamente recebido (R$)");
    await confirmInput.fill("500,00");
    await page
      .getByText(/Valor não pode superar|não pode superar/i)
      .first()
      .waitFor({ timeout: 15_000 });
    evidence.integrity.confirmOverRequestedUiBlocked = true;
    await confirmInput.fill("250,00");
    await page
      .getByText(/diferença não confirmada:\s*R\$\s*150,00/i)
      .first()
      .waitFor({ timeout: 15_000 });
    evidence.integrity.diffPreviewOk = true;
    await page.getByRole("button", { name: /Confirmar R\$\s*250,00/ }).click();
    await page.getByText("Confirmado", { exact: false }).first().waitFor({ timeout: 60_000 });
    await page.waitForTimeout(1500);
    evidence.afterConfirm = await readFinanceSummary(page);
    await shot(page, "11-receipt-confirmed-250");

    // Painel financeiro pós-confirmação
    await nav.getByRole("link", { name: "Financeiro" }).click();
    await page.getByText(/R\$\s*250,00/).first().waitFor({ timeout: 60_000 });
    await shot(page, "12-financeiro-after-confirm");

    // Persistência: reload + logout/login
    await page.goto(`${BASE}/sistema/contratacoes/${ids.engagementId}`);
    await page.reload();
    await page.getByText("Confirmado", { exact: false }).first().waitFor({ timeout: 60_000 });
    await shot(page, "13-after-reload");
    await page.getByRole("button", { name: "Sair" }).click();
    await page.waitForURL(/\/sistema\/login$/);
    await login(page, email, password);
    await page.goto(`${BASE}/sistema/contratacoes/${ids.engagementId}`);
    await page.getByText("Confirmado", { exact: false }).first().waitFor({ timeout: 60_000 });
    await page.getByText(/Processada|Processado/i).first().waitFor({ timeout: 30_000 });
    await shot(page, "14-after-relogin");

    // Reversão
    await page
      .locator('input[name="reason"]')
      .filter({ has: page.locator("xpath=ancestor::form[.//button[contains(.,'Reverter')]]") })
      .first()
      .fill(`${PREFIX} Encerramento de simulação financeira`)
      .catch(async () => {
        const reverseForm = page
          .locator("form")
          .filter({ has: page.getByRole("button", { name: "Reverter confirmação" }) });
        await reverseForm
          .locator('input[name="reason"]')
          .fill(`${PREFIX} Encerramento de simulação financeira`);
      });
    const reverseForm = page
      .locator("form")
      .filter({ has: page.getByRole("button", { name: "Reverter confirmação" }) });
    await reverseForm
      .locator('input[name="reason"]')
      .fill(`${PREFIX} Encerramento de simulação financeira`);
    await reverseForm.getByRole("button", { name: "Reverter confirmação" }).click();
    await page.getByText("Revertido", { exact: false }).first().waitFor({ timeout: 60_000 });
    await page.waitForTimeout(1500);
    evidence.afterReverse = await readFinanceSummary(page);
    await shot(page, "15-after-reverse");

    await nav.getByRole("link", { name: "Financeiro" }).click();
    await page.getByText("Revertido", { exact: false }).first().waitFor({ timeout: 60_000 });
    await shot(page, "16-financeiro-after-reverse");

    const report = {
      ok: true,
      phase: "release-01-operational-ui",
      environment: "local-ui-homol",
      baseUrl: BASE,
      prefix: PREFIX,
      actorRoleExpected: "DIRETORIA",
      actorEmailDomain: email.includes("@") ? email.split("@")[1] : "redacted",
      ids: {
        customerId: ids.customerId,
        customerIdHash: sha12(ids.customerId),
        proposalId: ids.proposalId,
        proposalIdHash: sha12(ids.proposalId),
        engagementId: ids.engagementId,
        engagementIdHash: sha12(ids.engagementId),
      },
      evidence,
      capturedAt: new Date().toISOString(),
    };
    writeFileSync(resolve(outDir, "operational-report.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    await shot(page, "zz-failure").catch(() => null);
    console.error(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        ids,
        evidence,
      }),
    );
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
