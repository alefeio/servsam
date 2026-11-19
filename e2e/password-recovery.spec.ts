import { expect, test } from "@playwright/test";

test("forgot password entry points stay separate from the demo", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/sistema/login");
  await expect(page.getByRole("heading", { name: "Entrar no sistema" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Esqueci minha senha" })).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/sistema\/esqueci-senha$/),
    page.getByRole("link", { name: "Esqueci minha senha" }).click(),
  ]);
  await expect(page.getByRole("heading", { name: "Recuperar senha" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar link de recuperação" })).toBeVisible();
  await expect(page.getByText("servsam-demo")).toHaveCount(0);

  await page.getByLabel("E-mail").fill("nao-existe@example.com");
  await page.getByRole("button", { name: "Enviar link de recuperação" }).click();
  await expect(
    page.getByText("Se este e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha."),
  ).toBeVisible({ timeout: 45000 });

  await page.goto("/sistema/redefinir-senha");
  await expect(page.getByRole("heading", { name: "Redefinir senha" })).toBeVisible();
  await expect(page.getByText(/inválido ou expirou/i)).toBeVisible();
});
