"use client";

import { useId, useMemo, useState } from "react";

import { searchLocations, type SearchableLocation } from "@missionops/core";

import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/client";

export type PickerLocation = SearchableLocation & { path: string };

/**
 * Sélecteur de destination (B2.1) : recherche insensible aux accents dans le
 * référentiel national embarqué et les lieux de l'organisation. Aucun appel
 * réseau : il fonctionne hors ligne. Deux touches suffisent (« nz » → Nzérékoré).
 *
 * Écrit deux champs cachés : `destinationCode` (lieu national) ou
 * `destinationLocationId` (lieu de l'organisation).
 */
export function LocationPicker({
  locations,
  defaultId,
  error,
}: {
  locations: PickerLocation[];
  defaultId?: string | null;
  error?: string;
}) {
  const t = useT();
  const id = useId();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PickerLocation | null>(
    () => locations.find((l) => l.id === defaultId) ?? null,
  );
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchLocations(locations, query, 8), [locations, query]);

  const choose = (location: PickerLocation) => {
    setSelected(location);
    setQuery("");
  };

  const isOrg = selected?.level === "organisation";
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {t("missions.form.destination")}
      </label>
      <input type="hidden" name="destinationCode" value={selected && !isOrg ? selected.id : ""} />
      <input
        type="hidden"
        name="destinationLocationId"
        value={selected && isOrg ? selected.id : ""}
      />
      {selected ? (
        <div className="flex h-11 items-center justify-between rounded-md border border-field bg-field-soft px-3">
          <span className="truncate text-sm font-medium text-field">{selected.path}</span>
          <button
            type="button"
            className="text-sm text-field underline"
            onClick={() => setSelected(null)}
          >
            {t("missions.form.destinationClear")}
          </button>
        </div>
      ) : (
        <div className="relative">
          <Input
            id={id}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-invalid={error ? true : undefined}
            autoComplete="off"
            placeholder={t("missions.form.destinationPlaceholder")}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((i) => Math.min(i + 1, results.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (event.key === "Enter" && results[active]) {
                event.preventDefault();
                choose(results[active].location);
              }
            }}
          />
          {query.trim() ? (
            <ul
              id={`${id}-list`}
              role="listbox"
              className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-surface shadow-md"
            >
              {results.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted">
                  {t("missions.form.destinationNone")}
                </li>
              ) : (
                results.map((result, index) => (
                  <li
                    key={result.location.id}
                    role="option"
                    aria-selected={index === active}
                    className={`flex cursor-pointer flex-col px-3 py-2 ${index === active ? "bg-field-soft" : ""}`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      choose(result.location);
                    }}
                  >
                    <span className="text-sm font-medium text-ink">{result.location.path}</span>
                    <span className="text-xs text-muted">
                      {t(`locationLevel.${result.location.level}`)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      )}
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted">{t("missions.form.destinationHint")}</p>
      )}
    </div>
  );
}
