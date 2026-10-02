import * as React from "react";

import { cn } from "@/lib/cn";

/**
 * Contrôles de formulaire natifs, stylés comme `Input`. Le `<select>` natif est
 * préféré au menu Radix dans les formulaires terrain : léger, accessible et
 * adapté aux téléphones d'entrée de gamme.
 */
const fieldClass =
  "w-full rounded-md border border-border bg-surface px-3 text-base text-ink shadow-xs transition-colors focus-visible:border-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger";

export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function NativeSelect({ className, ...props }, ref) {
  return <select ref={ref} className={cn(fieldClass, "h-11", className)} {...props} />;
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 3, ...props }, ref) {
  return (
    <textarea ref={ref} rows={rows} className={cn(fieldClass, "py-2", className)} {...props} />
  );
});
