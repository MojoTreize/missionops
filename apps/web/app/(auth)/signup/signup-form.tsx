"use client";

import { useActionState } from "react";

import { Field } from "@/components/forms/field";
import { FormStatus } from "@/components/forms/form-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/client";
import { idleState } from "@/lib/server/form-state";

import { signupAction } from "./actions";

export function SignupForm() {
  const t = useT();
  const [state, action, pending] = useActionState(signupAction, idleState);
  const err = (k: string) => state.fields?.[k];
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <Field id="s-name" label={t("signup.fullName")} error={err("fullName")}>
        <Input id="s-name" name="fullName" required autoComplete="name" />
      </Field>
      <Field id="s-email" label={t("signup.email")} error={err("email")}>
        <Input id="s-email" name="email" type="email" required autoComplete="email" />
      </Field>
      <Field id="s-password" label={t("signup.password")} error={err("password")}>
        <Input
          id="s-password"
          name="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
        />
      </Field>
      <Field id="s-org" label={t("signup.organisation")} error={err("organisationName")}>
        <Input id="s-org" name="organisationName" required autoComplete="organization" />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? t("signup.submitting") : t("signup.submit")}
      </Button>
      <FormStatus state={state} />
    </form>
  );
}
