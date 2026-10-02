import "server-only";

import { randomUUID } from "node:crypto";

/**
 * Journalisation structurée (B8.4) : une ligne JSON par événement, lisible
 * par n'importe quel collecteur (Fly.io, Loki, Datadog). Jamais de données
 * personnelles sensibles ni de secrets dans les champs.
 *
 * Les erreurs sont aussi remontées à Sentry (région UE) si `SENTRY_DSN` est
 * défini, par l'API d'enveloppes — sans SDK, pour garder le serveur léger.
 */
type Level = "debug" | "info" | "warn" | "error";

function serialize(value: unknown): unknown {
  return value instanceof Error
    ? { name: value.name, message: value.message, stack: value.stack }
    : value;
}

export function log(level: Level, event: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify(
    { ts: new Date().toISOString(), level, event, ...fields },
    (_, value) => serialize(value),
  );
  if (level === "error") {
    console.error(line);
    void report(event, fields);
  } else if (level === "warn") console.warn(line);
  else console.info(line);
}

/** `https://<clé>@<hôte>/<projet>` → URL d'enveloppe et en-tête d'authentification. */
export function parseDsn(dsn: string): { url: string; auth: string } | null {
  const match = /^(https?):\/\/([^@]+)@([^/]+)\/(\d+)$/.exec(dsn.trim());
  if (!match) return null;
  const [, protocol, key, host, project] = match;
  return {
    url: `${protocol}://${host}/api/${project}/envelope/`,
    auth: `Sentry sentry_version=7, sentry_client=missionops/1.0, sentry_key=${key}`,
  };
}

async function report(event: string, fields: Record<string, unknown>): Promise<void> {
  const target = process.env.SENTRY_DSN ? parseDsn(process.env.SENTRY_DSN) : null;
  if (!target) return;
  const error = fields.error instanceof Error ? fields.error : null;
  const eventId = randomUUID().replace(/-/g, "");
  const payload = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "node",
    level: "error",
    environment: process.env.APP_ENV ?? process.env.NODE_ENV,
    message: event,
    exception: error
      ? { values: [{ type: error.name, value: error.message, stacktrace: { frames: [] } }] }
      : undefined,
    extra: JSON.parse(JSON.stringify(fields, (_, value) => serialize(value))),
  };
  const body = [
    JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(payload),
  ].join("\n");
  try {
    await fetch(target.url, {
      method: "POST",
      headers: { "content-type": "application/x-sentry-envelope", "x-sentry-auth": target.auth },
      body,
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // La remontée d'erreur ne doit jamais faire échouer la requête.
  }
}
