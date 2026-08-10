"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/client";

import { loginWithPasswordAction, requestMagicLinkAction } from "../actions";
import { initialActionState } from "../action-state";
import { FormMessage } from "../form-message";

/**
 * Deux voies de connexion : le lien magique par e-mail (par défaut, sans mot de
 * passe à retenir) et le mot de passe en secours.
 */
export function LoginForm() {
  const t = useT();
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
          <Label htmlFor="magic-email">{t("auth.emailLabel")}</Label>
          <Input
            id="magic-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder={t("auth.emailPlaceholder")}
          />
        </div>
        <Button type="submit" disabled={magicPending}>
          {magicPending ? t("auth.login.magicSending") : t("auth.login.magicSubmit")}
        </Button>
        <FormMessage state={magicState} />
      </form>

      <div className="flex items-center gap-3 text-xs text-subtle">
        <span className="h-px flex-1 bg-border" />
        {t("auth.login.divider")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={pwdAction} className="flex flex-col gap-3" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pwd-email">{t("auth.emailLabel")}</Label>
          <Input
            id="pwd-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder={t("auth.emailPlaceholder")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="pwd-password">{t("auth.login.passwordLabel")}</Label>
            <Link href="/forgot-password" className="text-sm text-field hover:underline">
              {t("auth.login.forgot")}
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
          {pwdPending ? t("auth.login.passwordSigning") : t("auth.login.passwordSubmit")}
        </Button>
        <FormMessage state={pwdState} />
      </form>
    </div>
  );
}
