import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata = { title: "Tableau de bord — MissionOps" };

/**
 * Page d'accueil de l'espace authentifié. Volontairement minimale : elle
 * confirme la session. Les écrans métier arrivent aux blocs suivants.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-ink">Bonjour {user?.fullName ?? user?.email}</h1>
      <p className="mt-2 text-muted">Vous êtes connecté. Les missions apparaîtront ici bientôt.</p>
    </div>
  );
}
