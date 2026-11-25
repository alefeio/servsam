/**
 * Inativa o colaborador HOMOL-QA-11B3 via UI (Situação → Inativo).
 */
import { resolve } from "node:path";
import { chromium } from "playwright";
import { config as loadEnv } from "dotenv";
import { readFileSync } from "node:fs";

loadEnv({ path: ".env.local" });

const BASE = process.env.HOMOL_QA_BASE_URL || "http://127.0.0.1:3463";
const run = JSON.parse(
  readFileSync(
    resolve("docs/architecture/v1/artifacts-11b3-operational/run-result.json"),
    "utf8",
  ),
);
const employeeId = run.ids.employeeId;
const email = (process.env.SEED_ADMIN_EMAIL || "").trim();
const password = process.env.SEED_ADMIN_PASSWORD || "";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
try {
  await page.goto(`${BASE}/sistema/login`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/sistema\/?$/, { timeout: 90_000 });
  await page.goto(`${BASE}/sistema/colaboradores/${employeeId}`);
  await page.getByLabel("Situação").selectOption({ label: "Inativo" });
  await page.getByRole("button", { name: "Salvar colaborador" }).click();
  await page.waitForTimeout(2000);
  await page.reload();
  await page.getByText(/Inativo/i).first().waitFor({ timeout: 30_000 });
  await page.screenshot({
    path: resolve(
      "docs/architecture/v1/artifacts-11b3-operational/16-employee-inactivated.png",
    ),
    fullPage: true,
  });
  console.log(JSON.stringify({ ok: true, employeeId, status: "inactive" }));
  await browser.close();
  process.exit(0);
} catch (error) {
  console.error(
    JSON.stringify({
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    }),
  );
  await browser.close();
  process.exit(1);
}
