import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? "3000";
const baseURL = `http://127.0.0.1:${PORT}`;
const isolatedTest =
  process.env.DATABASE_ENV?.trim().toLowerCase() === "test" &&
  Boolean(process.env.E2E_ISOLATED_DATABASE_URL?.trim());

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  timeout: 90000,
  expect: {
    timeout: 20000,
  },
  webServer: {
    // Banco isolado: `next start` evita flakiness de server actions no `next dev`.
    command: isolatedTest
      ? `npx next start --hostname 127.0.0.1 --port ${PORT}`
      : "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    env: {
      ...process.env,
      DATABASE_ENV: process.env.DATABASE_ENV ?? "",
      E2E_ISOLATED_DATABASE_URL: process.env.E2E_ISOLATED_DATABASE_URL ?? "",
      RUNTIME_DATABASE_URL: process.env.RUNTIME_DATABASE_URL ?? "",
      POSTGRES_URL: process.env.POSTGRES_URL ?? "",
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
