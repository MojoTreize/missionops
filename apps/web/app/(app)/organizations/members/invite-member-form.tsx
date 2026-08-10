"use client";

import { useActionState } from "react";

import { ROLES } from "@missionops/core";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/client";

import { inviteMemberAction } from "../actions";
import { initialActionState } from "../action-state";
import { FormMessage } from "../form-message";

/** Formulaire d'invitation d'un membre par e-mail (administrateurs). */
export function InviteMemberForm() {
  const t = useT();
  const [state, action, pending] = useActionState(inviteMemberAction, initialActionState);

  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-email">{t("auth.emailLabel")}</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          inputMode="email"
          required
          placeholder={t("organizations.members.inviteEmailPlaceholder")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-role">{t("organizations.members.roleLabel")}</Label>
        <select
          id="invite-role"
          name="role"
          defaultValue="collaborateur"
          className="rounded-md border border-border bg-surface px-2 py-2 text-sm text-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {t(`roles.${role}`)}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending
          ? t("organizations.members.inviteSending")
          : t("organizations.members.inviteSubmit")}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
