import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// La sortie autonome n'est activée que pour l'image Docker (staging Fly.io,
// B1.12) : elle repose sur des liens symboliques que Windows n'autorise pas
// sans privilège, donc on la laisse désactivée pour le build local et la CI.
const standalone = process.env.BUILD_STANDALONE === "1";

/**
 * En-têtes de sécurité (B8.3). Next.js injecte des scripts en ligne pour
 * l'hydratation : `script-src` autorise donc `'unsafe-inline'`, mais aucune
 * origine tierce n'est permise. `unsafe-eval` uniquement en développement.
 */
const isDev = process.env.NODE_ENV !== "production";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Regroupe le serveur et ses dépendances tracées, sans `node_modules` complet.
  output: standalone ? "standalone" : undefined,
  // Racine de traçage = racine du monorepo, pour embarquer les paquets internes.
  outputFileTracingRoot: path.join(dirname, "../.."),
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Le service worker doit être revalidé à chaque visite.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};

export default nextConfig;
