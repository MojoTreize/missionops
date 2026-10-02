import * as React from "react";

import { cn } from "@/lib/cn";
import { formatMoney, type Money } from "@/lib/money";

export interface MoneyDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  money: Money;
  locale?: string;
  /** Met en évidence l'accent « grand-livre » (montants clés). */
  accent?: boolean;
}

/**
 * Affiche un montant monétaire (ADR-002) avec des chiffres tabulaires,
 * pour un alignement propre en colonnes de tableau.
 */
export function MoneyDisplay({
  money,
  locale = "fr",
  accent = false,
  className,
  ...props
}: MoneyDisplayProps) {
  const negative = money.amountMinor < 0n;
  return (
    <span
      className={cn(
        "tabular whitespace-nowrap font-medium",
        accent && "font-semibold text-ledger",
        negative && "text-danger",
        className,
      )}
      {...props}
    >
      {formatMoney(money, locale)}
    </span>
  );
}
