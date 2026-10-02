# B3.5 — Saisie de dépense

> **Statut : livré.**

## Objectif

Enregistrer une dépense en moins de 30 secondes sur un téléphone.

## Contenu

- **Table `expenses`** : catégorie, description, montant et devise, taux figé,
  montant en devise de base, date, statut (`soumise`, `approuvee`, `rejetee`),
  hors période, motif d'absence de justificatif, origine hors ligne et heure de
  saisie client.
- **Formulaire minimal** sur l'écran Terrain (`/terrain`) : mission, montant
  (clavier décimal), devise, catégorie, date du jour par défaut, description,
  photo. Un seul chemin d'enregistrement, en ligne comme hors ligne (file de
  synchronisation, B4.3).
- **Règles** `checkExpense` : mission `VALIDEE`, `EN_COURS` ou `TERMINEE`,
  montant positif, description, date valide ; justificatif **ou** motif
  obligatoire, sauf per diem ; avertissement `out_of_period` au-delà de la
  période de mission (tolérance d'un jour avant, deux après).
- **Liste `/expenses`** avec accès aux justificatifs.
- Idempotence sur l'UUID client (`createExpense` renvoie `duplicate`).

## Décisions appliquées

- ADR-002 (conversion au taux de la date de dépense), ADR-003 (UUID client).

## Tests

Unitaires : dépense justifiée acceptée, justificatif ou motif exigé sauf per
diem, hors période signalé, saisies invalides refusées. Intégration :
dépenses idempotentes.

## Fini quand

Chronométré à moins de 30 secondes sur un vrai téléphone (à mesurer).

## Hors périmètre de ce bloc

Mémoire de la dernière catégorie utilisée · mode brouillon d'une dépense.

## Dépend de

B3.4 (avances).
