/**
 * Mede login no Preview hospedado (sem imprimir senhas/cookies).
 * Lê `.credentials/release-03-pilot.local.json`.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const BASE =
  process.env.PERF_BASE_URL ||
  "https://servsam-git-fix-11b-4-finance-qa-alefeios-projects.vercel.app";
const outDir = resolve("docs/release/artifacts-release-03-perf");
mkdirSync(outDir, { recursive: true });

const envelope = JSON.parse(
  readFileSync(resolve(".credentials/release-03-pilot.local.json"), "utf8"),
);
const account =
  envelope.accounts.find((a) => a.role === "DIRETORIA") || envelope.accounts[0];
if (!account?.email || !account?.temporaryPassword) {
  console.error(JSON.stringify({ ok: false, reason: "credentials_missing" }));
  process.exit(1);
}

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

async function measureOnce(page, label) {
  const marks = {};
  const t0 = Date.now();

  const loginNav = Date.now();
  const loginResponse = await page.goto(`${BASE}/sistema/login`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  marks.loginPageLoadMs = Date.now() - loginNav;
  marks.loginHttpStatus = loginResponse?.status() ?? null;

  await page.getByLabel("E-mail").fill(account.email);
  await page.getByLabel("Senha").fill(account.temporaryPassword);

  const submitAt = Date.now();
  await Promise.all([
    page.waitForURL(/\/sistema\/?$/, { timeout: 180_000 }),
    page.getByRole("button", { name: "Entrar" }).click(),
  ]);
  marks.authSubmitToHomeMs = Date.now() - submitAt;

  const homeReady = Date.now();
  await page.getByRole("heading", { name: "Painel" }).waitFor({
    state: "visible",
    timeout: 60_000,
  });
  marks.homeRenderMs = Date.now() - homeReady;
  marks.totalLoginJourneyMs = Date.now() - t0;

  const navAt = Date.now();
  await page
    .getByRole("navigation", { name: "Sistema", exact: true })
    .getByRole("link", { name: "Clientes", exact: true })
    .click();
  await page.waitForURL(/\/sistema\/clientes/);
  await page
    .getByRole("heading", { name: /Clientes/i })
    .first()
    .waitFor({ state: "visible", timeout: 60_000 });
  marks.navClientesMs = Date.now() - navAt;

  await page.getByRole("button", { name: "Sair" }).click();
  await page.waitForURL(/\/sistema\/login$/, { timeout: 60_000 });

  return { label, ...marks };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(180_000);

  const runs = [];
  try {
    // Cold-ish: first hit after opening browser
    runs.push(await measureOnce(page, "cold_or_first"));
    for (let i = 1; i <= 5; i++) {
      runs.push(await measureOnce(page, `warm_${i}`));
    }
  } catch (error) {
    writeFileSync(
      resolve(outDir, "login-measure-error.json"),
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
          runs,
        },
        null,
        2,
      ),
    );
    console.error(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        completedRuns: runs.length,
      }),
    );
    process.exitCode = 2;
    await browser.close();
    return;
  }

  await browser.close();

  const submitTimes = runs.map((r) => r.authSubmitToHomeMs);
  const totals = runs.map((r) => r.totalLoginJourneyMs);
  const navTimes = runs.map((r) => r.navClientesMs).filter((n) => typeof n === "number");
  const report = {
    ok: true,
    baseUrl: BASE,
    actorRole: account.role,
    emailDomain: String(account.email).split("@")[1],
    runs,
    summary: {
      submitToHome: {
        first: submitTimes[0],
        medianWarm: median(submitTimes.slice(1)),
        max: Math.max(...submitTimes),
        all: submitTimes,
      },
      totalJourney: {
        first: totals[0],
        medianWarm: median(totals.slice(1)),
        max: Math.max(...totals),
      },
      navClientes: navTimes.length
        ? {
            first: navTimes[0],
            medianWarm: median(navTimes.slice(1)),
            max: Math.max(...navTimes),
            all: navTimes,
          }
        : null,
    },
    capturedAt: new Date().toISOString(),
  };
  const outName =
    process.env.PERF_OUT_NAME?.trim() || "login-measure-before.json";
  writeFileSync(resolve(outDir, outName), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main();
