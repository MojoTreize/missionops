# B4.1 — PWA installable

> **Statut : livré.**

## Objectif

L'application s'installe sur l'écran d'accueil et s'ouvre sans navigateur
visible.

## Contenu

- **Manifeste** `apps/web/public/manifest.webmanifest` : nom, `start_url`
  `/terrain`, affichage `standalone`, orientation portrait, couleurs, icônes
  192 et 512 px dont une icône « maskable ».
- **Service worker** `apps/web/public/sw.js`, enregistré en production par
  `components/offline/sw-register.tsx` : précache de `/terrain` et `/offline`,
  cache d'abord pour les ressources statiques versionnées, réseau d'abord avec
  repli sur le cache puis sur `/offline` pour les navigations, réseau seul pour
  l'API sauf `GET /api/terrain`.
- **Mises à jour** : nouvelle version activée immédiatement (`skipWaiting`,
  `clients.claim`), anciens caches supprimés ; `sw.js` servi en `no-cache`.
- **Page `/offline`** qui renvoie vers l'écran Terrain.

## Décisions appliquées

- ADR-003 : aucune écriture ne passe par le service worker.
- CSP : `worker-src 'self'`, `manifest-src 'self'`.

## Tests

Manuel : installation sur Android. Audit Lighthouse PWA à intégrer en CI
(B8.1).

## Fini quand

Installée sur le téléphone de trois utilisateurs pilotes.

## Hors périmètre de ce bloc

Invitation à installer personnalisée · rechargement contrôlé proposé à
l'utilisateur lors d'une mise à jour · écran de démarrage dédié.

## Dépend de

B3.10.
