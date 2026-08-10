import "server-only";

import { createDbClient, type Database } from "@missionops/db";

/**
 * Client de base de données partagé pour l'app web. Instancié paresseusement au
 * premier appel afin de ne pas exiger `DATABASE_URL` au moment du build (les
 * pages authentifiées sont rendues dynamiquement, à la requête). La couche
 * d'accès reste centralisée dans `@missionops/db` (voir client.ts).
 */
let handle: ReturnType<typeof createDbClient> | undefined;

export function getDb(): Database {
  if (!handle) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL est requis pour accéder à la base de données.");
    }
    handle = createDbClient(url, { max: 5 });
  }
  return handle.db;
}
