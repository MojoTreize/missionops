import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        neutral: "bg-field-softer text-field ring-field/15",
        muted: "bg-ink/[0.04] text-muted ring-ink/10",
        ledger: "bg-ledger-soft text-ledger ring-ledger/20",
        success: "bg-success-soft text-success ring-success/20",
        danger: "bg-danger-soft text-danger ring-danger/20",
        warning: "bg-warning-soft text-warning ring-warning/20",
        info: "bg-info-soft text-info ring-info/20",
        outline: "bg-surface text-ink ring-border-strong",
        dark: "bg-ink text-white ring-ink",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
