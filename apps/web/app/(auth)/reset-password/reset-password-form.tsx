"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/client";

import { resetPasswordAction } from "../actions";
import { initialActionState } from "../action-state";
import { FormMessage } from "../form-message";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(resetPasswordAction, initialActionState);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-ink">
          {t("auth.reset.title")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("auth.reset.hint")}</p>
      </div>
      <form action={action} className="flex flex-col gap-3" noValidate>
        <input type="hidden" name="token" value={token} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("auth.reset.passwordLabel")}</Label>
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
          <Label htmlFor="passwordConfirm">{t("auth.reset.confirmLabel")}</Label>
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
          {pending ? t("auth.reset.saving") : t("auth.reset.submit")}
        </Button>
        <FormMessage state={state} />
      </form>
    </div>
  );
}
