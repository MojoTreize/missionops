"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/client";

import { createOrganisationAction } from "../actions";
import { initialActionState } from "../action-state";
import { FormMessage } from "../form-message";

/** Formulaire de création d'une organisation. */
export function CreateOrganisationForm() {
  const t = useT();
  const [state, action, pending] = useActionState(createOrganisationAction, initialActionState);

  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="org-name">{t("organizations.new.nameLabel")}</Label>
        <Input
          id="org-name"
          name="name"
          type="text"
          required
          placeholder={t("organizations.new.namePlaceholder")}
          autoComplete="organization"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="org-country">{t("organizations.new.countryLabel")}</Label>
        <Input
          id="org-country"
          name="country"
          type="text"
          placeholder={t("organizations.new.countryPlaceholder")}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("organizations.new.creating") : t("organizations.new.submit")}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
