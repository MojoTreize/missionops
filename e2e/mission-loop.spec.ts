import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { USERS, asUser, expectStatus, submit } from "./helpers";

/**
 * Parcours critique de bout en bout (plan §1) : demande → validation →
 * avance → dépense saisie HORS LIGNE avec photo → synchronisation →
 * validation financière → retour → réconciliation → clôture → Closure Pack.
 * Trois rôles, trois navigateurs.
 */
test("la boucle argent-justificatif complète, dont la saisie hors ligne", async ({ browser }) => {
  const stamp = Date.now();
  const title = `E2E Kindia ${stamp}`;
  const description = `Hôtel Nzérékoré ${stamp}`;
  const agent = await asUser(browser, USERS.agent, { serviceWorkers: "allow" });
  const manager = await asUser(browser, USERS.manager);
  const finance = await asUser(browser, USERS.finance);
  const today = new Date().toISOString().slice(0, 10);

  // 1. Le collaborateur crée sa demande (destination trouvée en deux touches).
  const a = agent.page;
  await a.goto("/missions/new");
  await a.getByLabel("Intitulé").fill(title);
  await a
    .getByLabel("Objet de la mission")
    .fill("Distribution de kits d'hygiène aux centres de santé.");
  await a.getByRole("combobox", { name: "Destination" }).fill("nz");
  await a.getByRole("option").first().click();
  await expect(a.getByText("Nzérékoré", { exact: false }).first()).toBeVisible();
  await a.getByLabel("Départ").fill(today);
  await a.getByLabel("Retour").fill(today);
  await a.getByLabel("Moyen de transport").selectOption("vehicule_org");
  await a.getByRole("button", { name: "Créer le brouillon" }).click();
  await a.waitForURL(/\/missions\/[0-9a-f-]{36}$/);
  const missionUrl = a.url();
  const missionPath = new URL(missionUrl).pathname;

  await a.getByLabel("Libellé").fill("Hébergement");
  await a.getByLabel("Catégorie").selectOption("hebergement");
  await a.getByLabel("Montant unitaire").fill("500000");
  await submit(a, "Ajouter la ligne");
  await expect(a.getByText("Hébergement").first()).toBeVisible();
  await submit(a, "Soumettre en validation");
  await a.reload();
  await expectStatus(a, "En validation");

  // 2. Le manager valide depuis sa file.
  const m = manager.page;
  await m.goto("/approvals");
  await expect(m.getByText(title)).toBeVisible();
  await m.goto(missionPath);
  await submit(m, "Confirmer");
  await m.reload();
  await expectStatus(m, "Validée");

  // 3. La finance verse une avance.
  const f = finance.page;
  await f.goto(missionPath);
  await f.getByLabel("Montant", { exact: true }).fill("600000");
  await submit(f, "Enregistrer l'avance");
  await f.reload();
  await expect(f.getByText("600 000 GNF").first()).toBeVisible();

  // 4. Le collaborateur démarre puis saisit une dépense SANS RÉSEAU.
  await a.goto(missionPath);
  await submit(a, "Démarrer la mission");
  await a.goto(`/terrain?mission=${missionPath.split("/").pop()}`);
  await expect(a.getByRole("status").first()).toBeVisible();
  await a.waitForTimeout(1500); // le service worker met l'écran terrain en cache
  await agent.context.setOffline(true);
  await a.reload();
  await expect(a.getByText("Hors ligne — vos saisies", { exact: false })).toBeVisible();
  await a.getByLabel("Montant", { exact: true }).fill("450000");
  await a.getByLabel("Catégorie").selectOption("hebergement");
  await a.getByLabel("Description").fill(description);
  await a.getByLabel("Photo du reçu").setInputFiles(join(__dirname, "fixtures", "recu.png"));
  await expect(a.getByText("Photo prête", { exact: false })).toBeVisible();
  await a.getByRole("button", { name: "Enregistrer" }).click();
  await expect(a.getByText("Enregistré sur le téléphone.")).toBeVisible();
  await expect(a.getByText("En attente").first()).toBeVisible();

  // 5. Retour du réseau : la file se vide toute seule.
  await agent.context.setOffline(false);
  await expect(a.getByText("Envoyé").first()).toBeVisible({ timeout: 45_000 });
  await expect(a.getByText("Photo du reçu · Envoyé")).toBeVisible({ timeout: 45_000 });

  // 6. La finance voit la dépense avec son justificatif et l'approuve.
  await f.goto("/expenses?view=pending");
  const row = f.locator("li", { hasText: description });
  await expect(row.getByText("Voir le reçu")).toBeVisible();
  const approved = f.waitForResponse((r) => r.request().method() === "POST");
  await row.getByRole("button", { name: "Approuver" }).click();
  await approved;

  // 7. Retour, réconciliation (l'agent doit reverser 150 000), clôture.
  await a.goto(missionPath);
  await submit(a, "Déclarer le retour");
  await a.goto(`${missionPath}/reconciliation`);
  await expect(a.getByText("L'agent doit reverser 150 000 GNF")).toBeVisible();
  await submit(a, "Soumettre à la finance");

  await f.goto(`${missionPath}/reconciliation`);
  await submit(f, "Enregistrer le règlement");
  await submit(f, "Valider et clôturer la mission");
  await f.goto(missionPath);
  await expectStatus(f, "Clôturée");

  // 8. Le Closure Pack est un PDF versionné, avec son empreinte.
  const response = await finance.context.request.get(`/api${missionPath}/documents/closure_pack`);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/pdf");
  expect(response.headers()["x-document-sha256"]).toMatch(/^[a-f0-9]{64}$/);
  expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");

  await Promise.all([agent.context.close(), manager.context.close(), finance.context.close()]);
});
