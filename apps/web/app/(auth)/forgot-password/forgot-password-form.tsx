"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/client";

import { requestPasswordResetAction } from "../actions";
import { initialActionState } from "../action-state";
import { FormMessage } from "../form-message";

export function ForgotPasswordForm() {
  const t = useT();
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialActionState);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">{t("auth.forgot.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("auth.forgot.description")}</p>
      </div>
      <form action={action} className="flex flex-col gap-3" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("auth.emailLabel")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder={t("auth.emailPlaceholder")}
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? t("auth.forgot.sending") : t("auth.forgot.submit")}
        </Button>
        <FormMessage state={state} />
      </form>
      <Link href="/login" className="text-sm text-field hover:underline">
        {t("auth.forgot.back")}
      </Link>
    </div>
  );
}
