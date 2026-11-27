/**
 * RELEASE-03 — validação final simplificada no Preview de homologação.
 * Sem escrita de negócio. Não imprime senhas.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const BASE =
  process.env.PERF_BASE_URL ||
  "https://servsam-git-fix-11b-4-finance-qa-alefeios-projects.vercel.app";
const outDir = resolve("docs/release/artifacts-release-03-final");
mkdirSync(outDir, { recursive: true });

const credPath = resolve(".credentials/release-03-pilot.local.json");
if (!existsSync(credPath)) {
  console.error(JSON.stringify({ ok: false, reason: "credentials_envelope_missing" }));
  process.exit(1);
}
const envelope = JSON.parse(readFileSync(credPath, "utf8"));
const accounts = envelope.accounts || [];
if (accounts.length < 3) {
  console.error(JSON.stringify({ ok: false, reason: "credentials_incomplete" }));
  process.exit(1);
}

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

async function login(page, account) {
  await page.goto(`${BASE}/sistema/login`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  // Detect Vercel SSO interstitial
  if (page.url().includes("vercel.com")) {
    throw new Error("vercel_authentication_still_required");
  }
  await page.getByLabel("E-mail").waitFor({ state: "visible", timeout: 60_000 });
  await page.getByLabel("E-mail").fill(account.email);
  await page.getByLabel("Senha").fill(account.temporaryPassword);
  const submitAt = Date.now();
  await Promise.all([
    page.waitForURL(/\/sistema\/?$/, { timeout: 180_000 }),
    page.getByRole("button", { name: "Entrar" }).click(),
  ]);
  await page.getByRole("heading", { name: "Painel" }).waitFor({
    state: "visible",
    timeout: 60_000,
  });
  return Date.now() - submitAt;
}

async function logout(page) {
  await page.getByRole("button", { name: "Sair" }).click();
  await page.waitForURL(/\/sistema\/login$/, { timeout: 60_000 });
}

async function navMs(page, linkName, urlRe, headingRe) {
  const start = Date.now();
  await page
    .getByRole("navigation", { name: "Sistema", exact: true })
    .getByRole("link", { name: linkName, exact: true })
    .click();
  await page.waitForURL(urlRe, { timeout: 60_000 });
  await page
    .getByRole("heading", { name: headingRe })
    .first()
    .waitFor({ state: "visible", timeout: 60_000 });
  return Date.now() - start;
}

async function profileMenus(page, account) {
  const expected = {
    DIRETORIA: {
      present: [
        "Clientes",
        "Orçamentos",
        "Contratações",
        "Agenda",
        "Financeiro",
        "Usuários",
        "Perfis",
      ],
      absent: [],
    },
    ADMINISTRATIVO: {
      present: ["Clientes", "Orçamentos", "Contratações", "Agenda"],
      absent: ["Financeiro", "Usuários", "Perfis"],
    },
    FINANCEIRO: {
      present: ["Clientes", "Orçamentos", "Contratações", "Financeiro"],
      absent: ["Usuários", "Perfis"],
    },
  }[account.role];

  const modules = {};
  const nav = page.getByRole("navigation", { name: "Sistema", exact: true });
  for (const name of [...expected.present, ...expected.absent]) {
    modules[name] = (await nav.getByRole("link", { name, exact: true }).count()) > 0;
  }
  const presentOk = expected.present.every((n) => modules[n] === true);
  const absentOk = expected.absent.every((n) => modules[n] === false);
  return { email: account.email, role: account.role, modules, ok: presentOk && absentOk };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.setDefaultTimeout(120_000);

  const report = {
    ok: true,
    baseUrl: BASE,
    capturedAt: new Date().toISOString(),
    credentialsEnvelopePresent: true,
    credentialsAccountCount: accounts.length,
    directLogin: null,
    privateRoutes: {},
    performance: {},
    profiles: [],
  };

  try {
    // Private routes anonymous
    for (const path of ["/sistema", "/sistema/clientes", "/sistema/financeiro"]) {
      const res = await page.goto(`${BASE}${path}`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      report.privateRoutes[path] = {
        status: res?.status() ?? null,
        finalUrl: page.url(),
        redirectedToLogin: /\/sistema\/login/.test(page.url()),
        vercelSso: page.url().includes("vercel.com"),
      };
    }

    const diretoria = accounts.find((a) => a.role === "DIRETORIA") || accounts[0];

    // Performance: first + 3 consecutive + module nav
    const submits = [];
    const pageLoads = [];
    for (let i = 0; i < 4; i++) {
      const tPage = Date.now();
      await page.goto(`${BASE}/sistema/login`, {
        waitUntil: "domcontentloaded",
        timeout: 120_000,
      });
      if (page.url().includes("vercel.com")) {
        throw new Error("vercel_authentication_still_required");
      }
      pageLoads.push(Date.now() - tPage);
      await page.getByLabel("E-mail").fill(diretoria.email);
      await page.getByLabel("Senha").fill(diretoria.temporaryPassword);
      const submitAt = Date.now();
      await Promise.all([
        page.waitForURL(/\/sistema\/?$/, { timeout: 180_000 }),
        page.getByRole("button", { name: "Entrar" }).click(),
      ]);
      await page.getByRole("heading", { name: "Painel" }).waitFor({
        state: "visible",
        timeout: 60_000,
      });
      submits.push(Date.now() - submitAt);

      if (i === 0) {
        report.performance.moduleNav = {
          clientes: await navMs(page, "Clientes", /\/sistema\/clientes/, /Clientes/i),
          orcamentos: await navMs(
            page,
            "Orçamentos",
            /\/sistema\/orcamentos/,
            /Orçamentos/i,
          ),
          contratacoes: await navMs(
            page,
            "Contratações",
            /\/sistema\/contratacoes/,
            /Contratações/i,
          ),
          agenda: await navMs(page, "Agenda", /\/sistema\/agenda/, /Agenda/i),
          financeiro: await navMs(
            page,
            "Financeiro",
            /\/sistema\/financeiro/,
            /Financeiro/i,
          ),
        };
      }
      await logout(page);
    }

    report.directLogin = true;
    report.performance.loginPageLoadsMs = pageLoads;
    report.performance.submitToHomeMs = submits;
    report.performance.firstSubmitMs = submits[0];
    report.performance.consecutiveMedianMs = median(submits.slice(1));
    report.performance.consecutiveMaxMs = Math.max(...submits.slice(1));
    report.performance.note =
      "firstSubmit pode refletir warm se o ambiente acabou de ser usado; cold ~60s já documentado após idle longo.";

    // Three profiles
    for (const account of accounts) {
      await login(page, account);
      const profile = await profileMenus(page, account);
      report.profiles.push(profile);
      if (!profile.ok) report.ok = false;
      await logout(page);
    }

    const routesOk = Object.values(report.privateRoutes).every(
      (r) => r.redirectedToLogin && !r.vercelSso,
    );
    if (!routesOk || !report.directLogin) report.ok = false;
    if (report.profiles.length !== 3) report.ok = false;
  } catch (error) {
    report.ok = false;
    report.error = error instanceof Error ? error.message : String(error);
  } finally {
    await browser.close();
  }

  writeFileSync(
    resolve(outDir, "final-validation.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 2);
}

main();
