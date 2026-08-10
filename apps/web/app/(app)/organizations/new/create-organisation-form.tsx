"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createOrganisationAction } from "../actions";
import { initialActionState } from "../action-state";
import { FormMessage } from "../form-message";

/** Formulaire de création d'une organisation. */
export function CreateOrganisationForm() {
  const [state, action, pending] = useActionState(createOrganisationAction, initialActionState);

  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="org-name">Nom de l'organisation</Label>
        <Input
          id="org-name"
          name="name"
          type="text"
          required
          placeholder="Croix-Rouge Guinée"
          autoComplete="organization"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="org-country">Pays (facultatif)</Label>
        <Input id="org-country" name="country" type="text" placeholder="Guinée" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer l'organisation"}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
