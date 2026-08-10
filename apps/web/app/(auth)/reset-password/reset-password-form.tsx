"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { resetPasswordAction } from "../actions";
import { initialActionState } from "../action-state";
import { FormMessage } from "../form-message";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initialActionState);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Nouveau mot de passe</h2>
        <p className="mt-1 text-sm text-muted">Au moins 8 caractères.</p>
      </div>
      <form action={action} className="flex flex-col gap-3" noValidate>
        <input type="hidden" name="token" value={token} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="passwordConfirm">Confirmer le mot de passe</Label>
          <Input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Définir le mot de passe"}
        </Button>
        <FormMessage state={state} />
      </form>
    </div>
  );
}
