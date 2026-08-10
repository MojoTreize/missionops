import type { ActionState } from "./action-state";

/**
 * Message de retour d'une action de formulaire d'organisation. `alert` pour les
 * erreurs, `status` pour les confirmations.
 */
export function FormMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }
  const isError = state.status === "error";
  return (
    <p
      role={isError ? "alert" : "status"}
      className={`mt-3 text-sm ${isError ? "text-danger" : "text-success"}`}
    >
      {state.message}
    </p>
  );
}
