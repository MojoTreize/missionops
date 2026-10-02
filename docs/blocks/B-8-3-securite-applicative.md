# B8.3 — Sécurité applicative

> **Statut : partiel.**

## Objectif

Résister à un questionnaire de sécurité d'ONG internationale.

## Contenu

- **En-têtes de sécurité** (`apps/web/next.config.mjs`) : CSP sans origine
  tierce, HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`,
  `Permissions-Policy`, `Cross-Origin-Opener-Policy` ; `X-Powered-By` retiré.
- **Limitation de débit de la connexion partagée entre instances** :
  `DbRateLimiter` (`packages/services/src/rate-limit.ts`) sur la table système
  `rate_limits`, 5 tentatives par 15 minutes par e-mail et adresse IP ; remplace
  le compteur en mémoire.
- **Erreurs d'API** journalisées en JSON sans fuite de détail au client.
- **Rotation des secrets documentée** (`docs/runbooks/secrets.md`) et mesures
  résumées dans `docs/conformite/securite.md`.

## Décisions appliquées

- ADR-001 (RLS), ADR-004 (audit), séparation des tâches dans le domaine.

## Tests

Intégration : la limitation bloque au-delà du maximum et rouvre après la
fenêtre. E2E (`e2e/security.spec.ts`) : page protégée, autre organisation sans
accès aux missions, collaborateur sans accès à la finance ni à l'audit,
en-têtes présents.

## Fini quand

La checklist de revue de sécurité est intégrée au modèle de PR.

## Hors périmètre de ce bloc

À faire : CodeQL, audit des dépendances et détection de secrets en CI ;
limitation de débit sur toutes les routes de mutation ; CSP à nonces.

## Dépend de

B8.2 (accessibilité).
