"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loginWithPasswordAction, requestMagicLinkAction } from "../actions";
import { initialActionState } from "../action-state";
import { FormMessage } from "../form-message";

/**
 * Deux voies de connexion : le lien magique par e-mail (par défaut, sans mot de
 * passe à retenir) et le mot de passe en secours.
 */
export function LoginForm() {
  const [magicState, magicAction, magicPending] = useActionState(
    requestMagicLinkAction,
    initialActionState,
  );
  const [pwdState, pwdAction, pwdPending] = useActionState(
    loginWithPasswordAction,
    initialActionState,
  );

  return (
    <div className="flex flex-col gap-6">
      <form action={magicAction} className="flex flex-col gap-3" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="magic-email">Adresse e-mail</Label>
          <Input
            id="magic-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="vous@organisation.org"
          />
        </div>
        <Button type="submit" disabled={magicPending}>
          {magicPending ? "Envoi…" : "Recevoir un lien de connexion"}
        </Button>
        <FormMessage state={magicState} />
      </form>

      <div className="flex items-center gap-3 text-xs text-subtle">
        <span className="h-px flex-1 bg-border" />
        ou avec un mot de passe
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={pwdAction} className="flex flex-col gap-3" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pwd-email">Adresse e-mail</Label>
          <Input
            id="pwd-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="vous@organisation.org"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="pwd-password">Mot de passe</Label>
            <Link href="/forgot-password" className="text-sm text-field hover:underline">
              Oublié ?
            </Link>
          </div>
          <Input
            id="pwd-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" variant="secondary" disabled={pwdPending}>
          {pwdPending ? "Connexion…" : "Se connecter"}
        </Button>
        <FormMessage state={pwdState} />
      </form>
    </div>
  );
}
