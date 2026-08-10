/**
 * État partagé des actions de formulaire d'authentification. Séparé de
 * `actions.ts` car un fichier « use server » ne peut exporter que des fonctions
 * async (pas de type ni d'objet).
 */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialActionState: ActionState = { status: "idle" };
