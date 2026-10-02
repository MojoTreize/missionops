/**
 * État d'une action de formulaire, partagé entre serveur et client. Séparé des
 * fichiers « use server », qui ne peuvent exporter que des fonctions async.
 */
export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fields?: Record<string, string>;
  /** Destination après succès, suivie côté client (voir MissionForm). */
  redirectTo?: string;
};

export const idleState: FormState = { status: "idle" };
