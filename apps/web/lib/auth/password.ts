import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// Paramètres scrypt. `N` élevé pour ralentir les attaques hors ligne, tout en
// restant tenable côté serveur. Longueur de clé dérivée : 64 octets.
const KEY_LENGTH = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 } as const;

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, SCRYPT_PARAMS, (err, derived) => {
      if (err) {
        reject(err);
      } else {
        resolve(derived);
      }
    });
  });
}

/**
 * Hache un mot de passe avec scrypt (intégré à Node, aucune dépendance native).
 * Format stocké : `scrypt$<selHex>$<empreinteHex>`.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await deriveKey(password, salt);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

/**
 * Vérifie un mot de passe contre une empreinte stockée, en temps constant.
 * Renvoie `false` pour toute empreinte malformée plutôt que de lever.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }
  const saltHex = parts[1];
  const hashHex = parts[2];
  if (!saltHex || !hashHex) {
    return false;
  }
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== KEY_LENGTH) {
    return false;
  }
  const derived = await deriveKey(password, salt);
  return timingSafeEqual(derived, expected);
}
