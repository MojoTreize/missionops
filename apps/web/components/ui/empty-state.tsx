import * as React from "react";

import { cn } from "@/lib/cn";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icône illustrative (ex. une icône lucide-react). */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Action principale, généralement un bouton. */
  action?: React.ReactNode;
  /** Rendre le titre en `h1` quand l'état vide est toute la page (404). */
  as?: "h1";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  as,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface-2 px-6 py-14 text-center",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-xl bg-surface text-field shadow-sm ring-1 ring-border [&_svg]:size-6">
          {icon}
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        {as === "h1" ? (
          <h1 className="text-base font-semibold text-ink">{title}</h1>
        ) : (
          <p className="text-base font-semibold text-ink">{title}</p>
        )}
        {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
