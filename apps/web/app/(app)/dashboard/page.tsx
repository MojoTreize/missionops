import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getActiveContext } from "@/lib/org/queries";

export const metadata = { title: "Tableau de bord — MissionOps" };

/**
 * Page d'accueil de l'espace authentifié. Redirige vers la création d'une
 * organisation tant que l'utilisateur n'en a aucune ; affiche ensuite
 * l'organisation active. Les écrans métier arrivent aux blocs suivants.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { active } = await getActiveContext(user.id);
  if (!active) {
    redirect("/organizations/new");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-ink">Bonjour {user.fullName ?? user.email}</h1>
      <p className="mt-2 text-muted">
        Organisation active : <span className="font-medium text-field">{active.name}</span>. Les
        missions apparaîtront ici bientôt.
      </p>
      <p className="mt-4 text-sm">
        <Link href="/organizations/members" className="text-field hover:underline">
          Gérer les membres
        </Link>
      </p>
    </div>
  );
}
