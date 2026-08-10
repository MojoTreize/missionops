import { createHash, randomBytes } from "node:crypto";

/**
 * Jetons opaques (session, lien magique, réinitialisation). Le jeton en clair
 * n'est jamais persisté : on ne stocke que son empreinte SHA-256. La base ne
 * peut donc pas être rejouée pour se connecter, même si elle fuite.
 */

// Génère un jeton aléatoire de 32 octets, encodé en base64url (sûr en URL).
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

// Empreinte SHA-256 (hex) d'un jeton en clair, telle que stockée en base.
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
