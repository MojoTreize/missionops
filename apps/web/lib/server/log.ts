import "server-only";

/**
 * Journalisation structurée (B8.4) : une ligne JSON par événement, lisible
 * par n'importe quel collecteur (Fly.io, Loki, Datadog). Jamais de données
 * personnelles sensibles ni de secrets dans les champs.
 */
type Level = "debug" | "info" | "warn" | "error";

export function log(level: Level, event: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify(
    { ts: new Date().toISOString(), level, event, ...fields },
    (_, value) =>
      value instanceof Error
        ? { name: value.name, message: value.message, stack: value.stack }
        : value,
  );
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
