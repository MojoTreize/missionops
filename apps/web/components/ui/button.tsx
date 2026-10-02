import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all duration-150 select-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:size-[1.1em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-field text-field-fg shadow-sm shadow-field/20 ring-1 ring-inset ring-white/10 hover:bg-field-hover active:bg-field-active",
        ledger: "bg-ledger text-ledger-fg shadow-sm shadow-ledger/20 hover:bg-ledger-hover",
        secondary:
          "bg-surface text-ink shadow-xs ring-1 ring-inset ring-border hover:bg-surface-2 hover:ring-border-strong",
        outline: "text-field ring-1 ring-inset ring-field/40 hover:bg-field-softer",
        ghost: "text-ink-soft hover:bg-ink/5 hover:text-ink",
        danger: "bg-danger text-danger-fg shadow-sm hover:opacity-90",
        dark: "bg-field-950 text-white shadow-sm hover:bg-field-900",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-[0.95rem]",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Rend le composant enfant à la place d'un `<button>` (ex. un lien). */
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});

export { buttonVariants };
