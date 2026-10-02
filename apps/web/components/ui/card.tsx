import * as React from "react";

import { cn } from "@/lib/cn";

/** Carte : surface blanche, bordure fine, ombre discrète. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-surface shadow-xs", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-border/70 px-5 py-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-field-softer text-field [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-[0.95rem] font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

/** En-tête de page : surtitre, titre, description et actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-field">{eyebrow}</p>
        ) : null}
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-[0.95rem] text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Indicateur chiffré du tableau de bord. */
export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "field",
  href,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "field" | "ledger" | "warning" | "info";
  href?: string;
}) {
  const tones = {
    field: "bg-field-softer text-field",
    ledger: "bg-ledger-soft text-ledger",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
  };
  const body = (
    <div className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted">{label}</span>
        {icon ? (
          <span className={cn("flex size-8 items-center justify-center rounded-lg [&_svg]:size-4", tones[tone])}>{icon}</span>
        ) : null}
      </div>
      <span className="tabular text-2xl font-semibold tracking-tight text-ink sm:text-[1.7rem]">{value}</span>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </div>
  );
  return href ? (
    <a href={href} className="block rounded-xl focus-visible:outline-offset-4">
      {body}
    </a>
  ) : (
    body
  );
}
