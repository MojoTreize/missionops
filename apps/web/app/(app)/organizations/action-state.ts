/**
 * État partagé des actions de formulaire des organisations. Séparé de
 * `actions.ts` car un fichier « use server » ne peut exporter que des
 * fonctions async.
 */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialActionState: ActionState = { status: "idle" };
