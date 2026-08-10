"use client";

import { useRef, useTransition } from "react";

import { useT } from "@/lib/i18n/client";
import type { MembershipView } from "@/lib/org/queries";

import { switchOrganisationAction } from "./actions";

/**
 * Sélecteur d'organisation dans l'en-tête. Change l'organisation active côté
 * serveur (persistée sur l'utilisateur, ADR B1.6) et rafraîchit la page.
 */
export function OrgSwitcher({
  memberships,
  activeId,
}: {
  memberships: MembershipView[];
  activeId: string;
}) {
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  if (memberships.length <= 1) {
    const only = memberships[0];
    return <span className="text-sm font-medium text-field">{only?.name ?? ""}</span>;
  }

  return (
    <form ref={formRef} action={switchOrganisationAction}>
      <label className="sr-only" htmlFor="org-switcher">
        {t("organizations.switcher.label")}
      </label>
      <select
        id="org-switcher"
        name="organisationId"
        defaultValue={activeId}
        disabled={pending}
        onChange={() => startTransition(() => formRef.current?.requestSubmit())}
        className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {memberships.map((m) => (
          <option key={m.organisationId} value={m.organisationId}>
            {m.name}
          </option>
        ))}
      </select>
    </form>
  );
}
