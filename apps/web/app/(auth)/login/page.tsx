import { LoginForm } from "./login-form";

export const metadata = { title: "Connexion — MissionOps" };

/**
 * Page de connexion. `error=lien-invalide` provient d'un lien magique expiré,
 * déjà utilisé ou falsifié.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-ink">Se connecter</h2>
      {error === "lien-invalide" ? (
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          Ce lien de connexion est invalide ou a expiré. Demandez-en un nouveau.
        </p>
      ) : null}
      <LoginForm />
    </div>
  );
}
