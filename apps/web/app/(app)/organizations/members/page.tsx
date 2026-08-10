import { isRole } from "@missionops/core";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getT } from "@/lib/i18n/server";
import type { Translator } from "@/lib/i18n/translate";
import { getMembers, getPendingInvitations } from "@/lib/org/queries";
import { can, requireCan } from "@/lib/policy";

import { InviteMemberForm } from "./invite-member-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("meta.members")} — MissionOps` };
}

function roleLabel(t: Translator, role: string): string {
  return isRole(role) ? t(`roles.${role}`) : role;
}

export default async function MembersPage() {
  // Tout membre peut consulter la liste ; l'absence d'organisation renvoie
  // vers l'accueil / la connexion via la garde.
  const actor = await requireCan("read", "member");
  const canInvite = await can("create", "member");
  const { t } = await getT();

  const [members, pending] = await Promise.all([
    getMembers(actor.organisationId),
    getPendingInvitations(actor.organisationId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-field">
          {t("organizations.members.title", { name: actor.organisationName })}
        </h1>
        <p className="text-sm text-muted">{t("organizations.members.subtitle")}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-field">
          {t("organizations.members.activeMembers")}
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("organizations.members.memberColumn")}</TableHead>
              <TableHead>{t("organizations.members.roleColumn")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.userId}>
                <TableCell>{m.fullName ?? m.email}</TableCell>
                <TableCell>
                  <Badge variant={m.role === "admin" ? "ledger" : "muted"}>
                    {roleLabel(t, m.role)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {pending.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-field">
            {t("organizations.members.pendingInvitations")}
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("organizations.members.emailColumn")}</TableHead>
                <TableHead>{t("organizations.members.roleColumn")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.email}</TableCell>
                  <TableCell>
                    <Badge variant="warning">{roleLabel(t, inv.role)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ) : null}

      {canInvite ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-field">
            {t("organizations.members.inviteTitle")}
          </h2>
          <InviteMemberForm />
        </section>
      ) : null}
    </div>
  );
}
