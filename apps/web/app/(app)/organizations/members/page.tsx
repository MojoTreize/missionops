import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getActiveContext, getMembers, getPendingInvitations } from "@/lib/org/queries";

import { InviteMemberForm } from "./invite-member-form";

export default async function MembersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { active } = await getActiveContext(user.id);
  if (!active) {
    redirect("/organizations/new");
  }

  const [members, pending] = await Promise.all([
    getMembers(active.id),
    getPendingInvitations(active.id),
  ]);
  const isAdmin = active.role === "admin";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-field">Membres — {active.name}</h1>
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
                  <Badge variant={m.role === "admin" ? "ledger" : "muted"}>{m.role}</Badge>
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
                    <Badge variant="warning">{inv.role}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ) : null}

      {isAdmin ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-field">Inviter un membre</h2>
          <InviteMemberForm />
        </section>
      ) : null}
    </div>
  );
}
