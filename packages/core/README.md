# @missionops/core

**Domaine métier pur — zéro dépendance externe, zéro I/O.**

Ni React, ni Drizzle, ni `fetch`, ni `Date.now()`. Le temps est injecté en
paramètre. C'est ce qui rend ses tests instantanés et déterministes.

Sous-domaines prévus (voir [plan](../../docs/plan.md), section 3.1) :

- `money/` — Money, devises, taux, arrondis (B3.1)
- `mission/` — machine à états, règles de validation (B2.2)
- `expense/` — règles de dépense (B3.5)
- `reconciliation/` — calcul de solde d'avance (B3.8)
- `policy/` — rôles et permissions (B1.8)

Objectif de couverture : **90 %**.
