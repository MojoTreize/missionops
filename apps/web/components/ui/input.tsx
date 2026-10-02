import * as React from "react";

import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md border border-border bg-surface px-3.5 text-base text-ink shadow-xs transition-[border-color,box-shadow]",
        "placeholder:text-subtle hover:border-border-strong",
        "focus-visible:border-field focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-field/12",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/30",
        className,
      )}
      {...props}
    />
  );
});
