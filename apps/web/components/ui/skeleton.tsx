import * as React from "react";

import { cn } from "@/lib/cn";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/** Bloc de chargement animé, réservant l'espace du contenu à venir. */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-ink/[0.06]", className)} {...props} />;
}
