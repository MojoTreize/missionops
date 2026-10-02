import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout (plan §9). Ils s'exécutent contre une application
 * démarrée sur une base amorcée par `pnpm db:reset && pnpm db:seed:demo`.
 *
 *   E2E_BASE_URL=http://localhost:3000 pnpm test:e2e
 *
 * Profil mobile par défaut (375 px) : l'écran terrain est conçu pour lui.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    locale: "fr-FR",
    timezoneId: "Africa/Conakry",
    trace: "retain-on-failure",
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } }
      : {}),
  },
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 375, height: 800 },
        browserName: "chromium",
      },
    },
  ],
});
