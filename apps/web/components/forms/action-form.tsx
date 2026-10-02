"use client";

import { useActionState, type ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { idleState, type FormState } from "@/lib/server/form-state";

import { FormStatus } from "./form-status";

/**
 * Formulaire branché sur une action serveur : désactive le bouton pendant
 * l'envoi et affiche le retour (succès ou erreur traduite).
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel,
  variant,
  size,
  className,
  buttonClassName,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  children?: ReactNode | ((state: FormState) => ReactNode);
  submitLabel: string;
  pendingLabel?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  buttonClassName?: string;
}) {
  const [state, formAction, pending] = useActionState(action, idleState);
  return (
    <form action={formAction} className={className ?? "flex flex-col gap-3"} noValidate>
      {typeof children === "function" ? children(state) : children}
      <Button
        type="submit"
        variant={variant}
        size={size}
        disabled={pending}
        className={buttonClassName}
      >
        {pending ? (pendingLabel ?? submitLabel) : submitLabel}
      </Button>
      <FormStatus state={state} />
    </form>
  );
}
