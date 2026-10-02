#!/usr/bin/env node
/**
 * Test de charge minimal (B8.8), sans dépendance : Node 22 et `fetch` global.
 *
 * N'envoie que des requêtes GET de lecture : aucune donnée n'est créée. À lancer
 * contre `staging`, jamais contre la production sans prévenir.
 *
 * Variables :
 *   BASE_URL      URL de l'application (défaut http://localhost:3000)
 *   PATHS         chemins séparés par des virgules (défaut /api/health,/login)
 *   CONCURRENCY   nombre de clients simultanés (défaut 10)
 *   DURATION_S    durée du test en secondes (défaut 30)
 *   TIMEOUT_MS    délai maximal d'une requête (défaut 10000)
 *   COOKIE        en-tête Cookie facultatif, pour des pages authentifiées
 *                 (copié depuis un navigateur connecté sur staging)
 *
 * Exemple :
 *   BASE_URL=https://missionops-staging.fly.dev CONCURRENCY=50 DURATION_S=60 \
 *     node scripts/load-test.mjs
 *
 * Sortie : nombre de requêtes, débit, taux d'erreur, latences p50/p95/p99 par
 * chemin et au total. Code de sortie 1 si le taux d'erreur dépasse
 * MAX_ERROR_RATE (défaut 0,01).
 */

const env = process.env;
const BASE_URL = (env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const PATHS = (env.PATHS ?? "/api/health,/login")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);
const CONCURRENCY = positiveInt(env.CONCURRENCY, 10);
const DURATION_S = positiveInt(env.DURATION_S, 30);
const TIMEOUT_MS = positiveInt(env.TIMEOUT_MS, 10_000);
const MAX_ERROR_RATE = Number.parseFloat(env.MAX_ERROR_RATE ?? "0.01");
const COOKIE = env.COOKIE ?? "";

function positiveInt(value, fallback) {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Percentile par rang le plus proche, sur un tableau trié. */
function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1];
}

/** @type {Map<string, { latencies: number[]; errors: number; statuses: Map<string, number> }>} */
const stats = new Map(PATHS.map((p) => [p, { latencies: [], errors: 0, statuses: new Map() }]));

function record(path, latency, status, ok) {
  const s = stats.get(path);
  s.latencies.push(latency);
  if (!ok) s.errors += 1;
  s.statuses.set(status, (s.statuses.get(status) ?? 0) + 1);
}

async function hit(path) {
  const started = performance.now();
  try {
    const response = await fetch(BASE_URL + path, {
      headers: COOKIE ? { cookie: COOKIE } : {},
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // Le corps est lu entièrement pour mesurer une réponse complète.
    await response.arrayBuffer();
    const ok = response.status < 400;
    record(path, performance.now() - started, String(response.status), ok);
  } catch (error) {
    const kind = error?.name === "TimeoutError" ? "timeout" : "network";
    record(path, performance.now() - started, kind, false);
  }
}

async function worker(id, deadline) {
  let i = id;
  while (performance.now() < deadline) {
    await hit(PATHS[i % PATHS.length]);
    i += 1;
  }
}

function line(label, latencies, errors) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const count = sorted.length;
  const rate = count === 0 ? 0 : errors / count;
  const ms = (v) => `${v.toFixed(0)} ms`.padStart(8);
  return [
    label.padEnd(24),
    String(count).padStart(8),
    `${(rate * 100).toFixed(2)} %`.padStart(9),
    ms(percentile(sorted, 50)),
    ms(percentile(sorted, 95)),
    ms(percentile(sorted, 99)),
  ].join("  ");
}

async function main() {
  console.log(
    `Test de charge : ${BASE_URL} · ${CONCURRENCY} clients · ${DURATION_S} s · ${PATHS.join(", ")}` +
      (COOKIE ? " · authentifié" : ""),
  );
  const started = performance.now();
  const deadline = started + DURATION_S * 1000;
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, id) => worker(id, deadline)));
  const elapsedS = (performance.now() - started) / 1000;

  console.log("");
  console.log(
    [
      "Chemin".padEnd(24),
      "Requêtes".padStart(8),
      "Erreurs".padStart(9),
      "p50".padStart(8),
      "p95".padStart(8),
      "p99".padStart(8),
    ].join("  "),
  );
  let all = [];
  let errors = 0;
  for (const [path, s] of stats) {
    console.log(line(path, s.latencies, s.errors));
    const codes = [...s.statuses].map(([code, n]) => `${code}×${n}`).join(" ");
    console.log(`${"".padEnd(24)}  statuts : ${codes || "aucun"}`);
    all = all.concat(s.latencies);
    errors += s.errors;
  }
  console.log(line("TOTAL", all, errors));
  const errorRate = all.length === 0 ? 1 : errors / all.length;
  console.log("");
  console.log(
    `Débit : ${(all.length / elapsedS).toFixed(1)} requêtes/s sur ${elapsedS.toFixed(1)} s`,
  );
  if (errorRate > MAX_ERROR_RATE) {
    console.error(
      `Taux d'erreur ${(errorRate * 100).toFixed(2)} % au-delà du seuil ${(MAX_ERROR_RATE * 100).toFixed(2)} %`,
    );
    process.exitCode = 1;
  }
}

await main();
