import Link from "next/link";

export const metadata = { title: "Accès refusé — MissionOps" };

/**
 * Page d'accès refusé (403). Affichée quand l'acteur courant n'a pas le droit
 * requis pour une route (garde `requireCan`).
 */
export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 py-12 text-center">
      <h1 className="text-xl font-semibold text-field">Accès refusé</h1>
      <p className="text-sm text-muted">
        Votre rôle ne vous autorise pas à consulter cette page. Rapprochez-vous d'un administrateur
        de votre organisation si vous pensez qu'il s'agit d'une erreur.
      </p>
      <p className="mt-2 text-sm">
        <Link href="/dashboard" className="text-field hover:underline">
          Retour au tableau de bord
        </Link>
      </p>
    </div>
  );
}
