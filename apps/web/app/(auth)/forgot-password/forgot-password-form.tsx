"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { requestPasswordResetAction } from "../actions";
import { initialActionState } from "../action-state";
import { FormMessage } from "../form-message";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialActionState);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Mot de passe oublié</h2>
        <p className="mt-1 text-sm text-muted">
          Indiquez votre adresse : nous vous enverrons un lien de réinitialisation.
        </p>
      </div>
      <form action={action} className="flex flex-col gap-3" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="vous@organisation.org"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Envoi…" : "Envoyer le lien"}
        </Button>
        <FormMessage state={state} />
      </form>
      <Link href="/login" className="text-sm text-field hover:underline">
        Retour à la connexion
      </Link>
    </div>
  );
}
