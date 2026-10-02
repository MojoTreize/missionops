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

Détection de secrets en CI · CSP à nonces (Next.js injecte des scripts en
ligne). Livrés depuis : CodeQL et `pnpm audit --prod --audit-level high`
(`.github/workflows/security.yml`) ; mise à jour de Next.js (15.5.27, RCE),
Drizzle (0.45, injection d'identifiants) et surcharges sharp, postcss,
nanoid ; limitation de débit par utilisateur sur `/api/sync` (120/min) et
`/api/receipts` (60/min), et sur la connexion (testée en E2E sur PostgreSQL).

## Dépend de

B8.2 (accessibilité).
