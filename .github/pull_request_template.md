## Bloc concerné

<!-- ex. B1.5 — Authentification. Lien vers docs/blocks/B-x-y.md -->

## Ce que fait cette PR

<!-- Résumé en une à trois phrases. -->

## Checklist « terminé »

- [ ] La spec `docs/blocks/B-x-y.md` est à jour avec ce qui a été fait
- [ ] Les tests décrits dans la spec existent et passent
- [ ] CI verte
- [ ] Testé à la main sur un téléphone Android réel, réseau 3G bridé
- [ ] Textes présents en français **et** en anglais
- [ ] Aucune régression sur le seed de démo
- [ ] Une ligne ajoutée dans `CHANGELOG.md`
- [ ] ≤ 400 lignes modifiées hors fichiers générés

## Revue de sécurité

- [ ] Chaque requête filtre sur `organisation_id`
- [ ] Chaque mutation vérifie un droit via `can()`
- [ ] Chaque mutation écrit dans `audit_log`
- [ ] Aucune suppression physique (utiliser `deleted_at`)

## Captures / notes de test manuel

<!-- Captures d'écran mobile, appareil et réseau testés. -->
