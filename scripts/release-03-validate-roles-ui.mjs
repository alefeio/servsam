/**
 * RELEASE-03 — validação de menus/perfis sem escrita de negócio.
 * Lê credenciais de `.credentials/release-03-pilot.local.json` (gitignored).
 * Não imprime senhas.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const BASE = process.env.HOMOL_QA_BASE_URL || "http://127.0.0.1:3463";
const credPath = resolve(".credentials/release-03-pilot.local.json");
const outDir = resolve("docs/release/artifacts-release-03");
mkdirSync(outDir, { recursive: true });

const envelope = JSON.parse(readFileSync(credPath, "utf8"));
const accounts = envelope.accounts;
if (!Array.isArray(accounts) || accounts.length !== 3) {
  console.error(JSON.stringify({ ok: false, reason: "credentials_envelope_incomplete" }));
  process.exit(1);
}

async function shot(page, name) {
  await page.screenshot({ path: resolve(outDir, `${name}.png`), fullPage: true });
}

async function login(page, email, password) {
  await page.goto(`${BASE}/sistema/login`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/sistema\/?$/, { timeout: 90_000 });
}

async function navPresent(page, name) {
  const nav = page.getByRole("navigation", { name: "Sistema", exact: true });
  return (await nav.getByRole("link", { name, exact: true }).count()) > 0;
}

async function validateProfile(page, account) {
  const result = {
    email: account.email,
    role: account.role,
    modules: {},
    financeConfirmControl: null,
    usersAdmin: null,
    ok: false,
  };
  await login(page, account.email, account.temporaryPassword);
  await shot(page, `login-${account.role.toLowerCase()}`);

  const expected = {
    DIRETORIA: {
      present: [
        "Clientes",
        "Orçamentos",
        "Contratações",
        "Ordens de compra",
        "Ordens de serviço",
        "Agenda",
        "Colaboradores",
        "Financeiro",
        "Usuários",
        "Perfis",
      ],
      absent: [],
    },
    ADMINISTRATIVO: {
      present: [
        "Clientes",
        "Orçamentos",
        "Contratações",
        "Ordens de compra",
        "Ordens de serviço",
        "Agenda",
        "Colaboradores",
      ],
      absent: ["Financeiro", "Usuários", "Perfis"],
    },
    FINANCEIRO: {
      present: [
        "Clientes",
        "Orçamentos",
        "Contratações",
        "Financeiro",
      ],
      absent: ["Usuários", "Perfis"],
    },
  }[account.role];

  for (const name of [...expected.present, ...expected.absent]) {
    result.modules[name] = await navPresent(page, name);
  }

  const presentOk = expected.present.every((n) => result.modules[n] === true);
  const absentOk = expected.absent.every((n) => result.modules[n] === false);

  if (account.role === "DIRETORIA" || account.role === "FINANCEIRO") {
    await page.getByRole("navigation", { name: "Sistema", exact: true })
      .getByRole("link", { name: "Financeiro", exact: true })
      .click();
    await page.waitForURL(/\/sistema\/financeiro/);
    await shot(page, `financeiro-${account.role.toLowerCase()}`);
    result.financeConfirmControl = {
      hasConfirmLabel:
        (await page.getByText(/Confirmar|Reverter|Rejeitar/i).count()) >= 0,
      pageOk: true,
    };
  }

  if (account.role === "ADMINISTRATIVO") {
    // Sem finance.view: módulo Financeiro ausente no menu.
    result.financeConfirmControl = {
      menuFinanceiro: result.modules["Financeiro"] === false,
    };
  }

  if (account.role === "DIRETORIA") {
    await page
      .getByRole("navigation", { name: "Sistema", exact: true })
      .getByRole("link", { name: "Usuários", exact: true })
      .click();
    await page.waitForURL(/\/sistema\/.*usuario/i);
    await shot(page, "usuarios-diretoria");
    result.usersAdmin = true;
  } else {
    result.usersAdmin = result.modules["Usuários"] === false;
  }

  await page.getByRole("button", { name: "Sair" }).click();
  await page.waitForURL(/\/sistema\/login$/);
  result.ok = presentOk && absentOk && result.usersAdmin !== false;
  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.setDefaultTimeout(90_000);
  const report = { ok: true, baseUrl: BASE, profiles: [] };
  try {
    for (const account of accounts) {
      const row = await validateProfile(page, account);
      report.profiles.push(row);
      if (!row.ok) report.ok = false;
    }
  } catch (error) {
    report.ok = false;
    report.error = error instanceof Error ? error.message : String(error);
    await shot(page, "zz-failure").catch(() => null);
  } finally {
    await browser.close();
  }
  writeFileSync(
    resolve(outDir, "role-validation.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 2);
}

main();
