import { redirect } from "next/navigation";

/**
 * Racine : on oriente vers l'espace authentifié. Le middleware et la garde
 * serveur renverront vers `/login` si aucune session valide n'existe.
 */
export default function HomePage() {
  redirect("/dashboard");
}
