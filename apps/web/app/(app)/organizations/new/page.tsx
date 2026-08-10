import { CreateOrganisationForm } from "./create-organisation-form";

export default function NewOrganisationPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-field">Nouvelle organisation</h1>
        <p className="text-sm text-muted">
          Créez votre espace de travail. Vous en serez l'administrateur et pourrez inviter votre
          équipe.
        </p>
      </div>
      <CreateOrganisationForm />
    </div>
  );
}
