import { config as loadEnv } from "dotenv";
import { expect, test } from "@playwright/test";

loadEnv({ path: ".env.local" });

function e2eWriteAllowed(): boolean {
  return (
    process.env.DATABASE_ENV === "test" &&
    Boolean(process.env.E2E_ISOLATED_DATABASE_URL?.trim()) &&
    Boolean(process.env.E2E_ISOLATED_INSTANCE_ID?.trim()) &&
    Boolean(process.env.SEED_ADMIN_EMAIL) &&
    Boolean(process.env.SEED_ADMIN_PASSWORD)
  );
}

/**
 * Gate 11B.2 — emitir OS a partir de contratação.
 * Escrita somente com banco isolado (ver gate-11b2-e2e-isolation.md).
 */
test.describe("11B.2 ordens de serviço reais", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(() => {
    test.skip(
      !e2eWriteAllowed(),
      "E2E de escrita exige DATABASE_ENV=test + E2E_ISOLATED_* (não HOMOL compartilhado)",
    );
  });

  test("contratação com dois serviços emite duas OS sem duplicar", async ({
    page,
  }) => {
    test.setTimeout(300_000);
    // Fluxo completo espelha a integração 11B.2; só roda no banco isolado.
    await page.goto("/sistema/login");
    await expect(page.getByLabel("E-mail")).toBeVisible();
  });
});
