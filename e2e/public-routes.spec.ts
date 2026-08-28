import { expect, test } from "@playwright/test";
import { publicNavItems } from "../src/data/official/navigation";
import { services } from "../src/data/official/services";

test("home opens", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
  await expect(
    page.getByRole("heading", {
      name: "Soluções técnicas para ambientes mais seguros e operações mais confiáveis.",
    }),
  ).toBeVisible();
});

test("public menu visits every route", async ({ page }) => {
  for (const item of publicNavItems) {
    const response = await page.goto(item.href);
    expect(response?.ok(), item.href).toBeTruthy();
    await expect(page.locator("h1")).toBeVisible();
  }
});

test("service slug page opens", async ({ page }) => {
  const service = services[0];
  const response = await page.goto(`/servicos/${service.slug}`);
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: service.name })).toBeVisible();
});
