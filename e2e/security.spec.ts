import { expect, test } from "@playwright/test";

import { USERS, asUser, login } from "./helpers";

test("une page protégée renvoie vers la connexion", async ({ page }) => {
  await page.goto("/missions");
  await expect(page).toHaveURL(/\/login/);
});

test("une autre organisation ne voit pas les missions de la Croix-Rouge", async ({ browser }) => {
  const crg = await asUser(browser, USERS.manager);
  await crg.page.goto("/missions?status=all");
  const href = await crg.page.locator("ul a[href^='/missions/']").first().getAttribute("href");
  expect(href).toBeTruthy();

  const other = await asUser(browser, USERS.otherOrg);
  // Avec le streaming (loading.tsx), le statut est déjà parti : on vérifie
  // l'écran « introuvable » et, côté API, un 404 strict.
  await other.page.goto(href!);
  await expect(other.page.getByText("Page introuvable")).toBeVisible();
  const api = await other.context.request.get(`/api${href}/documents/ordre_mission`);
  expect(api.status()).toBe(404);
  await Promise.all([crg.context.close(), other.context.close()]);
});

test("un collaborateur n'accède ni à la finance ni au journal d'audit", async ({ page }) => {
  await login(page, USERS.agent);
  await page.goto("/finance");
  await expect(page).toHaveURL(/\/forbidden/);
  await page.goto("/audit");
  await expect(page).toHaveURL(/\/forbidden/);
});

test("les en-têtes de sécurité sont présents", async ({ request }) => {
  const response = await request.get("/login");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
});

test("la sonde de santé répond", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect((await response.json()).database).toBe("ok");
});

test("l'interface bascule en anglais sans texte en dur", async ({ page }) => {
  await login(page, USERS.director);
  await page.goto("/profile");
  await page.getByLabel(/Langue de l'interface/).selectOption("en");
  await page.waitForLoadState("networkidle");
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hello");
});

test("la connexion est bloquée après cinq échecs (limitation partagée en base)", async ({
  page,
}) => {
  const email = `inconnu-${Date.now()}@demo.gn`;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.goto("/login");
    await page.locator('input[name="email"]').last().fill(email);
    await page.locator('input[name="password"]').fill("mauvais-mot-de-passe");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByText("Adresse e-mail ou mot de passe incorrect.")).toBeVisible();
  }
  await page.goto("/login");
  await page.locator('input[name="email"]').last().fill(email);
  await page.locator('input[name="password"]').fill("mauvais-mot-de-passe");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByText("Trop de tentatives", { exact: false })).toBeVisible();
});
