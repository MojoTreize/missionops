import { expect, type Browser, type Page } from "@playwright/test";

/** Comptes du seed de démonstration (`pnpm db:seed:demo`). */
export const PASSWORD = "motdepasse-demo";
export const USERS = {
  admin: "awa.diallo@croix-rouge-guinee.demo",
  director: "mamadou.barry@croix-rouge-guinee.demo",
  manager: "fatoumata.camara@croix-rouge-guinee.demo",
  finance: "aissatou.bah@croix-rouge-guinee.demo",
  logistician: "ousmane.conde@croix-rouge-guinee.demo",
  agent: "kadiatou.balde@croix-rouge-guinee.demo",
  otherOrg: "nfale.kourouma@medecins-du-monde-guinee.demo",
} as const;

export async function login(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.locator('input[name="email"]').last().fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/dashboard");
}

/** Ouvre une session dans un contexte isolé (un rôle = un navigateur). */
export async function asUser(
  browser: Browser,
  email: string,
  options: { serviceWorkers?: "allow" | "block" } = {},
) {
  const context = await browser.newContext({
    viewport: { width: 375, height: 800 },
    locale: "fr-FR",
    serviceWorkers: options.serviceWorkers ?? "block",
  });
  const page = await context.newPage();
  await login(page, email);
  return { context, page };
}

/** Clique sur un bouton d'action et attend le retour de l'action serveur. */
export async function submit(page: Page, name: string | RegExp): Promise<void> {
  const done = page.waitForResponse((r) => r.request().method() === "POST" && r.status() < 400);
  await page.getByRole("button", { name }).first().click();
  await done;
  await page.waitForLoadState("networkidle");
}

export async function expectStatus(page: Page, label: string): Promise<void> {
  await expect(page.locator("header").getByText(label, { exact: true }).first()).toBeVisible();
}
