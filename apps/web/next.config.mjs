import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// La sortie autonome n'est activée que pour l'image Docker (staging Fly.io,
// B1.12) : elle repose sur des liens symboliques que Windows n'autorise pas
// sans privilège, donc on la laisse désactivée pour le build local et la CI.
const standalone = process.env.BUILD_STANDALONE === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Regroupe le serveur et ses dépendances tracées, sans `node_modules` complet.
  output: standalone ? "standalone" : undefined,
  // Racine de traçage = racine du monorepo, pour embarquer les paquets internes.
  outputFileTracingRoot: path.join(dirname, "../.."),
};

export default nextConfig;
