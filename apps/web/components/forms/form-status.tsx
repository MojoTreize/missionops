import type { FormState } from "@/lib/server/form-state";

/** Message de retour d'une action : `alert` pour une erreur, `status` sinon. */
export function FormStatus({ state }: { state: FormState }) {
  if (state.status === "idle" || !state.message) return null;
  const isError = state.status === "error";
  return (
    <p
      role={isError ? "alert" : "status"}
      className={`text-sm ${isError ? "text-danger" : "text-success"}`}
    >
      {state.message}
    </p>
  );
}
