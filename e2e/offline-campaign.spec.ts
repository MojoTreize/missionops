import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { USERS, asUser } from "./helpers";

/**
 * Campagne de tests hors ligne (B4.8) : le réseau tombe aux pires moments.
 * Chaque scénario vérifie qu'aucune saisie n'est perdue ni dupliquée.
 * Mission utilisée : la mission « en cours » du seed (Nzérékoré, Alpha Diakité).
 */

async function chooseMission(page: Page) {
  const value = await page
    .locator("#t-mission option", { hasText: "Évaluation des besoins à Nzérékoré" })
    .first()
    .getAttribute("value");
  await page.getByLabel("Mission").selectOption(value!);
}

async function openTerrain(page: Page) {
  await page.goto("/terrain");
  await chooseMission(page);
}

async function recordExpense(page: Page, description: string, withPhoto = false) {
  await page.getByLabel("Montant", { exact: true }).fill("25000");
  await page.getByLabel("Catégorie").selectOption("transport");
  await page.getByLabel("Description").fill(description);
  if (withPhoto) {
    await page.getByLabel("Photo du reçu").setInputFiles(join(__dirname, "fixtures", "recu.png"));
    await expect(page.getByText("Photo prête", { exact: false })).toBeVisible();
  } else {
    await page.getByLabel("Pas de reçu ? Expliquez pourquoi").fill("Taxi-moto sans reçu");
  }
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Enregistré sur le téléphone.")).toBeVisible();
}

function queueItem(page: Page, description: string) {
  return page.locator("li", { hasText: description });
}

test.describe("campagne hors ligne (B4.8)", () => {
  test("réponse perdue : le serveur a reçu le lot mais pas le téléphone — aucun doublon", async ({
    browser,
  }) => {
    const { context, page } = await asUser(browser, "alpha.diakite@croix-rouge-guinee.demo");
    const description = `Réponse perdue ${Date.now()}`;
    let dropped = 0;
    // Le lot atteint le serveur (qui l'enregistre), puis la réponse est perdue.
    await page.route("**/api/sync", async (route) => {
      if (dropped === 0) {
        dropped += 1;
        await route.fetch();
        await route.abort("connectionreset");
        return;
      }
      await route.continue();
    });
    await openTerrain(page);
    await recordExpense(page, description);
    // Au prochain déclencheur, le renvoi est reconnu comme doublon : « Envoyé ».
    await page.dispatchEvent("body", "focus");
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expect(queueItem(page, description).getByText("Envoyé")).toBeVisible({ timeout: 45_000 });
    // Une seule dépense côté serveur, malgré le renvoi.
    await page.goto("/expenses");
    await expect(page.getByText(description, { exact: true })).toHaveCount(1);
    await context.close();
  });

  test("coupure entre la dépense et la photo : la photo part au retour du réseau", async ({
    browser,
  }) => {
    const { context, page } = await asUser(browser, "alpha.diakite@croix-rouge-guinee.demo");
    const description = `Photo différée ${Date.now()}`;
    let blockPhotos = true;
    await page.route("**/api/receipts", (route) =>
      blockPhotos ? route.abort("internetdisconnected") : route.continue(),
    );
    await openTerrain(page);
    await recordExpense(page, description, true);
    const item = queueItem(page, description);
    await expect(item.getByText("Envoyé").first()).toBeVisible({ timeout: 45_000 });
    await expect(item.getByText("Photo du reçu · En attente")).toBeVisible();
    blockPhotos = false;
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expect(item.getByText("Photo du reçu · Envoyé")).toBeVisible({ timeout: 60_000 });
    await context.close();
  });

  test("erreur serveur passagère : l'élément reste en attente puis part", async ({ browser }) => {
    const { context, page } = await asUser(browser, "alpha.diakite@croix-rouge-guinee.demo");
    const description = `Erreur 503 ${Date.now()}`;
    let failures = 1;
    await page.route("**/api/sync", (route) =>
      failures-- > 0 ? route.fulfill({ status: 503, body: "{}" }) : route.continue(),
    );
    await openTerrain(page);
    await recordExpense(page, description);
    await expect(
      queueItem(page, description).getByText("En attente", { exact: true }),
    ).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expect(queueItem(page, description).getByText("Envoyé")).toBeVisible({ timeout: 60_000 });
    await context.close();
  });

  test("hors ligne au démarrage : plusieurs saisies, toutes envoyées dans l'ordre au retour", async ({
    browser,
  }) => {
    const { context, page } = await asUser(browser, "alpha.diakite@croix-rouge-guinee.demo", {
      serviceWorkers: "allow",
    });
    await openTerrain(page);
    await page.waitForTimeout(1500);
    await context.setOffline(true);
    await page.reload();
    await chooseMission(page);
    const stamp = Date.now();
    for (const n of [1, 2, 3]) await recordExpense(page, `Hors ligne ${stamp} n${n}`);
    await page.getByRole("button", { name: "Départ" }).click();
    await expect(page.getByText("En attente", { exact: true })).toHaveCount(4);
    await expect(page.getByText("4 en attente d'envoi", { exact: false })).toBeVisible();
    await context.setOffline(false);
    for (const n of [1, 2, 3]) {
      await expect(queueItem(page, `Hors ligne ${stamp} n${n}`).getByText("Envoyé")).toBeVisible({
        timeout: 60_000,
      });
    }
    await context.close();
  });

  test("une saisie refusée par le serveur est signalée, jamais perdue en silence", async ({
    browser,
  }) => {
    const { context, page } = await asUser(browser, USERS.agent);
    // Kadiatou n'a aucune mission en cours dans le seed : on force une mission
    // inconnue dans la file pour obtenir un refus explicite.
    await page.goto("/terrain");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Saisies locales")).toBeVisible();
    await page.evaluate(async () => {
      const request = indexedDB.open("missionops-terrain");
      await new Promise((resolve) => (request.onsuccess = resolve));
      const db = request.result;
      const bootstrap = await new Promise<{ organisationId: string } | undefined>((resolve) => {
        const r = db.transaction("bootstrap").objectStore("bootstrap").get("terrain");
        r.onsuccess = () => resolve(r.result as { organisationId: string } | undefined);
      });
      const tx = db.transaction("outbox", "readwrite");
      const id = crypto.randomUUID();
      tx.objectStore("outbox").put({
        id,
        type: "expense",
        payload: {
          id,
          missionId: crypto.randomUUID(),
          category: "transport",
          description: "Mission inexistante",
          amount: "1000",
          currency: "GNF",
          spentOn: new Date().toISOString().slice(0, 10),
          receiptMissingReason: "test",
        },
        label: "Mission inexistante",
        organisationId: bootstrap?.organisationId ?? "",
        status: "pending",
        attempts: 0,
        lastAttemptAt: null,
        error: null,
        createdAt: Date.now(),
      });
      await new Promise((resolve) => (tx.oncomplete = resolve));
    });
    await page.reload();
    const item = queueItem(page, "Mission inexistante");
    await expect(item.getByText("Refusé")).toBeVisible({ timeout: 45_000 });
    await expect(item.getByText("Élément introuvable.")).toBeVisible();
    await expect(item.getByRole("button", { name: "Réessayer" })).toBeVisible();
    await context.close();
  });
});
