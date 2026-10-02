import { cn } from "@/lib/cn";

/**
 * Logo MissionOps. Le symbole reprend l'élément signature du produit, la bande
 * de mission : un itinéraire qui relie des étapes et se referme sur la
 * clôture (point d'accent « grand-livre »). Il dessine aussi un « M ».
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("size-8 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width="40" height="40" rx="11" fill="#0b2a22" />
      <path
        d="M9 28 V14.5 L20 23 L31 14.5 V28"
        fill="none"
        stroke="#7fc3a8"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="14.5" r="3.2" fill="#ffffff" />
      <circle cx="20" cy="23" r="3.2" fill="#ffffff" />
      <circle cx="31" cy="28" r="3.6" fill="#e0894f" />
    </svg>
  );
}

export function Logo({
  className,
  tone = "dark",
  label = "MissionOps",
}: {
  className?: string;
  tone?: "dark" | "light";
  label?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span
        className={cn(
          "text-[1.15rem] font-semibold tracking-tight",
          tone === "dark" ? "text-ink" : "text-white",
        )}
      >
        {label.slice(0, 7)}
        <span className={tone === "dark" ? "text-field" : "text-field-200"}>{label.slice(7)}</span>
      </span>
    </span>
  );
}
