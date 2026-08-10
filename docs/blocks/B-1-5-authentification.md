# B1.5 — Authentification et session

## Objectif

Se connecter et se déconnecter, de façon sûre. Un utilisateur du seed peut se
connecter, la session est protégée et les routes applicatives sont gardées.

## Contenu

- **Deux voies de connexion** : lien magique par e-mail (voie par défaut) et mot
  de passe en secours (haché avec `scrypt`, intégré à Node, sans dépendance
  native).
- **Sessions en cookies `httpOnly`** : le navigateur ne détient qu'un jeton
  opaque ; seule son empreinte SHA-256 est stockée (`sessions`). Cookie
  `__Host-` : `Secure`, `SameSite=Lax`, `Path=/`.
- **Jetons à usage unique** (`auth_tokens`) : lien magique (15 min) et
  réinitialisation de mot de passe (1 h), invalidés dès le premier usage.
- **Limitation de débit** de la connexion par mot de passe (fenêtre glissante,
  5 tentatives / 15 min par e-mail + IP).
- **Protection des routes** : `middleware` (filtrage sur la présence du cookie)
  et garde serveur dans `(app)/layout` (validation réelle de la session).
- **Écrans** : `/login`, `/forgot-password`, `/reset-password`, construits sur
  les primitives B1.4. Espace authentifié `(app)/dashboard`.
- **Seed** (`pnpm db:seed`) : une organisation et un utilisateur de démonstration
  pour pouvoir se connecter sur un environnement de staging.

## Décisions appliquées

- ADR-005 — suppression logique : la déconnexion révoque la session via
  `deleted_at`, sans `DELETE` physique.
- §7.6 — pas d'`enum` PostgreSQL : `auth_tokens.type` est un `text`.
- Réponses génériques (anti-énumération) : demander un lien magique ou une
  réinitialisation renvoie toujours le même message, que le compte existe ou non.

## Tests

- Unitaires (Vitest) : limitation de débit (fenêtre glissante), hachage/vérif du
  mot de passe (salage, empreinte malformée), génération/empreinte des jetons.
- Migration validée hors ligne (PGlite) : `sessions` et `auth_tokens` présentes.
- Fumée : `/login` s'affiche ; `/dashboard` redirige vers `/login` sans session.

## Fini quand

Un utilisateur du seed peut se connecter sur `staging` depuis un téléphone (via
un vrai PostgreSQL). Hors ligne, tout le reste est vert : types, lint, tests,
build, migration.

## Hors périmètre de ce bloc

Les organisations et appartenances multiples (B1.6), les rôles et permissions
(B1.8), un vrai transport d'e-mail (branché ultérieurement à la place du
transport de développement qui journalise le lien).

## Dépend de

B1.3 (base de données), B1.4 (primitives).
