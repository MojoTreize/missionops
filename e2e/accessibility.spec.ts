import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { USERS, login } from "./helpers";

/**
 * Accessibilité (B8.2) : axe-core sur les écrans principaux, échec bloquant
 * sur toute violation « serious » ou « critical » (WCAG 2.1 AA).
 */
const PAGES = [
  "/dashboard",
  "/missions",
  "/missions/new",
  "/terrain",
  "/expenses",
  "/approvals",
  "/notifications",
  "/help",
];

test("les écrans principaux respectent WCAG 2.1 AA (axe-core)", async ({ page }) => {
  await login(page, USERS.manager);
  const failures: string[] = [];
  for (const path of PAGES) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    for (const v of results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    )) {
      failures.push(
        `${path} — ${v.id} (${v.impact}) : ${v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(" "))
          .join(" | ")}`,
      );
    }
  }
  expect(failures, failures.join("\n")).toEqual([]);
});

test("l'écran de connexion respecte WCAG 2.1 AA", async ({ page }) => {
  await page.goto("/login");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(
    results.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => v.id),
  ).toEqual([]);
});

test("la page d'accueil publique respecte WCAG 2.1 AA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(
    results.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`),
  ).toEqual([]);
});
