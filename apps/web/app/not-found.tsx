import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Page introuvable — MissionOps" };

/**
 * Page 404 globale (B1.10). Rendue hors de la coque authentifiée ; ramène
 * toujours vers un point d'entrée pour ne jamais laisser l'utilisateur bloqué.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        <EmptyState
          icon={<Compass aria-hidden />}
          title="Page introuvable"
          description="La page que vous cherchez n'existe pas ou a été déplacée."
          action={
            <Button asChild>
              <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
          }
        />
      </div>
    </main>
  );
}
