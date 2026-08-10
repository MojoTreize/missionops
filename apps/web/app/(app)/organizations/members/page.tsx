import { ROLE_LABELS, isRole } from "@missionops/core";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMembers, getPendingInvitations } from "@/lib/org/queries";
import { can, requireCan } from "@/lib/policy";

import { InviteMemberForm } from "./invite-member-form";

function roleLabel(role: string): string {
  return isRole(role) ? ROLE_LABELS[role] : role;
}

export default async function MembersPage() {
  // Tout membre peut consulter la liste ; l'absence d'organisation renvoie
  // vers l'accueil / la connexion via la garde.
  const actor = await requireCan("read", "member");
  const canInvite = await can("create", "member");

  const [members, pending] = await Promise.all([
    getMembers(actor.organisationId),
    getPendingInvitations(actor.organisationId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-field">Membres — {actor.organisationName}</h1>
        <p className="text-sm text-muted">Gérez les personnes ayant accès à cette organisation.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-field">Membres actifs</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membre</TableHead>
              <TableHead>Rôle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.userId}>
                <TableCell>{m.fullName ?? m.email}</TableCell>
                <TableCell>
                  <Badge variant={m.role === "admin" ? "ledger" : "muted"}>
                    {roleLabel(m.role)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {pending.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-field">Invitations en attente</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mail</TableHead>
                <TableHead>Rôle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.email}</TableCell>
                  <TableCell>
                    <Badge variant="warning">{roleLabel(inv.role)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ) : null}

      {canInvite ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-field">Inviter un membre</h2>
          <InviteMemberForm />
        </section>
      ) : null}
    </div>
  );
}
