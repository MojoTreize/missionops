/**
 * Constantes d'authentification (B1.5). Durées volontairement centralisées ici
 * pour être réutilisées par la logique et par les tests.
 */

// Durée de validité d'une session (30 jours).
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Durée de validité d'un lien magique (15 minutes) — court, car c'est une
// connexion directe.
export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

// Durée de validité d'un lien de réinitialisation de mot de passe (1 heure).
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

// Nom du cookie de session. Le préfixe `__Host-` impose Secure + Path=/ + pas de
// Domaine, ce qui verrouille le cookie sur l'origine exacte.
export const SESSION_COOKIE_NAME = "__Host-missionops_session";

// Types de jetons stockés dans `auth_tokens`.
export const AUTH_TOKEN_TYPES = {
  magicLink: "magic_link",
  passwordReset: "password_reset",
} as const;

export type AuthTokenType = (typeof AUTH_TOKEN_TYPES)[keyof typeof AUTH_TOKEN_TYPES];

// Limitation de débit de la connexion : au plus 5 tentatives par fenêtre
// glissante de 15 minutes, par clé (e-mail + IP).
export const LOGIN_RATE_LIMIT = {
  max: 5,
  windowMs: 15 * 60 * 1000,
} as const;
