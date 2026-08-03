# Contribuer à MissionOps

## Principe fondateur

**Un bloc = une spec écrite = une session = une Pull Request.**

On n'écrit pas de code sans une fiche de bloc à jour dans `docs/blocks/B-x-y.md`.
Un bloc sans spec écrite n'est pas prêt.

## Flux de travail

1. Choisir un bloc du plan ([docs/plan.md](docs/plan.md)).
2. Écrire ou relire sa fiche `docs/blocks/B-x-y.md` (objectif, règles métier,
   modèle de données, tests, « fini quand »).
3. Créer une branche : `b/<numéro-de-bloc>-<slug>` (ex. `b/1-5-authentification`).
4. Implémenter dans l'ordre : migration → domaine + tests → accès aux données
   → route + validation Zod → interface → test E2E.
5. Ouvrir une PR (≤ 400 lignes modifiées hors fichiers générés).
6. CI verte + relecture + test manuel sur téléphone Android réel.
7. Fusion en **squash** : un bloc = un commit sur `main`.

## Branches

- `b/<bloc>-<slug>` — un bloc du plan
- `fix/<slug>` — un correctif
- `chore/<slug>` — outillage

`main` est protégée : pas de push direct, PR obligatoire, CI verte, historique
linéaire, branche supprimée après fusion.

## Commits conventionnels

```
feat(expense): saisie de dépense hors ligne
fix(money): arrondi GNF sur conversion EUR
test(reconciliation): cas de l'avance supérieure aux dépenses
docs(adr): ADR-007 stratégie de synchronisation
chore(ci): cache pnpm dans le workflow
```

## Définition de « terminé »

- [ ] La spec `docs/blocks/B-x-y.md` est à jour
- [ ] Les tests décrits existent et passent
- [ ] CI verte
- [ ] Code relu et approuvé (si équipe > 1)
- [ ] Testé à la main sur un téléphone Android réel, 3G bridée
- [ ] Textes en français **et** en anglais
- [ ] Aucune régression sur le seed de démo
- [ ] Déployé sur `staging`
- [ ] Une ligne ajoutée dans `CHANGELOG.md`

## Dette technique

Toute dette volontaire devient une issue étiquetée `dette`, écrite le jour même,
avec la raison et le coût estimé de remboursement.
