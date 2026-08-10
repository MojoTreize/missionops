# B1.10 — Coque applicative

## Objectif

La navigation existe et diffère selon l'appareil. On peut circuler dans
l'application (encore presque vide) sans jamais se retrouver bloqué.

## Contenu

- **Configuration de navigation unique** (`apps/web/lib/nav.ts`) : quatre
  sections de premier niveau (Tableau de bord, Missions, Dépenses, Rapports),
  source de vérité partagée par la barre latérale et la barre d'onglets basse ;
  helpers `isActivePath` et `buildBreadcrumbs`.
- **Ordinateur** (`md:` et plus) : barre latérale (marque, sélecteur
  d'organisation, navigation, compte + déconnexion), fil d'Ariane dérivé de
  l'URL, recherche globale ouverte au clic ou par `Ctrl/⌘ + K`.
- **Mobile** : en-tête compact (marque, recherche, menu compte en `Sheet` avec
  organisation, membres et déconnexion) et barre d'onglets basse fixe à quatre
  entrées, avec marge de sécurité (`env(safe-area-inset-bottom)`).
- **Pages de section** `/missions`, `/expenses`, `/reports` en état vide
  (`EmptyState`) — aucune destination de navigation n'est un cul-de-sac.
- **États transverses** : `loading.tsx` (squelettes) et `error.tsx` (frontière
  d'erreur avec « Réessayer ») dans l'espace authentifié, `not-found.tsx` global
  (404 ramenant au tableau de bord).

## Décisions appliquées

- Une seule configuration de navigation pour les deux habillages : impossible de
  désynchroniser la barre latérale et la barre d'onglets.
- Coque en composant serveur (garde d'auth + données) ; seuls les fragments
  interactifs (navigation active, recherche, menu compte) sont des composants
  clients.
- Sur mobile, la barre basse porte les quatre sections ; le reste (organisation,
  membres, déconnexion) passe par le menu compte, pour ne rien rendre
  inaccessible.
- Mise en page sans débordement horizontal à 375 px : grille à colonne unique
  sur mobile, `min-w-0` et `truncate` sur les zones de texte.

## Tests

- Unitaire (Vitest) : la configuration de navigation expose exactement quatre
  entrées à href unique ; `isActivePath` distingue route exacte, sous-route et
  préfixe voisin ; `buildBreadcrumbs` accumule les maillons et marque la page
  courante.
- Hors ligne : typecheck, lint, build (routes `/missions`, `/expenses`,
  `/reports`, `not-found` incluses).

## Fini quand

On circule dans l'application vide sans se retrouver bloqué : chaque entrée de
navigation mène à une page, la 404 et l'erreur ramènent toujours vers un point
d'entrée.

## Hors périmètre de ce bloc

Le test E2E de navigation clavier complète et la vérification visuelle à 375 px
sous navigateur (Playwright non encore installé) : la structure responsive et
l'accessibilité clavier (liens, `aria-current`, focus visible, raccourci
recherche) sont en place ; l'E2E sera ajouté avec la suite E2E. La recherche
globale n'interroge encore aucune donnée (coque uniquement).

## Dépend de

B1.4 (jetons et primitives), B1.6 (organisations et appartenances).
