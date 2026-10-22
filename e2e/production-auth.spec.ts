import { config as loadEnv } from "dotenv";
import { expect, test } from "@playwright/test";

loadEnv({ path: ".env.local" });

test("production login is separate from the demo", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/sistema");
  await expect(page).toHaveURL(/\/sistema\/login$/);
  await expect(page.getByRole("heading", { name: "Entrar no sistema" })).toBeVisible();
  await expect(page.getByText("servsam-demo")).toHaveCount(0);
  await expect(page.getByText("direcao@demo.servsam.local")).toHaveCount(0);

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    test.skip(true, "SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD não estão no ambiente");
    return;
  }

  await page.getByLabel("E-mail").fill(email ?? "");
  await page.getByLabel("Senha").fill(password ?? "");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/sistema$/, { timeout: 30000 });
  await expect(page.getByRole("heading", { name: "Fundação do sistema" })).toBeVisible();

  await page.getByRole("link", { name: "Usuários" }).click();
  await expect(page.getByRole("heading", { name: "Usuários" })).toBeVisible();

  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/sistema\/login$/);
});
