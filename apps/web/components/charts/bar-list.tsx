import type { Money } from "@missionops/core";

import { MoneyDisplay } from "@/components/ui/money-display";

/**
 * Barres horizontales à une seule série (magnitude). Une teinte unique, barre
 * fine arrondie côté donnée, ancrée à la ligne de base ; libellé et valeur en
 * encre de texte, jamais dans la couleur de la série. La liste est aussi la vue
 * tableau : chaque ligne porte son libellé et sa valeur exacte ; l'infobulle
 * (`title`) rappelle la part du total au survol.
 */
export function BarList({
  rows,
  locale,
  shareLabel,
  caption,
}: {
  rows: { key: string; label: string; detail?: string; amount: Money }[];
  locale: string;
  shareLabel: (percent: number) => string;
  caption: string;
}) {
  const max = rows.reduce(
    (acc, r) => (r.amount.amountMinor > acc ? r.amount.amountMinor : acc),
    0n,
  );
  const total = rows.reduce((acc, r) => acc + r.amount.amountMinor, 0n);
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="sr-only">{caption}</figcaption>
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => {
          const width = max === 0n ? 0 : Number((row.amount.amountMinor * 10000n) / max) / 100;
          const percent =
            total === 0n ? 0 : Math.round(Number((row.amount.amountMinor * 1000n) / total) / 10);
          return (
            <li key={row.key} className="flex flex-col gap-1" title={shareLabel(percent)}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="min-w-0 truncate text-ink">
                  {row.label}
                  {row.detail ? <span className="text-muted"> · {row.detail}</span> : null}
                </span>
                <MoneyDisplay money={row.amount} locale={locale} className="text-ink" />
              </div>
              <div className="h-2 w-full rounded-r bg-transparent" aria-hidden>
                <div
                  className="h-2 rounded-r-[4px] bg-field"
                  style={{ width: `${Math.max(width, 0.5)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
