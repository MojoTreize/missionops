"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { inviteMemberAction } from "../actions";
import { initialActionState } from "../action-state";
import { FormMessage } from "../form-message";

/** Formulaire d'invitation d'un membre par e-mail (administrateurs). */
export function InviteMemberForm() {
  const [state, action, pending] = useActionState(inviteMemberAction, initialActionState);

  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-email">Adresse e-mail</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          inputMode="email"
          required
          placeholder="collegue@organisation.org"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-role">Rôle</Label>
        <select
          id="invite-role"
          name="role"
          defaultValue="collaborateur"
          className="rounded-md border border-border bg-surface px-2 py-2 text-sm text-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="collaborateur">Collaborateur</option>
          <option value="admin">Administrateur</option>
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Inviter"}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
